"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ReviewEngagement } from "@/components/review-engagement";
import { StarRatingDisplay } from "@/components/star-rating-display";
import type { ProviderReview } from "@/lib/types";
import {
  effectiveOverallRating,
  MAX_PINNED_TESTIMONIALS,
} from "@/lib/review-ratings";
import {
  reviewDetailRows,
  surveyLabelForReview,
  writtenFeedbackFromReview,
} from "@/lib/surveys/display";
import { reviewerStateLabel } from "@/lib/us-states";

function combinedNarrative(review: Parameters<typeof writtenFeedbackFromReview>[0]) {
  return writtenFeedbackFromReview(review);
}

function reviewAudienceBadge(review: ProviderReview) {
  if (review.source !== "pt_survey") return null;
  if (review.author_user_id) {
    return {
      label: "Member review",
      className:
        "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700",
    };
  }
  return {
    label: "Guest review",
    className:
      "rounded-md border border-border bg-surface-alt px-2 py-1 text-[11px] font-medium text-muted",
  };
}

function formatReviewPostedAt(createdAt: string) {
  const postedAt = new Date(createdAt);
  if (Number.isNaN(postedAt.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(postedAt);
}

function OwnerReviewMenu({
  ownerCanHide,
  ownerCanPin,
  optimisticVisible,
  optimisticPinned,
  canPinMore,
  isPending,
  onToggleVisibility,
  onTogglePin,
}: {
  ownerCanHide: boolean;
  ownerCanPin: boolean;
  optimisticVisible: boolean;
  optimisticPinned: boolean;
  canPinMore: boolean;
  isPending: boolean;
  onToggleVisibility: () => void;
  onTogglePin: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const hasMenuItems =
    ownerCanHide || (ownerCanPin && (optimisticPinned || canPinMore));

  if (!hasMenuItems) return null;

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Testimonial options"
        disabled={isPending}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-surface-alt px-2 text-lg leading-none text-muted transition hover:bg-background hover:text-foreground disabled:opacity-50"
      >
        <span aria-hidden>⋯</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg shadow-black/30"
        >
          {ownerCanHide ? (
            <button
              type="button"
              role="menuitem"
              disabled={isPending}
              onClick={() => {
                setOpen(false);
                onToggleVisibility();
              }}
              className="flex w-full px-3 py-2.5 text-left text-sm transition hover:bg-surface-alt disabled:opacity-50"
            >
              {optimisticVisible ? "Hide review" : "Unhide review"}
            </button>
          ) : null}
          {ownerCanPin ? (
            <button
              type="button"
              role="menuitem"
              disabled={isPending || (!optimisticPinned && !canPinMore)}
              onClick={() => {
                setOpen(false);
                onTogglePin();
              }}
              className="flex w-full px-3 py-2.5 text-left text-sm transition hover:bg-surface-alt disabled:opacity-50"
            >
              {optimisticPinned ? "Unpin review" : "Pin review"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ExpandableReviewCard({
  review,
  ownerCanPin = false,
  ownerCanHide = false,
  pinnedCount = 0,
  anchorId,
  asListItem = true,
  className,
  providerContext,
  authorVisibilityNote,
  patientFooter,
  showEngagement = true,
  signedIn = false,
  currentUserId = null,
}: {
  review: ProviderReview;
  ownerCanPin?: boolean;
  ownerCanHide?: boolean;
  pinnedCount?: number;
  /** When set, the list item is addressable via URL hash (e.g. deep-link from a patient home). */
  anchorId?: string;
  /** Use `div` when nesting inside another list row (e.g. patient “my testimonials” layout). */
  asListItem?: boolean;
  className?: string;
  /** On the patient’s home: who received this testimonial. */
  providerContext?: {
    displayName: string;
    practiceName: string | null;
    slug: string;
  };
  /** e.g. hidden from provider’s public profile (still visible to author). */
  authorVisibilityNote?: string;
  /** Primary action at the bottom of the card (patient home). */
  patientFooter?: { href: string; label: string };
  showEngagement?: boolean;
  signedIn?: boolean;
  currentUserId?: string | null;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticVisible, setOptimisticVisible] = useState(review.is_visible);
  const [optimisticPinned, setOptimisticPinned] = useState(Boolean(review.is_pinned));
  const narrative = combinedNarrative(review);
  const isPt = review.source === "pt_survey";
  const overall = effectiveOverallRating(review);
  const canPinMore =
    optimisticPinned || pinnedCount < MAX_PINNED_TESTIMONIALS;
  const audienceBadge = reviewAudienceBadge(review);
  const showOwnerActions = ownerCanPin || ownerCanHide;
  const surveyLabel = surveyLabelForReview(review);
  const detailRows = reviewDetailRows(review);

  const needsExpand =
    Boolean(narrative.trim()) &&
    (detailRows.length > 0 || narrative.length > (isPt && overall != null ? 120 : 180));

  const Root: "li" | "div" = asListItem ? "li" : "div";

  const rootClass = [
    "rounded-md border border-border p-4",
    anchorId ? "scroll-mt-24" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  function toggleVisibility() {
    setActionError(null);
    const newVisible = !optimisticVisible;
    setOptimisticVisible(newVisible);
    if (!newVisible) setOptimisticPinned(false);
    startTransition(async () => {
      const response = await fetch("/api/reviews/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          hidden: optimisticVisible,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setOptimisticVisible(!newVisible);
        setActionError(payload.error ?? "Unable to update visibility.");
        return;
      }
      router.refresh();
    });
  }

  function togglePin() {
    setActionError(null);
    const newPinned = !optimisticPinned;
    setOptimisticPinned(newPinned);
    startTransition(async () => {
      const response = await fetch("/api/reviews/pin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          pinned: newPinned,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setOptimisticPinned(!newPinned);
        setActionError(payload.error ?? "Unable to update pin.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <Root id={anchorId} className={rootClass}>
      {providerContext ? (
        <div className="mb-3 border-b border-border pb-3">
          <p className="text-[11px] uppercase tracking-wide text-muted">
            Testimonial provided to
          </p>
          <p className="mt-1 text-base font-semibold tracking-tight text-foreground">
            {providerContext.displayName}
          </p>
          {providerContext.practiceName ? (
            <p className="mt-0.5 text-sm text-muted">{providerContext.practiceName}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted">
            Public page:{" "}
            <Link
              href={`/u/${providerContext.slug}`}
              className="font-mono text-accent-secondary underline-offset-2 hover:underline"
            >
              /u/{providerContext.slug}
            </Link>
          </p>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-wrap items-center gap-2 text-left">
          {audienceBadge ? (
            <>
              <span className={audienceBadge.className}>{audienceBadge.label}</span>
              <p className="text-xs uppercase tracking-wide text-muted">{surveyLabel}</p>
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 text-right">
          {!audienceBadge ? (
            <p className="text-xs uppercase tracking-wide text-muted">{surveyLabel}</p>
          ) : null}
          {optimisticPinned ? (
            <span className="rounded-md border border-border bg-surface-alt px-2 py-1 text-[11px] font-medium text-muted">
              Pinned
            </span>
          ) : null}
        </div>
      </div>

      {isPt && overall != null ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StarRatingDisplay value={overall} className="text-xl" />
          <span className="text-sm text-muted">{overall} / 5</span>
        </div>
      ) : null}

      {isPt && reviewerStateLabel(review.reviewer_state) ? (
        <p className="mt-1 text-xs text-muted">
          Reviewing from {reviewerStateLabel(review.reviewer_state)}
        </p>
      ) : null}

      {narrative ? (
        <div
          className={
            expanded || !needsExpand
              ? "mt-2 whitespace-pre-wrap text-sm leading-relaxed"
              : "mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed"
          }
        >
          {narrative}
        </div>
      ) : isPt && overall != null ? (
        <p className="mt-2 text-sm text-muted">Star rating only.</p>
      ) : isPt ? (
        <p className="mt-2 text-sm text-muted">No rating on file.</p>
      ) : (
        <p className="mt-2 text-sm text-muted">No written feedback.</p>
      )}

      {expanded && isPt && detailRows.length > 0 ? (
        <dl className="mt-3 grid gap-2 border-t border-border pt-3 text-sm">
          {detailRows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                {row.label}
              </dt>
              <dd className="mt-0.5 text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {review.source === "google_manual" && review.source_url ? (
        <p className="mt-2">
          <a
            href={review.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-secondary underline"
          >
            View source
          </a>
        </p>
      ) : null}

      <p className="mt-3 text-xs text-muted">
        {review.guest_name?.trim() || "Anonymous"} • Posted {formatReviewPostedAt(review.created_at)}
      </p>

      {review.disclaimer_text ? (
        <p className="mt-1 text-xs text-muted">{review.disclaimer_text}</p>
      ) : null}

      {needsExpand || showOwnerActions ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {needsExpand ? (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="min-h-11 text-left text-sm font-medium text-accent-secondary hover:underline"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            ) : null}
          </div>
          {showOwnerActions ? (
            <OwnerReviewMenu
              ownerCanHide={ownerCanHide}
              ownerCanPin={ownerCanPin}
              optimisticVisible={optimisticVisible}
              optimisticPinned={optimisticPinned}
              canPinMore={canPinMore}
              isPending={isPending}
              onToggleVisibility={toggleVisibility}
              onTogglePin={togglePin}
            />
          ) : null}
        </div>
      ) : null}

      {actionError ? <p className="mt-2 text-xs text-danger">{actionError}</p> : null}

      {showEngagement ? (
        <ReviewEngagement
          reviewId={review.id}
          signedIn={signedIn}
          currentUserId={currentUserId}
        />
      ) : null}

      {patientFooter ? (
        <div className="mt-4 space-y-3 border-t border-border pt-3">
          {authorVisibilityNote ? (
            <p className="text-xs text-muted">{authorVisibilityNote}</p>
          ) : null}
          <Link
            href={patientFooter.href}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-4 py-2 text-center text-sm font-medium transition hover:bg-surface-alt"
          >
            {patientFooter.label}
          </Link>
        </div>
      ) : authorVisibilityNote ? (
        <p className="mt-4 text-xs text-muted">{authorVisibilityNote}</p>
      ) : null}
    </Root>
  );
}
