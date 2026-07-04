import { NextResponse } from "next/server";
import { z } from "zod";
import type { AppNotification } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  notificationId: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
});

async function markReadViaRpc(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  args: { notificationId?: string; markAll?: boolean },
) {
  const { data, error } = await supabase.rpc("mark_notifications_read", {
    p_notification_id: args.notificationId ?? null,
    p_mark_all: Boolean(args.markAll),
  });

  if (error) {
    const outdated =
      error.message.includes("mark_notifications_read") ||
      error.message.includes("does not exist");
    return {
      ok: false as const,
      error: outdated
        ? "Database schema is outdated. Run supabase/migrations/20250704150000_mark_notifications_read.sql, then retry."
        : error.message,
      outdated,
    };
  }

  return {
    ok: true as const,
    updatedCount: typeof data === "number" && Number.isFinite(data) ? data : 0,
  };
}

async function markReadViaUpdate(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  userId: string,
  args: { notificationId?: string; markAll?: boolean },
) {
  const now = new Date().toISOString();

  if (args.markAll) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("recipient_user_id", userId)
      .is("read_at", null);

    if (error) {
      return { ok: false as const, error: error.message, outdated: false };
    }

    return { ok: true as const, updatedCount: 0 };
  }

  if (!args.notificationId) {
    return { ok: false as const, error: "Missing notificationId.", outdated: false };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("id", args.notificationId)
    .eq("recipient_user_id", userId)
    .is("read_at", null);

  if (error) {
    return { ok: false as const, error: error.message, outdated: false };
  }

  return { ok: true as const, updatedCount: 1 };
}

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

  if (!parsed.data.markAll && !parsed.data.notificationId) {
    return NextResponse.json({ error: "Missing notificationId." }, { status: 400 });
  }

  const rpcResult = await markReadViaRpc(supabase, parsed.data);
  if (rpcResult.ok) {
    return NextResponse.json({
      ok: true,
      updatedCount: rpcResult.updatedCount,
    });
  }

  if (!rpcResult.outdated) {
    const fallback = await markReadViaUpdate(supabase, user.id, parsed.data);
    if (fallback.ok) {
      return NextResponse.json({
        ok: true,
        updatedCount: fallback.updatedCount,
      });
    }
    return NextResponse.json({ error: fallback.error }, { status: 400 });
  }

  return NextResponse.json({ error: rpcResult.error }, { status: 400 });
}
