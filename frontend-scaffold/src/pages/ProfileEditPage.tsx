import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import PageContainer from "@/components/layout/PageContainer";
import { PAGE_CONTAINER_LOADING_CLASS } from "@/components/layout/pageLoadingLayout";
import Loader from "@/components/primitives/Loader";
import DashboardTabPageHeader from "@/components/dashboard/DashboardTabPageHeader";
import { useProfile } from "@/hooks";
import { usePageTitle } from "@/hooks/usePageTitle";
import EditProfileForm from "@/sections/profile/EditProfileForm";

/** Matches `TerminalPage` main surface + tab panel padding + column width. */
const mainSurfaceClass =
  "min-h-screen min-w-0 overflow-x-hidden focus:outline-none";

const tabPanelPad = "px-1 pb-6 pt-5 md:px-4";
const tabPanelShell = "mx-auto w-full max-w-[680px]";

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isRegistered, loading } = useProfile();

  usePageTitle("Edit profile — Zap402");

  React.useEffect(() => {
    if (!loading && (!isRegistered || !profile)) {
      navigate("/terminal/profile", { replace: true });
    }
  }, [isRegistered, profile, loading, navigate]);

  if (loading) {
    return (
      <PageContainer
        tag="div"
        maxWidth="editorial"
        className={PAGE_CONTAINER_LOADING_CLASS}
      >
        <Loader size="lg" text="Loading profile…" />
      </PageContainer>
    );
  }

  if (!isRegistered || !profile) {
    return null;
  }

  return (
    <div
      tabIndex={-1}
      className={mainSurfaceClass}
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="w-full min-w-0 space-y-6 py-8 pb-24 md:pb-10">
        <div className={`${tabPanelPad} ${tabPanelShell}`}>
          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link
                to="/terminal/profile"
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-zap-ink-muted transition-colors hover:text-zap-brand"
              >
                <ArrowLeft size={16} strokeWidth={2} className="shrink-0 opacity-80" aria-hidden />
                Terminal
              </Link>
              <span className="text-zap-ink-faint" aria-hidden>
                ·
              </span>
              <Link
                to={`/@${profile.username}`}
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-zap-ink-muted transition-colors hover:text-zap-brand"
              >
                <ArrowLeft size={16} strokeWidth={2} className="shrink-0 opacity-80" aria-hidden />
                @{profile.username}
              </Link>
            </div>

            <div className="kofi-dashboard-card kofi-dashboard-card--shell min-w-0 overflow-hidden p-1 shadow-none">
              <div className="space-y-6 p-5 md:p-6">
                <DashboardTabPageHeader
                  kicker="EDIT PROFILE"
                  title="EDIT PROFILE"
                  description="Update display name, bio, photo, X handle, and optional social links. Username and public URL stay the same. Icons appear on your public page."
                  uppercaseTitle
                />
                <EditProfileForm profile={profile} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;
