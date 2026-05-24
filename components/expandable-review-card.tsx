"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ReviewEngagement } from "@/components/review-engagement";
import { StarRatingDisplay } from "@/components/star-rating-display";
import type { ProviderReview } from "@/lib/types";
import {
  effectiveOverallRating,
  MAX_PINNED_TESTIMONIALS,
} from "@/lib/review-ratings";
import { reviewerStateLabel } from "@/lib/us-states";

function combinedNarrative(review: ProviderReview) {
  const parts = [review.standout_care, review.rehab_story].filter(
    (s): s is string => Boolean(s?.trim()),
  );
  return parts.join("\n\n").trim();
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
  const surveyLabel =
    review.source === "google_manual"
      ? review.source_label ?? "From Google Reviews"
      : "Standard review";

  const needsExpand =
    Boolean(narrative.trim()) &&
    narrative.length > (isPt && overall != null ? 120 : 180);

  const Root: "li" | "div" = asListItem ? "li" : "div";

  const rootClass = [
    "rounded-md border border-border p-4",
    anchorId ? "scroll-mt-24" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

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

      {expanded && isPt && (review.body_region || review.condition_summary) ? (
        <dl className="mt-3 grid gap-2 border-t border-border pt-3 text-sm">
          {review.body_region ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Body region
              </dt>
              <dd className="mt-0.5 text-foreground">{review.body_region}</dd>
            </div>
          ) : null}
          {review.condition_summary ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Condition / recovery
              </dt>
              <dd className="mt-0.5 text-foreground">{review.condition_summary}</dd>
            </div>
          ) : null}
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

      {showOwnerActions ? (
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 justify-start">
              {ownerCanHide ? (
                <button
                  type="button"
                  disabled={isPending}
                  className="min-h-10 rounded-md border border-border bg-surface-alt px-3 py-2 text-xs font-medium transition hover:bg-background disabled:opacity-50"
                  onClick={() => {
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
                  }}
                >
                  {optimisticVisible ? "Hide review" : "Unhide review"}
                </button>
              ) : null}
            </div>
            <div className="flex shrink-0 justify-end">
              {ownerCanPin ? (
                <button
                  type="button"
                  disabled={isPending || (!optimisticPinned && !canPinMore)}
                  className="min-h-10 rounded-md border border-border bg-surface-alt px-3 py-2 text-xs font-medium transition hover:bg-background disabled:opacity-50"
                  onClick={() => {
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
                  }}
                >
                  {optimisticPinned ? "Unpin review" : "Pin review"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {actionError ? <p className="mt-2 text-xs text-danger">{actionError}</p> : null}

      {needsExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 min-h-11 text-left text-sm font-medium text-accent-secondary hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}

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
