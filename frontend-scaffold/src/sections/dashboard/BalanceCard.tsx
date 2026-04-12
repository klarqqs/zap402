import React from "react";
import { ArrowDownToLine, Wallet } from "lucide-react";

import AmountDisplay from "@/components/primitives/AmountDisplay";
import Button from "@/components/primitives/Button";
import { DashboardSectionHeader } from "@/sections/dashboard/DashboardSectionHeader";
import { dashboardSectionIconLucideProps } from "@/sections/dashboard/DashboardSectionIcon";

interface BalanceCardProps {
  balance: string;
  feeBps: number;
  onWithdraw: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  feeBps,
  onWithdraw,
}) => {
  return (
    <section className="overflow-hidden rounded-3xl border border-zap-bg-alt bg-zap-surface shadow-none">
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <DashboardSectionHeader
              icon={<Wallet {...dashboardSectionIconLucideProps} aria-hidden />}
              title="Ready to withdraw"
            >
              <p className="text-pretty text-sm font-medium text-zap-ink-muted">
                Withdraw to your wallet ({(feeBps / 100).toFixed(0)}% fee). Same escrow as zaps and
                unlock sales.
              </p>
              <AmountDisplay
                amount={balance}
                className="mt-6 block text-3xl sm:text-4xl md:text-5xl"
              />
            </DashboardSectionHeader>
          </div>
          <Button
            type="button"
            variant="brandCta"
            size="md"
            className="w-full shrink-0 sm:w-auto"
            icon={<ArrowDownToLine size={16} strokeWidth={2} aria-hidden />}
            onClick={onWithdraw}
          >
            Withdraw
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BalanceCard;
