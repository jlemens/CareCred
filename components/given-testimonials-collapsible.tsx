"use client";

import { useMemo, useState } from "react";
import { ExpandableReviewCard } from "@/components/expandable-review-card";
import type { ProfileType, ProviderReview } from "@/lib/types";
import type { ProviderSummaryForReview } from "@/lib/queries";

export type GivenTestimonialItem = {
  review: ProviderReview;
  provider: ProviderSummaryForReview;
};

type Filter = "self" | "other";

type Props = {
  items: GivenTestimonialItem[];
  currentUserId: string;
  profileType: ProfileType;
};

export function GivenTestimonialsCollapsible({
  items,
  currentUserId,
  profileType,
}: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("other");

  const isPatient = profileType === "patient";

  const filtered = useMemo(() => {
    if (isPatient) return items;
    return items.filter(({ provider }) =>
      filter === "self"
        ? provider.user_id === currentUserId
        : provider.user_id !== currentUserId,
    );
  }, [items, filter, currentUserId, isPatient]);

  const selfCount = useMemo(
    () => items.filter(({ provider }) => provider.user_id === currentUserId).length,
    [items],
  );
  const otherCount = items.length - selfCount;

  return (
    <details onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer text-sm font-medium text-foreground">
        My given testimonials ({items.length})
      </summary>
      <p className="mt-3 text-sm text-muted">
        {isPatient
          ? "Reviews you submitted while signed in on provider profiles."
          : "Reviews you submitted while signed in. Open a provider's page to see your testimonial in context."}
      </p>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          No account-linked testimonials yet. Visit a provider&apos;s profile to
          leave a review.
        </p>
      ) : (
        <>
          {open && !isPatient ? (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-xs text-muted">
                Show testimonials you left on your own public page vs. on other
                providers&apos; pages.
              </p>
              <div
                className="flex w-full max-w-md flex-wrap gap-2"
                role="group"
                aria-label="Filter testimonials by recipient"
              >
                <button
                  type="button"
                  onClick={() => setFilter("self")}
                  className={
                    filter === "self"
                      ? "inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-accent-secondary bg-accent-secondary/15 px-4 py-2 text-sm font-medium text-foreground"
                      : "inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-alt"
                  }
                >
                  Self ({selfCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("other")}
                  className={
                    filter === "other"
                      ? "inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-accent-secondary bg-accent-secondary/15 px-4 py-2 text-sm font-medium text-foreground"
                      : "inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-alt"
                  }
                >
                  Other user ({otherCount})
                </button>
              </div>
            </div>
          ) : null}

          {open && isPatient ? (
            <p className="mt-4 text-xs text-muted">
              Patient profiles can&apos;t receive self-testimonials—you only leave
              reviews on other providers&apos; pages.
            </p>
          ) : null}

          <ul className="mt-4 space-y-3">
            {filtered.length === 0 ? (
              <li className="text-sm text-muted">
                {isPatient
                  ? "No testimonials yet."
                  : filter === "self"
                    ? "No testimonials on your own provider page yet."
                    : "No testimonials on other providers' pages yet."}
              </li>
            ) : (
              filtered.map(({ review, provider }) => (
                <ExpandableReviewCard
                  key={review.id}
                  review={review}
                  signedIn
                  currentUserId={currentUserId}
                  providerContext={{
                    displayName: provider.display_name,
                    practiceName: provider.practice_name,
                    slug: provider.slug,
                  }}
                  authorVisibilityNote={
                    review.is_visible
                      ? undefined
                      : "Hidden from this provider's public page; it still appears here for you."
                  }
                  patientFooter={{
                    href: review.is_visible
                      ? `/u/${provider.slug}/testimonials#testimonial-${review.id}`
                      : `/u/${provider.slug}`,
                    label: review.is_visible
                      ? "View on provider's page"
                      : "View provider profile",
                  }}
                />
              ))
            )}
          </ul>
        </>
      )}
    </details>
  );
}
