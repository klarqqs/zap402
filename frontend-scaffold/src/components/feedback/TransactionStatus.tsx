import React, { useCallback, useEffect, useState } from "react";
import Button from "@/components/primitives/Button";
import Loader from "@/components/primitives/Loader";
import { useWallet } from "@/hooks/useWallet";

interface TransactionStatusProps {
  status:
    | "idle"
    | "signing"
    | "submitting"
    | "confirming"
    | "success"
    | "error";
  txHash?: string;
  errorMessage?: string;
  onRetry?: () => void;
  /** Overrides the default “Try again” label on the error action. */
  retryLabel?: string;
  /** Softer chrome for register / editorial flows. */
  variant?: "default" | "editorial";
}

const statusMessages: Record<string, string> = {
  idle: "",
  signing: "Waiting for wallet signature...",
  submitting: "Submitting transaction...",
  confirming: "Confirming on network...",
  success: "Transaction confirmed!",
  error: "Transaction failed",
};

const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  txHash,
  errorMessage,
  onRetry,
  retryLabel,
  variant = "default",
}) => {
  const { network } = useWallet();
  const [hashCopied, setHashCopied] = useState(false);

  useEffect(() => {
    if (!hashCopied) return;
    const t = window.setTimeout(() => setHashCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [hashCopied]);

  const copyTxHash = useCallback(async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setHashCopied(true);
    } catch {
      // ignore — clipboard may be denied
    }
  }, []);

  if (status === "idle") return null;

  const editorial = variant === "editorial";
  const shellClass = editorial
    ? "space-y-3 text-left sm:text-center"
    : "border-2 border-black p-4 text-center";

  const isLoading = ["signing", "submitting", "confirming"].includes(status);
  const explorerBase =
    network === "PUBLIC"
      ? "https://stellar.expert/explorer/public/tx/"
      : "https://stellar.expert/explorer/testnet/tx/";

  const errorActionLabel = retryLabel ?? "Try again";

  return (
    <div className={shellClass}>
      {isLoading && (
        <div className={editorial ? "text-sm text-zap-ink-muted" : ""}>
          <Loader text={statusMessages[status]} />
        </div>
      )}

      {status === "success" && (
        <div>
          <p
            className={
              editorial
                ? "mb-2 text-lg font-semibold text-emerald-800 dark:text-emerald-300"
                : "mb-2 text-lg font-black text-green-800"
            }
          >
            {statusMessages.success}
          </p>
          {txHash && (
            <div className="flex flex-col items-center gap-3">
              <a
                href={`${explorerBase}${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  editorial
                    ? "text-sm font-semibold text-zap-brand underline decoration-zap-brand/50 underline-offset-2"
                    : "text-sm font-bold underline"
                }
              >
                View on Stellar Expert 
              </a>
              <button
                type="button"
                onClick={() => copyTxHash(txHash)}
                className={
                  editorial
                    ? "text-sm font-semibold text-zap-brand underline decoration-zap-brand/45 underline-offset-[3px] transition-colors hover:text-zap-brand/90 hover:decoration-zap-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zap-brand focus-visible:ring-offset-2 focus-visible:ring-offset-zap-bg"
                    : "text-sm font-bold text-zap-brand underline underline-offset-2 transition-colors hover:text-zap-brand/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zap-brand focus-visible:ring-offset-2"
                }
              >
                {hashCopied ? "Copied!" : "Copy TX Hash"}
              </button>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div
          className={
            editorial
              ? "flex flex-col items-start gap-2 sm:items-center"
              : "flex flex-col items-center gap-4"
          }
        >
          <p
            className={
              editorial
                ? "text-pretty font-body text-[15px] font-medium leading-relaxed text-red-800 dark:text-red-300"
                : "text-lg font-black text-red-800"
            }
          >
            {errorMessage || statusMessages.error}
          </p>
          {onRetry &&
            (editorial ? (
              <button
                type="button"
                onClick={onRetry}
                className="text-sm font-semibold text-zap-brand underline decoration-zap-brand/45 underline-offset-[3px] transition-colors hover:text-zap-brand/90 hover:decoration-zap-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zap-brand focus-visible:ring-offset-2 focus-visible:ring-offset-zap-bg"
              >
                {errorActionLabel}
              </button>
            ) : (
              <Button
                variant="brandCta"
                size="sm"
                onClick={onRetry}
                className="w-full max-w-xs justify-center"
              >
                {errorActionLabel}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
};

export default TransactionStatus;
