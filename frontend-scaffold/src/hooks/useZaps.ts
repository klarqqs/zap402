import { useState, useEffect, useCallback, useRef } from "react";

import { useContract } from "@/hooks/useContract";
import type { Tip } from "@/types/contract";
export interface ZapsData {
  tips: Tip[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

/**
 * Hook for fetching paginated zap (tip) history for a creator or tipper.
 */
export const useZaps = (
  address: string,
  role: "creator" | "tipper" = "creator",
  limit = 10
): ZapsData => {
  const { getRecentTips, getCreatorTipCount, getTipsByTipper, getTipperTipCount } =
    useContract();

  const [tips, setTips] = useState<Tip[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const offsetRef = useRef(0);

  const fetchZaps = useCallback(
    async (isLoadMore = false) => {
      if (!address || isFetchingRef.current) return;

      isFetchingRef.current = true;
      if (!isLoadMore) setLoading(true);
      setError(null);

      try {
        const currentOffset = isLoadMore ? offsetRef.current : 0;

        const [fetchedTips, count] = await Promise.all([
          role === "creator"
            ? getRecentTips(address, limit, currentOffset)
            : getTipsByTipper(address, limit),
          role === "creator"
            ? getCreatorTipCount(address)
            : getTipperTipCount(address),
        ]);

        if (isLoadMore) {
          setTips((prev) => [...prev, ...fetchedTips]);
        } else {
          setTips(fetchedTips);
        }
        offsetRef.current = isLoadMore ? currentOffset + limit : limit;
        setTotalCount(count);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch zaps");
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [
      address,
      role,
      limit,
      getRecentTips,
      getTipsByTipper,
      getCreatorTipCount,
      getTipperTipCount,
    ]
  );

  useEffect(() => {
    setTips([]);
    offsetRef.current = 0;
    void fetchZaps(false);
  }, [address, role, limit, fetchZaps]);

  const refetch = useCallback(() => {
    offsetRef.current = 0;
    void fetchZaps(false);
  }, [fetchZaps]);

  const loadMore = useCallback(() => {
    if (!loading && tips.length < totalCount) {
      void fetchZaps(true);
    }
  }, [loading, tips.length, totalCount, fetchZaps]);

  const hasMore = tips.length < totalCount;

  return { tips, totalCount, loading, error, refetch, loadMore, hasMore };
};
