import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import ErrorState from "@/components/feedback/ErrorState";
import WalletConnect from "@/components/wallet/WalletConnect";
import EmptyState from "@/components/primitives/EmptyState";
import Loader from "@/components/primitives/Loader";
import Tabs, { type TabItem } from "@/components/primitives/Tabs";
import { categorizeError } from "@/utils/error";
import { useTerminal } from "@/hooks/useTerminal";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useProfileStore } from "@/state/profileStore";
import { useWalletStore } from "@/state/walletStore";
import { useChatStore } from "@/state/chatStore";
import DashboardHomePanel from "@/sections/dashboard/DashboardHomePanel";
import SettingsTab from "@/sections/dashboard/SettingsTab";
import PurchasesTab from "@/sections/dashboard/PurchasesTab";
import WithdrawModal from "@/sections/dashboard/WithdrawModal";
import FeedPage from "@/pages/FeedPage";
import SearchPage from "@/pages/SearchPage";
import TerminalChatPage from "@/pages/TerminalChatPage";
import {
  isTerminalSectionSlug,
  TERMINAL_DEFAULT_PATH,
  TERMINAL_LEGACY_SLUG_REDIRECT,
  TERMINAL_NAV,
  terminalSlugToTabId,
  terminalTabIdToSlug,
} from "@/constants/terminalNav";

const mainSurfaceClass =
  "min-h-screen min-w-0 overflow-x-hidden focus:outline-none";

