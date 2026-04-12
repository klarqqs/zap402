import React from "react";

const Bar: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = "",
  style,
}) => (
  <div
    className={`network-shimmer rounded-md ${className}`}
    style={style}
  />
);

/** Podium order matches `Podium.tsx`: left #2, center #1 (taller), right #3 */
const PODIUM_SLOTS = [
  { rank: 2 as const, tall: false },
  { rank: 1 as const, tall: true },
  { rank: 3 as const, tall: false },
];

const TABLE_HEAD: readonly string[] = [
  "RANK",
  "IDENTITY",
  "TOTAL_USDC",
  "ZAPS",
  "DEPLOYED",
];

/**
 * Shimmer for leaderboard body only — use inside the same shell as the loaded Network page
 * (`DashboardTabPageHeader` + `NetworkToolbar` + search already rendered).
 */
export const NetworkListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 items-end gap-5 md:grid-cols-3">
        {PODIUM_SLOTS.map((slot) => (
          <div
            key={slot.rank}
            className={`network-shimmer flex flex-col rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center md:px-6 ${
              slot.tall ? "md:z-[1] md:-mt-2" : ""
            }`}
            style={{
              minHeight: slot.tall ? 340 : 300,
              padding: "32px 24px",
            }}
          >
            <div className="flex justify-center">
              <Bar className="h-7 w-16 rounded-full" />
            </div>
            <Bar className="mx-auto mt-5 h-[72px] w-[72px] shrink-0 rounded-full" />
            <Bar className="mx-auto mt-4 h-6 w-36 max-w-full" />
            <Bar className="mx-auto mt-2 h-4 w-24" />
            <Bar className="mx-auto mt-4 h-8 w-28" />
            <Bar className="mx-auto mt-2 h-4 w-20" />
            <Bar className="mx-auto mt-5 h-3 w-32" />
            <p className="mt-6 font-body text-xs font-medium uppercase tracking-[0.08em] text-zap-ink-muted">
              Open profile
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="card-editorial overflow-x-auto p-0">
          <table className="min-w-[720px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zap-bg-alt bg-zap-bg-alt">
                {TABLE_HEAD.map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className="px-6 py-3.5 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-zap-ink-muted"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr
                  key={i}
                  className="border-b border-zap-bg-alt network-shimmer"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <td className="w-[60px] px-6 py-4">
                    <Bar className="h-5 w-8" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Bar className="h-12 w-12 shrink-0 rounded-full" />
                      <div className="space-y-2">
                        <Bar className="h-4 w-28" />
                        <Bar className="h-3 w-20" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Bar className="h-5 w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <Bar className="h-5 w-12" />
                  </td>
                  <td className="px-6 py-4">
                    <Bar className="h-4 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NetworkListSkeleton;
