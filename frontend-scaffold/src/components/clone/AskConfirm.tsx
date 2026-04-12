import React from "react";
import Avatar from "@/components/primitives/Avatar";
import Button from "@/components/primitives/Button";
import CopyButton from "@/components/primitives/CopyButton";
import Modal from "@/components/primitives/Modal";
import { truncateAddress } from "@/utils/format";

const ESTIMATED_NETWORK_FEE_NOTE = "~0.00001";

interface AskConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  creatorName: string;
  creatorAddress: string;
  requestLabel: string;
  priceUsdc: string;
  message: string;
  connected: boolean;
  publicKey?: string | null;
  submitting?: boolean;
  onConnectWallet: () => void;
}

const AskConfirm: React.FC<AskConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  creatorName,
  creatorAddress,
  requestLabel,
  priceUsdc,
  message,
  connected,
  publicKey,
  submitting = false,
  onConnectWallet,
}) => {
  const handlePrimary = () => {
    if (submitting) return;
    if (!connected) {
      onConnectWallet();
      return;
    }
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="INITIATE REQUEST"
      titleClassName="mt-2 font-body text-xl font-normal uppercase tracking-tight text-zap-ink md:text-2xl"
    >
      <div className="space-y-5">
        <p className="font-body text-sm text-zap-ink">
          Begin a conversational thread flow.
        </p>
        <p className="font-mono text-xs text-zap-ink">
          Transaction will be signed by your wallet and settled on Stellar (~5s finality).
        </p>

        <p className="font-body text-sm text-zap-ink">
          Outbound:{" "}
          <span className="font-mono font-semibold text-zap-brand">{priceUsdc} USDC</span>{" "}
          <span className="font-mono font-semibold text-zap-ink">@{creatorName}</span>
        </p>
        <p className="text-[11px] leading-relaxed text-zap-ink-faint">
          This paid request uses the same Zap402 payment rails as zaps. The on-chain memo is an
          ask commitment hash linked to your off-chain request body.
        </p>

        <div className="card-editorial space-y-4 p-4">
          <div className="flex items-center gap-3">
            <Avatar
              address={creatorAddress}
              alt={creatorName}
              fallback={creatorName}
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate font-body text-sm font-bold text-zap-ink">{creatorName}</p>
              <p className="font-mono text-xs text-zap-ink">
                @{truncateAddress(creatorAddress, 4)}
              </p>
            </div>
          </div>

          <dl className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <dt className="uppercase tracking-[0.08em] text-zap-ink-faint">REQUEST_TYPE</dt>
              <dd className="text-right text-zap-ink">{requestLabel}</dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="uppercase tracking-[0.08em] text-zap-ink-faint">REQUEST_AMOUNT</dt>
              <dd className="tabular-nums text-zap-brand">{priceUsdc} USDC</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="flex-shrink-0 uppercase tracking-[0.08em] text-zap-ink-faint">
                MESSAGE
              </dt>
              <dd className="min-w-0 truncate text-right text-zap-ink" title={message || "—"}>
                {message || "—"}
              </dd>
            </div>

            <div className="flex items-center justify-between border-t border-dashed border-zap-bg-alt pt-2">
              <dt className="uppercase tracking-[0.08em] text-zap-ink-faint">NETWORK</dt>
              <dd className="tabular-nums text-zap-ink">
                Stellar fee {ESTIMATED_NETWORK_FEE_NOTE} (reserve, not USDC)
              </dd>
            </div>
          </dl>
        </div>

        <p className="font-mono text-xs text-zap-ink">
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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
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
          <Button
            type="button"
            variant="editorial"
            size="sm"
            disabled={submitting}
            onClick={handlePrimary}
            className="!h-10 !min-h-10 !max-h-10 shrink-0 sm:min-w-0 sm:flex-1 sm:basis-0"
          >
            {connected ? "Begin" : "Connect wallet"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AskConfirm;

