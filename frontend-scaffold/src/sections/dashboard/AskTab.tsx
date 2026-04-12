import React from "react";

import DashboardTabPageHeader from "@/components/dashboard/DashboardTabPageHeader";
import AskSettingsCollapsible from "@/sections/dashboard/AskSettingsCollapsible";

/**
 * Dedicated pay-to-ask / chat-back settings (mirrors the block on Content, without the fold).
 */
const AskTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <DashboardTabPageHeader
        kicker="ASK"
        title="ASK"
        description="Set your price per question, choose AI-assisted or direct replies, and tune your persona. Fans pay on your public page."
      />
      <AskSettingsCollapsible layout="page" />
    </div>
  );
};

export default AskTab;
