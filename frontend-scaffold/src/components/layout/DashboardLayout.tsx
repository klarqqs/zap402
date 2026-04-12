import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useWallet } from "@/hooks/useWallet";
import { useProfileStore } from "@/state/profileStore";
import DashboardTopBar from "@/components/layout/DashboardTopBar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import {
  isOwnCreatorPage,
  isPublicZapPath,
} from "@/utils/dashboardRouteGuards";

/**
 * App workspace shell: fixed top nav + scrollable content region.
 * Public profile URLs still render standalone for non-registered visitors.
 */
const DashboardLayout: React.FC = () => {
  const { connected } = useWallet();
  const { pathname } = useLocation();
  const isRegistered = useProfileStore((s) => s.isRegistered);
  const profile = useProfileStore((s) => s.profile);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);



  if (
    isPublicZapPath(pathname) &&
    !isOwnCreatorPage(pathname, profile?.username) &&
    !isRegistered
  ) {
    return <Outlet />;
  }

  return (
    <div className="dashboard-shell fixed inset-0 flex flex-col justify-center bg-[var(--dashboard-bg-raised)] text-zap-ink overflow-hidden">
      <DashboardTopBar
        variant="dashboard"
        onOpenMenu={() => setMobileNavOpen(true)}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DashboardSidebar
          mobileOpen={mobileNavOpen}
          onNavigate={() => setMobileNavOpen(false)}
        />
        <main
          id="main-content"
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain focus:outline-none"
        >
          <div className="w-full max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
