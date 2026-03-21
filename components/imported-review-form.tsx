"use client";

import { FormEvent, useState } from "react";

type Props = {
  providerProfileId: string;
};

export function ImportedReviewForm({ providerProfileId }: Props) {
  const [guestName, setGuestName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/imported-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerProfileId,
        guestName,
        reviewText,
        sourceUrl,
        accepted,
      }),
    });

    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(json.error ?? "Unable to save imported review.");
      setLoading(false);
      return;
    }

    setMessage("Imported review added.");
    setGuestName("");
    setReviewText("");
    setSourceUrl("");
    setAccepted(false);
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <h3 className="text-base font-semibold">Add Google review manually</h3>
      <p className="text-sm text-muted">
        Copy/paste a review and include a source label with disclaimer
        attestation.
      </p>
      <label className="block space-y-2">
        <span className="text-sm text-muted">Reviewer name as shown</span>
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-muted">Review text</span>
        <textarea
          rows={4}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-muted">Source URL (optional)</span>
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5"
          required
        />
        I confirm this text was copied from Google Reviews or another public
        source and can be shared here with attribution.
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-alt disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save imported review"}
      </button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </form>
  );
}
