import React from "react";

import { TERMINAL_NAV } from "@/constants/terminalNav";

const mainSurfaceClass =
  "min-h-screen min-w-0 overflow-x-hidden focus:outline-none";

const ShimmerBar: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`editorial-skeleton ${className}`} aria-hidden />
);

/**
 * Matches loaded `TerminalPage` shell: tab strip + home-style card block (no duplicate `main` / `PageContainer`).
 */
const TerminalLoadingSkeleton: React.FC = () => {
  return (
    <div
      tabIndex={-1}
      className={mainSurfaceClass}
      style={{ backgroundColor: "var(--color-bg)" }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="w-full min-w-0 space-y-8 py-8 pb-24 md:pb-10">
        <div className="grid min-w-0 gap-8 lg:items-start">
          <div className="min-w-0">
            <div className="kofi-dashboard-card kofi-dashboard-card--shell min-w-0 overflow-hidden p-1 shadow-none">
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
                {TERMINAL_NAV.map((item) => (
                  <ShimmerBar
                    key={item.tabId}
                    className="h-10 min-w-[4.75rem] shrink-0 md:min-w-[5.25rem]"
                  />
                ))}
              </div>
              <div className="space-y-6 px-1 pb-6 pt-4 md:px-4">
                <div className="kofi-dashboard-card space-y-5 p-5 shadow-none">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <ShimmerBar className="h-36 w-36 shrink-0 !rounded-full sm:h-40 sm:w-40" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <ShimmerBar className="h-2.5 w-16" />
                      <ShimmerBar className="h-7 w-full max-w-[220px]" />
                      <ShimmerBar className="h-4 w-28" />
                      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3 sm:gap-3">
                        <ShimmerBar className="h-11 w-full" />
                        <ShimmerBar className="h-11 w-full" />
                        <ShimmerBar className="h-11 w-full" />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 border-t border-[var(--card-border-soft)] pt-5 sm:grid-cols-3">
                    <div className="space-y-2">
                      <ShimmerBar className="h-2.5 w-20" />
                      <ShimmerBar className="h-9 w-full" />
                    </div>
                    <div className="space-y-2">
                      <ShimmerBar className="h-2.5 w-16" />
                      <ShimmerBar className="h-9 w-full" />
                    </div>
                    <div className="space-y-2">
                      <ShimmerBar className="h-2.5 w-24" />
                      <ShimmerBar className="h-9 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalLoadingSkeleton;
