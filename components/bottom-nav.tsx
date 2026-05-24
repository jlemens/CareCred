"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useUnreadNotificationCount } from "@/components/notifications-panel";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type NavProfile = { slug: string | null; signedIn: boolean };

export function BottomNav() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<NavProfile>({ slug: null, signedIn: false });
  const unreadCount = useUnreadNotificationCount(profile.signedIn);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let mounted = true;
    async function load() {
      const { data: { session } } = await client!.auth.getSession();
      if (!mounted) return;
      if (!session?.user) {
        setProfile({ slug: null, signedIn: false });
        return;
      }
      const { data } = await client!
        .from("profiles")
        .select("slug")
        .eq("user_id", session.user.id)
        .maybeSingle<{ slug: string | null }>();
      if (!mounted) return;
      setProfile({ slug: data?.slug ?? null, signedIn: true });
    }

    void load();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        setProfile({ slug: null, signedIn: false });
        return;
      }
      void load();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!profile.signedIn) {
    return null;
  }

  const homeHref = profile.slug ? `/u/${profile.slug}` : "/dashboard";
  const searchHref = "/search";
  const settingsHref = "/dashboard";
  const notificationsHref = "/notifications";

  const isSettingsActive = pathname.startsWith("/dashboard");
  const isNotificationsActive = pathname.startsWith("/notifications");
  const isHomeActive =
    !isSettingsActive &&
    !isNotificationsActive &&
    (pathname === "/" ||
      (profile.slug != null &&
        (pathname === `/u/${profile.slug}` ||
          pathname.startsWith(`/u/${profile.slug}/`))));
  const isSearchActive = pathname.startsWith("/search");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-surface/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 backdrop-blur">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-4 gap-1 px-2 sm:px-4">
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
        <NavButton
          href={notificationsHref}
          label="Alerts"
          active={isNotificationsActive}
          badge={unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(unreadCount)) : undefined}
        >
          <span aria-hidden className="text-lg">
            🔔
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
  badge,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-xs transition ${
        active
          ? "bg-surface-alt text-foreground ring-1 ring-inset ring-border"
          : "text-muted hover:bg-surface-alt/40 hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span className="relative">
        {children}
        {badge ? (
          <span className="absolute -right-2 -top-1 min-w-[1rem] rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-white">
            {badge}
          </span>
        ) : null}
      </span>
      <span className={active ? "font-semibold" : ""}>{label}</span>
    </Link>
  );
}
