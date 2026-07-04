import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  showFollowerCount: z.boolean(),
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
    return NextResponse.json({ error: "Invalid follow settings." }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      show_follower_count: parsed.data.showFollowerCount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    const outdated =
      error.message.includes("show_follower_count") ||
      error.message.includes("does not exist");
    return NextResponse.json(
      {
        error: outdated
          ? "Database schema is outdated. Run supabase/migrations/20250704140000_add_profile_follows.sql, then retry."
          : error.message,
      },
      { status: outdated ? 400 : 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    showFollowerCount: parsed.data.showFollowerCount,
  });
}
