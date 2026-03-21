"use client";

import { useMemo, useState } from "react";
import type { ProviderReview } from "@/lib/types";

function combinedNarrative(review: ProviderReview) {
  const parts = [review.standout_care, review.rehab_story].filter(
    (s): s is string => Boolean(s?.trim()),
  );
  return parts.join("\n\n").trim();
}

export function ExpandableReviewCard({ review }: { review: ProviderReview }) {
  const [expanded, setExpanded] = useState(false);
  const narrative = combinedNarrative(review);
  const isPt = review.source === "pt_survey";

  const needsExpand = useMemo(() => {
    if (isPt) {
      return (
        narrative.length > 180 ||
        Boolean(review.condition_summary?.trim()) ||
        Boolean(review.body_region?.trim())
      );
    }
    return narrative.length > 180;
  }, [isPt, narrative.length, review.body_region, review.condition_summary]);

  return (
    <li className="rounded-md border border-border p-4">
      <p className="text-xs uppercase tracking-wide text-muted">
        {review.source === "google_manual"
          ? review.source_label ?? "From Google Reviews"
          : "PT survey review"}
      </p>

      {isPt ? (
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
          <span className="rounded-md bg-surface-alt px-2 py-1">
            Recommend: {review.recommend_provider ? "Yes" : "No"}
          </span>
          <span className="rounded-md bg-surface-alt px-2 py-1">
            Rehab: {review.rehab_experience_rating}/5
          </span>
          <span className="rounded-md bg-surface-alt px-2 py-1">
            Comm: {review.communication_rating}/5
          </span>
          <span className="rounded-md bg-surface-alt px-2 py-1">
            Pro: {review.professionalism_rating}/5
          </span>
          <span className="rounded-md bg-surface-alt px-2 py-1">
            Listened: {review.felt_listened ? "Yes" : "No"}
          </span>
        </div>
      ) : null}

      <div
        className={
          expanded || !needsExpand
            ? "mt-2 whitespace-pre-wrap text-sm leading-relaxed"
            : "mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed"
        }
      >
        {narrative ? (
          narrative
        ) : (
          <span className="text-muted">No written feedback.</span>
        )}
      </div>

      {expanded && isPt ? (
        <dl className="mt-3 grid gap-2 border-t border-border pt-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Body region
            </dt>
            <dd className="mt-0.5 text-foreground">{review.body_region}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Condition / recovery
            </dt>
            <dd className="mt-0.5 text-foreground">{review.condition_summary}</dd>
          </div>
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
        {review.guest_name ?? "Anonymous"} •{" "}
        {new Date(review.created_at).toLocaleDateString()}
      </p>

      {review.disclaimer_text ? (
        <p className="mt-1 text-xs text-muted">{review.disclaimer_text}</p>
      ) : null}

      {needsExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 min-h-11 text-left text-sm font-medium text-accent-secondary hover:underline"
        >
          {expanded ? "Show less" : "Read full review"}
        </button>
      ) : null}
    </li>
  );
}
