import type { NetworkEntry } from "@/types/contract";

export type NetworkPeriod = "all" | "week" | "month" | "alltime";

/**
 * Period filters use `registeredAt` when present; entries without a date stay visible so
 * on-chain data without timestamps is not hidden.
 */
export function filterNetworkByPeriod(
  entries: NetworkEntry[],
  period: NetworkPeriod,
): NetworkEntry[] {
  if (period === "all" || period === "alltime") {
    return [...entries];
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const cutoff =
    period === "week" ? nowSec - 7 * 86400 : nowSec - 30 * 86400;
  return entries.filter((e) => {
    if (e.registeredAt == null) return true;
    return e.registeredAt >= cutoff;
  });
}
