"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthEmailLinkHandler } from "@/components/auth-email-link-handler";
import { PASSWORD_RESET_PATH } from "@/lib/password-reset";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Client gate for `/` so recovery tokens in the URL hash are not dropped by a
 * server redirect to `/auth`.
 */
export function HomeEntry() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      router.replace("/auth");
      return;
    }

    let cancelled = false;

    async function routeHome() {
      const sb = supabase;
      if (!sb) return;

      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.slice(1));
      if (hashParams.get("type") === "recovery") {
        window.location.replace(`${PASSWORD_RESET_PATH}${url.hash}`);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
      if (cancelled) return;

      const {
        data: { session },
      } = await sb.auth.getSession();
      if (cancelled) return;

      if (!session) {
        router.replace("/auth");
        return;
      }

      const { data: profile } = await sb
        .from("profiles")
        .select("slug")
        .eq("user_id", session.user.id)
        .maybeSingle<{ slug: string | null }>();

      if (cancelled) return;

      if (profile?.slug) {
        router.replace(`/u/${profile.slug}`);
        return;
      }

      router.replace("/dashboard");
    }

    void routeHome();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <>
      <AuthEmailLinkHandler />
      <p className="text-sm text-muted">Loading…</p>
    </>
  );
}
