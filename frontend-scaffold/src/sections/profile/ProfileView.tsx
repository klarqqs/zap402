import React, { useCallback, useState } from "react";
import { CalendarDays, ExternalLink } from "lucide-react";

import Avatar from "@/components/primitives/Avatar";
import CopyButton from "@/components/primitives/CopyButton";
import CreditBadge from "@/components/creator/CreditBadge";
import AmountDisplay from "@/components/primitives/AmountDisplay";
import XHandleLink from "./XHandleLink";
import { useWalletStore } from "@/state/walletStore";
import {
  stellarExpertAccountUrl,
  truncateAddress,
} from "@/utils/format";
import type { Profile } from "@/types/contract";

interface ProfileViewProps {
  profile: Profile;
}

const statLabel =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted";

/**
 * Creator profile hero + stat strip — editorial shell (matches dashboard / landing).
 */
const ProfileView: React.FC<ProfileViewProps> = ({ profile }) => {
  const network = useWalletStore((s) => s.network);
  const [addrCopied, setAddrCopied] = useState(false);

  const copyOwner = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.owner);
      setAddrCopied(true);
      window.setTimeout(() => setAddrCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [profile.owner]);

  const registeredDate = new Date(profile.registeredAt * 1000).toLocaleDateString(
    undefined,
    {
      month: "long",
      year: "numeric",
    },
  );

  const explorerAccount = stellarExpertAccountUrl(profile.owner, network);

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-zap-bg-alt bg-zap-surface shadow-none">
      <div className="flex flex-col md:flex-row">
        {/* Avatar + tier */}
        <div className="flex shrink-0 flex-col items-center justify-center border-b border-zap-bg-alt bg-gradient-to-b from-zap-success-dim/90 to-zap-bg-raised p-8 dark:from-zap-success-dim dark:to-zap-surface md:w-72 md:border-b-0 md:border-r md:border-zap-bg-alt">
          <Avatar
            src={profile.imageUrl}
            alt={profile.displayName}
            size="2xl"
            address={profile.owner}
            fallback={profile.displayName}
          />
          <div className="mt-6 flex w-full justify-center">
            <CreditBadge score={profile.creditScore} showScore clickable />
          </div>
        </div>

        {/* Identity + bio */}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-6 md:p-8">
          <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="font-body text-3xl font-semibold leading-tight tracking-tight text-zap-ink md:text-4xl">
                  {profile.displayName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-lg font-medium text-zap-ink-muted">
                    @{profile.username}
                  </span>
                  <CopyButton
                    text={profile.username}
                    className="h-8 w-8 !p-0 text-zap-ink-muted hover:text-zap-ink"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 md:gap-4">
                  <button
                    type="button"
                    onClick={copyOwner}
                    title="Click to copy Stellar address"
                    className="font-mono-chain box-border flex max-w-md min-w-0 cursor-pointer items-center rounded-full border-2 border-zap-bg-alt bg-zap-bg-alt px-3 py-1.5 text-sm text-zap-ink-muted transition-colors hover:border-zap-bg-alt-bright hover:opacity-90 dark:bg-zinc-900/60"
                  >
                    {addrCopied ? "Copied" : truncateAddress(profile.owner, 6)}
                  </button>
                  <span className="text-xs font-medium text-zap-ink-muted">
                    {profile.totalTipsCount}{" "}
                    {profile.totalTipsCount === 1 ? "zap" : "zaps"} received
                  </span>
                  <a
                    href={explorerAccount}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zap-brand underline decoration-zap-brand/40 underline-offset-2 transition-opacity hover:opacity-85"
                  >
                    View on Explorer
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                  </a>
                </div>
              </div>
              <div className="inline-flex h-fit shrink-0 items-center gap-2 rounded-full border border-zap-bg-alt bg-zap-bg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zap-ink-muted">
                <CalendarDays size={14} className="opacity-80" aria-hidden />
                Joined {registeredDate}
              </div>
            </div>

            <p className="border-l-2 border-zap-bg-alt/35 pl-4 text-base font-medium leading-relaxed text-zap-ink">
              {profile.bio || "No bio yet — add one from Edit profile."}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-zap-bg-alt pt-6">
            <XHandleLink handle={profile.xHandle} followers={profile.xFollowers} />
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 border-t border-zap-bg-alt bg-zap-bg/40 dark:bg-zap-bg/20 md:grid-cols-4">
        <div className="border-b border-zap-bg-alt p-5 transition-colors hover:bg-zap-bg-alt/60 md:border-b-0 md:border-r">
          <p className={statLabel}>Total tips</p>
          <AmountDisplay
            amount={profile.totalTipsReceived}
            className="mt-2 block font-body text-xl font-semibold md:text-2xl"
          />
        </div>
        <div className="border-b border-zap-bg-alt p-5 transition-colors hover:bg-zap-bg-alt/60 md:border-b-0 md:border-r md:border-zap-bg-alt">
          <p className={statLabel}>Tip count</p>
          <p className="mt-2 font-body text-2xl font-semibold tabular-nums text-zap-ink md:text-3xl">
            {profile.totalTipsCount}
          </p>
        </div>
        <div className="border-r border-zap-bg-alt p-5 transition-colors hover:bg-zap-bg-alt/60 md:border-r">
          <p className={statLabel}>Credit score</p>
          <p className="mt-2 font-body text-2xl font-semibold tabular-nums text-zap-ink md:text-3xl">
            {profile.creditScore}
          </p>
        </div>
        <div className="p-5 transition-colors hover:bg-zap-bg-alt/60">
          <p className={statLabel}>Balance</p>
          <AmountDisplay
            amount={profile.balance}
            className="mt-2 block font-body text-xl font-semibold md:text-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
