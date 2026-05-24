import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/lib/types";

type CreateNotificationInput = {
  recipientUserId: string;
  actorUserId: string | null;
  type: NotificationType;
  reviewId: string | null;
  commentId?: string | null;
  message: string;
  href: string;
};

export async function createAppNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput,
) {
  const { data, error } = await supabase.rpc("create_app_notification", {
    p_recipient_user_id: input.recipientUserId,
    p_actor_user_id: input.actorUserId,
    p_type: input.type,
    p_review_id: input.reviewId,
    p_comment_id: input.commentId ?? null,
    p_message: input.message,
    p_href: input.href,
  });

  if (error) {
    console.error("create_app_notification failed:", error.message);
    return null;
  }

  return typeof data === "string" ? data : null;
}

type ReviewContext = {
  id: string;
  author_user_id: string | null;
  provider_profile_id: string;
  guest_name?: string | null;
};

type ProviderContext = {
  user_id: string;
  slug: string;
  display_name: string;
};


export async function notifyReviewComment(
  supabase: SupabaseClient,
  review: ReviewContext,
  provider: ProviderContext,
  actorUserId: string,
  actorDisplayName: string,
  commentId: string,
) {
  const href = `/u/${provider.slug}/testimonials#testimonial-${review.id}`;
  const message = `${actorDisplayName} commented on a testimonial on your profile.`;

  const recipients = new Set<string>();

  if (review.author_user_id && review.author_user_id !== actorUserId) {
    recipients.add(review.author_user_id);
  }
  if (provider.user_id !== actorUserId) {
    recipients.add(provider.user_id);
  }

  await Promise.all(
    [...recipients].map((recipientUserId) =>
      createAppNotification(supabase, {
        recipientUserId,
        actorUserId,
        type: "review_comment",
        reviewId: review.id,
        commentId,
        message:
          recipientUserId === review.author_user_id
            ? `${actorDisplayName} commented on your testimonial.`
            : message,
        href,
      }),
    ),
  );
}

export async function notifyReviewLike(
  supabase: SupabaseClient,
  review: ReviewContext,
  provider: ProviderContext,
  actorUserId: string,
  actorDisplayName: string,
) {
  if (!review.author_user_id || review.author_user_id === actorUserId) {
    return;
  }

  await createAppNotification(supabase, {
    recipientUserId: review.author_user_id,
    actorUserId,
    type: "review_like",
    reviewId: review.id,
    message: `${actorDisplayName} liked your testimonial.`,
    href: `/u/${provider.slug}/testimonials#testimonial-${review.id}`,
  });
}
