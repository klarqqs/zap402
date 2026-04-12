import React, { useCallback, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import Avatar from "@/components/primitives/Avatar";
import Card from "@/components/primitives/Card";
import CreditBadge from "@/components/creator/CreditBadge";
import CreatorSocialIcons from "@/components/creator/CreatorSocialIcons";
import XHandleLink from "./XHandleLink";
import { useWalletStore } from "@/state/walletStore";
import { collectCreatorSocialLinks } from "@/utils/creatorSocialLinks";
import { stellarExpertAccountUrl, truncateAddress } from "@/utils/format";
import type { Profile } from "@/types/contract";

const zapHeroTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
  color: "var(--color-ink)",
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
};

interface ProfileHeroSummaryProps {
  profile: Profile;
}

/**
 * Terminal profile — single card, ZapPage-style hero, sections separated by divider lines.
 */
const ProfileHeroSummary: React.FC<ProfileHeroSummaryProps> = ({ profile }) => {
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

  const explorerAccount = stellarExpertAccountUrl(profile.owner, network);

  const creatorSocialLinks = useMemo(
    () => collectCreatorSocialLinks(profile.xHandle ?? "", profile.bio ?? ""),
    [profile.xHandle, profile.bio],
  );

  return (
    <Card
      variant="editorial"
      padding="lg"
      className="relative overflow-hidden !p-0 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
    >
      <div className="zap-hero-shimmer pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(45,212,191,0.12),transparent)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(45,212,191,0.08),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zap-bg via-zap-bg to-zap-accent/[0.04] dark:to-zap-bg-alt/30" />

      <div className="relative divide-y divide-[var(--card-border-soft)]">
        {/* Identity */}
        <div className="space-y-4 p-6 text-center md:p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div
                className="absolute -inset-1 rounded-full opacity-90 blur-md"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(45,212,191,0.45), transparent 55%)",
                }}
              />
              <Avatar
                src={profile.imageUrl || undefined}
                address={profile.owner}
                alt={profile.displayName}
                fallback={profile.displayName}
                size="md"
                className="relative ring-2 ring-zap-surface shadow-md"
              />
            </div>
            <h1
              className="mt-0.5 font-semibold text-zap-ink"
              style={{ ...zapHeroTitleStyle, fontSize: "clamp(1.2rem, 3.2vw, 1.6rem)" }}
            >
              {profile.displayName}
            </h1>
            <p className="text-sm font-semibold text-zap-ink-muted">@{profile.username}</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio.trim() ? (
          <div className="px-6 py-4 md:px-8">
            <p className="mx-auto max-w-xl text-center text-sm leading-relaxed text-zap-ink/95">
              {profile.bio.trim()}
            </p>
          </div>
        ) : null}

        {/* Wallet + Explorer */}
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 px-6 py-4 md:px-8">
          <button
            type="button"
            onClick={copyOwner}
            title="Click to copy Stellar address"
            className="font-mono-chain box-border flex min-h-9 min-w-0 max-w-full cursor-pointer items-center rounded-full border border-zap-bg-alt bg-zap-bg-alt/80 px-3 py-1.5 text-[11px] text-zap-ink-muted transition-colors hover:border-zap-bg-alt-bright hover:opacity-90 dark:bg-zinc-900/40"
          >
            {addrCopied ? "Copied" : truncateAddress(profile.owner, 6)}
          </button>
          <a
            href={explorerAccount}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-zap-bg-alt bg-zap-bg-alt/80 px-3 py-1.5 text-[11px] font-semibold text-zap-ink transition-colors hover:border-zap-bg-alt-bright hover:opacity-90"
          >
            View on Explorer
            <ExternalLink className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
          </a>
        </div>

        {/* Social (optional, still inside same card) */}
        {creatorSocialLinks.length > 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-4 sm:flex-row sm:justify-center sm:gap-4 md:px-8">
            <CreatorSocialIcons
              links={creatorSocialLinks}
              xFollowers={profile.xFollowers}
            />
            {profile.xFollowers > 0 && profile.xHandle.trim() ? (
              <span className="text-xs font-medium text-zap-ink-muted">
                {profile.xFollowers.toLocaleString()} followers on X
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Requests | Credit */}
        {/* <div className="grid grid-cols-2 divide-x divide-[var(--card-border-soft)] bg-zap-bg-alt dark:bg-zap-bg/20">
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
        </div> */}

        {/* Footer: X (optional) | Public page • tier */}
        {/* <div className="flex flex-wrap items-center gap-3 px-6 py-4 md:px-8">
          {profile.xHandle.trim() ? (
            <div className="min-w-0 shrink-0">
              <XHandleLink handle={profile.xHandle} followers={profile.xFollowers} />
            </div>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              to={`/@${profile.username}`}
              className="text-xs font-semibold text-zap-brand underline decoration-zap-brand/40 underline-offset-2 transition-opacity hover:opacity-85"
            >
              Public page
            </Link>
            <span className="text-zap-ink-muted" aria-hidden>
              ●
            </span>
            <CreditBadge score={profile.creditScore} showScore clickable />
          </div>
        </div> */}
      </div>
    </Card>
  );
};

export default ProfileHeroSummary;
