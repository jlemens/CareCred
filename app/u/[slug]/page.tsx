import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AddTestimonialPanel } from "@/components/add-testimonial-panel";
import { ExpandableProfileText } from "@/components/expandable-profile-text";
import { ExpandableReviewCard } from "@/components/expandable-review-card";
import { ProfileFollowButton } from "@/components/profile-follow-button";
import { ProfileFollowersList } from "@/components/profile-followers-list";
import { ProfileShareLink } from "@/components/profile-share-link";
import { ReviewRatingSummary } from "@/components/review-rating-summary";
import { resolveEnabledSurveys, surveyConfigFromProfile } from "@/lib/surveys/config";
import {
  computePtSurveyStarStats,
  MAX_PINNED_TESTIMONIALS,
  PROFILE_TESTIMONIAL_PREVIEW_COUNT,
  sortReviewsForDisplay,
} from "@/lib/review-ratings";
import {
  getGivenReviewsWithProviderSummaries,
  getProfileBySlug,
  getProfileFollowers,
  getProfileFollowStats,
  getProviderHiddenReviewCount,
  getProviderReviews,
  getSessionUser,
} from "@/lib/queries";
import { reviewerStateLabel } from "@/lib/us-states";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile) {
    notFound();
  }

  const [reviews, sessionUser, hiddenReviewCount] = await Promise.all([
    profile.profile_type === "provider"
      ? getProviderReviews(profile.id)
      : ([] as Awaited<ReturnType<typeof getProviderReviews>>),
    getSessionUser(),
    profile.profile_type === "provider"
      ? getProviderHiddenReviewCount(profile.id)
      : Promise.resolve(0),
  ]);

  const isOwnProfile = sessionUser?.id === profile.user_id;
  const showFollowerCount = profile.show_follower_count !== false;

  const [followStats, followers] = await Promise.all([
    getProfileFollowStats(profile.id, sessionUser?.id ?? null, showFollowerCount),
    showFollowerCount ? getProfileFollowers(profile.id) : Promise.resolve([]),
  ]);

  const givenWithProviders =
    profile.profile_type === "patient" &&
    sessionUser &&
    sessionUser.id === profile.user_id
      ? await getGivenReviewsWithProviderSummaries(sessionUser.id)
      : [];
  const isOwnProviderPage =
    profile.profile_type === "provider" && isOwnProfile;
  const enabledSurveys =
    profile.profile_type === "provider"
      ? resolveEnabledSurveys(surveyConfigFromProfile(profile))
      : [];
  const surveyStarStats =
    profile.profile_type === "provider"
      ? computePtSurveyStarStats(reviews)
      : null;
  const orderedReviews =
    profile.profile_type === "provider" ? sortReviewsForDisplay(reviews) : [];
  const previewReviews = orderedReviews.slice(0, PROFILE_TESTIMONIAL_PREVIEW_COUNT);
  const pinnedCount = orderedReviews.filter((r) => Boolean(r.is_pinned)).length;
  const providerHighlights = [
    profile.specialties
      ? {
          label: "Specialties",
          content: (
            <ExpandableProfileText
              text={profile.specialties}
              minChars={100}
              clampLines={3}
              tone="foreground"
              className="mt-1 block"
            />
          ),
        }
      : null,
    profile.education
      ? {
          label: "Education",
          content: (
            <ExpandableProfileText
              text={profile.education}
              minChars={100}
              clampLines={3}
              tone="foreground"
              className="mt-1 block"
            />
          ),
        }
      : null,
    profile.years_experience
      ? {
          label: "Experience",
          content: (
            <span className="mt-1 block text-foreground">
              {profile.years_experience} years
            </span>
          ),
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; content: ReactNode }>;

  return (
    <div className="grid w-full gap-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-24 w-24 shrink-0 rounded-xl border border-border object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight">
                {profile.display_name}
              </h1>
              {profile.profile_type === "provider" ? (
                <p
                  className={
                    profile.profession?.trim()
                      ? "mt-1 text-sm font-medium text-accent-secondary"
                      : "mt-1 text-sm text-muted"
                  }
                >
                  {profile.profession?.trim() || "Profession not listed"}
                </p>
              ) : null}
              {profile.profile_type === "provider" && profile.credentials ? (
                <p className="mt-1 text-sm font-medium text-muted">
                  {profile.credentials}
                </p>
              ) : null}
              <p className="mt-1 text-sm text-muted">
                {profile.profile_type === "provider"
                  ? profile.practice_name ?? "Independent practice"
                  : "Patient profile"}
                {profile.location ? ` - ${profile.location}` : ""}
                {profile.profile_type === "patient" &&
                reviewerStateLabel(profile.home_state) ? (
                  <>
                    {" "}
                    · {reviewerStateLabel(profile.home_state)}
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <ProfileFollowButton
            profileId={profile.id}
            signedIn={Boolean(sessionUser)}
            isOwnProfile={isOwnProfile}
            initialFollowing={followStats.followedByMe}
            initialFollowerCount={followStats.followerCount}
            showFollowerCount={showFollowerCount}
          />
        </div>

        {profile.profile_type === "provider" ? (
          <div className="mt-4 w-full min-w-0">
            <ProfileShareLink slug={profile.slug} />
          </div>
        ) : null}

        {profile.bio ? (
          <div className="mt-4 max-w-3xl">
            <ExpandableProfileText
              text={profile.bio}
              minChars={200}
              clampLines={5}
            />
          </div>
        ) : null}

        {profile.profile_type === "provider" && providerHighlights.length > 0 ? (
          <div className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-3">
            {providerHighlights.map((detail) => (
              <div key={detail.label} className="rounded-md border border-border p-3">
                <span className="block text-xs uppercase tracking-wide">
                  {detail.label}
                </span>
                {detail.content}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {showFollowerCount && followers.length > 0 ? (
        <ProfileFollowersList followers={followers} />
      ) : null}

      {profile.profile_type === "provider" && surveyStarStats ? (
        <ReviewRatingSummary
          stats={surveyStarStats}
          hiddenCount={hiddenReviewCount}
        />
      ) : null}

      {profile.profile_type === "provider" ? (
        <section className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.1fr_1fr]">
          <div className="order-2 lg:order-1 card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1">
              <h2 className="text-lg font-semibold">Testimonials</h2>
              {isOwnProviderPage ? (
                <span
                  className="text-sm tabular-nums text-muted"
                  title={`You can pin up to ${MAX_PINNED_TESTIMONIALS} testimonials on your profile`}
                  aria-live="polite"
                >
                  {pinnedCount}/{MAX_PINNED_TESTIMONIALS} pinned
                </span>
              ) : null}
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              <li>Member reviews = signed-in accounts.</li>
              <li>Guest reviews = non-signed-in accounts.</li>
            </ul>
            {reviews.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                No testimonials yet. Be the first to leave a review.
              </p>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {previewReviews.map((review) => (
                    <ExpandableReviewCard
                      key={review.id}
                      review={review}
                      ownerCanPin={isOwnProviderPage}
                      ownerCanHide={isOwnProviderPage}
                      pinnedCount={pinnedCount}
                      anchorId={`testimonial-${review.id}`}
                      signedIn={Boolean(sessionUser)}
                      currentUserId={sessionUser?.id ?? null}
                    />
                  ))}
                </ul>
                {orderedReviews.length > PROFILE_TESTIMONIAL_PREVIEW_COUNT ? (
                  <div className="mt-4">
                    <Link
                      href={`/u/${profile.slug}/testimonials`}
                      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-sm transition hover:bg-surface-alt"
                    >
                      View more testimonials
                    </Link>
                  </div>
                ) : null}
              </>
            )}
          </div>
          <div className="order-1 lg:order-2">
            <AddTestimonialPanel
              providerProfileId={profile.id}
              providerSlug={profile.slug}
              enabledSurveys={enabledSurveys}
              disabled={isOwnProviderPage}
              disabledMessage="Providers cannot submit standard reviews for their own profile."
            />
          </div>
        </section>
      ) : sessionUser?.id === profile.user_id ? (
        <section className="card p-6">
          <h2 className="text-lg font-semibold">My given testimonials</h2>
          <p className="mt-1 text-sm text-muted">
            Reviews you submitted while signed in. Open a provider&apos;s page to
            see your testimonial in context.
          </p>
          {givenWithProviders.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No account-linked testimonials yet. Visit a provider&apos;s profile
              to leave a review.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {givenWithProviders.map(({ review, provider }) => (
                <ExpandableReviewCard
                  key={review.id}
                  review={review}
                  providerContext={{
                    displayName: provider.display_name,
                    practiceName: provider.practice_name,
                    slug: provider.slug,
                  }}
                  authorVisibilityNote={
                    review.is_visible
                      ? undefined
                      : "Hidden from this provider's public page; it still appears here for you."
                  }
                  patientFooter={{
                    href: review.is_visible
                      ? `/u/${provider.slug}/testimonials#testimonial-${review.id}`
                      : `/u/${provider.slug}`,
                    label: review.is_visible
                      ? "View on provider's page"
                      : "View provider profile",
                  }}
                  signedIn={Boolean(sessionUser)}
                  currentUserId={sessionUser?.id ?? null}
                />
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
