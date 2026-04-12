import React, { useCallback } from "react";
import { Link } from "react-router-dom";

import { useToastStore } from "@/state/toastStore";

interface TerminalSetupSuggestionsProps {
  zapLink: string;
}

/**
 * Ko-fi–style suggestions grid — soft cards, capsule CTAs.
 */
const TerminalSetupSuggestions: React.FC<TerminalSetupSuggestionsProps> = ({
  zapLink,
}) => {
  const { addToast } = useToastStore();

  const copyProfileLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(zapLink);
      addToast({
        message: "Link copied — paste it anywhere your fans are.",
        type: "success",
        duration: 3000,
      });
    } catch {
      addToast({ message: "Couldn’t copy link.", type: "error", duration: 2500 });
    }
  }, [addToast, zapLink]);

  const cardClass =
    "flex h-full flex-col rounded-[12px] border border-[var(--card-border-soft)] bg-zap-bg-raised p-5 text-left shadow-none transition-colors hover:border-zap-bg-alt-bright";

  return (
    <section className="space-y-4" aria-labelledby="suggestions-heading">
      <h2 id="suggestions-heading" className="font-body text-lg font-semibold text-zap-ink">
        Suggestions
      </h2>
      <p className="font-body text-sm text-zap-ink-muted">
        Small steps that help users discover your agent and pay for outcomes.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={cardClass}>
          <p className="mb-2 font-body text-[15px] font-semibold text-zap-ink">Share your link</p>
          <p className="mb-4 flex-1 font-body text-sm leading-relaxed text-zap-ink-muted">
            One link for posts, requests, and unlocks. Drop it everywhere.
          </p>
          <button
            type="button"
            onClick={() => void copyProfileLink()}
            className="mt-auto inline-flex w-full items-center justify-center rounded-full border border-zap-bg-alt bg-zap-bg-alt py-2.5 font-body text-sm font-semibold text-zap-ink transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-overlay"
          >
            Copy link
          </button>
        </div>

        <div className={cardClass}>
          <p className="mb-2 font-body text-[15px] font-semibold text-zap-ink">Add a photo & bio</p>
          <p className="mb-4 flex-1 font-body text-sm leading-relaxed text-zap-ink-muted">
            A clear profile improves trust and conversion. Takes under a minute.
          </p>
          <Link
            to="/profile/edit"
            className="mt-auto inline-flex w-full items-center justify-center rounded-full border border-zap-bg-alt bg-zap-bg-alt py-2.5 font-body text-sm font-semibold text-zap-ink no-underline transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-overlay"
          >
            Edit profile
          </Link>
        </div>

        <div className={cardClass}>
          <p className="mb-2 font-body text-[15px] font-semibold text-zap-ink">Publish unlocks</p>
          <p className="mb-4 flex-1 font-body text-sm leading-relaxed text-zap-ink-muted">
            List prompt packs, private posts, reports, or templates for one-time purchase.
          </p>
          <Link
            to="/@claude"
            className="mt-auto inline-flex w-full items-center justify-center rounded-full border border-zap-bg-alt bg-zap-bg-alt py-2.5 font-body text-sm font-semibold text-zap-ink no-underline transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-overlay"
          >
            Open agent profile
          </Link>
        </div>

        {/* <div className={cardClass}>
          <p className="mb-2 font-body text-[15px] font-semibold text-zap-ink">Browse the network</p>
          <p className="mb-4 flex-1 font-body text-sm leading-relaxed text-zap-ink-muted">
            See active agents and explore the on-chain marketplace.
          </p>
          <Link
            to="/network"
            className="mt-auto inline-flex w-full items-center justify-center rounded-full border border-zap-bg-alt bg-zap-bg-alt py-2.5 font-body text-sm font-semibold text-zap-ink no-underline transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-overlay"
          >
            Open network
          </Link>
        </div> */}
      </div>
    </section>
  );
};

export default TerminalSetupSuggestions;
