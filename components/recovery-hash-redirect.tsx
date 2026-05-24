"use client";

import { useEffect } from "react";
import { PASSWORD_RESET_PATH } from "@/lib/password-reset";

/**
 * Supabase sometimes sends recovery tokens in the URL hash to Site URL (/ or /auth).
 * Server redirects drop the hash, so forward recovery hashes to the reset page.
 */
export function RecoveryHashRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash || hash.length <= 1) return;

    const params = new URLSearchParams(hash.slice(1));
    if (params.get("type") !== "recovery") return;

    const target = `${PASSWORD_RESET_PATH}${hash}`;
    if (`${window.location.pathname}${window.location.hash}` === target) return;

    window.location.replace(target);
  }, []);

  return null;
}
