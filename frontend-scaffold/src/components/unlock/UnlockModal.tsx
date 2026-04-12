import React, { useEffect, useState } from "react";
import { HeartHandshake, Lock, Wallet } from "lucide-react";

import type { UnlockItem } from "@/types/unlock.types";
import Avatar from "@/components/primitives/Avatar";
import Button from "@/components/primitives/Button";
import CopyButton from "@/components/primitives/CopyButton";
import Modal from "@/components/primitives/Modal";
import { useOpenWalletConnect } from "@/components/wallet/WalletConnectModal";
import { env } from "@/config/env";
import { useWallet } from "@/hooks/useWallet";
import { useZapPayment } from "@/hooks/useZapPayment";
import { truncateAddress } from "@/utils/format";
import TransactionStatus from "@/components/feedback/TransactionStatus";

/** Order-of-magnitude Stellar base fee (paid from account reserve, not USDC). */
const EST_NETWORK_FEE_NOTE = "~0.00001";

const CONTENT_TYPE_LABEL: Record<string, string> = {
  FILE: "FILE_DOWNLOAD",
  TEXT: "PRIVATE_POST",
  LINK: "PRIVATE_LINK",
  PROMPT: "PROMPT_PACK",
};

export type UnlockCreatorSummary = {
  owner: string;
  username: string;
  displayName: string;
};

export interface UnlockModalProps {
  isOpen: boolean;
  item: UnlockItem;
  /** Creator profile for layout parity with zap confirm (avatar + @handle). */
  creator?: UnlockCreatorSummary | null;
  /** When true, modal should not be used to pay (creator viewing own page). */
  isOwner?: boolean;
  onClose: () => void;
  onSuccess: (txHash: string, amount: number) => Promise<void>;
}

type Step = "CONFIRM" | "SIGNING" | "PROCESSING" | "DONE" | "ERROR";

