import type { NetworkEntry } from "@/types/contract";

/** Stable bucket 0..mod-1 from username (deterministic “vibe” for demo discovery). */
export function browseBucketIndex(username: string, mod: number): number {
  if (mod <= 0) return 0;
  let h = 0;
  for (let i = 0; i < username.length; i += 1) {
    h = (Math.imul(31, h) + username.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % mod;
}

/** Sort by on-chain earnings (same idea as Network leaderboard). */
export function sortNetworkEntriesByTips(entries: NetworkEntry[]): NetworkEntry[] {
  return [...entries].sort((a, b) => {
    const diff = BigInt(b.totalTipsReceived) - BigInt(a.totalTipsReceived);
    if (diff > 0n) return 1;
    if (diff < 0n) return -1;
    return 0;
  });
}
