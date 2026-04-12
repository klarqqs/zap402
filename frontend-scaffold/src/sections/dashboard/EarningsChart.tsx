import React, { useMemo, useState } from "react";
import { Coins } from "lucide-react";

import { stroopToXlmBigNumber, formatTimestamp } from "@/utils/format";
import type { Tip } from "@/types/contract";

type Period = "week" | "month" | "all";

const PERIOD_LABEL: Record<Period, string> = {
  week: "WEEK",
  month: "MONTH",
  all: "ALL TIME",
};

interface DataPoint {
  label: string;
  value: number;
}

interface EarningsChartProps {
  tips: Tip[];
}

const SECONDS_IN_DAY = 24 * 60 * 60;

const PERIODS: Period[] = ["week", "month", "all"];

const tabBase =
  "border-0 bg-transparent font-body text-[11px] uppercase tracking-[0.1em] pb-0.5 transition-colors cursor-pointer";

const EarningsChart: React.FC<EarningsChartProps> = ({ tips }) => {
  const [period, setPeriod] = useState<Period>("week");
  const [anchorNowSec] = useState(() => Math.floor(Date.now() / 1000));

  const chartData = useMemo(() => {
    if (tips.length === 0) return [];

    const now = anchorNowSec;
    const result: DataPoint[] = [];

    const tipsHuman = tips.map((t) => ({
      ...t,
      amountHuman: Number(stroopToXlmBigNumber(t.amount).toFixed(7)),
    }));

    if (period === "week") {
      for (let i = 6; i >= 0; i--) {
        const dayStart = now - i * SECONDS_IN_DAY;
        const date = formatTimestamp(dayStart);
        const label = date.toLocaleDateString("en-US", { weekday: "short" });

        const dayTotal = tipsHuman
          .filter((t) => {
            const tDate = formatTimestamp(t.timestamp);
            return tDate.toDateString() === date.toDateString();
          })
          .reduce((sum, t) => sum + t.amountHuman, 0);

        result.push({ label, value: dayTotal });
      }
    } else if (period === "month") {
      for (let i = 5; i >= 0; i--) {
        const blockEnd = now - i * 5 * SECONDS_IN_DAY;
        const blockStart = blockEnd - 5 * SECONDS_IN_DAY;
        const date = formatTimestamp(blockEnd);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;

        const blockTotal = tipsHuman
          .filter((t) => t.timestamp > blockStart && t.timestamp <= blockEnd)
          .reduce((sum, t) => sum + t.amountHuman, 0);

        result.push({ label, value: blockTotal });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = d.getMonth();
        const year = d.getFullYear();
        const label = d.toLocaleDateString("en-US", { month: "short" });

        const monthTotal = tipsHuman
          .filter((t) => {
            const tDate = formatTimestamp(t.timestamp);
            return tDate.getMonth() === month && tDate.getFullYear() === year;
          })
          .reduce((sum, t) => sum + t.amountHuman, 0);

        result.push({ label, value: monthTotal });
      }
    }

    return result;
  }, [tips, period, anchorNowSec]);

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  const perfSubtitle =
    period === "week"
      ? "Your earnings this week"
      : period === "month"
        ? "Rolling blocks in the last month"
        : "Earnings by month";

  return (
    <div className="kofi-dashboard-card mb-4 p-5 shadow-none">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-body text-lg font-semibold text-zap-ink">Performance</h2>
          <p className="mt-1 font-body text-sm text-zap-ink-muted">{perfSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-4" role="group" aria-label="Chart period">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`${tabBase} ${
                period === p
                  ? "border-b border-zap-accent text-zap-accent"
                  : "border-b border-transparent text-zap-ink-muted hover:text-zap-ink"
              }`}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 border border-dashed border-zap-bg-alt bg-zap-bg-raised px-4">
          <Coins size={28} className="text-zap-ink-muted opacity-80" aria-hidden />
          <div className="h-px w-12 bg-zap-border" />
          <p className="text-center font-body text-sm font-medium text-zap-ink-muted">
            No earnings yet
          </p>
        </div>
      ) : (
        <div
          className="relative rounded-none border-b border-zap-bg-alt bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_47px,var(--color-border)_47px,var(--color-border)_48px)] px-1 pb-0 pt-2"
          style={{ minHeight: "12rem" }}
        >
          <div className="relative z-[1] flex h-48 items-stretch gap-2 md:gap-3">
            {chartData.map((point, index) => {
              const isEmpty = point.value <= 0;
              const heightPct =
                !isEmpty && maxValue > 0
                  ? Math.max((point.value / maxValue) * 100, 3)
                  : 0;
              const barH = !isEmpty ? `${heightPct}%` : "6px";
              return (
                <div
                  key={`${point.label}-${index}`}
                  className="group flex min-h-0 flex-1 flex-col"
                >
                  <div className="flex min-h-0 flex-1 flex-col justify-end">
                    <div
                      className="relative w-full"
                      style={{ height: barH, minHeight: isEmpty ? "6px" : undefined }}
                    >
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-none border border-zap-bg-alt bg-zap-bg-raised px-2 py-1 font-body text-[10px] font-semibold tabular-nums text-zap-ink opacity-0 shadow-none transition-opacity group-hover:opacity-100">
                        {point.value.toFixed(2)} USDC
                      </div>
                      <div
                        className={`h-full w-full min-h-[6px] rounded-t-sm transition-[filter] hover:brightness-110 ${
                          isEmpty ? "bg-zap-border" : "bg-zap-accent"
                        }`}
                      />
                    </div>
                  </div>
                  <span className="mt-2 text-center font-body text-[10px] font-medium uppercase tracking-wide text-zap-ink-muted md:text-[11px]">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsChart;
