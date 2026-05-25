"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  exchangeEmailLinkAuth,
  readAuthExchangeParams,
  readSupabaseAuthError,
} from "@/lib/auth-exchange";
import {
  isPasswordTooShort,
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from "@/lib/password-rules";
import { PASSWORD_RESET_PATH } from "@/lib/password-reset";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const INVALID_LINK_MESSAGE =
  "This reset link is invalid or has expired. Request a new one from the sign-in page or from Settings → Password & security while signed in.";

function cleanAuthParamsFromUrl(url: URL) {
  url.searchParams.delete("code");
  url.searchParams.delete("token_hash");
  url.searchParams.delete("type");
  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");
  url.searchParams.delete("message");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }

    const sb = supabase;
    let cancelled = false;

    async function establishRecoverySession() {
      const url = new URL(window.location.href);
      const errorParam = url.searchParams.get("error");
      const messageParam = url.searchParams.get("message");
      const supabaseError = readSupabaseAuthError(url.searchParams);

      if (errorParam === "invalid_link" || errorParam === "config" || supabaseError) {
        if (!cancelled) {
          setMessage(
            messageParam
              ? decodeURIComponent(messageParam)
              : supabaseError ?? INVALID_LINK_MESSAGE,
          );
          setChecking(false);
        }
        return;
      }

      // Middleware may have already exchanged the token — use existing session first.
      const {
        data: { session: existingSession },
      } = await sb.auth.getSession();
      if (cancelled) return;
      if (existingSession) {
        setReady(true);
        setChecking(false);
        cleanAuthParamsFromUrl(url);
        return;
      }

      const authParams = readAuthExchangeParams(url.searchParams);
      if (authParams.code || authParams.tokenHash) {
        const { error } = await exchangeEmailLinkAuth(sb, authParams);
        cleanAuthParamsFromUrl(url);
        if (!cancelled) {
          if (!error) {
            setReady(true);
            setChecking(false);
            return;
          }
          setMessage(error.message || INVALID_LINK_MESSAGE);
          setChecking(false);
          return;
        }
      }

      // Hash-based recovery links (#access_token=…&type=recovery).
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (cancelled) return;

      const {
        data: { session: retrySession },
      } = await sb.auth.getSession();
      if (retrySession) {
        setReady(true);
        setChecking(false);
        if (window.location.hash.includes("access_token")) {
          window.history.replaceState({}, "", PASSWORD_RESET_PATH);
        }
        return;
      }

      setChecking(false);
    }

    void establishRecoverySession();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session && event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
        if (window.location.hash.includes("access_token")) {
          window.history.replaceState({}, "", PASSWORD_RESET_PATH);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }
    if (isPasswordTooShort(password)) {
      setMessage(PASSWORD_TOO_SHORT_MESSAGE);
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace("/dashboard#password");
    router.refresh();
  }

  if (!supabase) {
    return (
      <p className="text-sm text-muted">
        Add Supabase environment variables to use password reset.
      </p>
    );
  }

  if (checking) {
    return <p className="text-sm text-muted">Checking your reset link…</p>;
  }

  if (!ready) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-muted">{message ?? INVALID_LINK_MESSAGE}</p>
        <Link
          href="/auth"
          className="inline-flex min-h-11 items-center rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(ev) => void onSubmit(ev)} className="space-y-4">
      <p className="text-sm text-muted">
        Choose a new password for your CareCred account. After saving, you can
        change it anytime under{" "}
        <strong className="text-foreground">Account → Edit profile</strong>,
        then open{" "}
        <strong className="text-foreground">Password &amp; security</strong>.
      </p>
      <label className="block space-y-2">
        <span className="text-sm text-muted">New password</span>
        <input
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-accent-primary focus:ring-2"
        />
        <p className="text-xs text-muted">{PASSWORD_TOO_SHORT_MESSAGE}</p>
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-muted">Confirm new password</span>
        <input
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-accent-primary focus:ring-2"
        />
      </label>
      {message ? (
        <p className="text-sm text-danger" role="alert">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
