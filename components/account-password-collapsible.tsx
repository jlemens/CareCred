"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getPasswordResetRedirectTo } from "@/lib/password-reset";

type Props = {
  accountEmail: string;
  /**
   * `settings-page` = inside dashboard Settings card; matches other `<details>` rows.
   * `in-form` = nested in Edit profile form (tinted inner panel).
   */
  variant?: "in-form" | "settings-page";
};

export function AccountPasswordCollapsible({
  accountEmail,
  variant = "in-form",
}: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [changeMsg, setChangeMsg] = useState<string | null>(null);
  const [changeLoading, setChangeLoading] = useState(false);

  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#password") return;
    const el = detailsRef.current;
    if (el) {
      el.open = true;
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  async function sendResetLink() {
    setResetMsg(null);
    if (!supabase) {
      setResetMsg("Supabase is not configured.");
      return;
    }
    const email = accountEmail.trim();
    if (!email) {
      setResetMsg("No email on file for this account.");
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordResetRedirectTo(),
    });
    setResetLoading(false);
    if (error) {
      setResetMsg(error.message);
      return;
    }
    setResetMsg(
      "Check your inbox for a CareCred message with a reset link. Open it, set your new password on the page we show you, then sign in as usual.",
    );
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setChangeMsg(null);
    if (!supabase) {
      setChangeMsg("Supabase is not configured.");
      return;
    }
    if (newPassword.length < 8) {
      setChangeMsg("Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNew) {
      setChangeMsg("New passwords do not match.");
      return;
    }
    setChangeLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangeLoading(false);
    if (error) {
      setChangeMsg(error.message);
      return;
    }
    setNewPassword("");
    setConfirmNew("");
    setChangeMsg("Password updated. You’re all set.");
  }

  const onSettingsPage = variant === "settings-page";

  return (
    <details
      ref={detailsRef}
      id="password"
      className={
        onSettingsPage
          ? undefined
          : "rounded-lg border border-border/60 bg-surface-alt/40"
      }
    >
      <summary
        className={
          onSettingsPage
            ? "cursor-pointer text-sm font-medium text-foreground"
            : "cursor-pointer select-none px-4 py-3 text-sm font-medium text-foreground"
        }
      >
        Password &amp; security
      </summary>
      <div
        className={
          onSettingsPage
            ? "mt-3 space-y-6"
            : "space-y-6 border-t border-border/60 px-4 py-4"
        }
      >
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Change password
          </h3>
          <p className="mt-1 text-xs text-muted">
            Signed in as <span className="text-foreground/90">{accountEmail}</span>.
            Enter a new password below (no need for your old one on this device).
          </p>
          <form
            onSubmit={(ev) => void onChangePassword(ev)}
            className="mt-3 space-y-3"
          >
            <label className="block space-y-1">
              <span className="text-xs text-muted">New password</span>
              <input
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted">Confirm new password</span>
              <input
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={confirmNew}
                onChange={(e) => setConfirmNew(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            {changeMsg ? (
              <p
                className={
                  changeMsg.includes("updated")
                    ? "text-xs text-success"
                    : "text-xs text-danger"
                }
                role={changeMsg.includes("updated") ? "status" : "alert"}
              >
                {changeMsg}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={changeLoading}
              className={
                onSettingsPage
                  ? "rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
                  : "rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-surface-alt disabled:opacity-60"
              }
            >
              {changeLoading ? "Updating…" : "Change password"}
            </button>
          </form>
        </div>

        <div className="border-t border-border/60 pt-4">
          <h3 className="text-sm font-medium text-foreground">
            Forgot your password?
          </h3>
          <p className="mt-1 text-xs text-muted">
            We&apos;ll email a secure link to{" "}
            <span className="text-foreground/90">{accountEmail}</span>. Open it,
            choose a new password on the page that loads, then return here to
            sign in if needed. You can change your password anytime from{" "}
            <strong className="text-foreground">Settings</strong> →{" "}
            <strong className="text-foreground">Password &amp; security</strong>
            {onSettingsPage
              ? " (this section) or from Edit profile."
              : ", or from Settings on your account page."}
          </p>
          <button
            type="button"
            onClick={() => void sendResetLink()}
            disabled={resetLoading || !accountEmail}
            className="mt-3 rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {resetLoading ? "Sending…" : "Email me a reset link"}
          </button>
          {resetMsg ? (
            <p className="mt-2 text-xs text-muted" role="status">
              {resetMsg}
            </p>
          ) : null}
        </div>
      </div>
    </details>
  );
}
