"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { LogoutButton } from "@/components/logout-button";

export function AppHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  /** Avoid flashing the pulse before we know if a session exists. */
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setSessionReady(true);
      return;
    }

    async function loadSession() {
      try {
        const {
          data: { session },
        } = await client!.auth.getSession();
        setSignedIn(Boolean(session?.user));
        setEmail(session?.user?.email ?? null);
      } finally {
        setSessionReady(true);
      }
    }

    void loadSession();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
      setEmail(session?.user?.email ?? null);
      setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="w-full min-w-0 border-b border-border/80 bg-surface/80 backdrop-blur">
      <nav className="mx-auto flex w-full min-w-0 max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="min-w-0">
          <Link
            href="/"
            className="block rounded-sm bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-2xl font-extrabold tracking-tight text-transparent drop-shadow-[0_0_22px_rgba(110,125,255,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-secondary sm:text-3xl"
            title="CareCred home"
          >
            CareCred
          </Link>
          {signedIn ? (
            <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">
              Signed in as {email ?? "your account"}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted sm:text-sm">
              Build trust with every patient story.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 text-sm text-muted">
          {signedIn ? (
            <LogoutButton />
          ) : (
            /* Signed-in users never see this link — no pulse when authenticated. */
            <Link
              href="/auth"
              className={
                sessionReady
                  ? "header-signin-pulse rounded-md border border-border bg-surface-alt/40 px-3 py-1.5 font-medium text-foreground transition hover:bg-surface-alt hover:brightness-110"
                  : "rounded-md border border-border px-3 py-1.5 transition hover:bg-surface-alt hover:text-foreground"
              }
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
