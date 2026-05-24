"use client";

import { useMemo, useState } from "react";

type Props = {
  slug: string;
  /** Defaults to share CTA on public profiles; use a clearer label in Settings. */
  buttonLabel?: string;
};

export function ProfileShareLink({ slug, buttonLabel }: Props) {
  const [status, setStatus] = useState<string | null>(null);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/u/${slug}`;
    }
    return `${window.location.origin}/u/${slug}`;
  }, [slug]);

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Link copied.");
    } catch {
      setStatus(
        "Couldn't copy—try again, or copy the address from your browser bar.",
      );
    }
  }

  return (
    <div className="w-full min-w-0">
      {/*
        Same shell as specialty/education cells: rounded-md border border-border p-3.
        Entire surface copies the public profile URL (tap / click / keyboard).
      */}
      <button
        type="button"
        onClick={copyShareUrl}
        className="flex w-full min-w-0 min-h-11 items-center gap-3 rounded-md border border-accent-primary/80 bg-accent-primary p-3 text-left text-white shadow-sm transition hover:border-accent-hover hover:bg-accent-hover hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Copy public profile link for ${slug}`}
      >
        <span className="select-none shrink-0 text-base leading-none" aria-hidden>
          🔗
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold">
          {buttonLabel ?? "Click for shareable profile link"}
        </span>
      </button>
      {status ? (
        <p className="mt-2 text-xs text-muted" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
      <span className="sr-only">Profile URL: {shareUrl}</span>
    </div>
  );
}
