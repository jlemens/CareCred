import type { EmailOtpType } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AUTH_CALLBACK_PATH,
  PASSWORD_RESET_PATH,
  safeAuthNextPath,
} from "@/lib/password-reset";

export function resolveAuthExchangeRedirect(
  pathname: string,
  searchParams: URLSearchParams,
): string {
  const type = searchParams.get("type");
  if (type === "recovery") {
    return PASSWORD_RESET_PATH;
  }

  const explicitNext = searchParams.get("next");
  if (explicitNext) {
    return safeAuthNextPath(explicitNext);
  }

  if (pathname === PASSWORD_RESET_PATH || pathname === AUTH_CALLBACK_PATH) {
    return PASSWORD_RESET_PATH;
  }

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
  cleaned.searchParams.delete("error");
  cleaned.searchParams.delete("error_code");
  cleaned.searchParams.delete("error_description");
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

/** Prefer token_hash (works from email / Supabase dashboard) over PKCE code. */
export async function exchangeEmailLinkAuth(
  supabase: SupabaseClient,
  params: AuthExchangeParams,
) {
  if (params.tokenHash && params.type) {
    return supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: params.type,
    });
  }

  if (params.code) {
    return supabase.auth.exchangeCodeForSession(params.code);
  }

  return { data: { session: null, user: null }, error: null };
}

export function readSupabaseAuthError(searchParams: URLSearchParams): string | null {
  const code = searchParams.get("error_code") ?? searchParams.get("error");
  if (code === "otp_expired") {
    return "This reset link has expired. Request a new one (links are single-use and time-limited).";
  }
  if (searchParams.get("error_description")) {
    return searchParams.get("error_description");
  }
  if (code) {
    return "This reset link is invalid or has expired.";
  }
  return null;
}
