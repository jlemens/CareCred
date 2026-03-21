"use client";

import { useMemo, useState } from "react";

type Props = {
  text: string;
  /** Approximate length before showing expand (…). */
  minChars?: number;
  /** Tailwind line-clamp count when collapsed. */
  clampLines?: 3 | 4 | 5 | 6;
  className?: string;
  tone?: "muted" | "foreground";
};

export function ExpandableProfileText({
  text,
  minChars = 200,
  clampLines = 5,
  className = "",
  tone = "muted",
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const needsToggle = useMemo(() => text.trim().length >= minChars, [text, minChars]);

  const clampClass =
    clampLines === 3
      ? "line-clamp-3"
      : clampLines === 4
        ? "line-clamp-4"
        : clampLines === 5
          ? "line-clamp-5"
          : "line-clamp-6";

  const color = tone === "foreground" ? "text-foreground" : "text-muted";

  if (!needsToggle) {
    return (
      <p
        className={`whitespace-pre-wrap text-sm leading-relaxed ${color} ${className}`}
      >
        {text}
      </p>
    );
  }

  return (
    <div className={className}>
      <p
        className={
          expanded
            ? `whitespace-pre-wrap text-sm leading-relaxed ${color}`
            : `${clampClass} whitespace-pre-wrap text-sm leading-relaxed ${color}`
        }
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 min-h-11 rounded-md px-1 text-lg font-semibold leading-none text-accent-secondary hover:bg-surface-alt hover:text-foreground"
        aria-expanded={expanded}
        aria-label={expanded ? "Show less text" : "Show full text"}
        title={expanded ? "Show less" : "Show more"}
      >
        {expanded ? "Show less" : "…"}
      </button>
    </div>
  );
}
