import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  reviewId: z.string().uuid(),
  pinned: z.boolean(),
});

export async function PATCH(request: Request) {
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

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { reviewId, pinned } = parsed.data;

  const { data: review, error: reviewError } = await supabase
    .from("provider_reviews")
    .select("id, provider_profile_id, is_pinned")
    .eq("id", reviewId)
    .single<{ id: string; provider_profile_id: string; is_pinned: boolean }>();

  if (reviewError || !review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  const { data: provider, error: providerError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", review.provider_profile_id)
    .eq("user_id", user.id)
    .eq("profile_type", "provider")
    .single<{ id: string }>();

  if (providerError || !provider) {
    return NextResponse.json(
      { error: "Only the profile owner can pin testimonials." },
      { status: 403 },
    );
  }

  if (pinned && !review.is_pinned) {
    const { count, error: countError } = await supabase
      .from("provider_reviews")
      .select("id", { head: true, count: "exact" })
      .eq("provider_profile_id", review.provider_profile_id)
      .eq("is_pinned", true);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 400 });
    }
    if ((count ?? 0) >= 4) {
      return NextResponse.json(
        { error: "You can pin up to 4 testimonials." },
        { status: 400 },
      );
    }
  }

  const { error: updateError } = await supabase
    .from("provider_reviews")
    .update({ is_pinned: pinned })
    .eq("id", reviewId)
    .eq("provider_profile_id", review.provider_profile_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
