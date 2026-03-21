"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { StarRatingDisplay } from "@/components/star-rating-display";
import type { ProviderReview } from "@/lib/types";
import { effectiveOverallRating } from "@/lib/review-ratings";

function combinedNarrative(review: ProviderReview) {
  const parts = [review.standout_care, review.rehab_story].filter(
    (s): s is string => Boolean(s?.trim()),
  );
  return parts.join("\n\n").trim();
}

export function ExpandableReviewCard({
  review,
  ownerCanPin = false,
  pinnedCount = 0,
}: {
  review: ProviderReview;
  ownerCanPin?: boolean;
  pinnedCount?: number;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const narrative = combinedNarrative(review);
  const isPt = review.source === "pt_survey";
  const overall = effectiveOverallRating(review);
  const canPinMore = review.is_pinned || pinnedCount < 4;

  const needsExpand =
    Boolean(narrative.trim()) &&
    narrative.length > (isPt && overall != null ? 120 : 180);

  return (
    <li className="rounded-md border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted">
          {review.source === "google_manual"
            ? review.source_label ?? "From Google Reviews"
            : "Quick survey"}
        </p>
        <div className="flex items-center gap-2">
          {review.is_pinned ? (
            <span className="rounded-md border border-border bg-surface-alt px-2 py-1 text-[11px] font-medium text-muted">
              Pinned
            </span>
          ) : null}
          {ownerCanPin ? (
            <button
              type="button"
              disabled={isPending || (!review.is_pinned && !canPinMore)}
              className="min-h-10 rounded-md border border-border px-2 py-1 text-xs transition hover:bg-surface-alt disabled:opacity-50"
              onClick={() => {
                setPinError(null);
                startTransition(async () => {
                  const response = await fetch("/api/reviews/pin", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      reviewId: review.id,
                      pinned: !review.is_pinned,
                    }),
                  });
                  const payload = (await response.json()) as { error?: string };
                  if (!response.ok) {
                    setPinError(payload.error ?? "Unable to update pin.");
                    return;
                  }
                  router.refresh();
                });
              }}
            >
              {review.is_pinned ? "Unpin" : "Pin"}
            </button>
          ) : null}
        </div>
      </div>

      {isPt && overall != null ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StarRatingDisplay value={overall} className="text-xl" />
          <span className="text-sm text-muted">{overall} / 5</span>
        </div>
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
        {review.guest_name?.trim() || "Anonymous"} •{" "}
        {new Date(review.created_at).toLocaleDateString()}
      </p>

      {review.disclaimer_text ? (
        <p className="mt-1 text-xs text-muted">{review.disclaimer_text}</p>
      ) : null}

      {pinError ? <p className="mt-2 text-xs text-danger">{pinError}</p> : null}

      {needsExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 min-h-11 text-left text-sm font-medium text-accent-secondary hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </li>
  );
}
