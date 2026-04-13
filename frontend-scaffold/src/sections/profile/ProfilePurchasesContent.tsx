import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

import ErrorState from "@/components/feedback/ErrorState";
import Loader from "@/components/primitives/Loader";
import Avatar from "@/components/primitives/Avatar";
import { UnlockRevealedContent } from "@/components/unlock/UnlockCard";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { getFanAskRequests } from "@/services/ask.service";
import {
  getBuyerUnlockLibrary,
  getProfileUnlockItems,
  type BuyerUnlockRow,
} from "@/services/unlock.service";
import { ASK_REQUEST_TYPES } from "@/constants/askRequestTypes";
import type { Profile } from "@/types/contract";
import type { AskRequest } from "@/types/ask.types";
import type { UnlockItem } from "@/types/unlock.types";
import { categorizeError } from "@/utils/error";
import { stellarExpertAccountUrl, truncateAddress } from "@/utils/format";
import { getExplorerTxUrl } from "@/utils/network";
import { useWalletStore } from "@/state/walletStore";

function formatPurchaseWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export interface ProfilePurchasesContentProps {
  /** When true, omit page-level header and back link (embedded in Settings). */
  embedded?: boolean;
}

/**
 * Fan unlock library — shared by Settings and any full-page purchases route.
 */
