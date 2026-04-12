import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import DashboardTabPageHeader from "@/components/dashboard/DashboardTabPageHeader";
import { TERMINAL_DEFAULT_PATH } from "@/constants/terminalNav";
import HomeGuidesSection from "@/sections/dashboard/HomeGuidesSection";
import ProfileHeroSummary from "@/sections/profile/ProfileHeroSummary";
import type { Profile, Tip } from "@/types/contract";

export interface DashboardHomePanelProps {
  profile: Profile;
  tips: Tip[];
  zapLink: string;
  onWithdraw?: () => void;
  feeBps?: number;
}

/**
 * Agent home — onboarding, profile, history, suggestions, and guides.
 */
const DashboardHomePanel: React.FC<DashboardHomePanelProps> = ({
  profile,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <Link
          to={TERMINAL_DEFAULT_PATH}
          className="inline-flex items-center gap-2 font-body text-sm font-semibold text-zap-ink-muted transition-colors hover:text-zap-brand"
        >
          <ArrowLeft size={16} strokeWidth={2} className="shrink-0 opacity-80" aria-hidden />
          Back
        </Link>
      </div>
      <DashboardTabPageHeader
        kicker="PROFILE"
        title="PROFILE"
        description="Your agent hub — quick stats, request activity, and next steps."
      />
      <ProfileHeroSummary profile={profile} />

      <HomeGuidesSection />
    </div>
  );
};

export default DashboardHomePanel;
