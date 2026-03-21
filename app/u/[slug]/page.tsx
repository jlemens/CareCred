import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpandableProfileText } from "@/components/expandable-profile-text";
import { ExpandableReviewCard } from "@/components/expandable-review-card";
import { NewReviewForm } from "@/components/new-review-form";
import { getProfileBySlug, getProviderReviews } from "@/lib/queries";

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
            <p className="mt-1 text-sm text-muted">
              {profile.profile_type === "provider"
                ? profile.practice_name ?? "Provider profile"
                : "Patient profile"}
              {profile.location ? ` - ${profile.location}` : ""}
            </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
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

        {profile.profile_type === "provider" ? (
          <div className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-3">
            <p className="rounded-md border border-border p-3">
              <span className="block text-xs uppercase tracking-wide">Specialties</span>
              {profile.specialties ? (
                <ExpandableProfileText
                  text={profile.specialties}
                  minChars={100}
                  clampLines={3}
                  tone="foreground"
                  className="mt-1 block"
                />
              ) : (
                <span className="mt-1 block text-foreground">-</span>
              )}
            </p>
            <p className="rounded-md border border-border p-3">
              <span className="block text-xs uppercase tracking-wide">Education</span>
              {profile.education ? (
                <ExpandableProfileText
                  text={profile.education}
                  minChars={100}
                  clampLines={3}
                  tone="foreground"
                  className="mt-1 block"
                />
              ) : (
                <span className="mt-1 block text-foreground">-</span>
              )}
            </p>
            <p className="rounded-md border border-border p-3">
              <span className="block text-xs uppercase tracking-wide">
                Experience
              </span>
              <span className="mt-1 block text-foreground">
                {profile.years_experience
                  ? `${profile.years_experience} years`
                  : "-"}
              </span>
            </p>
          </div>
        ) : null}
      </section>

      {profile.profile_type === "provider" ? (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Testimonials</h2>
            <p className="mt-1 text-sm text-muted">
              Includes PT survey reviews and provider-added imported reviews.
            </p>
            {reviews.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                No testimonials yet. Be the first to leave a review.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {reviews.map((review) => (
                  <ExpandableReviewCard key={review.id} review={review} />
                ))}
              </ul>
            )}
          </div>
          <NewReviewForm providerProfileId={profile.id} />
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
