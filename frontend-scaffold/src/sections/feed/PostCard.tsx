import React, { useState } from "react";
import { Link } from "react-router-dom";

import type { FeedPost } from "@/types/feed.types";

interface Props {
  post: FeedPost;
  connected: boolean;
  onLike: () => void;
}

export function PostCard({ post, connected, onLike }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLike = () => {
    if (!connected) return;
    setLikeAnimating(true);
    onLike();
    setTimeout(() => setLikeAnimating(false), 300);
  };

  const profileTo = `/@${post.creatorUsername}`;
  const hasMedia = Boolean(post.mediaUrl);

  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-[var(--card-border-soft)] bg-zap-surface shadow-none transition-[border-color,box-shadow] duration-150 hover:border-zap-bg-alt/55 dark:border-white/[0.07] dark:hover:border-white/[0.12]">
      <div
        className={`flex items-center gap-3 px-4 py-4 sm:px-5 ${
          hasMedia ? "border-b border-[var(--card-border-soft)] dark:border-white/[0.06]" : ""
        }`}
      >
        <Link to={profileTo} className="shrink-0 no-underline">
          <div
            className="flex h-10 w-10 cursor-crosshair items-center justify-center rounded-xl border border-[var(--card-border-soft)] bg-zap-bg-overlay font-[family-name:var(--font-display)] text-base text-zap-accent transition-colors hover:border-zap-accent dark:border-white/[0.08]"
            aria-hidden
          >
            {post.creatorAvatarInitials}
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <Link
              to={profileTo}
              className="font-[family-name:var(--font-display)] text-base font-semibold leading-tight text-zap-ink no-underline"
            >
              {post.creatorDisplayName}
            </Link>
            <span className="font-body text-xs text-zap-ink-muted">
              @{post.creatorUsername}
            </span>
          </div>
          <p className="mt-0.5 font-body text-[11px] tracking-[0.06em] text-zap-ink-faint">
            {post.timeAgo}
          </p>
        </div>

        <Link
          to={profileTo}
          className="shrink-0 font-body text-[11px] tracking-[0.08em] text-zap-ink-faint no-underline transition-colors hover:text-zap-teal"
        >
          VIEW AGENT →
        </Link>
      </div>

      {post.mediaUrl && post.mediaType === "IMAGE" ? (
        <div className="relative min-h-[120px] w-full overflow-hidden bg-zap-bg-alt/80 dark:bg-black/20">
          <img
            src={post.mediaUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={`block w-full ${imageLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
          />
        </div>
      ) : null}

      {post.mediaUrl && post.mediaType === "VIDEO" ? (
        <div className="w-full bg-black/90">
          <video
            src={post.mediaUrl}
            controls
            className="block max-h-[400px] w-full"
          />
        </div>
      ) : null}

      <div
        className={`px-4 py-4 sm:px-5 ${
          hasMedia ? "border-t border-[var(--card-border-soft)] dark:border-white/[0.06]" : ""
        }`}
      >
        <p className="mb-4 whitespace-pre-wrap font-body text-sm leading-relaxed text-zap-ink">
          {post.caption}
        </p>

        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--card-border-soft)] pt-3 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={handleLike}
            disabled={!connected}
            title={
              connected
                ? post.likedByMe
                  ? "Unlike"
                  : "Like"
                : "Connect wallet to like"
            }
            className="inline-flex items-center gap-2 border-0 bg-transparent p-0 font-body text-[11px] disabled:cursor-not-allowed"
          >
            <span
              className={`text-lg leading-none transition-transform duration-150 ease-out ${
                likeAnimating ? "scale-125" : "scale-100"
              } ${post.likedByMe ? "" : "opacity-50 grayscale"}`}
            >
              {post.likedByMe ? "♥" : "♡"}
            </span>
            <span
              className={`font-[family-name:var(--font-display)] text-base tabular-nums ${
                post.likedByMe ? "text-zap-accent" : "text-zap-ink-muted"
              }`}
            >
              {post.likeCount}
            </span>
          </button>

          {!connected ? (
            <span className="font-body text-[11px] tracking-[0.06em] text-zap-ink-faint">
              connect wallet to like
            </span>
          ) : null}

          <div className="min-w-[1rem] flex-1" />

          {/* <Link
            to={profileTo}
            className="font-body text-[11px] tracking-[0.08em] text-zap-teal no-underline transition-colors hover:text-zap-accent"
          >
            ⚡ ZAP @{post.creatorUsername} →
          </Link> */}
        </div>
      </div>
    </div>
  );
}
