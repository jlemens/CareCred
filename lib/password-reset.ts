/** Path users land on after clicking the password-reset link in email (add to Supabase Redirect URLs). */
export const PASSWORD_RESET_PATH = "/auth/reset-password";

export function getPasswordResetRedirectTo(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return `${window.location.origin}${PASSWORD_RESET_PATH}`;
}
