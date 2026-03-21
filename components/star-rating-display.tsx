"use client";

type Props = {
  value: number;
  className?: string;
};

/** Read-only row of stars (1–5). */
export function StarRatingDisplay({ value, className = "" }: Props) {
  const v = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-lg leading-none ${className}`}
      aria-label={`${v} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= v ? "text-amber-400" : "text-muted/30"}
        >
          ★
        </span>
      ))}
    </span>
  );
}
