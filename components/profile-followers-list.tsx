import Link from "next/link";
import type { ProfileFollowSummary } from "@/lib/types";

type Props = {
  followers: ProfileFollowSummary[];
  title?: string;
  emptyMessage?: string;
};

export function ProfileFollowersList({
  followers,
  title = "Followers",
  emptyMessage = "No followers yet.",
}: Props) {
  if (followers.length === 0) {
    return (
      <section className="card p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="card p-6">
      <h2 className="text-lg font-semibold">
        {title} ({followers.length})
      </h2>
      <ul className="mt-4 divide-y divide-border">
        {followers.map((follower) => (
          <li key={follower.slug}>
            <Link
              href={`/u/${follower.slug}`}
              className="flex min-h-14 items-center gap-3 py-3 transition hover:opacity-90"
            >
              {follower.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={follower.avatar_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-alt text-sm font-semibold text-muted">
                  {follower.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{follower.display_name}</p>
                <p className="truncate text-xs text-muted">
                  {follower.profile_type === "provider" ? "Provider" : "Patient"} · /u/
                  {follower.slug}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
