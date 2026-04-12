import React, { useState } from "react";
import { ExternalLink, PenSquare, Wallet2 } from "lucide-react";
import { Link } from "react-router-dom";

import PageContainer from "@/components/layout/PageContainer";
import { PAGE_CONTAINER_LOADING_CLASS } from "@/components/layout/pageLoadingLayout";
import Loader from "@/components/primitives/Loader";
import ErrorState from "@/components/feedback/ErrorState";
import { hasPositiveBalance } from "@/utils/balance";
import { useProfile, useContract } from "@/hooks";
import { usePageTitle } from "@/hooks/usePageTitle";
import { categorizeError } from "@/utils/error";
import { env } from "@/config/env";
import ProfileHeroSummary from "@/sections/profile/ProfileHeroSummary";
import ActivityFeed from "@/sections/profile/ActivityFeed";
import RegisterWizard from "@/sections/profile/RegisterWizard";
import RegisterScreenLayout from "@/sections/profile/RegisterScreenLayout";
import WithdrawModal from "@/sections/dashboard/WithdrawModal";

/**
 * ProfilePage is a protected route that displays the connected user's profile.
 * If the user is not registered, it prompts them to create a profile.
 * If registered, it shows their profile information, stats, activity, and actions.
 */
const ProfilePage: React.FC = () => {
  const { profile, loading, error, isRegistered, refetch } = useProfile();
  const { getStats } = useContract();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [feeBps, setFeeBps] = useState(250);
  const profileRecoveryRefetchDone = React.useRef(false);

  usePageTitle(
    loading
      ? "Loading Profile..."
      : isRegistered && profile
        ? `${profile.displayName} (@${profile.username})`
        : "Register Profile",
  );

  React.useEffect(() => {
    if (!env.contractConfigured) return;
    getStats()
      .then(stats => setFeeBps(stats.feeBps))
      .catch(err => console.warn("Failed to fetch fee bps:", err));
  }, [getStats]);

  React.useEffect(() => {
    if (profile || !isRegistered) {
      profileRecoveryRefetchDone.current = false;
      return;
    }
    if (!env.contractConfigured || loading) return;
    if (!profileRecoveryRefetchDone.current) {
      profileRecoveryRefetchDone.current = true;
      void refetch();
    }
  }, [isRegistered, profile, loading, refetch]);

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

  if (error && !isRegistered) {
    return (
      <PageContainer tag="div" maxWidth="editorial" className="py-20">
        <ErrorState
          category={categorizeError(error)}
          error={error}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  if (!isRegistered) {
    return (
      <PageContainer tag="div" maxWidth="full" className="px-0 py-0">
        <RegisterScreenLayout introVariant="profile" title="Let's get you started">
          <RegisterWizard />
        </RegisterScreenLayout>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer
        tag="div"
        maxWidth="editorial"
        className={PAGE_CONTAINER_LOADING_CLASS}
      >
        <div className="flex flex-col items-center gap-6">
          <Loader size="lg" text="Refreshing profile…" />
          {isRegistered ? (
            <button
              type="button"
              onClick={() => {
                profileRecoveryRefetchDone.current = false;
                void refetch();
              }}
              className="text-sm font-semibold text-zap-brand underline decoration-zap-brand/45 underline-offset-4 transition-opacity hover:opacity-80"
            >
              Try again
            </button>
          ) : null}
        </div>
      </PageContainer>
    );
  }

  return (
    <div
      tabIndex={-1}
      className="min-h-screen focus:outline-none"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="w-full min-w-0 space-y-8 py-8">
        <ProfileHeroSummary profile={profile} />
        <p className="max-w-3xl font-body text-sm leading-relaxed text-zap-ink-muted">
          This is your private dashboard: contract tips (zaps), on-chain balance, and recent supporter
          messages. Fans use your{" "}
          <Link
            to={`/@${profile.username}`}
            className="font-semibold text-zap-brand underline decoration-zap-brand/40 underline-offset-2"
          >
            public page
          </Link>{" "}
          to tip, buy unlocks, or pay-to-ask — without seeing your tip totals here.
        </p>
        <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
          <div className="min-w-0 space-y-8">
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted">
                    Activity
                  </p>
                  <h3 className="font-body text-[13px] font-semibold uppercase tracking-[0.06em] text-zap-ink">
                    Recent tips (zaps)
                  </h3>
                  <p className="mt-1 max-w-xl text-xs text-zap-ink-faint">
                    On-chain zaps only — unlock and pay-to-ask activity lives on your public page and
                    in Terminal.
                  </p>
                </div>
                <Link
                  to="/network"
                  className="text-sm font-medium text-zap-brand underline decoration-zap-brand/40 underline-offset-4 transition-opacity hover:opacity-80"
                >
                  View network
                </Link>
              </div>
              <div className="rounded-3xl border border-zap-bg-alt bg-zap-surface p-1 shadow-none sm:p-4">
                <ActivityFeed address={profile.owner} limit={5} />
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="rounded-3xl border border-zap-bg-alt bg-zap-surface p-5 shadow-none">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted">
                Quick actions
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zap-ink-faint">
                Unlocks and clone tools are in Terminal.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  to="/profile/edit"
                  className="btn-editorial-ghost btn-editorial-ghost--compact font-body inline-flex w-full items-center justify-center gap-2 no-underline sm:justify-start"
                >
                  <PenSquare size={16} className="shrink-0 opacity-80 font-body " aria-hidden />
                  Edit profile
                </Link>
                <Link
                  to="/terminal"
                  className="btn-editorial-ghost btn-editorial-ghost--compact inline-flex w-full items-center justify-center gap-2 no-underline sm:justify-start"
                >
                  Creator terminal
                </Link>
                <Link
                  to="/terminal/history"
                  className="btn-editorial-ghost btn-editorial-ghost--compact inline-flex w-full items-center justify-center gap-2 no-underline sm:justify-start"
                >
                  My purchases
                </Link>
                <button
                  type="button"
                  disabled={!hasPositiveBalance(profile.balance)}
                  onClick={() => setIsWithdrawModalOpen(true)}
                  className="btn-editorial-ghost btn-editorial-ghost--compact inline-flex w-full items-center justify-center gap-2 disabled:pointer-events-none disabled:opacity-45 sm:justify-start"
                >
                  <Wallet2 size={16} className="shrink-0 opacity-80" aria-hidden />
                  Withdraw tips
                </button>
                <Link
                  to={`/@${profile.username}`}
                  className="btn-editorial-ghost btn-editorial-ghost--compact inline-flex w-full items-center justify-center gap-2 no-underline sm:justify-start"
                >
                  <span>Public creator page</span>
                  <ExternalLink size={16} className="shrink-0 opacity-70" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-500/25 dark:bg-amber-950/25">
            <h3 className="font-body text-[13px] font-semibold uppercase tracking-[0.06em] text-zap-ink">
                Visibility tip
              </h3>
              <p className="mt-2 text-pretty text-xs leading-relaxed text-zap-ink-muted md:text-sm">
                A clear bio, X handle, and published unlocks help fans know how to support you.
              </p>
            </div>
          </aside>
        </div>

        <WithdrawModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          balance={profile.balance}
          feeBps={feeBps}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
