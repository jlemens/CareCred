"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { AppNotification } from "@/lib/types";

function formatWhen(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function notificationIcon(type: AppNotification["type"]) {
  switch (type) {
    case "new_review":
      return "⭐";
    case "review_comment":
      return "💬";
    case "review_like":
      return "❤️";
    default:
      return "🔔";
  }
}

export function NotificationsPanel() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadNotifications = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/notifications");
      const payload = (await response.json()) as {
        error?: string;
        notifications?: AppNotification[];
        unreadCount?: number;
      };
      if (!response.ok) {
        setError(payload.error ?? "Unable to load notifications.");
        return;
      }
      setNotifications(payload.notifications ?? []);
      setUnreadCount(payload.unreadCount ?? 0);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    function handleRefresh() {
      void loadNotifications();
    }
    window.addEventListener("carecred:notifications-changed", handleRefresh);
    return () => {
      window.removeEventListener("carecred:notifications-changed", handleRefresh);
    };
  }, [loadNotifications]);

  function applyReadLocally(notificationIds?: Set<string>) {
    const now = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) => {
        if (notificationIds && !notificationIds.has(item.id)) return item;
        return {
          ...item,
          read_at: item.read_at ?? now,
        };
      }),
    );
    setUnreadCount((count) =>
      notificationIds
        ? Math.max(0, count - notificationIds.size)
        : 0,
    );
    window.dispatchEvent(new CustomEvent("carecred:notifications-changed"));
  }

  function markAllRead() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      const payload = (await response.json()) as {
        error?: string;
        ok?: boolean;
        updatedCount?: number;
      };
      if (!response.ok) {
        setError(payload.error ?? "Unable to mark notifications as read.");
        return;
      }
      applyReadLocally();
      await loadNotifications();
    });
  }

  function openNotification(notification: AppNotification) {
    startTransition(async () => {
      if (!notification.read_at) {
        const response = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notification.id }),
        });
        if (response.ok) {
          applyReadLocally(new Set([notification.id]));
        }
      }
      router.push(notification.href);
    });
  }

  return (
    <div className="grid w-full gap-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Notifications</h1>
            <p className="mt-1 text-sm text-muted">
              Fresh activity related to your testimonials and profile.
            </p>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              disabled={isPending}
              onClick={markAllRead}
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface-alt px-4 py-2 text-xs font-medium transition hover:bg-background disabled:opacity-50"
            >
              Mark all read ({unreadCount})
            </button>
          ) : null}
        </div>
      </section>

      <section className="card p-6">
        {loading ? (
          <p className="text-sm text-muted">Loading notifications…</p>
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : notifications.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-3xl" aria-hidden>
              🔔
            </p>
            <p className="mt-3 text-sm text-muted">
              You&apos;re all caught up. New reviews, likes, and comments will show up
              here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((notification) => {
              const unread = !notification.read_at;
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => openNotification(notification)}
                    className={`flex w-full items-start gap-3 px-1 py-4 text-left transition hover:bg-surface-alt/40 disabled:opacity-50 ${
                      unread ? "bg-accent-primary/5" : ""
                    }`}
                  >
                    <span className="mt-0.5 text-xl" aria-hidden>
                      {notificationIcon(notification.type)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm leading-relaxed ${
                          unread ? "font-medium text-foreground" : "text-muted"
                        }`}
                      >
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        {formatWhen(notification.created_at)}
                      </span>
                    </span>
                    {unread ? (
                      <span
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent-secondary"
                        aria-label="Unread"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </section>

      <p className="text-center text-xs text-muted">
        Tip: use the{" "}
        <Link href="/search" className="text-accent-secondary hover:underline">
          Search
        </Link>{" "}
        tab to find providers and leave testimonials.
      </p>
    </div>
  );
}

export function useUnreadNotificationCount(enabled: boolean) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) return;
      const payload = (await response.json()) as { unreadCount?: number };
      setUnreadCount(payload.unreadCount ?? 0);
    } catch {
      /* ignore badge errors */
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    function handleRefresh() {
      void refresh();
    }
    window.addEventListener("carecred:notifications-changed", handleRefresh);
    return () => {
      window.removeEventListener("carecred:notifications-changed", handleRefresh);
    };
  }, [refresh]);

  return unreadCount;
}