const ProfilePurchasesContent: React.FC<ProfilePurchasesContentProps> = ({
  embedded = false,
}) => {
  const { publicKey } = useWallet();
  const network = useWalletStore((s) => s.network);
  const { getProfile } = useContract();
  const [rows, setRows] = useState<BuyerUnlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemDetails, setItemDetails] = useState<Record<string, UnlockItem>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [openPurchaseId, setOpenPurchaseId] = useState<string | null>(null);
  const [askRows, setAskRows] = useState<AskRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"requests" | "content">("requests");

  useEffect(() => {
    if (!publicKey) {
      Promise.resolve().then(() => {
        setRows([]);
        setLoading(false);
      });
      return;
    }
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });
    getBuyerUnlockLibrary(publicKey)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  useEffect(() => {
    if (!publicKey) {
      Promise.resolve().then(() => setAskRows([]));
      return;
    }
    let cancelled = false;
    getFanAskRequests(publicKey)
      .then((data) => {
        if (!cancelled) setAskRows(data);
      })
      .catch(() => {
        if (!cancelled) setAskRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  const creatorAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      set.add(r.purchase.creatorAddress);
    }
    return [...set];
  }, [rows]);

  const [creatorByAddress, setCreatorByAddress] = useState<
    Record<string, Profile | null>
  >({});
  useEffect(() => {
    if (creatorAddresses.length === 0) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, Profile | null> = {};
      await Promise.all(
        creatorAddresses.map(async (addr) => {
          try {
            map[addr] = await getProfile(addr);
          } catch {
            map[addr] = null;
          }
        }),
      );
      if (!cancelled) setCreatorByAddress(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [creatorAddresses, getProfile]);

  useEffect(() => {
    if (!publicKey || creatorAddresses.length === 0) {
      Promise.resolve().then(() => setItemDetails({}));
      return;
    }
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setDetailsLoading(true);
    });
    Promise.all(
      creatorAddresses.map((addr) => getProfileUnlockItems(addr, publicKey)),
    )
      .then((arrays) => {
        if (cancelled) return;
        const map: Record<string, UnlockItem> = {};
        for (const arr of arrays) {
          for (const it of arr) {
            map[it.id] = it;
          }
        }
        setItemDetails(map);
      })
      .catch(() => {
        if (!cancelled) setItemDetails({});
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [publicKey, creatorAddresses]);

  if (!publicKey) {
    return (
      <p className="font-body text-sm text-zap-ink-muted">
        Connect your wallet to see purchases.
      </p>
    );
  }

  if (loading) {
    return <Loader size="sm" text="Loading purchases…" />;
  }

  if (error) {
    return (
      <ErrorState
        category={categorizeError(error)}
        error={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          void getBuyerUnlockLibrary(publicKey)
            .then(setRows)
            .catch((e) =>
              setError(e instanceof Error ? e.message : String(e)),
            )
            .finally(() => setLoading(false));
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {!embedded ? (
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-zap-brand" aria-hidden />
            <h2 className="font-body text-xl font-semibold tracking-tight text-zap-ink">
              My purchases
            </h2>
          </div>
          <p className="max-w-2xl text-pretty text-sm font-medium leading-relaxed text-zap-ink-muted">
            Your full history of paid requests and unlocked content.
          </p>
        </header>
      ) : null}

      <div className="rounded-2xl border border-[var(--card-border-soft)] bg-zap-bg/20 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${activeTab === "requests"
              ? "bg-zap-brand text-white"
              : "text-zap-ink-muted hover:bg-zap-bg-alt"
              }`}
          >
            Requests
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${activeTab === "content"
              ? "bg-zap-brand text-white"
              : "text-zap-ink-muted hover:bg-zap-bg-alt"
              }`}
          >
            Content
          </button>
        </div>
      </div>

      {activeTab === "requests" ? (
        askRows.length === 0 ? (
          <div className="kofi-dashboard-card p-6 text-sm text-zap-ink-muted shadow-none md:p-8">
            <p className="font-body font-semibold text-zap-ink">No requests yet</p>
            <p className="mt-2 text-pretty leading-relaxed">
              Paid requests sent to agents will appear here after checkout.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {askRows
              .slice()
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .map((request) => {
                const txUrl = request.txHash
                  ? getExplorerTxUrl(request.txHash, network)
                  : null;
                const requestType = ASK_REQUEST_TYPES.find((t) => t.id === request.type);
                const requestLabel = requestType?.label ?? request.type;
                return (
                  <li key={request.requestId} className="kofi-dashboard-card shadow-none">
                    <div className="space-y-3 p-5 md:p-6">
                      <h3 className="font-body text-lg font-semibold tracking-tight text-zap-ink">
                        {requestLabel}
                      </h3>
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="font-mono font-semibold tabular-nums text-zap-brand">
                          {request.price.toFixed(2)} USDC
                        </span>
                        <span className="text-zap-ink-faint" aria-hidden>
                          ·
                        </span>
                        <time dateTime={request.updatedAt} className="text-zap-ink-muted">
                          {formatPurchaseWhen(request.updatedAt)}
                        </time>
                      </p>
                      <p className="text-sm leading-relaxed text-zap-ink-muted">
                        {request.messageText || "—"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {txUrl ? (
                          <a
                            href={txUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nav-editorial-cta inline-flex min-h-10 items-center gap-2 px-4 py-2 text-xs font-semibold normal-case tracking-normal no-underline"
                          >
                            View transaction
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                          </a>
                        ) : null}
                        <span className="rounded-full border border-[var(--card-border-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zap-ink-faint">
                          {request.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        )
      ) : rows.length === 0 ? (
        <div className="kofi-dashboard-card p-6 text-sm text-zap-ink-muted shadow-none md:p-8">
          <p className="font-body font-semibold text-zap-ink">No purchases yet</p>
          <p className="mt-2 text-pretty leading-relaxed">
            When you unlock content from an agent page, it appears here after the payment
            confirms on-chain.
          </p>
          <Link
            to="/terminal/discover"
            className="mt-4 inline-flex text-sm font-semibold text-zap-brand underline decoration-zap-brand/40 underline-offset-4"
          >
            Browse agents
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map(({ purchase, item }) => {
            const txUrl = purchase.txHash
              ? getExplorerTxUrl(purchase.txHash, network)
              : null;
            const fullItem = itemDetails[purchase.unlockItemId];
            const isOpen = openPurchaseId === purchase.id;
            const creatorAddr = purchase.creatorAddress;
            const creatorProfile = creatorByAddress[creatorAddr];
            const explorerAccount = stellarExpertAccountUrl(creatorAddr, network);
            const title =
              item?.title?.trim() ||
              `Content · ${truncateAddress(purchase.unlockItemId, 4)}`;
            const creatorInitials =
              creatorProfile?.displayName?.slice(0, 2) ||
              creatorProfile?.username?.slice(0, 2) ||
              "CR";

            return (
              <li key={purchase.id} className="kofi-dashboard-card shadow-none">
                <div className="p-5 md:p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-body text-lg font-semibold tracking-tight text-zap-ink">
                        {title}
                      </h3>
                      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="font-mono font-semibold tabular-nums text-zap-brand">
                          {purchase.amount.toFixed(2)} USDC
                        </span>
                        <span className="text-zap-ink-faint" aria-hidden>
                          ·
                        </span>
                        <time
                          dateTime={purchase.purchasedAt}
                          className="text-zap-ink-muted"
                        >
                          {formatPurchaseWhen(purchase.purchasedAt)}
                        </time>
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <Avatar
                        address={creatorAddr}
                        src={creatorProfile?.imageUrl || undefined}
                        alt={
                          creatorProfile?.displayName ||
                          creatorProfile?.username ||
                          "Creator"
                        }
                        fallback={creatorInitials}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        {creatorProfile === undefined ? (
                          <p className="text-sm text-zap-ink-muted">
                            Loading agent…
                          </p>
                        ) : creatorProfile ? (
                          <>
                            <Link
                              to={`/@${creatorProfile.username}`}
                              className="font-body text-base font-semibold text-zap-ink hover:underline"
                            >
                              {creatorProfile.displayName || creatorProfile.username}
                            </Link>
                            <p className="font-mono text-sm text-zap-ink-muted">
                              @{creatorProfile.username}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-body text-sm font-medium text-zap-ink">
                              Creator
                            </p>
                            <p className="mt-0.5 break-all font-mono text-xs text-zap-ink-muted">
                              {truncateAddress(creatorAddr, 5)}
                            </p>
                            <a
                              href={explorerAccount}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-zap-brand no-underline hover:opacity-90"
                            >
                              Account on explorer
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[var(--card-border-soft)] pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        {txUrl ? (
                          <a
                            href={txUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nav-editorial-cta inline-flex min-h-10 items-center gap-2 px-4 py-2 text-xs font-semibold normal-case tracking-normal no-underline"
                          >
                            View transaction
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                          </a>
                        ) : (
                          <span className="font-mono text-[11px] text-zap-ink-muted">
                            On-chain receipt pending
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenPurchaseId(isOpen ? null : purchase.id)
                        }
                        aria-expanded={isOpen}
                        aria-controls={`purchase-detail-${purchase.id}`}
                        id={`purchase-trigger-${purchase.id}`}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-zap-bg-alt bg-zap-bg-alt px-4 font-body text-sm font-semibold text-zap-ink transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-overlay sm:ml-auto sm:w-auto"
                      >
                        {isOpen ? "Hide content" : "View unlocked content"}
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""
                            }`}
                          aria-hidden
                        />
                      </button>
                    </div>
                  </div>

                  {isOpen ? (
                    <div
                      id={`purchase-detail-${purchase.id}`}
                      role="region"
                      aria-labelledby={`purchase-trigger-${purchase.id}`}
                      className="mt-4 border-t border-[var(--card-border-soft)] pt-4"
                    >
                      {detailsLoading ? (
                        <Loader size="sm" text="Loading content…" />
                      ) : fullItem ? (
                        <div className="space-y-4">
                          {fullItem.description ? (
                            <p className="text-pretty text-sm font-medium leading-relaxed text-zap-ink-muted">
                              {fullItem.description}
                            </p>
                          ) : null}
                          <UnlockRevealedContent
                            item={fullItem}
                            viewerAddress={publicKey}
                          />
                        </div>
                      ) : (
                        <p className="text-pretty text-sm font-medium text-zap-ink-muted">
                          Full content isn&apos;t available for this item (it may have been removed
                          or the listing changed). Your payment record above still applies.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!embedded ? (
        <p className="font-body text-xs text-zap-ink-faint">
          <Link
            to="/terminal/profile"
            className="font-semibold text-zap-brand underline decoration-zap-brand/40 underline-offset-2"
          >
            ← Back to home
          </Link>
        </p>
      ) : null}
    </div>
  );
};

export default ProfilePurchasesContent;
