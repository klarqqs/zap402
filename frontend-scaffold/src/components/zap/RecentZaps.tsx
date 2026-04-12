import React from "react";
import { Clock, Sparkles, Wallet } from "lucide-react";

import AmountDisplay from "@/components/primitives/AmountDisplay";
import EmptyState from "@/components/primitives/EmptyState";
import { useZaps } from "@/hooks/useZaps";
import Loader from "@/components/primitives/Loader";
import { truncateAddress } from "@/utils/format";
import {
  isAskTipMessage,
  parseAskTipHex,
  truncateAskCommitHex,
} from "@/utils/askOnChain";

interface RecentZapsProps {
  address: string;
}

function formatTipAge(seconds: number): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, nowSec - seconds);
  if (diff < 60) return "Just now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} min ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h} hr ago`;
  }
  const d = Math.floor(diff / 86400);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

const RecentZaps: React.FC<RecentZapsProps> = ({ address }) => {
  const { tips, loading } = useZaps(address, "creator", 3);

  if (loading && tips.length === 0) {
    return (
      <div className="flex justify-center py-10">
        <Loader size="sm" />
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <EmptyState
        title="No tips yet"
        description="When someone supports this creator, the latest tips show up here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {tips.map((tip) => {
        const raw = tip.message?.trim() ?? "";
        const isAsk = isAskTipMessage(raw);
        const askHex = isAsk ? parseAskTipHex(raw) : null;

        return (
          <li
            key={tip.id}
            className="relative min-w-0 overflow-hidden rounded-2xl border border-[var(--card-border-soft)] bg-zap-bg-raised/90 p-4 shadow-none dark:border-white/[0.05] dark:bg-zap-bg-alt/35"
          >
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-1 gap-3">
                <div
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--card-border-soft)] bg-zap-bg-alt text-zap-brand dark:border-white/[0.06] dark:bg-zap-bg/50"
                  aria-hidden
                >
                  <Wallet className="h-[18px] w-[18px]" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zap-ink-muted">
                    From wallet
                  </p>
                  <p
                    className="mt-0.5 truncate font-mono text-sm font-semibold text-zap-ink"
                    title={tip.tipper}
                  >
                    {truncateAddress(tip.tipper, 5)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end sm:text-right">
                <AmountDisplay
                  amount={tip.amount}
                  className="text-lg font-semibold tabular-nums tracking-tight"
                />
                <p className="inline-flex items-center gap-1 text-[11px] font-medium text-zap-ink-muted">
                  <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  {formatTipAge(tip.timestamp)}
                </p>
              </div>
            </div>

            <div className="mt-4 min-w-0 border-t border-dashed border-[var(--card-border-soft)] pt-4 dark:border-white/[0.06]">
              {isAsk && askHex ? (
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted">
                      Note
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-zap-bg-alt/20 bg-zap-brand/[0.08] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zap-brand dark:border-zap-accent/25 dark:bg-zap-accent/[0.08] dark:text-zap-accent">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      Paid request
                    </span>
                  </div>
                  <p className="min-w-0 break-all font-mono text-[13px] leading-snug text-zap-ink">
                    <span className="text-zap-ink-muted">Commitment </span>
                    <span className="select-all" title={raw}>
                      {truncateAskCommitHex(askHex)}
                    </span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-zap-ink-muted">
                    Question text is stored off-chain; this hash links the payment to the
                    request.
                  </p>
                </div>
              ) : (
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted">
                    Message
                  </p>
                  <p
                    className="mt-1.5 min-w-0 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-zap-ink [overflow-wrap:anywhere]"
                    title={raw || undefined}
                  >
                    {raw ? (
                      <span className="text-zap-ink">“{raw}”</span>
                    ) : (
                      <span className="text-zap-ink-muted">No message with this tip.</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default RecentZaps;
