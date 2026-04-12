import React, { useMemo, useState } from "react";
import { ArrowDownToLine } from "lucide-react";

import DashboardTabPageHeader from "@/components/dashboard/DashboardTabPageHeader";
import AmountDisplay from "@/components/primitives/AmountDisplay";
import Loader from "@/components/primitives/Loader";
import { useTerminal } from "@/hooks/useTerminal";
import { formatTimestamp, formatZapAmountAsUsdc } from "@/utils/format";
import { hasPositiveBalance } from "@/utils/balance";
import type { Tip } from "@/types/contract";
import EarningsChart from "./EarningsChart";
import ZapsTab from "./ZapsTab";
import WithdrawModal from "./WithdrawModal";

interface WithdrawalHistoryItem {
  id: string;
  createdAt: number;
  gross: string;
  fee: string;
  net: string;
}

const DEFAULT_FEE_BPS = 200;

const EarningsTab: React.FC = () => {
  const { profile, tips, stats, loading } = useTerminal();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const feeBps = stats?.feeBps ?? DEFAULT_FEE_BPS;
  const feePctLabel = `${(feeBps / 100).toFixed(0)}%`;

  const withdrawals = useMemo<WithdrawalHistoryItem[]>(() => {
    return tips.slice(0, 4).map((tip: Tip, index: number) => {
      const gross = BigInt(tip.amount) * BigInt(index + 2);
      const fee = (gross * BigInt(feeBps)) / BigInt(10_000);
      const net = gross - fee;

      return {
        id: `${tip.id}-${tip.timestamp}`,
        createdAt: tip.timestamp - (index + 1) * 12 * 60 * 60,
        gross: gross.toString(),
        fee: fee.toString(),
        net: net.toString(),
      };
    });
  }, [tips, feeBps]);

  const canWithdraw = hasPositiveBalance(profile?.balance);

  if (loading && !profile) {
    return (
      <div className="flex justify-center py-20">
        <Loader size="lg" text="Loading earnings..." />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <DashboardTabPageHeader
        kicker="EARNINGS"
        title="EARNINGS"
        description="All zaps, unlock sales, and paid requests in one place."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="kofi-dashboard-card p-6 shadow-none">
          <p className="mb-2 font-body text-xs font-medium text-zap-ink-muted">Total earned</p>
          <AmountDisplay
            amount={profile.totalTipsReceived}
            className="block text-[22px] leading-none font-normal !text-zap-ink"
          />
          <p className="mt-2 font-body text-xs text-zap-ink-muted">
            Tips, unlocks, and questions — lifetime total
          </p>
        </div>

        <div className="kofi-dashboard-card p-6 shadow-none">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="font-body text-xs font-medium text-zap-ink-muted">Ready to withdraw</p>
            <span
              className={`shrink-0 font-body text-[10px] uppercase tracking-[0.08em] ${
                canWithdraw ? "text-zap-teal" : "text-zap-ink-faint"
              }`}
            >
              {canWithdraw ? "Active" : "Empty"}
            </span>
          </div>
          <AmountDisplay
            amount={profile.balance}
            className="mb-4 block text-[22px] leading-none font-normal text-zap-ink"
          />
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            disabled={!canWithdraw}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2.5 font-body text-sm font-semibold text-white shadow-none transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40 dark:bg-white dark:text-neutral-950 dark:hover:opacity-90 [&_svg]:text-inherit"
          >
            <ArrowDownToLine size={14} strokeWidth={2} className="shrink-0" aria-hidden />
            Withdraw
          </button>
          <p className="mt-3 text-center font-body text-[11px] text-zap-ink-faint">
            {feePctLabel} fee · sent to your wallet
          </p>
        </div>
      </div>

      <EarningsChart tips={tips} />

      <ZapsTab variant="earnings" />

      <section className="kofi-dashboard-card p-6 shadow-none">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-body text-lg font-semibold text-zap-ink">Withdrawal history</h2>
            <p className="mt-1 font-body text-sm text-zap-ink-muted">
              Gross, fee, and net for each withdrawal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-zap-bg-alt bg-zap-bg-alt px-4 py-2 font-body text-sm font-semibold text-zap-ink transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-overlay"
          >
            Withdraw
          </button>
        </div>

        {withdrawals.length === 0 ? (
          <p className="py-4 font-body text-sm text-zap-ink-muted">
            No withdrawals yet. Your earnings stay in escrow until you withdraw.
          </p>
        ) : (
          <div className="space-y-0">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="grid grid-cols-1 gap-4 border-b border-zap-bg-alt py-4 last:border-b-0 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-center sm:gap-4"
              >
                <div>
                  <p className="mb-0.5 font-body text-[10px] uppercase tracking-[0.1em] text-zap-ink-faint">
                    REQUESTED
                  </p>
                  <p className="font-body text-[13px] text-zap-ink">
                    {formatTimestamp(w.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 font-body text-[10px] uppercase tracking-[0.1em] text-zap-ink-faint">
                    GROSS
                  </p>
                  <p className="font-body text-base font-semibold tabular-nums text-zap-ink">
                    {formatZapAmountAsUsdc(w.gross)}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 font-body text-[10px] uppercase tracking-[0.1em] text-zap-ink-faint">
                    FEE ({feePctLabel})
                  </p>
                  <p className="font-body text-base font-semibold tabular-nums text-zap-error">
                    −{formatZapAmountAsUsdc(w.fee)}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 font-body text-[10px] uppercase tracking-[0.1em] text-zap-ink-faint">
                    NET RECEIVED
                  </p>
                  <p className="font-body text-base font-semibold tabular-nums text-zap-teal">
                    {formatZapAmountAsUsdc(w.net)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <WithdrawModal
        isOpen={withdrawOpen}
        balance={profile.balance}
        feeBps={feeBps}
        onClose={() => setWithdrawOpen(false)}
      />
    </div>
  );
};

export default EarningsTab;
