import { FREIGHTER_ID, XBULL_ID } from "@creit.tech/stellar-wallets-kit";

function rawMessageFromUnknown(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message.trim();
  }
  if (typeof err === "string" && err.trim()) {
    return err.trim();
  }
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    for (const key of ["message", "error", "reason", "detail"] as const) {
      const v = o[key];
      if (typeof v === "string" && v.trim()) {
        return v.trim();
      }
    }
  }
  return "";
}

function isLikelyUserCancelled(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("reject") ||
    m.includes("denied") ||
    m.includes("cancel") ||
    m.includes("closed") ||
    m.includes("dismiss") ||
    m.includes("abort") ||
    m.includes("user cancelled")
  );
}

const FREIGHTER_HINT =
  "Could not reach Freighter. In a new browser you need the extension: install it from " +
  "https://freighter.app , pin it, then refresh this page and tap Connect again. " +
  "If it’s already installed, allow this site in Freighter and try again.";

const XBULL_HINT =
  "Could not reach xBull. Install the xBull wallet (https://xbull.app), open it, " +
  "then try Connect again — desktop apps must be running for the browser to talk to them.";

/**
 * Turn StellarWalletsKit / extension failures into actionable UI copy.
 * Many failures are not `Error` instances, which previously showed only “Failed to connect wallet”.
 */
export function formatWalletConnectionError(
  err: unknown,
  walletId: string,
): string {
  const raw = rawMessageFromUnknown(err);
  const blob = `${raw} ${String(err)}`.toLowerCase();

  if (isLikelyUserCancelled(raw) || isLikelyUserCancelled(blob)) {
    return (
      "Connection was cancelled in the wallet. Try again when you’re ready to approve."
    );
  }

  if (raw && raw !== "Failed to connect wallet") {
    return raw;
  }

  if (walletId === FREIGHTER_ID) {
    return FREIGHTER_HINT;
  }
  if (walletId === XBULL_ID) {
    return XBULL_HINT;
  }

  return (
    raw ||
    "Could not connect. Install Freighter or xBull for this browser, refresh the page, and try again."
  );
}
