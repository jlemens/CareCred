"use client";

import { FormEvent, useState } from "react";
import { StarRatingInput } from "@/components/star-rating-input";

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
  const [overallStars, setOverallStars] = useState(0);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) {
      setStatus(disabledMessage ?? "Review submission is not available for this account.");
      return;
    }
    if (overallStars < 1) {
      setStatus("Tap the stars to choose your overall rating (1–5).");
      return;
    }
    setLoading(true);
    setStatus(null);

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerProfileId,
        guestName: guestName.trim() || undefined,
        overallRating: overallStars,
        consent,
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(payload.error ?? "Unable to submit review.");
      setLoading(false);
      return;
    }

    setStatus("Thank you. Your rating was posted.");
    setGuestName("");
    setOverallStars(0);
    setConsent(false);
    setLoading(false);
    onSubmitted?.();
  }

  return (
    <form
      onSubmit={submitReview}
      className={embedded ? "space-y-4" : "card space-y-4 p-6"}
    >
      {!embedded ? (
        <>
          <h2 className="text-lg font-semibold">New review</h2>
          <p className="text-sm text-muted">
            One overall star rating — quick and quantitative.
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

      <StarRatingInput
        id="overall-survey-stars"
        label="Overall experience with this provider"
        value={overallStars}
        onChange={setOverallStars}
        disabled={disabled}
      />

      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          required
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
        {disabled ? "Review unavailable" : loading ? "Submitting..." : "Submit rating"}
      </button>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </form>
  );
}
