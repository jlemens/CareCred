"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { ReviewComment, ReviewEngagementSummary } from "@/lib/types";

/** Default number of comments shown before expanding the thread. */
const COMMENTS_PREVIEW_COUNT = 3;

/** Max scroll height when viewing the full thread (roughly ~3–4 comments). */
const COMMENTS_EXPANDED_MAX_HEIGHT = "17.5rem";

function formatWhen(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type Props = {
  reviewId: string;
  signedIn: boolean;
  currentUserId?: string | null;
};

export function ReviewEngagement({ reviewId, signedIn, currentUserId }: Props) {
  const [engagement, setEngagement] = useState<ReviewEngagementSummary>({
    likeCount: 0,
    likedByMe: false,
    comments: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadEngagement = useCallback(async () => {
    setLoadError(null);
    try {
      const response = await fetch(
        `/api/reviews/engagement?ids=${encodeURIComponent(reviewId)}`,
      );
      const payload = (await response.json()) as {
        error?: string;
        engagement?: Record<string, ReviewEngagementSummary>;
      };
      if (!response.ok) {
        setLoadError(payload.error ?? "Unable to load activity.");
        return;
      }
      setEngagement(
        payload.engagement?.[reviewId] ?? {
          likeCount: 0,
          likedByMe: false,
          comments: [],
        },
      );
    } catch {
      setLoadError("Unable to load activity.");
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    void loadEngagement();
  }, [loadEngagement]);

  function toggleLike() {
    if (!signedIn) return;
    setActionError(null);
    const previous = engagement;
    const nextLiked = !engagement.likedByMe;
    setEngagement({
      ...engagement,
      likedByMe: nextLiked,
      likeCount: Math.max(0, engagement.likeCount + (nextLiked ? 1 : -1)),
    });

    startTransition(async () => {
      const response = await fetch("/api/reviews/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      const payload = (await response.json()) as {
        error?: string;
        liked?: boolean;
        likeCount?: number;
      };
      if (!response.ok) {
        setEngagement(previous);
        setActionError(payload.error ?? "Unable to update like.");
        return;
      }
      setEngagement((current) => ({
        ...current,
        likedByMe: Boolean(payload.liked),
        likeCount: payload.likeCount ?? current.likeCount,
      }));
      window.dispatchEvent(new CustomEvent("carecred:notifications-changed"));
    });
  }

  function submitComment() {
    if (!signedIn || !commentBody.trim()) return;
    setActionError(null);

    startTransition(async () => {
      const response = await fetch("/api/reviews/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, body: commentBody.trim() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        comment?: ReviewComment;
      };
      if (!response.ok) {
        setActionError(payload.error ?? "Unable to post comment.");
        return;
      }
      if (payload.comment) {
        setEngagement((current) => ({
          ...current,
          comments: [...current.comments, payload.comment!],
        }));
      }
      setCommentBody("");
      setShowComments(true);
      setShowAllComments(true);
      window.dispatchEvent(new CustomEvent("carecred:notifications-changed"));
    });
  }

  function deleteComment(commentId: string) {
    setActionError(null);
    const previous = engagement;
    setEngagement({
      ...engagement,
      comments: engagement.comments.filter((c) => c.id !== commentId),
    });

    startTransition(async () => {
      const response = await fetch("/api/reviews/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setEngagement(previous);
        setActionError(payload.error ?? "Unable to delete comment.");
      }
    });
  }

  if (loading) {
    return (
      <div className="mt-3 border-t border-border pt-3">
        <p className="text-xs text-muted">Loading activity…</p>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      {loadError ? <p className="mb-2 text-xs text-danger">{loadError}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!signedIn || isPending}
          onClick={toggleLike}
          className={`inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-accent-secondary transition hover:underline disabled:opacity-50 ${
            engagement.likedByMe ? "font-semibold" : ""
          }`}
          aria-pressed={engagement.likedByMe}
        >
          <span aria-hidden>{engagement.likedByMe ? "❤️" : "🤍"}</span>
          <span>
            {engagement.likeCount} {engagement.likeCount === 1 ? "like" : "likes"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowComments((open) => {
              if (open) setShowAllComments(false);
              return !open;
            });
          }}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-accent-secondary transition hover:underline"
        >
          <span aria-hidden>💬</span>
          <span>
            {engagement.comments.length}{" "}
            {engagement.comments.length === 1 ? "comment" : "comments"}
          </span>
        </button>
      </div>

      {!signedIn ? (
        <p className="mt-2 text-xs text-muted">
          <Link href="/auth" className="text-accent-secondary hover:underline">
            Sign in
          </Link>{" "}
          to like or comment on testimonials.
        </p>
      ) : null}

      {showComments ? (
        <div className="mt-3 space-y-3">
          {engagement.comments.length === 0 ? (
            <p className="text-xs text-muted">No comments yet. Start the conversation.</p>
          ) : (
            <>
              {engagement.comments.length > COMMENTS_PREVIEW_COUNT && !showAllComments ? (
                <p className="text-xs text-muted">
                  Showing the {COMMENTS_PREVIEW_COUNT} most recent comments.
                </p>
              ) : null}
              <ul
                className={`divide-y divide-border ${
                  showAllComments && engagement.comments.length > COMMENTS_PREVIEW_COUNT
                    ? "overflow-y-auto"
                    : ""
                }`}
                style={
                  showAllComments && engagement.comments.length > COMMENTS_PREVIEW_COUNT
                    ? { maxHeight: COMMENTS_EXPANDED_MAX_HEIGHT }
                    : undefined
                }
              >
                {(showAllComments
                  ? engagement.comments
                  : engagement.comments.slice(-COMMENTS_PREVIEW_COUNT)
                ).map((comment) => (
                  <li
                    key={comment.id}
                    className="border-l-2 border-accent-secondary/35 py-3 pl-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {comment.author_slug ? (
                          <Link
                            href={`/u/${comment.author_slug}`}
                            className="text-sm font-medium text-accent-secondary hover:underline"
                          >
                            {comment.author_display_name ?? "Member"}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium">
                            {comment.author_display_name ?? "Member"}
                          </p>
                        )}
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                          {comment.body}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          {formatWhen(comment.created_at)}
                        </p>
                      </div>
                      {signedIn && comment.author_user_id === currentUserId ? (
                        <DeleteCommentButton
                          commentId={comment.id}
                          onDelete={() => deleteComment(comment.id)}
                          disabled={isPending}
                        />
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              {engagement.comments.length > COMMENTS_PREVIEW_COUNT ? (
                <button
                  type="button"
                  onClick={() => setShowAllComments((expanded) => !expanded)}
                  className="min-h-10 text-left text-sm font-medium text-accent-secondary hover:underline"
                >
                  {showAllComments
                    ? "Show fewer comments"
                    : `View all ${engagement.comments.length} comments`}
                </button>
              ) : null}
            </>
          )}

          {signedIn ? (
            <div className="space-y-2">
              <textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Add a comment…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={isPending || !commentBody.trim()}
                onClick={submitComment}
                className="inline-flex min-h-10 items-center rounded-md bg-accent-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
              >
                Post comment
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {actionError ? <p className="mt-2 text-xs text-danger">{actionError}</p> : null}
    </div>
  );
}

function DeleteCommentButton({
  commentId,
  onDelete,
  disabled,
}: {
  commentId: string;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setConfirming(true)}
        className="shrink-0 text-[11px] text-muted hover:text-danger disabled:opacity-50"
        aria-label={`Delete comment ${commentId}`}
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={onDelete}
        className="text-[11px] font-medium text-danger disabled:opacity-50"
      >
        Confirm
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setConfirming(false)}
        className="text-[11px] text-muted disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}
