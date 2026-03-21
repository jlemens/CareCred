"use client";

type Props = {
  id?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

/** Clickable 1–5 stars; fills all stars up to and including the selected index. */
export function StarRatingInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
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
        className="flex flex-wrap items-center gap-1"
      >
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
    </div>
  );
}
