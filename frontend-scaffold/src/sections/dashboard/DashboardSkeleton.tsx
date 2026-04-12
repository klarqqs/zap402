import React from 'react';
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/primitives/Card";
import Skeleton from "@/components/primitives/Skeleton";

const CHART_BAR_PCT = [42, 68, 55, 72, 48, 61, 38];

const DashboardSkeleton: React.FC = () => {
    return (
        <PageContainer maxWidth="editorial" tag="div" className="space-y-6 py-10">
            <section className="flex flex-col gap-3">
                <div className="space-y-2">
                    <Skeleton width="100px" height="10px" />
                    <Skeleton width="220px" height="32px" />
                    <Skeleton width="140px" height="14px" />
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} variant="editorial" className="kofi-dashboard-card space-y-2 shadow-none">
                        <Skeleton width="100px" height="10px" />
                        <Skeleton width="140px" height="24px" />
                    </Card>
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                    <Card variant="editorial" padding="lg" className="kofi-dashboard-card shadow-none">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Skeleton width="180px" height="24px" />
                                <Skeleton width="140px" height="32px" />
                            </div>
                            <div className="relative rounded-xl border border-[var(--card-border-soft)] bg-zap-bg-raised p-6 pb-2">
                                <div className="flex h-48 items-end gap-2 md:gap-4">
                                    {CHART_BAR_PCT.map((pct, i) => (
                                        <div key={i} className="flex flex-1 flex-col items-center">
                                            <Skeleton width="100%" height={`${pct}%`} />
                                            <Skeleton width="30px" height="10px" className="mt-2" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card variant="editorial" className="kofi-dashboard-card space-y-4 shadow-none" padding="lg">
                        <div className="flex items-center justify-between gap-4">
                            <Skeleton width="180px" height="24px" />
                            <Skeleton width="120px" height="14px" />
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} height="80px" />
                            ))}
                        </div>
                        <Skeleton width="200px" height="30px" className="mx-auto" />
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card variant="editorial" className="kofi-dashboard-card space-y-4 shadow-none" padding="lg">
                        <Skeleton width="180px" height="24px" />
                        <div className="space-y-2 rounded-xl border border-[var(--card-border-soft)] bg-zap-bg-alt p-4">
                            <Skeleton width="120px" height="10px" />
                            <Skeleton width="100px" height="20px" />
                        </div>
                        <Skeleton lines={2} />
                    </Card>

                    <Card variant="editorial" className="kofi-dashboard-card space-y-4 shadow-none" padding="lg">
                        <Skeleton width="150px" height="24px" />
                        <div className="grid gap-3">
                            <Skeleton height="50px" />
                            <Skeleton height="50px" />
                        </div>
                    </Card>
                    
                    <Card variant="editorial" padding="lg" className="kofi-dashboard-card flex flex-col items-center space-y-4 shadow-none">
                        <div className="space-y-2 text-center">
                           <Skeleton width="80px" height="10px" className="mx-auto" />
                           <Skeleton width="120px" height="20px" className="mx-auto" />
                        </div>
                        <Skeleton width="160px" height="160px" variant="circle" />
                        <div className="w-full space-y-3">
                           <Skeleton height="40px" />
                           <Skeleton height="45px" />
                        </div>
                    </Card>
                </div>
            </section>
        </PageContainer>
    );
};

export default DashboardSkeleton;
