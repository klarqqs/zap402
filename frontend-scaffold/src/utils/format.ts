import BigNumber from "bignumber.js";

// used for display purposes
export const truncateString = (str: string) =>
  str ? `${str.slice(0, 5)}…${str.slice(-5)}` : "";

/** Stellar-style account display: `GABC…XYZ` (ellipsis, not middle ellipsis char). */
export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function stellarExpertAccountUrl(
  address: string,
  network: "TESTNET" | "PUBLIC" = "TESTNET",
): string {
  const segment = network === "PUBLIC" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${segment}/account/${encodeURIComponent(address)}`;
}

export function stellarExpertTxUrl(
  txHash: string,
  network: "TESTNET" | "PUBLIC" = "TESTNET",
): string {
  const segment = network === "PUBLIC" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${segment}/tx/${encodeURIComponent(txHash)}`;
}

export function stellarExpertContractUrl(
  contractId: string,
  network: "TESTNET" | "PUBLIC" = "TESTNET",
): string {
  const segment = network === "PUBLIC" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${segment}/contract/${encodeURIComponent(contractId)}`;
}

// Convert a Unix timestamp in seconds (Soroban contract format) to a Date object.
// All Tip.timestamp values in this app are in seconds.
export function formatTimestamp(seconds: number): Date {
  return new Date(seconds * 1000);
}

// conversion used to display the base fee and other XLM amounts
export const stroopToXlm = (
  stroops: BigNumber | string | number,
  decimals?: number,
): string => {
  let xlmValue: BigNumber;
  
  if (stroops instanceof BigNumber) {
    xlmValue = stroops.dividedBy(1e7);
  } else {
    xlmValue = new BigNumber(Number(stroops) / 1e7);
  }
  
  // Default to 2 decimal places for amounts, 7 for precise values
  const defaultDecimals = decimals !== undefined ? decimals : 2;
  
  return xlmValue.toFormat(defaultDecimals);
};

// conversion that returns BigNumber for backward compatibility
export const stroopToXlmBigNumber = (
  stroops: BigNumber | string | number,
): BigNumber => {
  if (stroops instanceof BigNumber) {
    return stroops.dividedBy(1e7);
  }
  return new BigNumber(Number(stroops) / 1e7);
};

export const xlmToStroop = (lumens: BigNumber | string): BigNumber => {
  if (lumens instanceof BigNumber) {
    return lumens.times(1e7);
  }
  // round to nearest stroop
  return new BigNumber(Math.round(Number(lumens) * 1e7));
};

/** Human amount with 7 fractional digits → minor units (USDC, native XLM stroops, same-scale SAC). */
export const humanToSevenDecimalMinorUnits = xlmToStroop;

// With a tokens set number of decimals, display the formatted value for an amount.
// Example - User A has 1000000001 of a token set to 7 decimals, display should be 100.0000001
/** Display string for network earnings (marketing copy uses USDC label). */
export const formatNetworkEarningsUsdc = (
  stroops: BigNumber | string | number | null | undefined,
): string => {
  if (stroops == null || stroops === "") {
    return "$0.00 USDC";
  }
  const bn =
    stroops instanceof BigNumber ? stroops : new BigNumber(String(stroops));
  if (!bn.isFinite()) {
    return "$0.00 USDC";
  }
  const xlm = stroopToXlmBigNumber(bn);
  if (!xlm.isFinite()) {
    return "$0.00 USDC";
  }
  return `$${xlm.toFormat(2)} USDC`;
};

/** Same display as network table — zaps shown as USDC-style amounts in the UI. */
export const formatZapAmountAsUsdc = formatNetworkEarningsUsdc;

/** Short month + year for network “Joined” column (unix seconds). */
export const formatNetworkJoined = (seconds?: number): string => {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const d = new Date(seconds * 1000);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

export const formatTokenAmount = (amount: BigNumber, decimals: number) => {
  let formatted = amount.toString();

  if (decimals > 0) {
    formatted = amount.shiftedBy(-decimals).toFixed(decimals).toString();

    // Trim trailing zeros
    while (formatted[formatted.length - 1] === "0") {
      formatted = formatted.substring(0, formatted.length - 1);
    }

    if (formatted.endsWith(".")) {
      formatted = formatted.substring(0, formatted.length - 1);
    }
  }

  return formatted;
};
