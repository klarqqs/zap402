import { ExternalLink } from "lucide-react";
import React from "react";

interface XHandleLinkProps {
  handle: string;
  followers?: number;
}

const formatFollowers = (followers: number): string => {
  if (followers >= 1_000_000) {
    const value = followers / 1_000_000;
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}M`;
  }

  if (followers >= 1_000) {
    const value = followers / 1_000;
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}K`;
  }

  return followers.toLocaleString();
};

const XHandleLink: React.FC<XHandleLinkProps> = ({ handle, followers }) => {
  const normalizedHandle = handle.trim().replace(/^@+/, "");

  if (!normalizedHandle) {
    return null;
  }

  const followersText =
    typeof followers === "number"
      ? ` · ${formatFollowers(followers)} followers`
      : "";

  return (
    <a
      href={`https://x.com/${normalizedHandle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-medium text-zap-ink transition-colors hover:text-zap-brand"
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zap-bg-alt bg-zap-bg text-[10px] font-semibold text-zap-ink">
        X
      </span>
      <span>
        @{normalizedHandle}
        {followersText}
      </span>
      <ExternalLink size={14} className="shrink-0 opacity-70" aria-hidden />
    </a>
  );
};

export default XHandleLink;
