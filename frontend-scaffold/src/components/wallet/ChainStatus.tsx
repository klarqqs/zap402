import React from "react";

import { useWallet } from "@/hooks/useWallet";
import { useWalletStore } from "@/state/walletStore";

/** Plain network label — no bordered chip */
const ChainStatus: React.FC = () => {
  const { connected } = useWallet();
  const network = useWalletStore((s) => s.network);
  const netLabel = network === "PUBLIC" ? "MAINNET" : "TESTNET";

  return (
    <span className="inline-flex items-center gap-1.5 font-body text-[10px] uppercase tracking-[0.1em] text-zap-ink-muted">
      {connected ? (
        <>
          <span
            className="inline-block text-[8px] leading-none text-emerald-600 dark:text-emerald-400"
            aria-hidden
          >
            ●
          </span>
          <span>{netLabel}</span>
        </>
      ) : (
        <>
          <span
            className="inline-block text-[8px] leading-none text-zap-teal/45"
            aria-hidden
          >
            ○
          </span>
          <span>{netLabel}</span>
        </>
      )}
    </span>
  );
};

export default ChainStatus;
