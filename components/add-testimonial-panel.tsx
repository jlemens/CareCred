"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NewReviewForm } from "@/components/new-review-form";

type Flow = "closed" | "pick-type" | "standard-review";

type Props = {
  providerProfileId: string;
  /** Public profile path slug; used after a successful submit to return to the provider page. */
  providerSlug: string;
  disabled?: boolean;
  disabledMessage?: string;
};

export function AddTestimonialPanel({
  providerProfileId,
  providerSlug,
  disabled = false,
  disabledMessage,
}: Props) {
  const router = useRouter();
  const [flow, setFlow] = useState<Flow>("closed");

  if (disabled) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold">Add a testimonial</h2>
        <p className="mt-2 text-sm text-muted">
          {disabledMessage ??
            "You can’t submit a testimonial from your own provider page."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {flow === "closed" ? (
        <button
          type="button"
          onClick={() => setFlow("pick-type")}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-accent-hover sm:w-auto sm:justify-start"
        >
          <span className="text-lg font-semibold leading-none" aria-hidden>
            +
          </span>
          Add testimonial
        </button>
      ) : null}

      {flow !== "closed" ? (
        <div className="card space-y-4 p-6">
          {flow === "pick-type" ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Add a testimonial</h2>
                  <p className="mt-1 text-sm text-muted">
                    Choose how you’d like to share feedback. More survey types
                    will appear here over time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFlow("closed")}
                  className="min-h-11 shrink-0 rounded-md border border-border px-3 py-2 text-sm text-muted transition hover:bg-surface-alt hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              <ul className="grid gap-3">
                <li>
                  <button
                    type="button"
                    onClick={() => setFlow("standard-review")}
                    className="w-full rounded-lg border-2 border-accent-primary/80 bg-accent-primary/10 p-4 text-left shadow-sm ring-1 ring-accent-primary/20 transition hover:bg-accent-primary/15"
                  >
                    <span className="text-base font-semibold text-foreground">
                      Standard review
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      Overall star rating plus a few short category ratings—our
                      default way to leave feedback for a provider.
                    </span>
                  </button>
                </li>
                <li>
                  <div className="rounded-md border border-border/60 bg-surface-alt/30 px-3 py-2.5 text-left">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted">
                      More survey types
                    </span>
                    <span className="mt-0.5 block text-xs text-muted/90">
                      Coming later—no extra options yet.
                    </span>
                  </div>
                </li>
              </ul>
            </>
          ) : null}

          {flow === "standard-review" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setFlow("pick-type")}
                  className="min-h-11 text-sm text-muted underline-offset-2 transition hover:text-foreground hover:underline"
                >
                  ← Back to survey types
                </button>
                <button
                  type="button"
                  onClick={() => setFlow("closed")}
                  className="min-h-11 text-sm text-muted underline-offset-2 transition hover:text-foreground hover:underline"
                >
                  Close
                </button>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Standard review</h2>
                <p className="mt-1 text-sm text-muted">
                  Only overall rating, recommendation, and state are required.
                  Submit when you’re ready.
                </p>
              </div>
              <NewReviewForm
                providerProfileId={providerProfileId}
                embedded
                onSubmitted={() => {
                  setFlow("closed");
                  router.push(`/u/${providerSlug}`);
                  router.refresh();
                }}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
