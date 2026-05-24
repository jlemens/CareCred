import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyReviewComment } from "@/lib/notifications";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const postSchema = z.object({
  reviewId: z.string().uuid(),
  body: z.string().trim().min(1).max(1000),
});

const deleteSchema = z.object({
  commentId: z.string().uuid(),
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
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comment." }, { status: 400 });
  }

  const { reviewId, body } = parsed.data;

  const { data: review, error: reviewError } = await supabase
    .from("provider_reviews")
    .select("id, author_user_id, provider_profile_id, is_visible")
    .eq("id", reviewId)
    .single<{
      id: string;
      author_user_id: string | null;
      provider_profile_id: string;
      is_visible: boolean;
    }>();

  if (reviewError || !review) {
    return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
  }

  if (!review.is_visible) {
    const { data: provider } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", review.provider_profile_id)
      .single<{ user_id: string }>();
    const isOwner = provider?.user_id === user.id;
    const isAuthor = review.author_user_id === user.id;
    if (!isOwner && !isAuthor) {
      return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
    }
  }

  const { data: comment, error: insertError } = await supabase
    .from("review_comments")
    .insert({
      review_id: reviewId,
      author_user_id: user.id,
      body,
    })
    .select("id, review_id, author_user_id, body, created_at")
    .single<{
      id: string;
      review_id: string;
      author_user_id: string;
      body: string;
      created_at: string;
    }>();

  if (insertError || !comment) {
    const outdated =
      insertError?.message?.includes("review_comments") ||
      insertError?.message?.includes("does not exist");
    return NextResponse.json(
      {
        error: outdated
          ? "Database schema is outdated. Run supabase/schema.sql, then retry."
          : (insertError?.message ?? "Unable to post comment."),
      },
      { status: outdated ? 400 : 500 },
    );
  }

  const [{ data: actorProfile }, { data: providerProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, slug")
      .eq("user_id", user.id)
      .maybeSingle<{ display_name: string; slug: string }>(),
    supabase
      .from("profiles")
      .select("user_id, slug, display_name")
      .eq("id", review.provider_profile_id)
      .single<{ user_id: string; slug: string; display_name: string }>(),
  ]);

  if (providerProfile) {
    await notifyReviewComment(
      supabase,
      review,
      providerProfile,
      user.id,
      actorProfile?.display_name ?? "Someone",
      comment.id,
    );
  }

  return NextResponse.json({
    comment: {
      ...comment,
      author_display_name: actorProfile?.display_name ?? "Member",
      author_slug: actorProfile?.slug ?? null,
    },
  });
}

export async function DELETE(request: Request) {
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = deleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { error } = await supabase
    .from("review_comments")
    .delete()
    .eq("id", parsed.data.commentId)
    .eq("author_user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