export function UnlockModal({
  isOpen,
  item,
  creator,
  isOwner,
  onClose,
  onSuccess,
}: UnlockModalProps) {
  const { connected, publicKey } = useWallet();
  const openWalletConnect = useOpenWalletConnect();
  const { payToUnlock } = useZapPayment();
  const [step, setStep] = useState<Step>("CONFIRM");
  const [txHash, setTxHash] = useState<string>("");
  const [error, setError] = useState<string>("");

  const creatorOwner = creator?.owner ?? item.creatorId;
  const creatorUsername =
    creator?.username ?? truncateAddress(creatorOwner, 4);
  const creatorDisplayName = creator?.displayName ?? creatorUsername;

  useEffect(() => {
    if (!isOpen) {
      const timerId = window.setTimeout(() => {
        setStep("CONFIRM");
        setTxHash("");
        setError("");
      }, 0);
      return () => window.clearTimeout(timerId);
    }
  }, [isOpen]);

  const submitting = step === "SIGNING" || step === "PROCESSING";

  const handlePay = async () => {
    if (!connected || isOwner) return;
    try {
      setStep("SIGNING");
      const amountStr = item.price.toFixed(2);
      const { txHash: hash } = await payToUnlock(item.id, amountStr, {
        creatorAddress: item.creatorId,
      });
      if (!hash) {
        setError("No transaction hash");
        setStep("ERROR");
        return;
      }
      setTxHash(hash);
      setStep("PROCESSING");
      await onSuccess(hash, item.price);
      setStep("DONE");
    } catch (e) {
      setError(e instanceof Error ? e.message : "TX_FAILED");
      setStep("ERROR");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="INITIATE PURCHASE"
      titleClassName="mt-2 font-body text-xl font-normal uppercase tracking-tight text-zap-ink md:text-2xl"
    >
      <div className="space-y-5">
        {isOwner ? (
          <p
            className="border border-zap-bg-alt bg-zap-warning-dim/30 px-3 py-2 font-body text-sm text-zap-ink"
            role="status"
          >
            You can’t unlock your own content. Switch wallets to test a purchase.
          </p>
        ) : null}

        <p className="font-mono text-xs text-zap-ink-muted">
          Transaction will be signed by your wallet and settled on Stellar (~5s finality).
        </p>

        <p className="font-body text-sm text-zap-ink">
          Outbound:{" "}
          <span className="font-mono font-semibold text-zap-brand">
            {item.price.toFixed(2)} USDC
          </span>{" "}
          {" "}
          <span className="font-mono font-semibold text-zap-ink">@{creatorUsername}</span>
        </p>
        <p className="text-[11px] leading-relaxed text-zap-ink-muted">
          {env.contractConfigured ? (
            <>
              USDC is held in Zap402 for the creator (same path as a zap). They withdraw from{" "}
              <span className="font-semibold text-zap-ink">TERMINAL</span> after the platform fee.
            </>
          ) : (
            <>
              Dev fallback: USDC transfers directly to the creator wallet. Set{" "}
              <span className="font-mono text-zap-ink">VITE_CONTRACT_ID</span> for escrow + unified withdraw.
            </>
          )}
        </p>

        <div className="card-editorial space-y-4 p-4">
          <div className="flex items-center gap-3">
            <Avatar
              address={creatorOwner}
              alt={creatorDisplayName}
              fallback={creatorDisplayName}
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate font-body text-sm font-bold text-zap-ink">
                {creatorDisplayName}
              </p>
              <p className="font-mono text-xs text-zap-ink-muted">@{creatorUsername}</p>
            </div>
          </div>

          <div>
            <h3 className="font-body text-base font-semibold uppercase tracking-tight text-zap-ink">
              {item.title}
            </h3>
            <p className="mt-1 font-body text-[11px] uppercase tracking-[0.1em] text-zap-ink-muted">
              {CONTENT_TYPE_LABEL[item.contentType] ?? item.contentType} · PAY_ONCE · ACCESS_FOREVER
            </p>
          </div>

          <dl className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <dt className="uppercase tracking-[0.08em] text-zap-ink-faint">UNLOCK_AMOUNT</dt>
              <dd className="tabular-nums text-zap-brand">{item.price.toFixed(2)} USDC</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="flex-shrink-0 uppercase tracking-[0.08em] text-zap-ink-faint">
                ACCESS
              </dt>
              <dd className="min-w-0 text-right text-zap-ink-muted">One-time · yours to keep</dd>
            </div>

            <div className="flex items-center justify-between border-t border-dashed border-zap-bg-alt pt-2">
              <dt className="uppercase tracking-[0.08em] text-zap-ink-faint">NETWORK</dt>
              <dd className="tabular-nums text-zap-ink-muted">
                Stellar fee {EST_NETWORK_FEE_NOTE} (reserve, not USDC)
              </dd>
            </div>
          </dl>
        </div>

        <p className="font-mono text-xs text-zap-ink-muted">
          From:{" "}
          {connected && publicKey ? (
            <span className="inline-flex items-center gap-1 align-middle">
              <span className="text-zap-ink">{truncateAddress(publicKey, 4)}</span>
              <CopyButton
                text={publicKey}
                className="!h-7 !min-h-7 !w-7 !shrink-0 !gap-0 !border-0 !p-0 !shadow-none bg-transparent hover:bg-zap-bg-alt/60"
              />
            </span>
          ) : (
            <span className="text-zap-ink-faint">Wallet not connected</span>
          )}
        </p>

        {step === "CONFIRM" ? (
          isOwner ? (
            <Button
              type="button"
              variant="editorialGhost"
              size="sm"
              onClick={onClose}
              className="!h-10 !min-h-10 !max-h-10 w-full shrink-0"
            >
              Close
            </Button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <Button
                type="button"
                variant="editorialGhost"
                size="sm"
                onClick={onClose}
                disabled={submitting}
                className="!h-10 !min-h-10 !max-h-10 shrink-0 sm:min-w-0 sm:flex-1 sm:basis-0"
              >
                Abort
              </Button>
              {!connected ? (
                <Button
                  type="button"
                  variant="editorial"
                  size="sm"
                  onClick={openWalletConnect}
                  icon={<Wallet size={16} strokeWidth={2} aria-hidden />}
                  className="!h-10 !min-h-10 !max-h-10 shrink-0 sm:min-w-0 sm:flex-1 sm:basis-0"
                >
                  Connect wallet
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="editorial"
                  size="sm"
                  onClick={() => void handlePay()}
                  icon={<Lock size={16} strokeWidth={2} aria-hidden />}
                  className="!h-10 !min-h-10 !max-h-10 shrink-0 sm:min-w-0 sm:flex-1 sm:basis-0"
                >
                  Sign & Unlock
                </Button>
              )}
            </div>
          )
        ) : null}

        {step === "SIGNING" ? (
          <TransactionStatus variant="editorial" status="signing" />
        ) : null}

        {step === "PROCESSING" ? (
          <TransactionStatus
            variant="editorial"
            status="confirming"
            txHash={txHash || undefined}
          />
        ) : null}

        {step === "DONE" ? (
          <div className="space-y-4">
            <TransactionStatus
              variant="editorial"
              status="success"
              txHash={txHash || undefined}
            />
            <p className="font-body text-[11px] text-zap-ink-faint">Content is now visible on the profile.</p>
            <Button
              type="button"
              variant="editorialGhost"
              size="sm"
              onClick={onClose}
              className="!h-10 !min-h-10 !max-h-10 w-full shrink-0"
            >
              Close
            </Button>
          </div>
        ) : null}

        {step === "ERROR" ? (
          <div className="space-y-4">
            <TransactionStatus variant="editorial" status="error" errorMessage={error} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <Button
                type="button"
                variant="editorialGhost"
                size="sm"
                onClick={onClose}
                className="!h-10 !min-h-10 !max-h-10 shrink-0 sm:min-w-0 sm:flex-1 sm:basis-0"
              >
                Abort
              </Button>
              <Button
                type="button"
                variant="editorial"
                size="sm"
                onClick={() => {
                  setStep("CONFIRM");
                  setError("");
                }}
                icon={<HeartHandshake size={16} strokeWidth={2} aria-hidden />}
                className="!h-10 !min-h-10 !max-h-10 shrink-0 sm:min-w-0 sm:flex-1 sm:basis-0"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export default UnlockModal;
