import { StarRatingDisplay } from "@/components/star-rating-display";
import type { PtSurveyStarStats } from "@/lib/review-ratings";

type Props = {
  stats: PtSurveyStarStats;
  hiddenCount?: number;
};

export function ReviewRatingSummary({ stats, hiddenCount }: Props) {
  const { average, count, histogram, recommendPercent } = stats;
  const maxBar = Math.max(
    1,
    histogram[1],
    histogram[2],
    histogram[3],
    histogram[4],
    histogram[5],
  );

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Survey ratings</h2>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StarRatingDisplay value={Math.round(average)} className="text-2xl" />
        <p className="text-2xl font-semibold tabular-nums">
          {average.toFixed(2)}
          <span className="text-base font-normal text-muted"> / 5</span>
        </p>
      </div>

      <div
        className="mt-4 rounded-lg border border-success/35 bg-success/10 px-4 py-3 sm:px-5 sm:py-3.5"
        role="status"
      >
        <p className="text-base font-semibold text-success sm:text-lg">
          Recommended by {recommendPercent}% of reviewers
        </p>
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span>
          Based on {count} rating{count === 1 ? "" : "s"}
        </span>
        {typeof hiddenCount === "number" ? (
          <>
            <span className="text-muted/50" aria-hidden>
              ·
            </span>
            <span>Hidden reviews: {hiddenCount}</span>
          </>
        ) : null}
      </p>

      <div className="mt-6 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Distribution
        </p>
        {([5, 4, 3, 2, 1] as const).map((stars) => {
          const n = histogram[stars];
          const pct = Math.round((n / maxBar) * 100);
          return (
            <div key={stars} className="flex items-center gap-3 text-sm">
              <span className="w-8 shrink-0 tabular-nums text-muted">
                {stars}★
              </span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-alt">
                <div
                  className="h-full rounded-full bg-amber-400/90 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right tabular-nums text-muted">
                {n}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
