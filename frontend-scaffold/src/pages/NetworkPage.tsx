import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import DashboardTabPageHeader from "@/components/dashboard/DashboardTabPageHeader";
import ErrorState from "@/components/feedback/ErrorState";
import { env } from "@/config/env";
import { useOpenWalletConnect } from "@/components/wallet/WalletConnectModal";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNetwork } from "@/hooks/useNetwork";
import { useWallet } from "@/hooks";
import { useProfileStore } from "@/state/profileStore";
import { NetworkListSkeleton } from "@/sections/network/NetworkSkeleton";
import NetworkToolbar from "@/sections/network/NetworkToolbar";
import Podium from "@/sections/network/Podium";
import NetworkTable from "@/sections/network/NetworkTable";
import {
  NETWORK_EMPTY_BOARD_BODY,
  NETWORK_EMPTY_BOARD_EYEBROW,
  NETWORK_EMPTY_BOARD_TITLE,
  networkSharePagePath,
} from "@/content/networkBoardEmpty";
import { categorizeError } from "@/utils/error";
import {
  NETWORK_TAB_PANEL_PAD,
} from "@/sections/network/networkPageInner";
import {
  filterNetworkByPeriod,
  type NetworkPeriod,
} from "@/utils/networkPeriod";

const mainSurfaceClass =
  "min-h-screen min-w-0 overflow-x-hidden focus:outline-none";

