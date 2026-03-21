import Link from "next/link";
import { ImportedReviewForm } from "@/components/imported-review-form";
import { LogoutButton } from "@/components/logout-button";
import { StarRatingDisplay } from "@/components/star-rating-display";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { effectiveOverallRating } from "@/lib/review-ratings";
import {
  getGivenReviewsByUser,
  getProfileByUserId,
  getSessionUser,
} from "@/lib/queries";
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

  const [profile, givenReviews] = await Promise.all([
    getProfileByUserId(user.id),
    getGivenReviewsByUser(user.id),
  ]);

  const needsOnboarding = !profile;

  if (needsOnboarding) {
    return (
      <OnboardingFlow userId={user.id} email={user.email ?? ""} />
    );
  }

  return (
    <div className="grid w-full gap-6">
      <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Account</h1>
          <p className="mt-1 text-sm text-muted">
            Your public page is separate from this screen. Use{" "}
            <strong className="text-foreground">My page</strong> in the header
            to view or share it.
          </p>
        </div>
        <LogoutButton />
      </section>

      <section className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Your public profile</h2>
          <p className="mt-1 text-sm text-muted">
            {profile.display_name} · /u/{profile.slug}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
        </div>
      </section>

      {profile.profile_type === "provider" ? (
        <ImportedReviewForm providerProfileId={profile.id} />
      ) : null}

      <section className="card p-6">
        <h2 className="text-lg font-semibold">My given testimonials</h2>
        <p className="mt-1 text-sm text-muted">
          Reviews you submitted while signed in to your account.
        </p>
        {givenReviews.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No account-linked reviews yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {givenReviews.map((review) => {
              const stars = effectiveOverallRating(review);
              return (
                <li key={review.id} className="rounded-md border border-border p-3">
                  <p className="text-sm text-muted">
                    {new Date(review.created_at).toLocaleDateString()} ·{" "}
                    {review.source === "google_manual"
                      ? "Imported"
                      : "Quick survey"}
                  </p>
                  {review.source === "pt_survey" && stars != null ? (
                    <div className="mt-2 flex items-center gap-2">
                      <StarRatingDisplay value={stars} />
                      <span className="text-sm text-muted">{stars}/5</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm">
                      {review.standout_care?.trim() || "—"}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
