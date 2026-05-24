"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  exchangeEmailLinkAuth,
  readAuthExchangeParams,
} from "@/lib/auth-exchange";
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

      const {
        data: { session },
      } = await sb.auth.getSession();
      if (session && preferPasswordReset) {
        router.replace(PASSWORD_RESET_PATH);
        return;
      }

      const authParams = readAuthExchangeParams(url.searchParams);
      if (authParams.code || authParams.tokenHash) {
        const { error } = await exchangeEmailLinkAuth(sb, authParams);
        url.searchParams.delete("code");
        url.searchParams.delete("token_hash");
        url.searchParams.delete("type");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        if (!cancelled && !error) {
          router.replace(preferPasswordReset ? PASSWORD_RESET_PATH : "/");
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
