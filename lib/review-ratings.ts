import type { ProviderReview } from "@/lib/types";

/** Maximum pinned testimonials per provider (API and pin UI enforce this). */
export const MAX_PINNED_TESTIMONIALS = 4;

/** Testimonials listed on the public profile before “View more testimonials”. */
export const PROFILE_TESTIMONIAL_PREVIEW_COUNT = 6;

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
  /** Share of the same cohort (visible standard reviews with an overall star rating) who chose “would recommend”. */
  recommendPercent: number;
};

export function computePtSurveyStarStats(
  reviews: ProviderReview[],
): PtSurveyStarStats | null {
  const ratings: number[] = [];
  let recommendYes = 0;
  for (const r of reviews) {
    const v = effectiveOverallRating(r);
    if (v != null) {
      ratings.push(v);
      if (r.recommend_provider) recommendYes += 1;
    }
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
  const recommendPercent = Math.round((recommendYes / ratings.length) * 100);
  return { average, count: ratings.length, histogram, recommendPercent };
}

/** Pinned reviews first, then newest first. */
export function sortReviewsForDisplay(reviews: ProviderReview[]): ProviderReview[] {
  return [...reviews].sort((a, b) => {
    const aPinned = Boolean(a.is_pinned);
    const bPinned = Boolean(b.is_pinned);
    if (aPinned !== bPinned) {
      return aPinned ? -1 : 1;
    }
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}
