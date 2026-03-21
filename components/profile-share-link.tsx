"use client";

import { useMemo, useState } from "react";

type Props = {
  slug: string;
};

export function ProfileShareLink({ slug }: Props) {
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
      setStatus("Copy failed. Select the link and copy it manually.");
    }
  }

  return (
    <div className="w-full max-w-sm rounded-md border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted">Share profile</p>
      <input
        readOnly
        value={shareUrl}
        aria-label="Public profile link"
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted"
      />
      <button
        type="button"
        onClick={copyShareUrl}
        className="mt-2 inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm transition hover:bg-surface-alt"
      >
        Copy link
      </button>
      {status ? <p className="mt-2 text-xs text-muted">{status}</p> : null}
    </div>
  );
}
