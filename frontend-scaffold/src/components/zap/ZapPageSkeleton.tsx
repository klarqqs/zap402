import React from "react";

import PageContainer from "@/components/layout/PageContainer";
const ShimmerBar: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`editorial-skeleton ${className}`} aria-hidden />
);

const ZapPageSkeleton: React.FC = () => {
  return (
    <PageContainer
      maxWidth="zapMain"
      className="min-h-screen min-w-0 space-y-8 bg-transparent py-10"
    >
      <section className="grid min-w-0 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="kofi-dashboard-card kofi-dashboard-card--shell min-w-0 overflow-hidden p-1 shadow-none">
          <div className="space-y-6 px-1 py-5 md:px-4 md:py-6">
            <div className="kofi-dashboard-card space-y-5 p-5 shadow-none md:p-6">
              <div className="flex justify-end">
                <ShimmerBar className="h-7 w-36" />
              </div>
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <ShimmerBar className="h-20 w-20 shrink-0 !rounded-full" />
                  <div className="space-y-2.5">
                    <ShimmerBar className="h-2.5 w-24" />
                    <ShimmerBar className="h-6 w-[12.5rem] max-w-[60vw]" />
                    <ShimmerBar className="h-4 w-32" />
                    <ShimmerBar className="h-4 w-56 max-w-[68vw]" />
                  </div>
                </div>
                <ShimmerBar className="h-7 w-16" />
              </div>
              <div className="space-y-2 border-t border-[var(--card-border-soft)] pt-5">
                <ShimmerBar className="h-4 w-full" />
                <ShimmerBar className="h-4 w-[92%]" />
                <ShimmerBar className="h-4 w-[78%]" />
              </div>
              <div className="grid grid-cols-1 border-t border-zap-bg-alt bg-zap-bg/40 dark:bg-zap-bg/20 sm:grid-cols-3">
                <div className="border-b border-zap-bg-alt p-5 sm:border-b-0 sm:border-r sm:border-zap-bg-alt">
                  <ShimmerBar className="h-2.5 w-20" />
                  <div className="mt-3">
                    <ShimmerBar className="h-10 w-full" />
                  </div>
                </div>
                <div className="border-b border-zap-bg-alt p-5 sm:border-b-0 sm:border-r sm:border-zap-bg-alt">
                  <ShimmerBar className="h-2.5 w-16" />
                  <div className="mt-3">
                    <ShimmerBar className="h-10 w-[60%]" />
                  </div>
                </div>
                <div className="border-b border-zap-bg-alt p-5 sm:border-b-0">
                  <ShimmerBar className="h-2.5 w-24" />
                  <div className="mt-3">
                    <ShimmerBar className="h-10 w-[50%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="kofi-dashboard-card min-w-0 space-y-5 p-5 shadow-none lg:pt-6">
          <ShimmerBar className="h-7 w-44 rounded-[14px]" />
          <ShimmerBar className="h-12 w-full rounded-[16px]" />
          <div className="flex gap-2">
            <ShimmerBar className="h-8 w-[4.625rem] rounded-[14px]" />
            <ShimmerBar className="h-8 w-[4.625rem] rounded-[14px]" />
            <ShimmerBar className="h-8 w-[4.625rem] rounded-[14px]" />
          </div>
          <ShimmerBar className="h-20 w-full rounded-[18px]" />
          <div className="flex gap-3">
            <ShimmerBar className="h-10 w-full rounded-[14px]" />
            <ShimmerBar className="h-10 w-full rounded-[14px]" />
          </div>
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <div className="kofi-dashboard-card min-w-0 space-y-4 p-5 shadow-none md:p-6">
          <ShimmerBar className="h-6 w-44" />
          <div className="space-y-2">
            <ShimmerBar className="h-4 w-full" />
            <ShimmerBar className="h-4 w-[84%]" />
          </div>
          <ShimmerBar className="h-24 w-full" />
          <ShimmerBar className="h-10 w-40" />
        </div>

        <div className="kofi-dashboard-card min-w-0 space-y-4 p-5 shadow-none md:p-6">
          <ShimmerBar className="h-5 w-48" />
          <div className="space-y-2">
            <ShimmerBar className="h-4 w-full" />
            <ShimmerBar className="h-4 w-[92%]" />
            <ShimmerBar className="h-4 w-[76%]" />
          </div>
          <ShimmerBar className="h-3 w-36" />
        </div>

        <div className="kofi-dashboard-card min-w-0 space-y-4 p-5 shadow-none md:p-6">
          <ShimmerBar className="h-5 w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ShimmerBar key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
};

export default ZapPageSkeleton;
