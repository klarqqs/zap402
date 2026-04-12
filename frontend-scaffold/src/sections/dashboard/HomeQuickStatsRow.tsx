import React from "react";
import { Link } from "react-router-dom";

import { getCreditTier } from "@/types/contract";
import type { Profile } from "@/types/contract";

export interface HomeQuickStatsRowProps {
  profile: Profile;
}

/**
 * Single-line stats: zaps, credit, X followers — links to full earnings.
 */
const HomeQuickStatsRow: React.FC<HomeQuickStatsRowProps> = ({ profile }) => {
  const tier = getCreditTier(profile.creditScore);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border border-zap-bg-alt bg-zap-bg-alt px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="font-body text-[10px] uppercase tracking-[0.1em] text-zap-ink-faint">
          Zaps
        </span>
        <span className="font-body text-lg font-semibold tabular-nums text-zap-ink">
          {profile.totalTipsCount.toLocaleString()}
        </span>
      </div>

      <div className="hidden h-6 w-px bg-zap-border sm:block" aria-hidden />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-body text-[10px] uppercase tracking-[0.1em] text-zap-ink-faint">
          Credit
        </span>
        <span className="font-body text-lg font-semibold tabular-nums text-zap-ink">
          {profile.creditScore}
        </span>
        <span className="font-body text-[10px] uppercase tracking-[0.08em] text-zap-ink-muted">
          ● {tier}
        </span>
      </div>

      <div className="hidden h-6 w-px bg-zap-border sm:block" aria-hidden />

      <div className="flex items-center gap-2">
        <span className="font-body text-[10px] uppercase tracking-[0.1em] text-zap-ink-faint">
          X followers
        </span>
        <span className="font-body text-lg font-semibold tabular-nums text-zap-ink">
          {profile.xHandle?.trim()
            ? profile.xFollowers.toLocaleString()
            : "—"}
        </span>
      </div>

      <div className="ml-auto w-full sm:w-auto">
        <Link
          to="/terminal/earnings"
          className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-zap-teal no-underline transition-opacity hover:opacity-85"
        >
          View all earnings 
        </Link>
      </div>
    </div>
  );
};

export default HomeQuickStatsRow;
