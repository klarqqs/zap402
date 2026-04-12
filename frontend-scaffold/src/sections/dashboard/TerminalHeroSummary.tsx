import React from "react";
import { ArrowDownToLine } from "lucide-react";

import AmountDisplay from "@/components/primitives/AmountDisplay";
import { hasPositiveBalance } from "@/utils/balance";
import type { Profile } from "@/types/contract";

const labelClass =
  "font-body text-xs font-medium text-zap-ink-muted";

export interface TerminalHeroSummaryProps {
  profile: Profile;
  onWithdraw?: () => void;
  /** For fee sublabel (e.g. 200 → 2%). */
  feeBps?: number;
}

/**
 * Two-up earnings summary — Ko-fi style: neutral numbers, soft panels.
 */
const TerminalHeroSummary: React.FC<TerminalHeroSummaryProps> = ({
  profile,
  onWithdraw,
  feeBps = 200,
}) => {
  // Matches the calmer `terminal/ask` stat typography.
  const amountClass =
    "mt-2 block text-[22px] leading-none font-normal text-zap-ink";
  const canWithdraw = hasPositiveBalance(profile.balance);
  const feePct = (feeBps / 100).toFixed(0);

  return (
    <div className="min-w-0 max-w-full">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="kofi-dashboard-card p-6 shadow-none">
          <p className={labelClass}>Total earned</p>
          <AmountDisplay
            amount={profile.totalTipsReceived}
            className={`${amountClass} !text-zap-ink`}
          />
          <p className="mt-2 font-body text-xs text-zap-ink-muted">
            Tips, unlocks, and questions — lifetime total
          </p>
        </div>

        <div className="kofi-dashboard-card p-6 shadow-none">
          <p className={labelClass}>Ready to withdraw</p>
          <AmountDisplay amount={profile.balance} className={amountClass} />
          {onWithdraw ? (
            <button
              type="button"
              onClick={onWithdraw}
              disabled={!canWithdraw}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2.5 font-body text-sm font-semibold text-white shadow-none transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40 dark:bg-white dark:text-neutral-950 dark:hover:opacity-90 [&_svg]:text-inherit"
            >
              <ArrowDownToLine size={14} strokeWidth={2} className="shrink-0" aria-hidden />
              Withdraw
            </button>
          ) : null}
          <p className="mt-3 font-body text-[11px] text-zap-ink-faint">
            {feePct}% fee · sent to your wallet
          </p>
        </div>
      </div>
    </div>
  );
};

export default TerminalHeroSummary;
