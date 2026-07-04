"use client";

import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  isPasswordTooShort,
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from "@/lib/password-rules";
import { getPasswordResetRedirectTo } from "@/lib/password-reset";
import { PasswordInput } from "@/components/password-input";

type Mode = "signin" | "signup";

type AuthPanelProps = {
  initialMode?: Mode;
};

export function AuthPanel({ initialMode = "signin" }: AuthPanelProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!supabase) {
      setMessage("Missing Supabase env vars. Add them to .env.local.");
      setLoading(false);
      return;
    }

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      window.location.href = "/";
      return;
    }

    if (mode === "signup" && isPasswordTooShort(password)) {
      setMessage(PASSWORD_TOO_SHORT_MESSAGE);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/`
            : undefined,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.href = "/";
      return;
    }

    setMessage(
      "Account created. Check your inbox to verify your email, then sign in.",
    );
    setLoading(false);
  }

  async function onForgotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setForgotMessage(null);
    if (!supabase) {
      setForgotMessage("Missing Supabase env vars. Add them to .env.local.");
      return;
    }
    const trimmed = email.trim();
    if (!trimmed) {
      setForgotMessage("Enter the email you used for CareCred.");
      return;
    }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: getPasswordResetRedirectTo(),
    });
    setForgotLoading(false);
    if (error) {
      setForgotMessage(error.message);
      return;
    }
    setForgotMessage(
      "If an account exists for that email, we sent CareCred reset instructions. Open the link, set a new password on our site, then sign in. You can change your password later under Account → Edit profile → Password & security.",
    );
  }

  return (
    <div className="card w-full max-w-lg p-6">
      <div className="mb-6 flex gap-2 rounded-md bg-surface-alt p-1 text-sm">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setShowForgot(false);
            setForgotMessage(null);
          }}
          className={`flex-1 rounded px-3 py-2 transition ${
            mode === "signin" ? "bg-background text-foreground" : "text-muted"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          id="auth-tab-signup"
          onClick={() => {
            setMode("signup");
            setShowForgot(false);
            setForgotMessage(null);
          }}
          className={`flex-1 rounded px-3 py-2 transition ${
            mode === "signup" ? "bg-background text-foreground" : "text-muted"
          }`}
        >
          Create Account
        </button>
      </div>

      {showForgot ? (
        <div className="mb-6 space-y-4">
          <button
            type="button"
            onClick={() => {
              setShowForgot(false);
              setForgotMessage(null);
            }}
            className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            ← Back to sign in
          </button>
          <h2 className="text-lg font-semibold">Reset your password</h2>
          <p className="text-sm text-muted">
            We&apos;ll email you a CareCred link. After you open it and choose a
            new password, you can update it anytime in{" "}
            <strong className="text-foreground">Edit profile</strong> →{" "}
            <strong className="text-foreground">Password &amp; security</strong>.
          </p>
          <form onSubmit={onForgotSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-muted">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-accent-primary focus:ring-2"
              />
            </label>
            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
            >
              {forgotLoading ? "Sending…" : "Send reset link"}
            </button>
          </form>
          {forgotMessage ? (
            <p className="text-sm text-muted">{forgotMessage}</p>
          ) : null}
        </div>
      ) : null}

      {!showForgot && mode === "signin" ? (
        <p className="mb-4 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-center text-base leading-snug text-muted sm:text-lg">
          <span>
            New here?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setShowForgot(false);
                setMessage(null);
                setForgotMessage(null);
              }}
              className="font-semibold text-accent-secondary underline-offset-2 hover:underline"
            >
              Create an account
            </button>
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-success">
            <span aria-hidden>—</span>
            <span>it&apos;s free</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[1.15em] w-[1.15em] shrink-0 -translate-y-px"
              aria-hidden
            >
              <path d="M7 17 17 7M17 7H9M17 7v8" />
            </svg>
          </span>
        </p>
      ) : null}

      {!showForgot ? (
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-muted">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-accent-primary focus:ring-2"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Password</span>
          <PasswordInput
            required
            minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "signup" ? (
            <p className="text-xs text-muted">{PASSWORD_TOO_SHORT_MESSAGE}</p>
          ) : null}
        </label>

        {mode === "signin" ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForgot(true);
                setMessage(null);
                setForgotMessage(null);
              }}
              className="text-sm font-medium text-accent-secondary underline-offset-2 hover:underline"
            >
              Forgot password?
            </button>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {loading
            ? "Working..."
            : mode === "signin"
              ? "Sign In"
              : "Create CareCred Account"}
        </button>
      </form>
      ) : null}

      {!showForgot && message ? (
        <p className="mt-4 text-sm text-muted">{message}</p>
      ) : null}
    </div>
  );
}
