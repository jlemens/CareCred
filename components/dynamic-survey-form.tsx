"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StarRatingInput } from "@/components/star-rating-input";
import { getQuestionById } from "@/lib/surveys/question-bank";
import type { ResolvedSurvey } from "@/lib/surveys/types";
import { reviewerStateSelectOptions } from "@/lib/us-states";

type Props = {
  providerProfileId: string;
  survey: ResolvedSurvey;
  disabled?: boolean;
  disabledMessage?: string;
  embedded?: boolean;
  onSubmitted?: () => void;
};

export function DynamicSurveyForm({
  providerProfileId,
  survey,
  disabled = false,
  disabledMessage,
  embedded = false,
  onSubmitted,
}: Props) {
  const [guestName, setGuestName] = useState("");
  const [reviewerState, setReviewerState] = useState("");
  const [overallStars, setOverallStars] = useState(0);
  const [recommend, setRecommend] = useState("yes");
  const [responses, setResponses] = useState<Record<string, string | number | boolean>>({});
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimers = useRef<{
    fade?: ReturnType<typeof setTimeout>;
    remove?: ReturnType<typeof setTimeout>;
  }>({});

  const clearToastTimers = useCallback(() => {
    if (toastTimers.current.fade) clearTimeout(toastTimers.current.fade);
    if (toastTimers.current.remove) clearTimeout(toastTimers.current.remove);
    toastTimers.current = {};
  }, []);

  const showToast = useCallback(
    (message: string) => {
      clearToastTimers();
      setToast(message);
      setToastVisible(true);
      toastTimers.current.fade = setTimeout(() => setToastVisible(false), 3200);
      toastTimers.current.remove = setTimeout(() => {
        setToast(null);
        toastTimers.current = {};
      }, 3600);
    },
    [clearToastTimers],
  );

  useEffect(() => () => clearToastTimers(), [clearToastTimers]);

  function setResponse(id: string, value: string | number | boolean | undefined) {
    setResponses((prev) => {
      const next = { ...prev };
      if (value === undefined || value === "" || value === 0) {
        delete next[id];
      } else {
        next[id] = value;
      }
      return next;
    });
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) {
      showToast(disabledMessage ?? "Review submission is not available for this account.");
      return;
    }
    if (overallStars < 1) {
      showToast("Choose your overall star rating (1–5) before submitting.");
      return;
    }
    if (!reviewerState) {
      showToast("Select the state you’re reviewing from.");
      return;
    }
    if (!consent) {
      showToast("Check the consent box to post your review publicly.");
      return;
    }
    setLoading(true);

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerProfileId,
        surveyTemplateId: survey.templateId,
        guestName: guestName.trim() || undefined,
        overallRating: overallStars,
        recommendProvider: recommend === "yes",
        reviewerState,
        responses,
        consent,
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      showToast(payload.error ?? "Unable to submit review.");
      setLoading(false);
      return;
    }

    setGuestName("");
    setReviewerState("");
    setOverallStars(0);
    setRecommend("yes");
    setResponses({});
    setConsent(false);
    setLoading(false);
    if (onSubmitted) {
      onSubmitted();
    } else {
      showToast("Thank you. Your review was posted.");
    }
  }

  return (
    <form
      onSubmit={submitReview}
      className={embedded ? "relative space-y-4" : "card relative space-y-4 p-6"}
    >
      {!embedded ? (
        <>
          <h2 className="text-lg font-semibold">{survey.name}</h2>
          <p className="text-sm text-muted">{survey.description}</p>
        </>
      ) : null}

      {disabled ? (
        <p className="rounded-md border border-border bg-surface-alt p-3 text-sm text-muted">
          {disabledMessage ?? "Review submission is not available for this account."}
        </p>
      ) : null}

      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Required for all reviews
      </p>

      <label className="block space-y-2">
        <span className="text-sm text-muted">Your name (optional)</span>
        <input
          disabled={disabled}
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Leave blank to post as Anonymous"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-muted">
          State you are reviewing from{" "}
          <span className="font-medium text-danger">(required)</span>
        </span>
        <select
          disabled={disabled}
          value={reviewerState}
          onChange={(e) => setReviewerState(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Select state</option>
          {reviewerStateSelectOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <StarRatingInput
        id="overall-survey-stars"
        label={
          <>
            How would you rate this provider?{" "}
            <span className="font-medium text-danger">(required)</span>
          </>
        }
        value={overallStars}
        onChange={setOverallStars}
        disabled={disabled}
      />
      <p className="-mt-1 text-xs text-muted">Select 1 to 5 stars.</p>

      <Choice
        label={
          <>
            Would you recommend this provider?{" "}
            <span className="font-medium text-danger">(required)</span>
          </>
        }
        value={recommend}
        setValue={setRecommend}
        disabled={disabled}
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
      />

      {survey.questionIds.length > 0 ? (
        <>
          <p className="border-t border-border/70 pt-4 text-xs text-muted">
            Optional questions — skip any you prefer not to answer.
          </p>
          <div className="space-y-4">
            {survey.questionIds.map((questionId) => (
              <SurveyQuestionField
                key={questionId}
                questionId={questionId}
                value={responses[questionId]}
                onChange={(value) => setResponse(questionId, value)}
                disabled={disabled}
              />
            ))}
          </div>
        </>
      ) : null}

      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          disabled={disabled}
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        I consent to sharing this rating publicly on this provider profile.
      </label>

      <button
        type="submit"
        disabled={loading || disabled}
        className="rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {disabled ? "Review unavailable" : loading ? "Submitting..." : `Submit ${survey.name.toLowerCase()}`}
      </button>

      {toast ? (
        <div
          role="alert"
          aria-live="polite"
          className={`pointer-events-none fixed bottom-24 left-1/2 z-[100] max-w-[min(92vw,22rem)] -translate-x-1/2 rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm text-foreground shadow-lg transition-opacity duration-300 md:bottom-10 ${
            toastVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {toast}
        </div>
      ) : null}
    </form>
  );
}

function SurveyQuestionField({
  questionId,
  value,
  onChange,
  disabled,
}: {
  questionId: string;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean | undefined) => void;
  disabled?: boolean;
}) {
  const question = getQuestionById(questionId);
  if (!question) return null;

  const optionalLabel = question.recommended ? (
    <>
      {question.label}{" "}
      <strong className="font-semibold text-foreground">(recommended)</strong>
      <span className="text-muted"> (optional)</span>
    </>
  ) : (
    <>
      {question.label} <span className="text-muted">(optional)</span>
    </>
  );

  switch (question.type) {
    case "star":
      return (
        <StarRatingInput
          id={`survey-q-${questionId}`}
          label={optionalLabel}
          value={typeof value === "number" ? value : 0}
          onChange={(n) => onChange(n >= 1 ? n : undefined)}
          disabled={disabled}
          optional
        />
      );
    case "yes_no":
      return (
        <Choice
          label={optionalLabel}
          value={
            value === true ? "yes" : value === false ? "no" : ""
          }
          setValue={(v) => {
            if (v === "yes") onChange(true);
            else if (v === "no") onChange(false);
            else onChange(undefined);
          }}
          disabled={disabled}
          options={[
            { label: "Prefer not to say", value: "" },
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
        />
      );
    case "select":
      return (
        <label className="block space-y-2">
          <span className="text-sm text-muted">{optionalLabel}</span>
          <select
            disabled={disabled}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Skip</option>
            {question.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    case "text":
      return (
        <label className="block space-y-2">
          <span className="text-sm text-muted">{optionalLabel}</span>
          <input
            disabled={disabled}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder={question.placeholder}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      );
    case "textarea":
      return (
        <label
          className={
            question.recommended
              ? "block space-y-2 border-t border-border/70 pt-5"
              : "block space-y-2"
          }
        >
          <span className="text-sm leading-snug text-muted">{optionalLabel}</span>
          {question.recommended ? (
            <p className="text-xs leading-relaxed text-success">
              Written reviews help people understand what made your care stand out.
            </p>
          ) : null}
          <textarea
            rows={4}
            disabled={disabled}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder={
              question.placeholder ??
              "Your experience, what helped, or anything you’d like others to know."
            }
            className={
              question.recommended
                ? "w-full rounded-md border-2 border-success/75 bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted/60 focus:border-success focus:ring-2 focus:ring-success/30"
                : "w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            }
          />
        </label>
      );
    default:
      return null;
  }
}

function Choice({
  label,
  value,
  setValue,
  options,
  disabled = false,
}: {
  label: ReactNode;
  value: string;
  setValue: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-muted">{label}</span>
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
