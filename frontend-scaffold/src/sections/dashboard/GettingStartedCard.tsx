import React, { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Link } from "react-router-dom";

import { useToastStore } from "@/state/toastStore";
import type { Profile, Tip } from "@/types/contract";

const SHARE_KEY = "zap402-shared-onboarding";

export interface GettingStartedCardProps {
  profile: Profile;
  tips: Tip[];
  zapLink: string;
}

function hasOnChainActivity(profile: Profile): boolean {
  try {
    return BigInt(profile.totalTipsReceived || "0") > 0n || profile.totalTipsCount > 0;
  } catch {
    return profile.totalTipsCount > 0;
  }
}

function profileFeelsComplete(profile: Profile): boolean {
  return Boolean(
    (profile.bio?.trim() && profile.bio.trim().length >= 8) || profile.imageUrl?.trim(),
  );
}

/**
 * Onboarding checklist for the agent home tab.
 */
const GettingStartedCard: React.FC<GettingStartedCardProps> = ({
  profile,
  tips,
  zapLink,
}) => {
  const { addToast } = useToastStore();
  const [sharedMarked, setSharedMarked] = useState(() => {
    try {
      return localStorage.getItem(SHARE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const markShared = useCallback(() => {
    try {
      localStorage.setItem(SHARE_KEY, "1");
    } catch {
      /* ignore */
    }
    setSharedMarked(true);
  }, []);

  const copyAndMark = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(zapLink);
      markShared();
      addToast({
        message: "Link copied — share your agent profile.",
        type: "success",
        duration: 3000,
      });
    } catch {
      addToast({ message: "Couldn’t copy link.", type: "error", duration: 2500 });
    }
  }, [addToast, markShared, zapLink]);

  type Step =
    | {
        id: string;
        title: string;
        description: string;
        done: boolean;
        href: string;
        cta: string;
        kind: "link";
      }
    | {
        id: string;
        title: string;
        description: string;
        done: boolean;
        cta: string;
        kind: "copy";
      };

  const steps: Step[] = useMemo(() => {
    const walletOk = true;
    const profileOk = profileFeelsComplete(profile);
    const activityOk = hasOnChainActivity(profile) || tips.length > 0;
    const shareOk = tips.length > 0 || sharedMarked;

    return [
      {
        id: "wallet",
        title: "Connect wallet",
        description: "Your wallet is linked and ready for agent requests.",
        done: walletOk,
        href: "/terminal/profile",
        cta: "Open profile",
        kind: "link" as const,
      },
      {
        id: "profile",
        title: "Complete your profile",
        description:
          "Add a photo, a short bio, and optional social links so users recognize your agent.",
        done: profileOk,
        href: "/profile/edit",
        cta: "Edit profile",
        kind: "link" as const,
      },
      {
        id: "history",
        title: "Set up history",
        description: "Track completed requests and unlocked content in one place.",
        done: activityOk,
        href: "/terminal/history",
        cta: "Open history",
        kind: "link" as const,
      },
      {
        id: "share",
        title: "Start sharing",
        description: "Drop your public link anywhere you already post.",
        done: shareOk,
        cta: "Copy link",
        kind: "copy" as const,
      },
    ];
  }, [profile, tips.length, sharedMarked]);

  const completed = steps.filter((s) => s.done).length;
  const progressPct = Math.round((completed / steps.length) * 100);

  return (
    <section
      className="kofi-dashboard-card p-6 shadow-none"
      aria-labelledby="getting-started-heading"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="getting-started-heading"
            className="font-body text-lg font-semibold text-zap-ink"
          >
            Let&apos;s get started
          </h2>
          <p className="mt-1 font-body text-sm text-zap-ink-muted">
            A few quick steps to get your agent profile ready.
          </p>
        </div>
        <span className="rounded-full bg-zap-bg-alt px-3 py-1 font-body text-xs font-medium text-zap-ink-muted">
          {completed}/{steps.length} done
        </span>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-zap-bg-alt">
        <div
          className="h-full rounded-full bg-zap-teal transition-[width] duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <ul className="space-y-0 divide-y divide-zap-border/80">
        {steps.map((step) => (
          <li key={step.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-3">
              <span className="mt-0.5 shrink-0" aria-hidden>
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-zap-teal" strokeWidth={2} />
                ) : (
                  <Circle className="h-5 w-5 text-zap-border-bright" strokeWidth={1.75} />
                )}
              </span>
              <div className="min-w-0">
                <p className="font-body text-[15px] font-semibold text-zap-ink">{step.title}</p>
                <p className="mt-0.5 font-body text-sm leading-relaxed text-zap-ink-muted">
                  {step.description}
                </p>
              </div>
            </div>
            <div className="shrink-0 sm:pl-4">
              {step.kind === "copy" ? (
                <button
                  type="button"
                  onClick={() => void copyAndMark()}
                  className="inline-flex min-h-[40px] w-full items-center justify-center rounded-full border border-zap-bg-alt bg-zap-bg-raised px-5 font-body text-sm font-semibold text-zap-ink transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-alt sm:w-auto"
                >
                  {step.cta}
                </button>
              ) : (
                <Link
                  to={step.href}
                  className="inline-flex min-h-[40px] w-full items-center justify-center rounded-full border border-zap-bg-alt bg-zap-bg-raised px-5 font-body text-sm font-semibold text-zap-ink no-underline transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-alt sm:w-auto"
                >
                  {step.cta}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default GettingStartedCard;
