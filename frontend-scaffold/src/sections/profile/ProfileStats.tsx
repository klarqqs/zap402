import React from "react";

import AmountDisplay from "@/components/primitives/AmountDisplay";

interface ProfileStatsProps {
  balance: string;
  totalTipsReceived: string;
  totalTipsCount: number;
  xFollowers: number;
  className?: string;
}

const labelClass =
  "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted";

/**
 * KPI grid for the logged-in profile — matches dashboard earnings tiles.
 */
const ProfileStats: React.FC<ProfileStatsProps> = ({
  balance,
  totalTipsReceived,
  totalTipsCount,
  xFollowers,
  className = "",
}) => {
  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}
    >
      <div className="rounded-3xl border border-zap-bg-alt bg-zap-surface p-5 shadow-none transition-colors hover:border-zap-bg-alt/25">
        <div className={labelClass}>
          <span>Available balance</span>
        </div>
        <AmountDisplay
          amount={balance}
          className="mt-3 block font-body text-2xl font-semibold"
        />
      </div>

      <div className="rounded-3xl border border-zap-bg-alt/25 bg-amber-50/50 p-5 shadow-none transition-colors hover:border-zap-bg-alt/35 dark:border-amber-500/20 dark:bg-amber-950/20">
        <div className={labelClass}>
          <span>Lifetime earnings</span>
        </div>
        <AmountDisplay
          amount={totalTipsReceived}
          className="mt-3 block font-body text-2xl font-semibold"
        />
      </div>

      <div className="rounded-3xl border border-zap-bg-alt bg-zap-surface p-5 shadow-none transition-colors hover:border-zap-bg-alt/25">
        <div className={labelClass}>
          <span>Total tips</span>
        </div>
        <p className="mt-3 font-body text-2xl font-semibold tabular-nums text-zap-ink xl:text-3xl">
          {totalTipsCount}
        </p>
      </div>

      <div className="rounded-3xl border border-zap-bg-alt bg-zap-surface p-5 shadow-none transition-colors hover:border-zap-bg-alt/25">
        <div className={labelClass}>
          <span>X followers</span>
        </div>
        <p className="mt-3 font-body text-2xl font-semibold tabular-nums text-zap-ink xl:text-3xl">
          {xFollowers.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default ProfileStats;
