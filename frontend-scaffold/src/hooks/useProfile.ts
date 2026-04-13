import { useEffect, useCallback, useLayoutEffect } from 'react';

import { useWalletStore } from '@/state/walletStore';
import { useProfileStore } from '@/state/profileStore';
import { errorMessageFromUnknown, isNoCreatorProfileContractError } from '@/utils/error';
import { withTimeout } from '@/utils/withTimeout';
import { useContract } from './useContract';

const PROFILE_FETCH_TIMEOUT_MS = 45_000;

/**
 * Coalesce concurrent profile fetches for the same address (multiple components used to
 * call get_profile in parallel and could wedge RPC or leave loading stuck).
 */
let profileInFlight: { address: string; promise: Promise<void> } | null = null;

/**
 * Manages the connected user's profile state.
 *
 * - Auto-fetches from the contract whenever the connected wallet's publicKey changes.
 * - Updates the profile store on a successful fetch.
 * - Clears the profile store when the wallet disconnects.
 * - Treats an unregistered address as isRegistered = false (no error state).
 */
export const useProfile = () => {
  const { publicKey } = useWalletStore();
  const profile = useProfileStore((s) => s.profile);
  const loading = useProfileStore((s) => s.loading);
  const error = useProfileStore((s) => s.error);
  const isRegistered = useProfileStore((s) => s.isRegistered);

  const { getProfile } = useContract();

  const fetchProfile = useCallback(
    async (address: string) => {
      if (profileInFlight?.address === address) {
        await profileInFlight.promise;
        return;
      }

      const run = (async () => {
        const { setProfile, clearProfile, setLoading, setError } =
          useProfileStore.getState();

       Promise.resolve().then(() => setLoading(true));
        setError(null);

        try {
          const fetched = await withTimeout(
            getProfile(address),
            PROFILE_FETCH_TIMEOUT_MS,
            "Profile",
          );
          setProfile(fetched);
        } catch (err) {
          if (isNoCreatorProfileContractError(err)) {
            clearProfile();
          } else {
            setError(errorMessageFromUnknown(err) || 'Failed to fetch profile');
          }
        } finally {
          useProfileStore.getState().setLoading(false);
        }
      })();

      profileInFlight = { address, promise: run };
      try {
        await run;
      } finally {
        if (profileInFlight?.promise === run) {
          profileInFlight = null;
        }
      }
    },
    [getProfile],
  );

  useLayoutEffect(() => {
    if (publicKey) {
      useProfileStore.getState().setLoading(true);
    }
  }, [publicKey]);

  useEffect(() => {
    if (publicKey) {
      void fetchProfile(publicKey);
    } else {
      profileInFlight = null;
      useProfileStore.getState().clearProfile();
    }
  }, [publicKey, fetchProfile]);

  const refetch = useCallback(() => {
    if (publicKey) {
      profileInFlight = null;
      void fetchProfile(publicKey);
    }
  }, [publicKey, fetchProfile]);

  return { profile, loading, error, isRegistered, refetch };
};
