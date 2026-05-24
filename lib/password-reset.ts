/** Where users choose a new password after following the email link. */
export const PASSWORD_RESET_PATH = "/auth/reset-password";

/** Supabase PKCE / OTP links must land here first so we can establish a session. */
export const AUTH_CALLBACK_PATH = "/auth/callback";

export function buildPasswordResetRedirectTo(origin: string): string {
  const next = encodeURIComponent(PASSWORD_RESET_PATH);
  return `${origin}${AUTH_CALLBACK_PATH}?next=${next}`;
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
