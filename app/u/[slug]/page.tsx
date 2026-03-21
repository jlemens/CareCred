import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ExpandableProfileText } from "@/components/expandable-profile-text";
import { ExpandableReviewCard } from "@/components/expandable-review-card";
import { AddTestimonialPanel } from "@/components/add-testimonial-panel";
import { ProfileShareLink } from "@/components/profile-share-link";
import { ReviewRatingSummary } from "@/components/review-rating-summary";
import { computePtSurveyStarStats, sortReviewsForDisplay } from "@/lib/review-ratings";
import { getProfileBySlug, getProviderReviews, getSessionUser } from "@/lib/queries";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile) {
    notFound();
  }

  const reviews =
    profile.profile_type === "provider"
      ? await getProviderReviews(profile.id)
      : [];
  const sessionUser = await getSessionUser();
  const isOwnProviderPage =
    profile.profile_type === "provider" && sessionUser?.id === profile.user_id;
  const surveyStarStats =
    profile.profile_type === "provider"
      ? computePtSurveyStarStats(reviews)
      : null;
  const orderedReviews =
    profile.profile_type === "provider" ? sortReviewsForDisplay(reviews) : [];
  const previewReviews = orderedReviews.slice(0, 4);
  const pinnedCount = orderedReviews.filter((r) => r.is_pinned).length;
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-start gap-4">
            {profile.profile_type === "provider" && profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-24 w-24 shrink-0 rounded-xl border border-border object-cover"
              />
            ) : null}
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {profile.display_name}
              </h1>
              {profile.profile_type === "provider" && profile.credentials ? (
                <p className="mt-1 text-sm font-medium text-muted">
                  {profile.credentials}
                </p>
              ) : null}
              <p className="mt-1 text-sm text-muted">
                {profile.profile_type === "provider"
                  ? profile.practice_name ?? "Provider profile"
                  : "Patient profile"}
                {profile.location ? ` - ${profile.location}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <ProfileShareLink slug={profile.slug} />
            <Link
              href="/"
              className="text-sm text-muted transition hover:text-foreground"
            >
              CareCred home
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(profile.display_name)}`}
              className="rounded-md border border-border px-3 py-2 text-sm transition hover:bg-surface-alt"
            >
              Find providers
            </Link>
          </div>
        </div>

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

      {profile.profile_type === "provider" && surveyStarStats ? (
        <ReviewRatingSummary stats={surveyStarStats} />
      ) : null}

      {profile.profile_type === "provider" ? (
        <section className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.1fr_1fr]">
          <div className="order-2 lg:order-1 card p-6">
            <h2 className="text-lg font-semibold">Testimonials</h2>
            <p className="mt-1 text-sm text-muted">
              Quick survey ratings and provider-imported reviews.
            </p>
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
                      pinnedCount={pinnedCount}
                    />
                  ))}
                </ul>
                {orderedReviews.length > 4 ? (
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
              disabled={isOwnProviderPage}
              disabledMessage="Providers cannot submit PT surveys for their own profile."
            />
          </div>
        </section>
      ) : (
        <section className="card p-6">
          <h2 className="text-lg font-semibold">My given testimonials</h2>
          <p className="mt-2 text-sm text-muted">
            This section appears for patient profiles and can show account-linked
            reviews they have submitted.
          </p>
        </section>
      )}
    </div>
  );
}
