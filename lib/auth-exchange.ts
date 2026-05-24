import type { EmailOtpType } from "@supabase/supabase-js";
import {
  AUTH_CALLBACK_PATH,
  PASSWORD_RESET_PATH,
  safeAuthNextPath,
} from "@/lib/password-reset";

export function resolveAuthExchangeRedirect(
  pathname: string,
  searchParams: URLSearchParams,
): string {
  const explicitNext = searchParams.get("next");
  if (explicitNext) {
    return safeAuthNextPath(explicitNext);
  }

  if (pathname === PASSWORD_RESET_PATH || pathname === AUTH_CALLBACK_PATH) {
    return PASSWORD_RESET_PATH;
  }

  const type = searchParams.get("type");
  if (type === "recovery") {
    return PASSWORD_RESET_PATH;
  }

  // Supabase falls back to Site URL (/auth) when redirectTo is not allow-listed.
  if (pathname === "/auth" && (searchParams.has("code") || searchParams.has("token_hash"))) {
    return PASSWORD_RESET_PATH;
  }

  return "/";
}

export function stripAuthExchangeParams(url: URL): URL {
  const cleaned = new URL(url.toString());
  cleaned.searchParams.delete("code");
  cleaned.searchParams.delete("token_hash");
  cleaned.searchParams.delete("type");
  cleaned.searchParams.delete("next");
  return cleaned;
}

export type AuthExchangeParams = {
  code: string | null;
  tokenHash: string | null;
  type: EmailOtpType | null;
};

export function readAuthExchangeParams(
  searchParams: URLSearchParams,
): AuthExchangeParams {
  return {
    code: searchParams.get("code"),
    tokenHash: searchParams.get("token_hash"),
    type: searchParams.get("type") as EmailOtpType | null,
  };
}
