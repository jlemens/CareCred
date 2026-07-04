import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const postSchema = z.object({
  profileId: z.string().uuid(),
});

function outdatedSchemaMessage(errorMessage: string) {
  const outdated =
    errorMessage.includes("profile_follows") ||
    errorMessage.includes("does not exist");
  return outdated
    ? "Database schema is outdated. Run supabase/migrations/20250704140000_add_profile_follows.sql, then retry."
    : errorMessage;
}

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
    return NextResponse.json({ error: "Sign in to follow profiles." }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { profileId } = parsed.data;

  const { data: targetProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id")
    .eq("id", profileId)
    .single<{ id: string; user_id: string }>();

  if (profileError || !targetProfile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (targetProfile.user_id === user.id) {
    return NextResponse.json({ error: "You cannot follow your own profile." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("profile_follows")
    .select("followed_profile_id")
    .eq("followed_profile_id", profileId)
    .eq("follower_user_id", user.id)
    .maybeSingle();

  let following: boolean;

  if (existing) {
    const { error: deleteError } = await supabase
      .from("profile_follows")
      .delete()
      .eq("followed_profile_id", profileId)
      .eq("follower_user_id", user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: outdatedSchemaMessage(deleteError.message) },
        { status: 500 },
      );
    }
    following = false;
  } else {
    const { error: insertError } = await supabase.from("profile_follows").insert({
      followed_profile_id: profileId,
      follower_user_id: user.id,
    });

    if (insertError) {
      return NextResponse.json(
        { error: outdatedSchemaMessage(insertError.message) },
        { status: 500 },
      );
    }
    following = true;
  }

  const { data: countData, error: countError } = await supabase.rpc(
    "profile_follower_count",
    { p_profile_id: profileId },
  );

  let followerCount = typeof countData === "number" ? countData : 0;
  if (countError) {
    const { count } = await supabase
      .from("profile_follows")
      .select("followed_profile_id", { head: true, count: "exact" })
      .eq("followed_profile_id", profileId);
    followerCount = count ?? 0;
  }

  return NextResponse.json({ following, followerCount });
}