const NetworkPage: React.FC = () => {
  usePageTitle("NETWORK — ZAP402");
  const profile = useProfileStore((s) => s.profile);
  const isRegistered = useProfileStore((s) => s.isRegistered);
  const { connected, publicKey } = useWallet();
  const openWalletConnect = useOpenWalletConnect();
  const { entries, loading, error, refetch } = useNetwork();
  const [period, setPeriod] = useState<NetworkPeriod>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const sortedFiltered = useMemo(() => {
    const filtered = filterNetworkByPeriod(entries, period);
    return [...filtered].sort((a, b) => {
      const diff = BigInt(b.totalTipsReceived) - BigInt(a.totalTipsReceived);
      if (diff > 0n) return 1;
      if (diff < 0n) return -1;
      return 0;
    });
  }, [entries, period]);

  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedFiltered;
    return sortedFiltered.filter((e) => {
      const pretty = e.username
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .toLowerCase();
      return (
        e.username.toLowerCase().includes(q) ||
        pretty.includes(q) ||
        e.address.toLowerCase().includes(q)
      );
    });
  }, [sortedFiltered, searchQuery]);

  const topThree = searchFiltered.slice(0, 3);
  const rest = searchFiltered.slice(3);

  const rpcStatusAction = env.contractConfigured ? (
    <div className="flex flex-wrap items-center justify-end gap-3 font-mono text-[10px] font-normal uppercase tracking-[0.1em] md:gap-4">
      <span className="text-zap-teal">● LIVE_RPC</span>
      <span className="text-zap-ink-faint">·</span>
      <span className="text-zap-teal">✓ SYNCED</span>
    </div>
  ) : (
    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-zap-ink-muted">
      ● CONTRACT_NOT_CONFIGURED
    </span>
  );

  const initialLoading = loading && entries.length === 0 && !error;

  return (
    <div
      tabIndex={-1}
      className={mainSurfaceClass}
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="w-full min-w-0 space-y-8 py-8 pb-24 md:pb-10">
        <div className="kofi-dashboard-card kofi-dashboard-card--shell min-w-0 overflow-hidden p-1 shadow-none">
          <div className={`space-y-8 ${NETWORK_TAB_PANEL_PAD}`}>
            <DashboardTabPageHeader
              kicker="Explore / Network"
              title="Network"
              description="Top earners by zap volume. Live rows from the Zap402 Soroban contract. USDC-style amounts in the UI."
              action={rpcStatusAction}
            />

            {error ? (
              <ErrorState
                category={categorizeError(error)}
                error={error}
                onRetry={refetch}
              />
            ) : (
              <>
                <NetworkToolbar
                  period={period}
                  onPeriodChange={setPeriod}
                  totalCreators={searchFiltered.length}
                  isLoading={initialLoading}
                />

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="network-creator-search"
                      className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-zap-ink-muted"
                    >
                      Search creator
                    </label>
                    <input
                      id="network-creator-search"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by handle or name"
                      autoComplete="off"
                      disabled={initialLoading}
                      className="h-12 w-full rounded-xl border-2 border-zap-bg-alt bg-zap-surface px-4 font-mono text-sm text-zap-ink placeholder:text-zap-ink-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-zap-brand focus-visible:ring-offset-2 focus-visible:ring-offset-zap-bg disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {initialLoading ? (
                    <NetworkListSkeleton />
                  ) : searchFiltered.length === 0 ? (
                    <div className="group kofi-dashboard-card mx-auto max-w-lg p-6 text-center shadow-none transition-[border-color,background-color] duration-200 ease-out md:p-8 hover:border-zap-bg-alt-bright">
                      {sortedFiltered.length > 0 && searchQuery.trim() ? (
                        <>
                          <h2 className="font-body text-xl font-normal uppercase tracking-tight text-zap-ink md:text-3xl">
                            No match
                          </h2>
                          <p className="mx-auto mt-4 max-w-md font-body text-[13px] leading-relaxed text-zap-ink-muted">
                            No creators match your search. Try another handle or clear the field.
                          </p>
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="btn-ghost mt-6 inline-flex min-w-[200px] justify-center"
                          >
                            Clear search
                          </button>
                        </>
                      ) : entries.length > 0 && (period === "week" || period === "month") ? (
                        <>
                          <p className="font-body text-[10px] uppercase tracking-[0.2em] text-zap-ink-muted">
                            // FILTER
                          </p>
                          <h2 className="mt-2 font-body text-xl font-normal uppercase tracking-tight text-zap-ink md:text-4xl">
                            No rows this period
                          </h2>
                          <p className="mx-auto mt-6 max-w-md font-body text-[13px] leading-[1.85] text-zap-ink-muted">
                            The on-chain board has creators, but none match this time window. Switch to
                            ALL TIME or try again later.
                          </p>
                          <div className="mt-8 flex justify-center">
                            <button
                              type="button"
                              onClick={() => setPeriod("all")}
                              className="btn-primary inline-flex min-w-[200px] justify-center"
                            >
                              ALL TIME
                            </button>
                          </div>
                        </>
                      ) : !env.contractConfigured ? (
                        <>
                          <p className="font-body text-[10px] uppercase tracking-[0.2em] text-zap-ink-muted">
                            RPC_CONFIG
                          </p>
                          <h2 className="mt-2 font-body text-xl font-normal uppercase tracking-tight text-zap-ink md:text-4xl">
                            RPC: CONTRACT_NOT_CONFIGURED
                          </h2>
                          <p className="mx-auto mt-6 max-w-md font-body text-[13px] leading-[1.85] text-zap-ink-muted">
                            Set{" "}
                            <code className="font-mono text-[12px] text-zap-brand">VITE_CONTRACT_ID</code> in{" "}
                            <code className="font-mono text-[12px]">frontend-scaffold/.env</code>. Restart
                            Vite.
                          </p>
                          <div className="mt-8 flex justify-center">
                            <Link
                              to="/"
                              className="btn-primary inline-flex min-w-[200px] justify-center no-underline"
                            >
                              HOME
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-body text-[10px] uppercase tracking-[0.2em] text-zap-ink-muted">
                            {NETWORK_EMPTY_BOARD_EYEBROW}
                          </p>
                          <h2 className="mt-2 font-body text-xl font-normal uppercase tracking-tight text-zap-ink md:text-4xl">
                            {NETWORK_EMPTY_BOARD_TITLE}
                          </h2>
                          <p className="mx-auto mt-6 max-w-md font-body text-[13px] leading-[1.85] text-zap-ink-muted">
                            {NETWORK_EMPTY_BOARD_BODY}
                          </p>
                          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
                            {connected ? (
                              <>
                                <Link
                                  to={networkSharePagePath(
                                    profile?.username,
                                    isRegistered,
                                  )}
                                  className="btn-primary inline-flex w-full min-w-[200px] max-w-xs justify-center font-body no-underline sm:w-auto"
                                >
                                  SHARE PAGE
                                </Link>
                                <Link
                                  to="/terminal"
                                  className="btn-ghost inline-flex w-full min-w-[200px] font-body max-w-xs justify-center no-underline sm:w-auto"
                                >
                                  ACCESS TERMINAL
                                </Link>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openWalletConnect()}
                                className="btn-primary inline-flex w-full min-w-[200px] font-body max-w-xs justify-center sm:w-auto"
                              >
                                CONNECT WALLET
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <Podium creators={topThree} viewerPublicKey={publicKey} />
                      <NetworkTable entries={rest} viewerPublicKey={publicKey} />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkPage;
