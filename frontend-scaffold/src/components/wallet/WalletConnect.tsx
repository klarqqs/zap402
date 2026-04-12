import React from 'react';
import Button from '@/components/primitives/Button';
import Toast from '@/components/primitives/Toast';
import CreditBadge from '@/components/creator/CreditBadge';
import CopyButton from "@/components/primitives/CopyButton";
import { useOpenWalletConnect } from "@/components/wallet/WalletConnectModal";
import { useWallet } from "@/hooks";
import { useProfileStore } from "@/state/profileStore";
import { truncateAddress } from "@/services";

interface WalletConnectProps {
  className?: string;
  /** Dashboard shell: plain address text; header uses bordered chip when false */
  editorial?: boolean;
  /** Hide tier badge when it’s shown elsewhere (e.g. dashboard balance tile). */
  hideCreditBadge?: boolean;
}

const WalletConnect: React.FC<WalletConnectProps> = ({
  className,
  editorial = false,
  hideCreditBadge = false,
}) => {
  const openConnectModal = useOpenWalletConnect();
  const { publicKey, connected, connecting, error, disconnect } = useWallet();
  const profile = useProfileStore((s) => s.profile);

  if (connected && publicKey) {
    const chipClass = editorial
      ? "font-mono text-xs font-semibold text-zap-ink"
      : "border-2 border-zap-bg-alt bg-zap-surface px-3 py-1.5 font-mono text-sm font-semibold text-zap-ink";

    return (
      <div className={`flex flex-wrap items-center gap-3 ${className || ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          {profile && !hideCreditBadge && (
            <CreditBadge score={profile.creditScore} showScore={false} />
          )}
          <span className={chipClass}>{truncateAddress(publicKey)}</span>
          <CopyButton
            text={publicKey}
            label="Copy wallet address"
            className={`!h-8 !min-h-8 !w-8 !shrink-0 !gap-0 !border-0 !p-0 !shadow-none ${
              editorial
                ? "bg-transparent hover:bg-zap-bg-alt/60"
                : "bg-transparent hover:bg-zap-bg-alt"
            }`}
          />
        </div>
        {editorial ? (
          <button
            type="button"
            onClick={disconnect}
            className="btn-editorial-ghost btn-editorial-ghost--compact"
          >
            DISCONNECT
          </button>
        ) : (
          <Button variant="outline" size="sm" onClick={disconnect}>
            DISCONNECT
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <Button
        size="sm"
        onClick={openConnectModal}
        loading={connecting}
        className={className}
      >
        {connecting ? "PROCESSING..." : "Connect Wallet"}
      </Button>

      {error && (
        <Toast
          message={error}
          type="error"
          onClose={() => {}}
        />
      )}
    </>
  );
};

export default WalletConnect;
