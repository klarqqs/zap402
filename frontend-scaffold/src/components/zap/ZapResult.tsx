import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, RefreshCw, Zap } from "lucide-react";

import type { Profile } from "@/types";
import Button from "@/components/primitives/Button";
import { getExplorerTxUrl } from "@/utils/network";

/** Matches ZapPage action buttons — compact editorial CTA in action rows. */
const zapPrimaryBtnClass =
  "!h-10 !min-h-10 !max-h-10 !w-full !normal-case !tracking-normal !font-semibold sm:!w-auto sm:min-w-[10rem]";

interface ZapResultProps {
  status: "success" | "error";
  txHash?: string;
  amount?: string;
  creator?: Profile;
  errorMessage?: string;
  onPrimaryAction?: () => void;
}

const ZapResult: React.FC<ZapResultProps> = ({
  status,
  txHash,
  amount,
  creator,
  errorMessage,
  onPrimaryAction,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="card-web3-highlight border-zap-bg-alt p-6"
    >
      <div className="space-y-4">
        {status === "success" ? (
          <>
            <h3 className="font-body text-2xl font-semibold tracking-tight text-zap-ink">
              Transaction confirmed
              <span className="ml-2 text-zap-teal" aria-hidden>
                ✓
              </span>
            </h3>
            <p className="font-body text-sm leading-relaxed text-zap-ink-muted">
              {amount
                ? `You sent ${amount} USDC to @${creator?.username ?? "this creator"}.`
                : "Your tip was submitted."}
              {creator?.displayName &&
              creator.displayName.trim().toLowerCase() !==
                creator.username.toLowerCase() ? (
                <span className="mt-1 block text-zap-ink-faint">
                  ({creator.displayName})
                </span>
              ) : null}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {txHash ? (
                <a
                  href={getExplorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex !h-10 !min-h-10 !max-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-zap-bg-alt bg-transparent px-3 font-body text-sm font-medium text-zap-brand transition-colors hover:border-zap-bg-alt-bright hover:bg-zap-bg-alt sm:w-auto"
                >
                  <ExternalLink size={16} strokeWidth={2} className="shrink-0" aria-hidden />
                  <span className="whitespace-nowrap">View on explorer</span>
                </a>
              ) : null}
              <Button
                type="button"
                variant="editorial"
                size="sm"
                icon={<Zap size={16} strokeWidth={2} aria-hidden />}
                onClick={onPrimaryAction}
                className={zapPrimaryBtnClass}
              >
                New zap
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-body text-xl font-semibold tracking-tight text-zap-error">
              Transaction failed
            </h3>
            <p className="font-body text-sm leading-relaxed text-zap-ink-muted">
              {errorMessage ||
                "Transaction rejected or timed out. Check your wallet and retry."}
            </p>
            <Button
              type="button"
              variant="editorial"
              size="md"
              icon={<RefreshCw size={18} strokeWidth={2} aria-hidden />}
              onClick={onPrimaryAction}
              className={zapPrimaryBtnClass}
            >
              Try again
            </Button>
          </>
        )}
      </div>
    </motion.section>
  );
};

export default ZapResult;
