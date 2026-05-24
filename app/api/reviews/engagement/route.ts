import { NextResponse } from "next/server";
import type { ReviewComment, ReviewEngagementSummary } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids")?.trim();
  if (!idsParam) {
    return NextResponse.json({ error: "Missing ids query parameter." }, { status: 400 });
  }

  const reviewIds = [...new Set(idsParam.split(",").map((id) => id.trim()).filter(Boolean))];
  if (reviewIds.length === 0 || reviewIds.length > 50) {
    return NextResponse.json({ error: "Invalid ids." }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: likes, error: likesError }, { data: comments, error: commentsError }] =
    await Promise.all([
      supabase
        .from("review_likes")
        .select("review_id, user_id")
        .in("review_id", reviewIds),
      supabase
        .from("review_comments")
        .select("id, review_id, author_user_id, body, created_at")
        .in("review_id", reviewIds)
        .order("created_at", { ascending: true }),
    ]);

  if (likesError || commentsError) {
    const message = likesError?.message ?? commentsError?.message ?? "Unable to load engagement.";
    const outdated =
      message.includes("review_likes") ||
      message.includes("review_comments") ||
      message.includes("does not exist");
    return NextResponse.json(
      {
        error: outdated
          ? "Database schema is outdated. Run supabase/schema.sql, then retry."
          : message,
      },
      { status: outdated ? 400 : 500 },
    );
  }

  const authorIds = [...new Set((comments ?? []).map((c) => c.author_user_id))];
  const { data: profiles } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name, slug")
          .in("user_id", authorIds)
      : { data: [] as Array<{ user_id: string; display_name: string; slug: string }> };

  const profileByUserId = new Map(
    (profiles ?? []).map((p) => [p.user_id, { display_name: p.display_name, slug: p.slug }]),
  );

  const engagement: Record<string, ReviewEngagementSummary> = {};
  for (const reviewId of reviewIds) {
    engagement[reviewId] = { likeCount: 0, likedByMe: false, comments: [] };
  }

  for (const like of likes ?? []) {
    const entry = engagement[like.review_id];
    if (!entry) continue;
    entry.likeCount += 1;
    if (user && like.user_id === user.id) {
      entry.likedByMe = true;
    }
  }

  for (const comment of comments ?? []) {
    const entry = engagement[comment.review_id];
    if (!entry) continue;
    const profile = profileByUserId.get(comment.author_user_id);
    entry.comments.push({
      ...comment,
      author_display_name: profile?.display_name ?? "Member",
      author_slug: profile?.slug ?? null,
    } satisfies ReviewComment);
  }

  return NextResponse.json({ engagement });
}
