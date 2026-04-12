import React from "react";
import { MessageCircle } from "lucide-react";

import Card from "@/components/primitives/Card";
import { DashboardSectionHeader } from "@/sections/dashboard/DashboardSectionHeader";
import { dashboardSectionIconLucideProps } from "@/sections/dashboard/DashboardSectionIcon";

export interface CloneEarningsProps {
  totalUsdc: string;
  messagesCount: number;
}

const CloneEarnings: React.FC<CloneEarningsProps> = ({
  totalUsdc,
  messagesCount,
}) => {
  return (
    <Card variant="editorial" hover className="flex h-full flex-col space-y-4" padding="lg">
      <DashboardSectionHeader
        icon={<MessageCircle {...dashboardSectionIconLucideProps} aria-hidden />}
        title="Clone earnings"
      >
        <p className="font-body text-3xl font-semibold tabular-nums tracking-tight text-zap-ink">
          {totalUsdc}{" "}
          <span className="text-lg font-medium text-zap-ink">USDC</span>
        </p>
      </DashboardSectionHeader>
      <p className="mt-auto text-pretty text-xs font-medium leading-relaxed text-zap-ink">
        {messagesCount} paid message{messagesCount === 1 ? "" : "s"} (demo counters)
      </p>
    </Card>
  );
};

export default CloneEarnings;
