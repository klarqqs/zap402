import React from "react";

import Avatar from "@/components/primitives/Avatar";
import Card from "@/components/primitives/Card";
import AmountDisplay from "@/components/primitives/AmountDisplay";
import type { Tip } from "@/types";
import { truncateString } from "@/utils/format";

export interface ZapCardProps {
  zap: Tip;
  showSender?: boolean;
  showReceiver?: boolean;
}

const formatRelativeTimestamp = (timestamp: number): string => {
  const normalizedTimestamp =
    timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - normalizedTimestamp) / 1000),
  );

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(diffSeconds / 86400);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const ZapCard: React.FC<ZapCardProps> = ({
  zap,
  showSender = true,
  showReceiver = true,
}) => {
  const primaryAddress = showSender ? zap.tipper : zap.creator;
  const primaryLabel = showSender ? "From" : "To";
  const secondaryAddress =
    showSender && showReceiver ? zap.creator : showReceiver ? zap.tipper : null;
  const secondaryLabel =
    showSender && showReceiver ? "To" : showReceiver ? "From" : null;

  return (
    <button
      type="button"
      className="block w-full text-left"
      aria-label={`Open zap card for ${truncateString(primaryAddress)}`}
    >
      <Card hover variant="editorial" className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              address={primaryAddress}
              alt={`${primaryLabel} ${primaryAddress}`}
              size="md"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted">
                {primaryLabel}
              </p>
              <p className="truncate text-sm font-semibold text-zap-ink">
                {truncateString(primaryAddress)}
              </p>
              {secondaryAddress && secondaryLabel && (
                <p className="mt-1 truncate text-xs font-medium text-zap-ink-muted">
                  {secondaryLabel}: {truncateString(secondaryAddress)}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-zap-bg-alt/30 bg-amber-50/70 px-3 py-2 dark:border-amber-500/25 dark:bg-amber-950/30">
            <AmountDisplay amount={zap.amount} className="text-sm md:text-base" />
          </div>
        </div>

        <p
          className="overflow-hidden text-sm font-medium leading-relaxed text-zap-ink-muted"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {zap.message || "No message attached."}
        </p>

        <div className="flex items-center justify-between border-t border-dashed border-zap-bg-alt pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted">
            Zap
          </span>
          <span className="text-xs font-medium text-zap-ink-muted">
            {formatRelativeTimestamp(zap.timestamp)}
          </span>
        </div>
      </Card>
    </button>
  );
};

export default ZapCard;
