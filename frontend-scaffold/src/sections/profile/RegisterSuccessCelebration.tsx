import React, { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

import { env } from "@/config/env";
import { useToastStore } from "@/state/toastStore";
import { stellarExpertTxUrl } from "@/utils/format";

interface RegisterSuccessCelebrationProps {
  username: string;
  pageUrl: string;
  txHash?: string;
}

/**
 * Post-deploy celebration — Ko-fi–style “your page is live” with clear next steps.
 */
const RegisterSuccessCelebration: React.FC<RegisterSuccessCelebrationProps> = ({
  username,
  pageUrl,
  txHash,
}) => {
  const [copied, setCopied] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      addToast({ message: "Link copied — paste it anywhere your fans are.", type: "success", duration: 3000 });
    } catch {
      addToast({ message: "Couldn’t copy — select and copy the link manually.", type: "error", duration: 4000 });
    }
  };

  return (
    <div
      className="rounded-2xl border-2 border-zap-bg-alt bg-zap-bg-raised p-8 text-center shadow-none md:p-10"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zap-teal-dim text-zap-teal">
        <Check className="h-9 w-9" strokeWidth={2.5} aria-hidden />
      </div>
      <h2 className="font-body mt-6 text-2xl font-semibold tracking-tight text-zap-ink md:text-3xl">
        Your page is live
      </h2>
      <p className="mt-2 font-body text-lg text-zap-ink-muted">
        <span className="font-semibold text-zap-ink">@{username}</span>
        <span className="mx-1.5 text-zap-ink-faint">·</span>
        Personalize anytime in Terminal or profile settings.
      </p>
      <p className="mx-auto mt-4 max-w-md font-body text-sm leading-relaxed text-zap-ink-muted">
        Share your link anywhere fans find you — tips settle on Stellar in seconds.
      </p>

      <div className="mt-8 flex flex-col items-stretch gap-3 sm:mx-auto sm:max-w-md">
        {/* <button
          type="button"
          onClick={() => void handleCopy()}
          className="btn-primary inline-flex min-h-[48px] items-center justify-center gap-2 normal-case tracking-normal"
        >
          {copied ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : <Copy className="h-4 w-4 shrink-0" aria-hidden />}
          {copied ? "Copied!" : "Copy page link"} */}
        {/* </button> */}
        <Link
          to="/terminal"
          className="btn-primary inline-flex min-h-[48px] items-center justify-center gap-2 no-underline normal-case tracking-normal"
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
          Go to Terminal
        </Link>
        {/* <Link
          to={`/@${username}`}
          className="btn-ghost inline-flex min-h-[48px] items-center justify-center gap-2 no-underline normal-case tracking-normal"
        >
          View public page
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
        <Link
          to="/profile/edit"
          className="font-body text-sm font-medium text-zap-brand underline decoration-zap-brand/35 underline-offset-4 transition-opacity hover:opacity-85"
        >
          Add photo &amp; bio
        </Link> */}
        {txHash ? (
  <a
    href={stellarExpertTxUrl(
      txHash,
      env.network === "MAINNET" ? "PUBLIC" : "TESTNET"
    )}
    target="_blank"
    rel="noopener noreferrer"
    className="btn-ghost inline-flex min-h-[48px] items-center justify-center gap-2 no-underline normal-case tracking-normal"
  >
    View transaction on Stellar Expert
    <ExternalLink size={16} />
  </a>
) : null}

      </div>
    </div>
  );
};

export default RegisterSuccessCelebration;
