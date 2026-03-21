import type { ProviderReview } from "@/lib/types";

/**
 * Single overall score for stats/display.
 * Prefers `overall_rating`; falls back to rounded mean of legacy 3-axis ratings for old rows.
 */
export function effectiveOverallRating(review: ProviderReview): number | null {
  if (review.source !== "pt_survey") return null;
  if (
    review.overall_rating != null &&
    review.overall_rating >= 1 &&
    review.overall_rating <= 5
  ) {
    return review.overall_rating;
  }
  const a = review.rehab_experience_rating;
  const b = review.communication_rating;
  const c = review.professionalism_rating;
  if (
    typeof a === "number" &&
    typeof b === "number" &&
    typeof c === "number" &&
    a >= 1 &&
    a <= 5 &&
    b >= 1 &&
    b <= 5 &&
    c >= 1 &&
    c <= 5
  ) {
    return Math.min(5, Math.max(1, Math.round((a + b + c) / 3)));
  }
  return null;
}

export type PtSurveyStarStats = {
  average: number;
  count: number;
  histogram: Record<1 | 2 | 3 | 4 | 5, number>;
};

export function computePtSurveyStarStats(
  reviews: ProviderReview[],
): PtSurveyStarStats | null {
  const ratings: number[] = [];
  for (const r of reviews) {
    const v = effectiveOverallRating(r);
    if (v != null) ratings.push(v);
  }
  if (ratings.length === 0) return null;

  const histogram: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const n of ratings) {
    const k = n as 1 | 2 | 3 | 4 | 5;
    if (k >= 1 && k <= 5) histogram[k] += 1;
  }
  const average =
    ratings.reduce((sum, n) => sum + n, 0) / ratings.length;
  return { average, count: ratings.length, histogram };
}

/** Pinned reviews first, then newest first. */
export function sortReviewsForDisplay(reviews: ProviderReview[]): ProviderReview[] {
  return [...reviews].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) {
      return a.is_pinned ? -1 : 1;
    }
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}
