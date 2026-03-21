"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type NavProfile = { slug: string | null; signedIn: boolean };

export function BottomNav() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<NavProfile>({ slug: null, signedIn: false });

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const safeClient = client!;

    let mounted = true;
    async function load() {
      const {
        data: { user },
      } = await safeClient.auth.getUser();
      if (!mounted) return;
      if (!user) {
        setProfile({ slug: null, signedIn: false });
        return;
      }
      const { data } = await safeClient
        .from("profiles")
        .select("slug")
        .eq("user_id", user.id)
        .maybeSingle<{ slug: string | null }>();
      if (!mounted) return;
      setProfile({ slug: data?.slug ?? null, signedIn: true });
    }

    void load();
    const {
      data: { subscription },
    } = safeClient.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const homeHref = profile.slug ? `/u/${profile.slug}` : profile.signedIn ? "/dashboard" : "/auth";
  const searchHref = "/search";
  const settingsHref = profile.signedIn ? "/dashboard" : "/auth";

  const isHomeActive = pathname === homeHref || (profile.slug ? pathname === `/u/${profile.slug}` : pathname === "/dashboard");
  const isSearchActive = pathname.startsWith("/search");
  const isSettingsActive = pathname.startsWith("/dashboard");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-surface/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 backdrop-blur md:hidden">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-3 px-4">
        <NavButton href={homeHref} label="Home" active={isHomeActive}>
          <span aria-hidden className="text-lg">
            🏠
          </span>
        </NavButton>
        <NavButton href={searchHref} label="Search" active={isSearchActive}>
          <span aria-hidden className="text-lg">
            🔍
          </span>
        </NavButton>
        <NavButton href={settingsHref} label="Settings" active={isSettingsActive}>
          <span aria-hidden className="text-lg">
            ⚙️
          </span>
        </NavButton>
      </div>
    </nav>
  );
}

function NavButton({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md text-xs transition ${
        active ? "text-foreground" : "text-muted hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
      <span>{label}</span>
    </Link>
  );
}
