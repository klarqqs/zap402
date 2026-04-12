import React from "react";
import BigNumber from "bignumber.js";
import { formatZapAmountAsUsdc } from "@/utils/format";

interface AmountDisplayProps {
  /** Stellar amount in stroops; Soroban may hand back bigint before mapping. */
  amount: string | number | bigint;
  className?: string;
}

const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  className = "",
}) => {
  const label = formatZapAmountAsUsdc(new BigNumber(String(amount)));

  return (
    <span className={`font-body font-semibold tabular-nums text-zap-ink ${className}`}>
      {label}
    </span>
  );
};

export default AmountDisplay;
