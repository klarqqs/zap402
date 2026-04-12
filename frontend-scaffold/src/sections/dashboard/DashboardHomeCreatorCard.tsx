import React, { useCallback, useState } from "react";
import { ExternalLink } from "lucide-react";

import Avatar from "@/components/primitives/Avatar";
import { useToastStore } from "@/state/toastStore";
import { useWalletStore } from "@/state/walletStore";
import { stellarExpertAccountUrl, truncateAddress } from "@/utils/format";
import type { Profile } from "@/types/contract";

function displayInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export interface DashboardHomeCreatorCardProps {
  profile: Profile;
}

/**
 * Ko-fi–style profile summary: avatar, identity, metric row, soft CTAs.
 */
const DashboardHomeCreatorCard: React.FC<DashboardHomeCreatorCardProps> = ({
  profile,
}) => {
  const profileTags = "Food & Drink, Science & Tech";
  const profileType = /\btag\s*:\s*agent\b/i.test(profile.bio || "")
    ? "Agent"
    : "Creator";
  const network = useWalletStore((s) => s.network);
  const { addToast } = useToastStore();
  const [addrCopied, setAddrCopied] = useState(false);

  const explorerAccount = stellarExpertAccountUrl(profile.owner, network);

  const copyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.owner);
      setAddrCopied(true);
      window.setTimeout(() => setAddrCopied(false), 2000);
    } catch {
      addToast({ message: "Couldn’t copy address.", type: "error", duration: 2500 });
    }
  }, [addToast, profile.owner]);

  return (
    <div className="kofi-dashboard-card overflow-hidden shadow-none">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Avatar
            src={profile.imageUrl}
            alt={profile.displayName}
            size="2xl"
            address={profile.owner}
            fallback={displayInitials(profile.displayName)}
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-body text-2xl font-semibold leading-tight tracking-tight text-zap-ink">
              {profile.displayName}
            </h2>
            <p className="mt-0.5 font-body text-sm text-zap-ink-muted">@{profile.username}</p>
            <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                onClick={() => void copyAddress()}
                title="Click to copy full Stellar address"
                className="font-mono-chain box-border flex min-h-11 w-full min-w-0 max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-zap-bg-alt bg-zap-bg-alt px-2 py-2 text-zap-ink-muted transition-colors hover:border-zap-bg-alt-bright hover:opacity-90 dark:bg-zinc-900/60 sm:px-3"
              >
                <span className="block min-w-0 max-w-full truncate text-center text-[11px] leading-tight sm:text-sm">
                  {addrCopied ? "Copied" : truncateAddress(profile.owner, 6)}
                </span>
              </button>
              <a
                href={explorerAccount}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden rounded-full border-2 border-zap-bg-alt bg-zap-bg-alt/80 px-2 py-2 text-center font-body text-xs font-semibold uppercase tracking-[0.06em] text-zap-ink transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-alt sm:px-3 sm:text-sm sm:normal-case sm:tracking-normal"
              >
                <span className="min-w-0 truncate">View on Explorer</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              </a>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p className="font-body text-xs text-zap-ink-muted">
                Tags: {profileTags}
              </p>
              
            </div>
            <span className="inline-flex items-center rounded-full py-2 font-body text-[10px] font-semibold uppercase tracking-[0.08em] text-zap-ink-muted">
                {profileType}
              </span>
          </div>
        </div>
      </div>

      {profile.bio?.trim() ? (
        <p className="border-t border-[var(--card-border-soft)] px-6 pb-5 pt-4 font-body text-sm leading-relaxed text-zap-ink-muted">
          {profile.bio.trim()}
        </p>
      ) : null}

      <div className="grid grid-cols-2 divide-x divide-[var(--card-border-soft)] border-t border-[var(--card-border-soft)] bg-zap-bg-alt/50">
        <div className="px-4 py-4 text-center sm:px-6">
          <p className="font-body text-xs text-zap-ink-muted">Requests</p>
          <p className="mt-1 font-body text-2xl font-semibold tabular-nums text-zap-ink">
            {profile.totalTipsCount.toLocaleString()}
          </p>
        </div>
        <div className="px-4 py-4 text-center sm:px-6">
          <p className="font-body text-xs text-zap-ink-muted">Credit</p>
          <p className="mt-1 font-body text-2xl font-semibold tabular-nums text-zap-ink">
            {profile.creditScore}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHomeCreatorCard;
