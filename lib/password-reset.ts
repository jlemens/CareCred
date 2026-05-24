/** Where users choose a new password after following the email link. */
export const PASSWORD_RESET_PATH = "/auth/reset-password";

/** Supabase email tokens are exchanged here, then the user is sent to reset-password. */
export const AUTH_CALLBACK_PATH = "/auth/callback";

const RESET_NEXT_PARAM = encodeURIComponent(PASSWORD_RESET_PATH);

/** Used by resetPasswordForEmail({ redirectTo }). Must be allow-listed in Supabase. */
export function buildPasswordResetRedirectTo(origin: string): string {
  return `${origin}${AUTH_CALLBACK_PATH}?next=${RESET_NEXT_PARAM}`;
}

/**
 * Paste into Supabase → Authentication → Email templates → Reset password.
 * Uses token_hash so links work from email apps and Supabase dashboard sends.
 */
export function buildRecoveryEmailLink(siteUrl: string): string {
  const origin = siteUrl.replace(/\/$/, "");
  return `${origin}${AUTH_CALLBACK_PATH}?next=${RESET_NEXT_PARAM}&token_hash={{ .TokenHash }}&type=recovery`;
}

export function getPasswordResetRedirectTo(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return buildPasswordResetRedirectTo(window.location.origin);
}

/** Prevent open redirects from tampered `next` query params. */
export function safeAuthNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return PASSWORD_RESET_PATH;
  }
  return next;
}
