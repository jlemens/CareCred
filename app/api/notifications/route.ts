import { NextResponse } from "next/server";
import { z } from "zod";
import type { AppNotification } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  notificationId: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
});

export async function GET() {
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

  const [{ data: notifications, error }, { count: unreadCount, error: countError }] =
    await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)
        .returns<AppNotification[]>(),
      supabase
        .from("notifications")
        .select("id", { head: true, count: "exact" })
        .eq("recipient_user_id", user.id)
        .is("read_at", null),
    ]);

  if (error || countError) {
    const message = error?.message ?? countError?.message ?? "Unable to load notifications.";
    const outdated = message.includes("notifications") || message.includes("does not exist");
    return NextResponse.json(
      {
        error: outdated
          ? "Database schema is outdated. Run supabase/schema.sql, then retry."
          : message,
      },
      { status: outdated ? 400 : 500 },
    );
  }

  return NextResponse.json({
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
  });
}

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

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (parsed.data.markAll) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("recipient_user_id", user.id)
      .is("read_at", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!parsed.data.notificationId) {
    return NextResponse.json({ error: "Missing notificationId." }, { status: 400 });
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("id", parsed.data.notificationId)
    .eq("recipient_user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
