"use client";

import type { ReactNode } from "react";

type Props = {
  id?: string;
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** When set, shows a clear control so the user can leave this question unanswered (value 0). */
  optional?: boolean;
};

/** Clickable 1–5 stars; fills all stars up to and including the selected index. */
export function StarRatingInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  optional = false,
}: Props) {
  const groupId = id ?? "star-rating";

  return (
    <div className="space-y-2">
      <span id={`${groupId}-label`} className="block text-sm text-muted">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={`${groupId}-label`}
        className="flex flex-wrap items-center gap-2"
      >
        <div className="flex flex-wrap items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = value >= star;
            return (
              <button
                key={star}
                type="button"
                disabled={disabled}
                aria-label={`${star} out of 5 stars`}
                aria-pressed={active}
                onClick={() => onChange(star)}
                className={`flex min-h-11 min-w-11 items-center justify-center rounded-md text-2xl leading-none transition hover:bg-surface-alt disabled:opacity-50 ${
                  active ? "text-amber-400" : "text-muted/35"
                }`}
              >
                ★
              </button>
            );
          })}
        </div>
        {optional && value > 0 ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(0)}
            className="text-xs text-muted underline-offset-2 transition hover:text-foreground hover:underline disabled:opacity-50"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
