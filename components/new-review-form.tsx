"use client";

import { FormEvent, useState } from "react";

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
};

export function NewReviewForm({ providerProfileId }: Props) {
  const [guestName, setGuestName] = useState("");
  const [recommend, setRecommend] = useState("yes");
  const [rehabRating, setRehabRating] = useState("5");
  const [communicationRating, setCommunicationRating] = useState("5");
  const [professionalismRating, setProfessionalismRating] = useState("5");
  const [feltListened, setFeltListened] = useState("yes");
  const [bodyRegion, setBodyRegion] = useState(bodyRegions[0]);
  const [conditionSummary, setConditionSummary] = useState("");
  const [rehabStory, setRehabStory] = useState("");
  const [standoutCare, setStandoutCare] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerProfileId,
        guestName,
        recommendProvider: recommend === "yes",
        rehabExperienceRating: Number(rehabRating),
        communicationRating: Number(communicationRating),
        professionalismRating: Number(professionalismRating),
        feltListened: feltListened === "yes",
        bodyRegion,
        conditionSummary,
        rehabStory,
        standoutCare,
        consent,
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(payload.error ?? "Unable to submit review.");
      setLoading(false);
      return;
    }

    setStatus("Thank you. Your review was posted.");
    setGuestName("");
    setConditionSummary("");
    setRehabStory("");
    setStandoutCare("");
    setConsent(false);
    setLoading(false);
  }

  return (
    <form onSubmit={submitReview} className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">New review</h2>
      <p className="text-sm text-muted">
        PT survey for this provider (other specialties coming soon).
      </p>

      <label className="block space-y-2">
        <span className="text-sm text-muted">Your name</span>
        <input
          required
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <Choice
          label="Would you recommend this provider?"
          value={recommend}
          setValue={setRecommend}
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
        />
        <Rating
          label="How was your rehab experience with this provider?"
          value={rehabRating}
          setValue={setRehabRating}
        />
        <Rating
          label="How would you rate communication?"
          value={communicationRating}
          setValue={setCommunicationRating}
        />
        <Rating
          label="How would you rate professionalism?"
          value={professionalismRating}
          setValue={setProfessionalismRating}
        />
      </div>

      <Choice
        label="Did you feel listened to?"
        value={feltListened}
        setValue={setFeltListened}
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
      />

      <label className="block space-y-2">
        <span className="text-sm text-muted">Body region treated</span>
        <select
          value={bodyRegion}
          onChange={(e) => setBodyRegion(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {bodyRegions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-muted">
          Condition or issue recovered/improved from
        </span>
        <input
          required
          value={conditionSummary}
          onChange={(e) => setConditionSummary(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-muted">
          Tell us about your rehab experience
        </span>
        <textarea
          rows={3}
          value={rehabStory}
          onChange={(e) => setRehabStory(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-muted">What stood out about your care?</span>
        <textarea
          rows={3}
          value={standoutCare}
          onChange={(e) => setStandoutCare(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        I consent to sharing this feedback publicly on this provider profile.
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit review"}
      </button>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </form>
  );
}

function Choice({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-muted">{label}</span>
      <select
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

function Rating({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      >
        {[1, 2, 3, 4, 5].map((num) => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </select>
    </label>
  );
}
