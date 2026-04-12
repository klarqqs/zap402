/**
 * Pay-to-ask uses the same `send_tip` path as zaps. The on-chain message is a
 * compact commitment to the question body: `ask:` + SHA-256 (hex, 64 chars).
 * Full text stays off-chain (Terminal/API); the hash links payment ↔ content.
 */

export const ASK_MESSAGE_PREFIX = "ask:" as const;

const ASK_HEX_LEN = 64;

/** True if `message` is a valid pay-to-ask tip message (prefix + 64 hex chars). */
export function isAskTipMessage(message: string): boolean {
  if (!message.startsWith(ASK_MESSAGE_PREFIX)) return false;
  const hex = message.slice(ASK_MESSAGE_PREFIX.length);
  return hex.length === ASK_HEX_LEN && /^[0-9a-f]+$/.test(hex);
}

/** Returns the 64-char hex digest from an ask tip message, or null if invalid. */
export function parseAskTipHex(message: string): string | null {
  if (!isAskTipMessage(message)) return null;
  return message.slice(ASK_MESSAGE_PREFIX.length);
}

/** Short hex for UI (e.g. `0892db37…2701ca`) — avoids layout overflow for on-chain commitments. */
export function truncateAskCommitHex(hex: string, head = 8, tail = 6): string {
  const h = hex.trim().toLowerCase();
  if (h.length <= head + tail + 1) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

async function sha256HexUtf8(text: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Builds the Soroban `send_tip` message for a paid ask (≤ 280 chars).
 */
export async function buildAskTipMessage(questionBody: string): Promise<string> {
  const hash = await sha256HexUtf8(questionBody);
  return `${ASK_MESSAGE_PREFIX}${hash}`;
}
