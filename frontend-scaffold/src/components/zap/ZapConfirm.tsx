import React from "react";
import { HeartHandshake } from "lucide-react";

import Avatar from "@/components/primitives/Avatar";
import Button from "@/components/primitives/Button";
import Modal from "@/components/primitives/Modal";
import type { Profile } from "@/types";
/** Small Stellar network cost (not USDC); order-of-magnitude for user expectations. */
const ESTIMATED_NETWORK_FEE_NOTE = "~0.00001";

interface ZapConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  creator: Profile;
  amount: string;
  message: string;
  submitting?: boolean;
}

const ZapConfirm: React.FC<ZapConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  creator,
  amount,
  message,
  submitting = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="INITIATE ZAP"
      titleClassName="mt-2 font-body text-xl font-normal uppercase tracking-tight text-zap-ink md:text-2xl"
    >
      <div className="space-y-5">
        <p className="font-mono text-xs text-zap-ink-muted">
          Transaction will be signed by your wallet and settled on Stellar (~5s finality).
        </p>

        <p className="font-body text-sm text-zap-ink">
          Outbound:{" "}
          <span className="font-mono font-semibold text-zap-brand">
            {amount} USDC
          </span>{" "}
          {" "}
          <span className="font-mono font-semibold text-zap-ink">@{creator.username}</span>
        </p>
        <p className="text-[11px] leading-relaxed text-zap-ink-faint">
          Zap402 moves the contract’s tip token (configured as USDC for this product). Wallets
          sometimes show the raw Soroban token name instead of “USDC” — the amount in your confirm
          screen is still the same tip.
        </p>

        <div className="card-editorial space-y-4 p-4">
          <div className="flex items-center gap-3">
            <Avatar
              address={creator.owner}
              alt={creator.displayName || creator.username}
              fallback={creator.displayName || creator.username}
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate font-body text-sm font-bold text-zap-ink">
                {creator.displayName || creator.username}
              </p>
              <p className="font-mono text-xs text-zap-ink-muted">@{creator.username}</p>
            </div>
          </div>

          <dl className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <dt className="uppercase tracking-[0.08em] text-zap-ink-faint">ZAP_AMOUNT</dt>
              <dd className="tabular-nums text-zap-brand">{amount} USDC</dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="flex-shrink-0 uppercase tracking-[0.08em] text-zap-ink-faint">
                MEMO
              </dt>
              <dd
                className="min-w-0 truncate text-right text-zap-ink-muted"
                title={message || "—"}
              >
                {message || "—"}
              </dd>
            </div>

            <div className="flex items-center justify-between border-t border-dashed border-zap-bg-alt pt-2">
              <dt className="uppercase tracking-[0.08em] text-zap-ink-faint">NETWORK</dt>
              <dd className="tabular-nums text-zap-ink-muted">
                Stellar fee {ESTIMATED_NETWORK_FEE_NOTE} (reserve, not USDC)
              </dd>
            </div>
          </dl>
        </div>

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
            onClick={onConfirm}
            icon={<HeartHandshake size={16} />}
            className="!h-10 !min-h-10 !max-h-10 shrink-0 sm:min-w-0 sm:flex-1 sm:basis-0"
          >
            Sign & Send
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ZapConfirm;
