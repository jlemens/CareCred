import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyReviewLike } from "@/lib/notifications";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  reviewId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to like testimonials." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { reviewId } = parsed.data;

  const { data: review, error: reviewError } = await supabase
    .from("provider_reviews")
    .select("id, author_user_id, provider_profile_id, is_visible, guest_name")
    .eq("id", reviewId)
    .single<{
      id: string;
      author_user_id: string | null;
      provider_profile_id: string;
      is_visible: boolean;
      guest_name: string | null;
    }>();

  if (reviewError || !review) {
    return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
  }

  if (!review.is_visible) {
    return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("review_likes")
    .select("review_id")
    .eq("review_id", reviewId)
    .eq("user_id", user.id)
    .maybeSingle();

  let liked: boolean;

  if (existing) {
    const { error: deleteError } = await supabase
      .from("review_likes")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", user.id);

    if (deleteError) {
      const outdated =
        deleteError.message.includes("review_likes") ||
        deleteError.message.includes("does not exist");
      return NextResponse.json(
        {
          error: outdated
            ? "Database schema is outdated. Run supabase/schema.sql, then retry."
            : deleteError.message,
        },
        { status: outdated ? 400 : 500 },
      );
    }
    liked = false;
  } else {
    const { error: insertError } = await supabase.from("review_likes").insert({
      review_id: reviewId,
      user_id: user.id,
    });

    if (insertError) {
      const outdated =
        insertError.message.includes("review_likes") ||
        insertError.message.includes("does not exist");
      return NextResponse.json(
        {
          error: outdated
            ? "Database schema is outdated. Run supabase/schema.sql, then retry."
            : insertError.message,
        },
        { status: outdated ? 400 : 500 },
      );
    }
    liked = true;

    const [{ data: actorProfile }, { data: providerProfile }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle<{ display_name: string }>(),
      supabase
        .from("profiles")
        .select("user_id, slug, display_name")
        .eq("id", review.provider_profile_id)
        .single<{ user_id: string; slug: string; display_name: string }>(),
    ]);

    if (providerProfile) {
      await notifyReviewLike(
        supabase,
        review,
        providerProfile,
        user.id,
        actorProfile?.display_name ?? "Someone",
      );
    }
  }

  const { count } = await supabase
    .from("review_likes")
    .select("review_id", { head: true, count: "exact" })
    .eq("review_id", reviewId);

  return NextResponse.json({ liked, likeCount: count ?? 0 });
}
