import { useState, useEffect, useCallback, useRef } from 'react';

import { useWalletStore } from '@/state/walletStore';
import { useContract } from './useContract';
import { useToastStore } from '@/state/toastStore';
import { Profile, ContractStats, Tip } from '@/types/contract';
import {
  categorizeError,
  ERRORS,
  errorMessageFromUnknown,
  isNoCreatorProfileContractError,
} from '@/utils/error';
import { withTimeout } from '@/utils/withTimeout';
import { env } from '@/config/env';

const REFETCH_INTERVAL_MS = 30_000;
const TERMINAL_RPC_TIMEOUT_MS = 45_000;

export interface TerminalData {
  profile: Profile | null;
  tips: Tip[];
  stats: ContractStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches all data required by the terminal (creator session) and keeps it fresh.
 * Uses timeouts so a hung Soroban RPC cannot leave loading / isFetching stuck forever.
 */
export const useTerminal = (): TerminalData => {
  const { publicKey, connected } = useWalletStore();
  const { getProfile, getStats, getRecentTips } = useContract();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDataRef = useRef(false);
  const isFetchingRef = useRef(false);
  const isRegisteredRef = useRef(true);
  /** Bumps on effect cleanup / wallet change so stale async work does not touch loading state (e.g. React Strict Mode). */
  const fetchGenerationRef = useRef(0);

  const fetchTerminal = useCallback(async () => {
    if (!publicKey || !connected || isFetchingRef.current || !isRegisteredRef.current) {
      return;
    }

    const generationAtStart = fetchGenerationRef.current;

    isFetchingRef.current = true;
    if (!hasDataRef.current) {
      setLoading(true);
    }
    setError(null);

    try {
      const { addToast } = useToastStore.getState();

      const statsPromise: Promise<ContractStats | null> = env.contractConfigured
        ? withTimeout(getStats(), TERMINAL_RPC_TIMEOUT_MS, 'Platform stats')
        : Promise.resolve(null);

      const [profileResult, statsResult, tipsResult] = await Promise.allSettled([
        withTimeout(getProfile(publicKey), TERMINAL_RPC_TIMEOUT_MS, 'Terminal profile'),
        statsPromise,
        withTimeout(
          getRecentTips(publicKey, 10, 0),
          TERMINAL_RPC_TIMEOUT_MS,
          'Recent tips',
        ),
      ]);

      if (generationAtStart !== fetchGenerationRef.current) {
        return;
      }

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
        isRegisteredRef.current = true;
      } else {
        const err = profileResult.reason;
        if (isNoCreatorProfileContractError(err)) {
          isRegisteredRef.current = false;
          setProfile(null);
          setStats(null);
          setTips([]);
          hasDataRef.current = false;
        } else {
          setError(errorMessageFromUnknown(err) || 'Failed to fetch profile');
        }
      }

      if (statsResult.status === 'fulfilled' && statsResult.value !== null) {
        setStats(statsResult.value);
      } else if (statsResult.status === 'rejected') {
        const err = statsResult.reason;
        console.warn('Failed to fetch platform stats:', err);
        if (categorizeError(err) === 'network') {
          addToast({ message: ERRORS.NETWORK, type: 'error' });
        }
      }

      if (tipsResult.status === 'fulfilled') {
        setTips(tipsResult.value);
      } else if (tipsResult.status === 'rejected') {
        console.error('Failed to fetch tips:', tipsResult.reason);
      }

      if (profileResult.status === 'fulfilled') {
        hasDataRef.current = true;
      }
    } catch (err) {
      if (generationAtStart === fetchGenerationRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch terminal data');
      }
    } finally {
      isFetchingRef.current = false;
      if (generationAtStart === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [publicKey, connected, getProfile, getStats, getRecentTips]);

  useEffect(() => {
    if (publicKey && connected) {
      isRegisteredRef.current = true;
      hasDataRef.current = false;
      setProfile(null);
      setStats(null);
      setTips([]);
      setError(null);
      void fetchTerminal();
    } else {
      fetchGenerationRef.current += 1;
      isFetchingRef.current = false;
      setProfile(null);
      setStats(null);
      setTips([]);
      setError(null);
      hasDataRef.current = false;
      isRegisteredRef.current = true;
      setLoading(false);
    }

    return () => {
      fetchGenerationRef.current += 1;
      isFetchingRef.current = false;
    };
  }, [publicKey, connected, fetchTerminal]);

  useEffect(() => {
    if (!publicKey || !connected) return;

    const id = setInterval(() => {
      void fetchTerminal();
    }, REFETCH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [publicKey, connected, fetchTerminal]);

  const refetch = useCallback(() => {
    if (publicKey && connected) {
      isRegisteredRef.current = true;
      void fetchTerminal();
    }
  }, [publicKey, connected, fetchTerminal]);

  return { profile, tips, stats, loading, error, refetch };
};
