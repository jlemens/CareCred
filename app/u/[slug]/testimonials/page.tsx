import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpandableReviewCard } from "@/components/expandable-review-card";
import { getProfileBySlug, getProviderReviews, getSessionUser } from "@/lib/queries";
import { sortReviewsForDisplay } from "@/lib/review-ratings";

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
  const pinnedCount = orderedReviews.filter((r) => r.is_pinned).length;

  return (
    <div className="grid w-full gap-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">All testimonials</h1>
            <p className="mt-1 text-sm text-muted">
              {profile.display_name} · {orderedReviews.length} total
            </p>
          </div>
          <Link
            href={`/u/${profile.slug}`}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-sm transition hover:bg-surface-alt"
          >
            Back to profile
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
                pinnedCount={pinnedCount}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
