import React, { useMemo } from "react";
import { Activity, BarChart3 } from "lucide-react";

import EmptyState from "@/components/primitives/EmptyState";
import ActivityMini from "./ActivityMini";
import { useTerminal } from "@/hooks/useTerminal";
import Loader from "@/components/primitives/Loader";
import { Tip } from "@/types/contract";
import { formatZapAmountAsUsdc } from "@/utils/format";
import { DashboardSectionHeader } from "@/sections/dashboard/DashboardSectionHeader";
import { dashboardSectionIconLucideProps } from "@/sections/dashboard/DashboardSectionIcon";

function buildWeeklyChart(tips: Tip[]) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      total: 0,
    };
  });

  const now = Math.floor(Date.now() / 1000);
  tips.forEach((tip: Tip) => {
    const daysAgo = Math.floor((now - tip.timestamp) / (60 * 60 * 24));
    const idx = 6 - daysAgo;
    if (idx >= 0 && idx < 7) {
      days[idx].total += Number(tip.amount);
    }
  });

  return days;
}

const OverviewTab: React.FC = () => {
  const { profile, tips, loading, error } = useTerminal();

  const weeklyData = useMemo(() => buildWeeklyChart(tips), [tips]);
  const maxBar = Math.max(...weeklyData.map((d) => d.total), 1);

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader size="lg" text="FETCHING..." />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="py-20">
        <EmptyState
          title="ERROR: unexpected_state"
          description={error}
          action={{
            label: "Retry",
            buttonVariant: "brandCta",
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20">
        <EmptyState
          title="PROFILE: null"
          description="No on-chain identity for this wallet. Deploy a profile first."
          action={{ label: "DEPLOY PROFILE", onClick: () => {} }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <DashboardSectionHeader
          icon={<BarChart3 {...dashboardSectionIconLucideProps} aria-hidden />}
          title="Last 7 days"
        >
          <p className="text-pretty text-sm font-medium text-zap-ink-muted">
            Stroops aggregated by weekday · USDC-style display
          </p>
        </DashboardSectionHeader>
        <div className="card-editorial p-6">
          <div className="flex h-32 items-end gap-2">
            {weeklyData.map((day: { label: string; total: number }) => {
              const heightPct = Math.round((day.total / maxBar) * 100);
              return (
                <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
                  <div className="relative w-full" style={{ height: "7rem" }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg bg-zap-brand/80 transition-all duration-500"
                      style={{ height: `${heightPct}%` }}
                      title={`${day.label}: ${day.total > 0 ? formatZapAmountAsUsdc(String(day.total)) : "0"}`}
                    />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-zap-ink-muted">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div>
        <div className="mb-4">
          <DashboardSectionHeader
            icon={<Activity {...dashboardSectionIconLucideProps} aria-hidden />}
            title="Recent activity"
          >
            <p className="text-pretty text-sm font-medium text-zap-ink-muted">
              Latest inbound zaps for this wallet.
            </p>
          </DashboardSectionHeader>
        </div>
        <ActivityMini tips={tips} />
      </div>
    </div>
  );
};

export default OverviewTab;
