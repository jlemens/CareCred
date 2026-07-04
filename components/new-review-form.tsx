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
import { SurveyQuestionLabel } from "@/components/survey-question-label";
import { reviewerStateSelectOptions } from "@/lib/us-states";

const bodyRegions = [
  "Neck",
  "Shoulder",
  "Elbow",
  "Wrist/Hand",
  "Upper Back",
  "Lower Back",
  "Hip",
  "Knee",
  "Ankle/Foot",
  "Pelvic Floor",
  "Other",
];

type Props = {
  providerProfileId: string;
  disabled?: boolean;
  disabledMessage?: string;
  embedded?: boolean;
  onSubmitted?: () => void;
};

export function NewReviewForm({
  providerProfileId,
  disabled = false,
  disabledMessage,
  embedded = false,
  onSubmitted,
}: Props) {
  const [guestName, setGuestName] = useState("");
  const [reviewerState, setReviewerState] = useState("");
  const [overallStars, setOverallStars] = useState(0);
  const [recommend, setRecommend] = useState("yes");
  const [rehabStars, setRehabStars] = useState(0);
  const [communicationStars, setCommunicationStars] = useState(0);
  const [professionalismStars, setProfessionalismStars] = useState(0);
  const [feltListened, setFeltListened] = useState("");
  const [bodyRegion, setBodyRegion] = useState("");
  const [conditionSummary, setConditionSummary] = useState("");
  const [experienceNotes, setExperienceNotes] = useState("");
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

    const trimmedNotes = experienceNotes.trim();
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerProfileId,
        guestName: guestName.trim() || undefined,
        overallRating: overallStars,
        recommendProvider: recommend === "yes",
        ...(rehabStars >= 1 ? { rehabExperienceRating: rehabStars } : {}),
        ...(communicationStars >= 1
          ? { communicationRating: communicationStars }
          : {}),
        ...(professionalismStars >= 1
          ? { professionalismRating: professionalismStars }
          : {}),
        ...(feltListened === "yes" || feltListened === "no"
          ? { feltListened: feltListened === "yes" }
          : {}),
        reviewerState,
        bodyRegion: bodyRegion.trim() || undefined,
        conditionSummary: conditionSummary.trim() || undefined,
        rehabStory: undefined,
        standoutCare: trimmedNotes || undefined,
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
    setRehabStars(0);
    setCommunicationStars(0);
    setProfessionalismStars(0);
    setFeltListened("");
    setBodyRegion("");
    setConditionSummary("");
    setExperienceNotes("");
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
          <h2 className="text-lg font-semibold">Standard review</h2>
          <p className="text-sm text-muted">
            Only your overall rating, recommendation, and state are required.
            Other questions are optional.
          </p>
        </>
      ) : null}
      {disabled ? (
        <p className="rounded-md border border-border bg-surface-alt p-3 text-sm text-muted">
          {disabledMessage ?? "Review submission is not available for this account."}
        </p>
      ) : null}

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

      <p className="text-xs text-muted">
        Optional — category ratings default to your overall score if you skip them.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <StarRatingInput
          id="rehab-stars"
          label="How was your rehab experience? (optional)"
          value={rehabStars}
          onChange={setRehabStars}
          disabled={disabled}
          optional
        />
        <StarRatingInput
          id="communication-stars"
          label="Rate provider's communication during your care (optional)"
          value={communicationStars}
          onChange={setCommunicationStars}
          disabled={disabled}
          optional
        />
        <StarRatingInput
          id="professionalism-stars"
          label="Rate provider's professionalism during your care (optional)"
          value={professionalismStars}
          onChange={setProfessionalismStars}
          disabled={disabled}
          optional
        />
      </div>

      <Choice
        label="Did you feel listened to? (optional)"
        value={feltListened}
        setValue={setFeltListened}
        disabled={disabled}
        options={[
          { label: "Prefer not to say", value: "" },
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
      />

      <label className="block space-y-2">
        <span className="text-sm text-muted">Body region treated (optional)</span>
        <select
          disabled={disabled}
          value={bodyRegion}
          onChange={(e) => setBodyRegion(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Skip</option>
          {bodyRegions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-muted">
          Condition or issue recovered/improved from (optional)
        </span>
        <input
          disabled={disabled}
          value={conditionSummary}
          onChange={(e) => setConditionSummary(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="mt-5 block space-y-2 border-t border-border/70 pt-5">
        <SurveyQuestionLabel
          label="Written feedback for others reading this profile"
          recommended
        />
        <p className="text-xs leading-relaxed text-success">
          Written reviews are nice: they help people understand what made your care
          stand out.
        </p>
        <textarea
          rows={4}
          disabled={disabled}
          value={experienceNotes}
          onChange={(e) => setExperienceNotes(e.target.value)}
          placeholder="Your experience, what helped, or anything you’d like future patients to know."
          className="w-full rounded-md border-2 border-success/75 bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted/60 focus:border-success focus:ring-2 focus:ring-success/30"
        />
      </label>

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
        {disabled ? "Review unavailable" : loading ? "Submitting..." : "Submit standard review"}
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
