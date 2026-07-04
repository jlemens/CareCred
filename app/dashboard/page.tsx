import Link from "next/link";
import { AccountPasswordCollapsible } from "@/components/account-password-collapsible";
import { ExpandableReviewCard } from "@/components/expandable-review-card";
import { FollowDashboardSection } from "@/components/follow-dashboard-section";
import { GivenTestimonialsCollapsible } from "@/components/given-testimonials-collapsible";
import { ImportedReviewForm } from "@/components/imported-review-form";
import { ProfileShareLink } from "@/components/profile-share-link";
import { ProviderQrDownloadButton } from "@/components/provider-qr-download";
import { SurveyCenterCollapsible } from "@/components/survey-center-collapsible";
import { OnboardingFlow } from "@/components/onboarding-flow";
import {
  getGivenReviewsWithProviderSummaries,
  getProfileByUserId,
  getProfileFollowerCount,
  getProfileFollowers,
  getProfilesFollowedByUser,
  getProviderHiddenReviews,
  getSessionUser,
} from "@/lib/queries";
import { surveyConfigFromProfile } from "@/lib/surveys/config";
import { hasSupabaseEnv } from "@/lib/env";

export default async function DashboardPage() {
  if (!hasSupabaseEnv()) {
    return (
      <section className="card w-full p-8">
        <h1 className="text-2xl font-semibold">Dashboard unavailable</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Configure your Supabase environment variables in `.env.local` to use
          authentication and database-backed features.
        </p>
      </section>
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <section className="card w-full p-8">
        <h1 className="text-2xl font-semibold">Sign in required</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to manage your CareCred account and public page.
        </p>
        <Link
          href="/auth"
          className="mt-5 inline-flex rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Sign in
        </Link>
      </section>
    );
  }

  const [profile, givenWithProviders] = await Promise.all([
    getProfileByUserId(user.id),
    getGivenReviewsWithProviderSummaries(user.id),
  ]);

  const needsOnboarding = !profile;

  if (needsOnboarding) {
    return (
      <OnboardingFlow userId={user.id} email={user.email ?? ""} />
    );
  }

  const hiddenReviews =
    profile.profile_type === "provider"
      ? await getProviderHiddenReviews(profile.id)
      : [];

  const [followerCount, followers, following] = await Promise.all([
    getProfileFollowerCount(profile.id),
    getProfileFollowers(profile.id),
    getProfilesFollowedByUser(user.id),
  ]);

  return (
    <div className="grid w-full gap-6">
      <section className="card p-6">
        <details>
          <summary className="cursor-pointer text-base font-semibold text-accent-secondary">
            Questions or feedback? Contact Jake
          </summary>
          <div className="mt-3 space-y-4">
            <p className="text-sm text-muted">
              Hey, I&apos;m Jake — a licensed physical therapist and the creator of
              CareCred. I&apos;d love to hear from you: feedback, feature ideas, or
              anything on your mind.
            </p>
            <p className="text-sm">
              <span className="text-muted">Email </span>
              <a
                href="mailto:dptforme.llc@gmail.com"
                className="font-medium text-accent-secondary underline-offset-2 hover:underline"
              >
                dptforme.llc@gmail.com
              </a>
            </p>
            <a
              href="https://buy.stripe.com/6oU4gz4UMcL596dcrO9Ve01"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-success px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Support CareCred
            </a>
          </div>
        </details>
      </section>

      <section className="card flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Your public profile</h2>
            <p className="mt-1 text-sm text-muted">
              {profile.display_name} · /u/{profile.slug}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={`/u/${profile.slug}`}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent-primary px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-accent-hover"
            >
              View my page
            </Link>
            <Link
              href="/dashboard/edit"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2 text-center text-sm font-medium transition hover:bg-surface-alt"
            >
              Edit profile
            </Link>
            {profile.profile_type === "provider" ? (
              <ProviderQrDownloadButton slug={profile.slug} />
            ) : null}
          </div>
        </div>
        {profile.profile_type === "patient" ? (
          <div className="w-full min-w-0 max-w-xl">
            <p className="mb-2 text-xs text-muted">
              Your profile link isn&apos;t shown on your public page. Copy it here
              if you need to share or save it.
            </p>
            <ProfileShareLink
              slug={profile.slug}
              buttonLabel="Copy your public profile link"
            />
          </div>
        ) : null}
      </section>

      <section className="card p-6">
        <AccountPasswordCollapsible
          accountEmail={user.email ?? ""}
          variant="settings-page"
        />
      </section>

      <FollowDashboardSection
        followers={followers}
        following={following}
        followerCount={followerCount}
        initialShowFollowerCount={profile.show_follower_count !== false}
      />

      {profile.profile_type === "provider" ? (
        <section className="card p-6">
          <SurveyCenterCollapsible
            initialConfig={surveyConfigFromProfile(profile)}
            profession={profile.profession}
          />
        </section>
      ) : null}

      {profile.profile_type === "provider" ? (
        <ImportedReviewForm providerProfileId={profile.id} />
      ) : null}

      {profile.profile_type === "provider" ? (
        <section className="card p-6">
          <details>
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              Hidden reviews ({hiddenReviews.length})
            </summary>
            <p className="mt-3 text-sm text-muted">
              Hidden testimonials are not shown on your public profile. You can
              unhide any review from this list.
            </p>
            {hiddenReviews.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No hidden reviews.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {hiddenReviews.map((review) => (
                  <ExpandableReviewCard
                    key={review.id}
                    review={review}
                    ownerCanHide
                    signedIn
                    currentUserId={user.id}
                  />
                ))}
              </ul>
            )}
          </details>
        </section>
      ) : null}

      <section className="card p-6">
        <GivenTestimonialsCollapsible
          items={givenWithProviders}
          currentUserId={user.id}
          profileType={profile.profile_type}
        />
      </section>
    </div>
  );
}
