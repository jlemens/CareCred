"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { LogoutButton } from "@/components/logout-button";

async function loadHeaderProfile(
  client: SupabaseClient,
  setSignedIn: (v: boolean) => void,
  setSlug: (v: string | null) => void,
) {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    setSignedIn(false);
    setSlug(null);
    return;
  }
  setSignedIn(true);
  const { data } = await client
    .from("profiles")
    .select("slug")
    .eq("user_id", user.id)
    .maybeSingle();
  setSlug(data?.slug ?? null);
}

export function AppHeader() {
  const [slug, setSlug] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return;
    }

    void loadHeaderProfile(client, setSignedIn, setSlug);

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      void loadHeaderProfile(client, setSignedIn, setSlug);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b border-border/80 bg-surface/80 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight"
          title="CareCred home"
        >
          CareCred
        </Link>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-muted">
          <Link href="/search" className="transition hover:text-foreground">
            Find Providers
          </Link>

          {signedIn ? (
            <>
              {slug ? (
                <Link
                  href={`/u/${slug}`}
                  className="rounded-md bg-accent-primary px-3 py-1.5 font-medium text-white transition hover:bg-accent-hover"
                >
                  My page
                </Link>
              ) : null}
              <Link
                href="/dashboard"
                className="rounded-md border border-border px-3 py-1.5 transition hover:bg-surface-alt hover:text-foreground"
              >
                Account
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/auth" className="transition hover:text-foreground">
                Sign in
              </Link>
              <Link
                href="/auth"
                className="rounded-md border border-border px-3 py-1.5 transition hover:bg-surface-alt hover:text-foreground"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
