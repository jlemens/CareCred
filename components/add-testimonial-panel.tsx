"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DynamicSurveyForm } from "@/components/dynamic-survey-form";
import type { ResolvedSurvey } from "@/lib/surveys/types";

type Flow = "closed" | "pick-type" | "survey";

type Props = {
  providerProfileId: string;
  providerSlug: string;
  enabledSurveys: ResolvedSurvey[];
  disabled?: boolean;
  disabledMessage?: string;
};

export function AddTestimonialPanel({
  providerProfileId,
  providerSlug,
  enabledSurveys,
  disabled = false,
  disabledMessage,
}: Props) {
  const router = useRouter();
  const [flow, setFlow] = useState<Flow>("closed");
  const [selectedSurvey, setSelectedSurvey] = useState<ResolvedSurvey | null>(null);

  const surveys = enabledSurveys.length > 0 ? enabledSurveys : [];

  function openSurvey(survey: ResolvedSurvey) {
    setSelectedSurvey(survey);
    setFlow("survey");
  }

  function startFlow() {
    if (surveys.length === 1) {
      openSurvey(surveys[0]!);
      return;
    }
    setFlow("pick-type");
  }

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
          onClick={startFlow}
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
                    Choose the survey that best matches your experience with this
                    provider.
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
                {surveys.map((survey) => (
                  <li key={survey.templateId}>
                    <button
                      type="button"
                      onClick={() => openSurvey(survey)}
                      className="w-full rounded-lg border-2 border-accent-primary/80 bg-accent-primary/10 p-4 text-left shadow-sm ring-1 ring-accent-primary/20 transition hover:bg-accent-primary/15"
                    >
                      <span className="text-base font-semibold text-foreground">
                        {survey.name}
                      </span>
                      <span className="mt-1 block text-sm text-muted">
                        {survey.description}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {flow === "survey" && selectedSurvey ? (
            <>
              {surveys.length > 1 ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFlow("pick-type");
                      setSelectedSurvey(null);
                    }}
                    className="min-h-11 text-sm text-muted underline-offset-2 transition hover:text-foreground hover:underline"
                  >
                    ← Back to survey types
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlow("closed");
                      setSelectedSurvey(null);
                    }}
                    className="min-h-11 text-sm text-muted underline-offset-2 transition hover:text-foreground hover:underline"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setFlow("closed");
                      setSelectedSurvey(null);
                    }}
                    className="min-h-11 text-sm text-muted underline-offset-2 transition hover:text-foreground hover:underline"
                  >
                    Close
                  </button>
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold">{selectedSurvey.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  Overall rating, recommendation, and state are required. Other
                  questions are optional.
                </p>
              </div>
              <DynamicSurveyForm
                providerProfileId={providerProfileId}
                survey={selectedSurvey}
                embedded
                onSubmitted={() => {
                  setFlow("closed");
                  setSelectedSurvey(null);
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
