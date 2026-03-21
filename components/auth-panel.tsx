"use client";

import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "signin" | "signup";

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      window.location.href = "/dashboard";
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/dashboard`
            : undefined,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.href = "/dashboard";
      return;
    }

    setMessage(
      "Account created. Check your inbox to verify your email, then sign in.",
    );
    setLoading(false);
  }

  return (
    <div className="card w-full max-w-lg p-6">
      <div className="mb-6 flex gap-2 rounded-md bg-surface-alt p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded px-3 py-2 transition ${
            mode === "signin" ? "bg-background text-foreground" : "text-muted"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded px-3 py-2 transition ${
            mode === "signup" ? "bg-background text-foreground" : "text-muted"
          }`}
        >
          Create Account
        </button>
      </div>

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
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-accent-primary focus:ring-2"
          />
        </label>

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

      {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
