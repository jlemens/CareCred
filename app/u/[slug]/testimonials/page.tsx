import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpandableReviewCard } from "@/components/expandable-review-card";
import { getProfileBySlug, getProviderReviews, getSessionUser } from "@/lib/queries";
import {
  MAX_PINNED_TESTIMONIALS,
  sortReviewsForDisplay,
} from "@/lib/review-ratings";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AllTestimonialsPage({ params }: Props) {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile || profile.profile_type !== "provider") {
    notFound();
  }

  const [reviews, sessionUser] = await Promise.all([
    getProviderReviews(profile.id),
    getSessionUser(),
  ]);

  const isOwnProviderPage = sessionUser?.id === profile.user_id;
  const orderedReviews = sortReviewsForDisplay(reviews);
  const pinnedCount = orderedReviews.filter((r) => Boolean(r.is_pinned)).length;

  return (
    <div className="grid w-full gap-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">All testimonials</h1>
            <p className="mt-1 text-sm text-muted">
              {profile.display_name} · {orderedReviews.length} total
            </p>
            {isOwnProviderPage ? (
              <p
                className="mt-1 text-sm tabular-nums font-medium text-foreground"
                title={`You can pin up to ${MAX_PINNED_TESTIMONIALS} testimonials on your profile`}
                aria-live="polite"
              >
                {pinnedCount}/{MAX_PINNED_TESTIMONIALS} pinned
              </p>
            ) : null}
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              <li>Member reviews = signed-in accounts.</li>
              <li>Guest reviews = non-signed-in accounts.</li>
            </ul>
          </div>
          <Link
            href={`/u/${profile.slug}`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-accent-secondary px-5 py-2 text-sm font-semibold text-white shadow-md shadow-accent-secondary/35 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-secondary"
          >
            Back to provider profile
          </Link>
        </div>
      </section>

      <section className="card p-6">
        {orderedReviews.length === 0 ? (
          <p className="text-sm text-muted">No testimonials yet.</p>
        ) : (
          <ul className="space-y-3">
            {orderedReviews.map((review) => (
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
        )}
      </section>
    </div>
  );
}
