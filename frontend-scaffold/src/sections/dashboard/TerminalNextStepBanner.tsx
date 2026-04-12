import React, { useCallback, useState } from "react";
import { Copy, X } from "lucide-react";

import { env } from "@/config/env";
import { useToastStore } from "@/state/toastStore";
import type { Tip } from "@/types/contract";

const STORAGE_KEY_SHARE = "zap402-terminal-dismiss-share-hint";

interface TerminalNextStepBannerProps {
  username: string;
  zapLink: string;
  tips: Tip[];
}

/**
 * High-contrast “next step” strip (Ko-fi–style) — one priority: contract → share link.
 */
const TerminalNextStepBanner: React.FC<TerminalNextStepBannerProps> = ({
  username,
  zapLink,
  tips,
}) => {
  const [dismissedShare, setDismissedShare] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SHARE) === "1";
    } catch {
      return false;
    }
  });
  const { addToast } = useToastStore();

  const dismissShare = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SHARE, "1");
    } catch {
      /* ignore */
    }
    setDismissedShare(true);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(zapLink);
      addToast({
        message: "Link copied — share it where your fans are.",
        type: "success",
        duration: 3000,
      });
    } catch {
      addToast({ message: "Couldn’t copy to clipboard.", type: "error", duration: 3000 });
    }
  }, [zapLink, addToast]);

  if (!env.contractConfigured) {
    return (
      <div
        className="flex flex-col gap-3 rounded-3xl border border-amber-500/35 bg-amber-50 px-4 py-3 text-amber-950 shadow-none dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between"
        role="status"
      >
        <p className="font-body text-sm font-medium leading-snug">
          <span className="font-semibold">Contract not configured.</span> Set{" "}
          <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">
            VITE_CONTRACT_ID
          </code>{" "}
          in <code className="font-mono text-xs">.env</code> to load on-chain tips and balances.
        </p>
      </div>
    );
  }

  const noTipsYet = tips.length === 0;
  if (!noTipsYet || dismissedShare) {
    return null;
  }

  return (
    <div
      className="relative flex flex-col gap-3 rounded-3xl bg-zap-ink px-4 py-3.5 text-zap-bg shadow-none sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pr-12"
      role="region"
      aria-label="Suggested next step"
    >
      <p className="font-body text-sm font-medium leading-snug sm:pr-2">
        <span className="mr-1.5" aria-hidden>
          ✨
        </span>
        <span className="font-semibold">Next step:</span> Share your page so fans can tip you —{" "}
        <span className="opacity-95">@{username}</span>
      </p>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-zap-bg px-4 font-body text-sm font-semibold text-zap-ink transition-opacity hover:opacity-90"
        >
          <Copy className="h-4 w-4 shrink-0" aria-hidden />
          Copy link
        </button>
      </div>
      <button
        type="button"
        onClick={dismissShare}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-zap-bg/80 transition-colors hover:bg-white/10 hover:text-zap-bg sm:right-3 sm:top-1/2 sm:-translate-y-1/2"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default TerminalNextStepBanner;
