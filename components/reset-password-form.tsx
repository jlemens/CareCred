"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PASSWORD_RESET_PATH } from "@/lib/password-reset";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const INVALID_LINK_MESSAGE =
  "This reset link is invalid or has expired. Request a new one from the sign-in page or from Settings → Password & security while signed in.";

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

      if (errorParam === "invalid_link" || errorParam === "config") {
        if (!cancelled) {
          setMessage(INVALID_LINK_MESSAGE);
          setChecking(false);
        }
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        url.searchParams.delete("code");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        if (!cancelled) {
          if (!error) {
            setReady(true);
            setChecking(false);
            return;
          }
          setMessage(INVALID_LINK_MESSAGE);
          setChecking(false);
          return;
        }
      }

      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      if (tokenHash && type === "recovery") {
        const { error } = await sb.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        url.searchParams.delete("token_hash");
        url.searchParams.delete("type");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        if (!cancelled) {
          if (!error) {
            setReady(true);
            setChecking(false);
            return;
          }
          setMessage(INVALID_LINK_MESSAGE);
          setChecking(false);
          return;
        }
      }

      const {
        data: { session },
      } = await sb.auth.getSession();
      if (cancelled) return;
      if (session) {
        setReady(true);
        setChecking(false);
        return;
      }

      // Hash-based recovery links (#access_token=…&type=recovery) need a moment to parse.
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (cancelled) return;

      const {
        data: { session: retrySession },
      } = await sb.auth.getSession();
      if (retrySession) {
        setReady(true);
        setChecking(false);
        return;
      }

      setChecking(false);
    }

    void establishRecoverySession();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (
        session &&
        (event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "TOKEN_REFRESHED")
      ) {
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
    if (password.length < 8) {
      setMessage("Use at least 8 characters.");
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
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-accent-primary focus:ring-2"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-muted">Confirm new password</span>
        <input
          type="password"
          required
          minLength={8}
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