const TerminalPage: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();

  const { connected, publicKey } = useWalletStore();
  const storeProfile = useProfileStore((s) => s.profile);
  const isRegisteredStore = useProfileStore((s) => s.isRegistered);
  const { profile: dashProfile, loading, error, stats, refetch, tips } = useTerminal();
  const { setActiveChat } = useChatStore();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const storeMatchesWallet =
    !!publicKey && !!storeProfile && storeProfile.owner === publicKey;
  const profile =
    dashProfile ??
    (isRegisteredStore && storeMatchesWallet ? storeProfile : null);

  const legacyTarget =
    section && section in TERMINAL_LEGACY_SLUG_REDIRECT
      ? TERMINAL_LEGACY_SLUG_REDIRECT[section as keyof typeof TERMINAL_LEGACY_SLUG_REDIRECT]
      : null;

  const navLabel = useMemo(() => {
    if (!section || (!isTerminalSectionSlug(section) && !legacyTarget)) return "Terminal";
    const slug = legacyTarget ?? section;
    const tabId = terminalSlugToTabId(slug);
    return TERMINAL_NAV.find((n) => n.tabId === tabId)?.label ?? "Terminal";
  }, [section, legacyTarget]);

  usePageTitle(`${navLabel} — Terminal — Zap402`);

  if (legacyTarget) {
    return <Navigate to={`/terminal/${legacyTarget}`} replace />;
  }

  if (!section || !isTerminalSectionSlug(section)) {
    return <Navigate to={TERMINAL_DEFAULT_PATH} replace />;
  }

  const activeTabId = terminalSlugToTabId(section);

  const terminalHeroFooter = (p: typeof profile) =>
    p ? (
      <div className="flex w-full max-w-full flex-col items-center gap-4">
        <div className="max-w-full space-y-0.5 px-1 text-center">
          <p className="font-body text-[13px] text-zap-ink-muted">
            Session:{" "}
            <span className="text-zap-ink">
              {p.displayName || `@${p.username}`}
            </span>
          </p>
          <p className="font-body text-[11px] text-zap-ink-muted">
            @{p.username}
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/terminal/profile"
              className="btn-editorial-ghost btn-editorial-ghost--compact inline-flex items-center gap-2 no-underline normal-case tracking-normal"
            >
              Home
            </Link>
            <Link
              to="/profile/edit"
              className="btn-editorial-ghost btn-editorial-ghost--compact font-body inline-flex items-center gap-2 no-underline normal-case tracking-normal"
            >
              Edit profile
            </Link>
            <Link
              to="/terminal/history"
              className="btn-editorial-ghost btn-editorial-ghost--compact inline-flex items-center gap-2 no-underline normal-case tracking-normal"
            >
              My purchases
            </Link>
            <Link
              to={`/@${p.username}`}
              className="btn-editorial-ghost btn-editorial-ghost--compact inline-flex items-center gap-2 no-underline"
            >
              <span>Public page</span>
              <span aria-hidden>↗</span>
            </Link>
          </div>
          <WalletConnect
            editorial
            hideCreditBadge
            className="items-center justify-center sm:mx-auto lg:mx-0"
          />
        </div>
      </div>
    ) : (
      <div className="flex justify-center">
        <WalletConnect editorial className="shrink-0" />
      </div>
    );

  if (!connected) {
    return <Navigate to="/" replace />;
  }

  if (loading && !profile) {
    return (
      <div
        tabIndex={-1}
        className={mainSurfaceClass}
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <div className="flex min-h-[60vh] items-center justify-center py-10">
          <Loader size="lg" text="Loading workspace…" />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div
        tabIndex={-1}
        className={mainSurfaceClass}
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <div className="w-full min-w-0 space-y-8 py-10">
          {terminalHeroFooter(null)}
          <ErrorState
            category={categorizeError(error)}
            error={error}
            onRetry={refetch}
          />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        tabIndex={-1}
        className={mainSurfaceClass}
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <div className="w-full min-w-0 space-y-8 py-10">
          {terminalHeroFooter(null)}
          <EmptyState
            title="Create your profile"
            description="One quick sign-up deploys your on-chain agent page."
          />
          <div className="flex justify-center">
            <Link
              to="/register"
              className="btn-editorial-primary inline-flex justify-center px-8 text-center normal-case tracking-normal"
            >
              Create your page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const creator = profile;
  const zapLink = `${window.location.origin}/@${creator.username}`;

  const tabPanelPad = "px-1 pb-6 pt-5 md:px-4";
  /** Aligns all terminal panels with Search / Feed column width. */
  const tabPanelShell = "mx-auto w-full max-w-[680px]";

  const homeDashboard = (
    <div className={`space-y-8 ${tabPanelPad} ${tabPanelShell}`}>
      <DashboardHomePanel
        profile={creator}
        tips={tips}
        zapLink={zapLink}
        onWithdraw={() => setWithdrawOpen(true)}
        feeBps={stats?.feeBps ?? 200}
      />
    </div>
  );

  const panelOnly = (panel: React.ReactNode) => (
    <div className={`space-y-8 ${tabPanelPad} ${tabPanelShell}`}>{panel}</div>
  );

  const tabs: TabItem[] = TERMINAL_NAV.map((item) => {
    const Icon = item.icon;
    const content = (() => {
      switch (item.tabId) {
        case "home":
          return homeDashboard;
        case "config":
          return panelOnly(

            <SettingsTab profile={creator} />
          );
        case "purchases":
          return panelOnly(

            <PurchasesTab />
          );
        case "search":
          return panelOnly(

            <SearchPage />
          );
        case "chat":
          return panelOnly(
            <TerminalChatPage />
          );
        case "feed":
          return panelOnly(
            <FeedPage />
          );
        default:
          return homeDashboard;
      }
    })();
    return {
      id: item.tabId,
      label: item.label,
      icon: (
        <Icon
          size={16}
          strokeWidth={1.75}
          className="shrink-0 opacity-80"
          aria-hidden
        />
      ),
      content,
    };
  });

  return (
    <div
      tabIndex={-1}
      className={mainSurfaceClass}
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="w-full h-full">
        <div className="grid min-w-0 gap-8 lg:items-start">
          <div className="min-w-0">
            <div className="kofi-dashboard-card kofi-dashboard-card--shell min-w-0 overflow-hidden p-1 shadow-none">
              <Tabs
                tabs={tabs}
                activeTab={activeTabId}
                onTabChange={(id) => {
                  navigate(`/terminal/${terminalTabIdToSlug(id)}`);
                }}
                tabListWrapperClassName="md:hidden"
                variant="editorial"
              />
            </div>
          </div>
        </div>

        <WithdrawModal
          isOpen={withdrawOpen}
          balance={creator.balance}
          feeBps={stats?.feeBps ?? 200}
          onClose={() => setWithdrawOpen(false)}
        />
      </div>
    </div>
  );
};

export default TerminalPage;
