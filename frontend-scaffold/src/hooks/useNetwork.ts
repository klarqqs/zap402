import { useState, useEffect, useCallback, useRef } from "react";

import { useContract } from "./useContract";
import { NetworkEntry } from "@/types/contract";
import { env } from "@/config/env";

const REFETCH_INTERVAL_MS = 60_000; // 60 seconds
const CACHE_KEY = "network_cache";
const CACHE_DURATION_MS = 30 * 1000; // 30 seconds

interface CacheData {
  entries: NetworkEntry[];
  timestamp: number;
}

export interface NetworkData {
  entries: NetworkEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches on-chain network rankings from the contract and keeps them fresh.
 */
export const useNetwork = (): NetworkData => {
  const { getNetwork } = useContract();

  const [entries, setEntries] = useState<NetworkEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDataRef = useRef(false);
  const isFetchingRef = useRef(false);

  const loadFromCache = useCallback((): NetworkEntry[] | null => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);

      if (
        !parsed ||
        !Array.isArray(parsed.entries) ||
        typeof parsed.timestamp !== "number"
      ) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }

      if (
        !parsed.entries.every(
          (entry: unknown) =>
            entry &&
            typeof entry === "object" &&
            entry !== null &&
            "address" in entry &&
            "username" in entry &&
            "totalTipsReceived" in entry &&
            "creditScore" in entry &&
            typeof (entry as { address: unknown }).address === "string" &&
            typeof (entry as { username: unknown }).username === "string" &&
            typeof (entry as { totalTipsReceived: unknown }).totalTipsReceived ===
              "string" &&
            typeof (entry as { creditScore: unknown }).creditScore === "number",
        )
      ) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }

      const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION_MS;

      if (isExpired) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsed.entries;
    } catch {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, []);

  const saveToCache = useCallback((data: NetworkEntry[]): void => {
    try {
      const cacheData: CacheData = {
        entries: data,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch {
      // Silently fail
    }
  }, []);

  const fetchNetwork = useCallback(async () => {
    if (isFetchingRef.current) return;

    if (!env.contractConfigured) {
      setEntries([]);
      setError(null);
      setLoading(false);
      hasDataRef.current = false;
      isFetchingRef.current = false;
      return;
    }

    isFetchingRef.current = true;
    if (!hasDataRef.current) {
      setLoading(true);
    }
    setError(null);

    try {
      const fetchedEntries = await getNetwork(500);

      setEntries(fetchedEntries);
      hasDataRef.current = true;
      saveToCache(fetchedEntries);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch network data",
      );
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [getNetwork, saveToCache]);

  useEffect(() => {
    const cachedEntries = loadFromCache();

    if (cachedEntries) {
      setEntries(cachedEntries);
      hasDataRef.current = true;
      fetchNetwork();
    } else {
      fetchNetwork();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setInterval(() => {
      fetchNetwork();
    }, REFETCH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [fetchNetwork]);

  const refetch = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEY);
    hasDataRef.current = false;
    fetchNetwork();
  }, [fetchNetwork]);

  return {
    entries,
    loading,
    error,
    refetch,
  };
};
