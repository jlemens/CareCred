"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type Props = {
  profileId: string;
  signedIn: boolean;
  isOwnProfile: boolean;
  initialFollowing: boolean;
  initialFollowerCount: number;
  showFollowerCount: boolean;
};

export function ProfileFollowButton({
  profileId,
  signedIn,
  isOwnProfile,
  initialFollowing,
  initialFollowerCount,
  showFollowerCount,
}: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isOwnProfile) {
    const countLabel = `${followerCount} ${followerCount === 1 ? "follower" : "followers"}`;
    return (
      <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end">
        <p className="text-sm font-medium text-foreground sm:text-right">{countLabel}</p>
        {!showFollowerCount ? (
          <p className="text-xs text-muted sm:text-right">Hidden on your public page</p>
        ) : null}
      </div>
    );
  }

  function toggleFollow() {
    if (!signedIn) return;
    setError(null);

    const previousFollowing = following;
    const previousCount = followerCount;
    const nextFollowing = !following;

    setFollowing(nextFollowing);
    setFollowerCount(Math.max(0, followerCount + (nextFollowing ? 1 : -1)));

    startTransition(async () => {
      const response = await fetch("/api/profile/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const payload = (await response.json()) as {
        error?: string;
        following?: boolean;
        followerCount?: number;
      };

      if (!response.ok) {
        setFollowing(previousFollowing);
        setFollowerCount(previousCount);
        setError(payload.error ?? "Unable to update follow.");
        return;
      }

      setFollowing(Boolean(payload.following));
      if (typeof payload.followerCount === "number") {
        setFollowerCount(payload.followerCount);
      }
    });
  }

  const countLabel = `${followerCount} ${followerCount === 1 ? "follower" : "followers"}`;

  return (
    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
      {showFollowerCount ? (
        <p className="text-sm text-muted sm:text-right">{countLabel}</p>
      ) : null}

      {signedIn ? (
        <button
          type="button"
          disabled={isPending}
          onClick={toggleFollow}
          aria-pressed={following}
          className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2 text-sm font-semibold transition disabled:opacity-50 ${
            following
              ? "border border-border bg-surface-alt text-foreground hover:bg-background"
              : "bg-accent-primary text-white hover:bg-accent-hover"
          }`}
        >
          {isPending ? "Saving…" : following ? "Following" : "Follow"}
        </button>
      ) : (
        <Link
          href="/auth"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover"
        >
          Follow
        </Link>
      )}

      {error ? <p className="max-w-[14rem] text-xs text-danger sm:text-right">{error}</p> : null}
    </div>
  );
}
