import React from "react";
import { ArrowRight, Inbox } from "lucide-react";

import { formatZapAmountAsUsdc, truncateString } from "@/utils/format";
import type { Tip } from "@/types/contract";

interface ActivityMiniProps {
  tips: Tip[];
  onViewAll?: () => void;
  /** HOME dashboard: one eyebrow header, no duplicate “Recent activity” title. */
  variant?: "default" | "home";
}

const MAX_TIPS = 5;

function formatRelativeTime(timestamp: number): string {
  const normalizedTs =
    timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - normalizedTs) / 1000),
  );

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffSeconds / 86400);
  return `${days}d ago`;
}

function truncateAddr(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 1) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

const ActivityMini: React.FC<ActivityMiniProps> = ({
  tips,
  onViewAll,
  variant = "default",
}) => {
  const recentTips = tips.slice(0, MAX_TIPS);
  const isHome = variant === "home";

  if (isHome) {
    return (
      <section className="kofi-dashboard-card p-6 shadow-none">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-body text-lg font-semibold text-zap-ink">
            Recent payments & orders
          </h2>
          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="font-body text-sm font-medium text-zap-teal transition-opacity hover:opacity-80"
            >
              View all
            </button>
          ) : null}
        </div>

        {recentTips.length === 0 ? (
          <p className="border-t border-[var(--card-border-soft)] pt-4 font-body text-sm leading-relaxed text-zap-ink-muted">
            Nothing here just yet — share your link to start receiving support.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--card-border-soft)]">
            {recentTips.map((tip, index) => (
              <li
                key={`${tip.id}-${index}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-xs first:pt-0 last:pb-0 sm:gap-x-4"
              >
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-zap-teal">
                  Zap
                </span>
                <span className="shrink-0 font-mono text-[11px] text-zap-ink-muted">
                  {truncateAddr(tip.tipper)}
                </span>
                <span className="shrink-0 font-body text-sm font-semibold tabular-nums text-zap-ink">
                  +{formatZapAmountAsUsdc(tip.amount)}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-[11px] text-zap-ink-faint"
                  title={tip.message || ""}
                >
                  {tip.message ? `"${tip.message}"` : "—"}
                </span>
                <span className="ml-auto shrink-0 text-[11px] text-zap-ink-faint">
                  {formatRelativeTime(tip.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {tips.length > MAX_TIPS && onViewAll ? (
          <p className="mt-3 border-t border-dashed border-zap-bg-alt pt-3 text-[11px] font-medium text-zap-ink-muted">
            + {tips.length - MAX_TIPS} more
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-zap-bg-alt bg-zap-surface p-6 shadow-none">
      {recentTips.length > 0 ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-body text-lg font-semibold tracking-tight text-zap-ink">
            Recent activity
          </h2>
          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-zap-brand transition-opacity hover:opacity-80"
            >
              View all earnings
              <ArrowRight size={14} aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}

      {recentTips.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <Inbox size={28} className="text-zap-ink-muted" aria-hidden />
          <p className="text-sm font-medium text-zap-ink-muted">
            No tips yet — your recent activity will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-dashed divide-zap-border">
          {recentTips.map((tip, index) => (
            <li
              key={`${tip.id}-${index}`}
              className="flex flex-wrap items-center gap-2 py-3 first:pt-0 last:pb-0 sm:gap-3"
            >
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-zap-accent">
                ZAP
              </span>
              <span className="w-14 shrink-0 text-xs font-medium text-zap-ink-muted">
                {formatRelativeTime(tip.timestamp)}
              </span>

              <span className="shrink-0 rounded-lg border border-zap-bg-alt/25 bg-amber-50/70 px-2 py-0.5 font-body text-xs font-semibold tabular-nums text-zap-ink dark:border-amber-500/25 dark:bg-amber-950/30">
                {formatZapAmountAsUsdc(tip.amount)}
              </span>

              <span className="shrink-0 font-mono text-xs font-medium text-zap-ink">
                {truncateString(tip.tipper)}
              </span>

              <span
                className="min-w-0 flex-1 truncate text-xs font-medium text-zap-ink-muted"
                title={tip.message || "No message"}
              >
                {tip.message || "—"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {tips.length > MAX_TIPS && onViewAll && (
        <p className="mt-3 border-t border-dashed border-zap-bg-alt pt-3 text-xs font-medium text-zap-ink-muted">
          + {tips.length - MAX_TIPS} more tip{tips.length - MAX_TIPS !== 1 ? "s" : ""}
        </p>
      )}
    </section>
  );
};

export default ActivityMini;
