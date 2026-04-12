import React from "react";
import { Link } from "react-router-dom";

import WalletConnect from "@/components/wallet/WalletConnect";
import TerminalHeroSummary from "@/sections/dashboard/TerminalHeroSummary";
import TerminalNextStepBanner from "@/sections/dashboard/TerminalNextStepBanner";
import TerminalSetupSuggestions from "@/sections/dashboard/TerminalSetupSuggestions";
import type { Profile, Tip } from "@/types/contract";

export interface TerminalCreatorContextProps {
  profile: Profile;
  tips: Tip[];
  zapLink: string;
}

/**
 * Session strip + earnings summary + next-step + “Grow your page” — repeated under every Terminal tab
 * so creators always see profile context while switching Overview / Tips / …
 */
const TerminalCreatorContext: React.FC<TerminalCreatorContextProps> = ({
  profile,
  tips,
  zapLink,
}) => {
  return (
    <div className="space-y-8">
      <div className="flex w-full max-w-full flex-col items-center gap-4">
        <div className="max-w-full space-y-0.5 px-1 text-center">
          <p className="font-body text-[13px] text-zap-ink-muted">
            Session:{" "}
            <span className="text-zap-ink">
              {profile.displayName || `@${profile.username}`}
            </span>
          </p>
          <p className="font-body text-[11px] text-zap-ink-muted">@{profile.username}</p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/terminal/profile"
              className="btn-editorial-ghost btn-editorial-ghost--compact inline-flex items-center gap-2 no-underline normal-case tracking-normal"
            >
              Profile
            </Link>
            <Link
              to="/profile/edit"
              className="btn-editorial-ghost btn-editorial-ghost--compact inline-flex items-center gap-2 no-underline normal-case tracking-normal"
            >
              Edit
            </Link>
            <Link
              to="/profile/purchases"
              className="btn-editorial-ghost btn-editorial-ghost--compact inline-flex items-center gap-2 no-underline normal-case tracking-normal"
            >
              Purchases
            </Link>
            <Link
              to={`/@${profile.username}`}
              className="btn-editorial-ghost btn-editorial-ghost--compact inline-flex items-center gap-2 no-underline"
            >
              <span>Public zap page</span>
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

      <TerminalHeroSummary profile={profile} />

      <TerminalNextStepBanner
        username={profile.username}
        zapLink={zapLink}
        tips={tips}
      />

      <TerminalSetupSuggestions zapLink={zapLink} />
    </div>
  );
};

export default TerminalCreatorContext;
