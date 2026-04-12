import React from "react";

import type { NetworkPeriod } from "@/utils/networkPeriod";

const PERIODS: { id: NetworkPeriod; label: string }[] = [
  { id: "all", label: "ALL TIME" },
  { id: "week", label: "7D" },
  { id: "month", label: "30D" },
  { id: "alltime", label: "GENESIS" },
];

export interface NetworkToolbarProps {
  period: NetworkPeriod;
  onPeriodChange: (p: NetworkPeriod) => void;
  totalCreators: number;
  /** Initial fetch: disable filters and show ROWS: — */
  isLoading?: boolean;
}

const NetworkToolbar: React.FC<NetworkToolbarProps> = ({
  period,
  onPeriodChange,
  totalCreators,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div
        className={`flex flex-wrap gap-2 ${isLoading ? "pointer-events-none opacity-55" : ""}`}
      >
        {PERIODS.map(({ id, label }) => {
          const active = period === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPeriodChange(id)}
              disabled={isLoading}
              className={`border px-3 py-2 font-mono text-[11px] font-normal uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed ${
                active
                  ? "border-zap-bg-alt bg-zap-brand-dim text-zap-brand"
                  : "border-zap-bg-alt bg-zap-bg-alt text-zap-ink-muted hover:border-zap-bg-alt-bright hover:text-zap-ink"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="whitespace-nowrap font-mono text-[11px] text-zap-ink-muted">
        ROWS: {isLoading ? "—" : totalCreators}
      </p>
    </div>
  );
};

export default NetworkToolbar;
