"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PASSWORD_RESET_PATH } from "@/lib/password-reset";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = {
  /** When true, recovery / reset links go to the reset-password page. */
  preferPasswordReset?: boolean;
};

/**
 * Handles Supabase email links that arrive with ?code=, ?token_hash=, or #type=recovery.
 * Needed when Site URL is / or /auth and middleware cannot see URL hashes.
 */
export function AuthEmailLinkHandler({ preferPasswordReset = false }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;

    async function handleEmailLink() {
      const sb = supabase;
      if (!sb) return;

      const url = new URL(window.location.href);
      const hash = url.hash.slice(1);

      if (hash) {
        const hashParams = new URLSearchParams(hash);
        if (hashParams.get("type") === "recovery") {
          window.location.replace(`${PASSWORD_RESET_PATH}#${hash}`);
          return;
        }
      }

      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");

      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        url.searchParams.delete("code");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        if (!cancelled && !error) {
          router.replace(preferPasswordReset ? PASSWORD_RESET_PATH : "/");
          return;
        }
      }

      if (tokenHash && type === "recovery") {
        const { error } = await sb.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        url.searchParams.delete("token_hash");
        url.searchParams.delete("type");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        if (!cancelled && !error) {
          router.replace(PASSWORD_RESET_PATH);
          return;
        }
      }
    }

    void handleEmailLink();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !session) return;
      if (event === "PASSWORD_RECOVERY") {
        router.replace(PASSWORD_RESET_PATH);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router, preferPasswordReset]);

  return null;
}
