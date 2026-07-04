"use client";

import { useState } from "react";
import type { ProfileFollowSummary } from "@/lib/types";
import { ProfileFollowersList } from "@/components/profile-followers-list";

type Props = {
  followers: ProfileFollowSummary[];
  following: ProfileFollowSummary[];
  followerCount: number;
  initialShowFollowerCount: boolean;
};

export function FollowDashboardSection({
  followers,
  following,
  followerCount,
  initialShowFollowerCount,
}: Props) {
  const [showFollowerCount, setShowFollowerCount] = useState(initialShowFollowerCount);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  async function saveShowFollowerCount(next: boolean) {
    setSettingsMessage(null);
    const previous = showFollowerCount;
    setShowFollowerCount(next);
    setSettingsLoading(true);

    const response = await fetch("/api/profile/follow-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showFollowerCount: next }),
    });
    const payload = (await response.json()) as { error?: string; showFollowerCount?: boolean };

    setSettingsLoading(false);
    if (!response.ok) {
      setShowFollowerCount(previous);
      setSettingsMessage(payload.error ?? "Unable to save setting.");
      return;
    }

    if (typeof payload.showFollowerCount === "boolean") {
      setShowFollowerCount(payload.showFollowerCount);
    }
    setSettingsMessage("Saved.");
  }

  return (
    <section className="card p-6">
      <details>
        <summary className="cursor-pointer text-base font-semibold text-foreground">
          Followers &amp; privacy
        </summary>
        <div className="mt-4 space-y-6">
          <p className="text-sm text-muted">
            You have{" "}
            <span className="font-medium text-foreground">
              {followerCount} {followerCount === 1 ? "follower" : "followers"}
            </span>
            . Following {following.length}{" "}
            {following.length === 1 ? "profile" : "profiles"}.
          </p>

          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-surface-alt/50 p-4">
            <input
              type="checkbox"
              checked={showFollowerCount}
              disabled={settingsLoading}
              onChange={(event) => void saveShowFollowerCount(event.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              <span className="block font-medium text-foreground">
                Show follower count on my public profile
              </span>
              <span className="mt-1 block text-muted">
                When off, your follower count is hidden on your public profile page.
                You can still follow others and see your stats here.
              </span>
            </span>
          </label>

          {settingsMessage ? (
            <p className="text-xs text-muted">{settingsMessage}</p>
          ) : null}

          <div className="space-y-4 border-t border-border pt-4">
            <ProfileFollowersList
              embedded
              followers={followers}
              title="Your followers"
              emptyMessage="When someone follows your profile, they'll show up here."
            />

            <ProfileFollowersList
              embedded
              followers={following}
              title="Profiles you follow"
              emptyMessage="Visit a profile and tap Follow to build your list."
            />
          </div>
        </div>
      </details>
    </section>
  );
}
