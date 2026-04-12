import React, { useState } from "react";

import Button from "@/components/primitives/Button";
import { useZapPayment } from "@/hooks/useZapPayment";

export interface ZapButtonProps {
  contentId: string;
  priceUsdc: string;
  /** Creator’s Stellar address (Soroban USDC transfer destination). */
  creatorAddress: string;
  locked: boolean;
  onSuccess?: () => void;
}

const ZapButton: React.FC<ZapButtonProps> = ({
  contentId,
  priceUsdc,
  creatorAddress,
  locked,
  onSuccess,
}) => {
  const { payToUnlock } = useZapPayment();
  const [busy, setBusy] = useState(false);

  if (!locked) {
    return (
      <Button
        type="button"
        variant="editorialGhost"
        disabled
        className="w-full !uppercase tracking-[0.08em]"
      >
        Unlocked
      </Button>
    );
  }

  const handleClick = async () => {
    setBusy(true);
    try {
      const { ok } = await payToUnlock(contentId, priceUsdc, {
        creatorAddress,
      });
      if (ok) onSuccess?.();
    } catch {
      /* wallet closed or not connected */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="editorial"
      size="md"
      className="w-full !uppercase tracking-[0.08em]"
      loading={busy}
      onClick={() => void handleClick()}
    >
      <span className="font-bold">Unlock —</span>{" "}
      <span className="text-lg font-black tabular-nums tracking-tight">
        {priceUsdc} USDC
      </span>
    </Button>
  );
};

export default ZapButton;
