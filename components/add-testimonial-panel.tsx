"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NewReviewForm } from "@/components/new-review-form";

type Flow = "closed" | "pick-type" | "pt-survey";

type Props = {
  providerProfileId: string;
  disabled?: boolean;
  disabledMessage?: string;
};

export function AddTestimonialPanel({
  providerProfileId,
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
                    onClick={() => setFlow("pt-survey")}
                    className="w-full rounded-md border border-border p-4 text-left transition hover:bg-surface-alt"
                  >
                    <span className="font-medium text-foreground">
                      Quick star rating
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      Tap stars for one overall 1–5 score — no written responses
                      required.
                    </span>
                  </button>
                </li>
                <li>
                  <div className="rounded-md border border-dashed border-border p-4 opacity-70">
                    <span className="font-medium text-foreground">
                      More survey types
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      Coming soon — additional specialties and formats.
                    </span>
                  </div>
                </li>
              </ul>
            </>
          ) : null}

          {flow === "pt-survey" ? (
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
                <h2 className="text-lg font-semibold">Quick star rating</h2>
                <p className="mt-1 text-sm text-muted">
                  Your stars appear publicly on this profile after you submit.
                </p>
              </div>
              <NewReviewForm
                providerProfileId={providerProfileId}
                embedded
                onSubmitted={() => router.refresh()}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
