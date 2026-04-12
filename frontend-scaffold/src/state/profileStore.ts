import { create } from 'zustand';

import { Profile } from '@/types/contract';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  /** True after a successful on-chain profile load for the current wallet. */
  isRegistered: boolean;
}

interface ProfileActions {
  setProfile: (profile: Profile) => void;
  clearProfile: () => void;
  setLoading: (loading: boolean) => void;
  /** Non-null error clears profile + isRegistered; null only clears the error field. */
  setError: (error: string | null) => void;
}

type ProfileStore = ProfileState & ProfileActions;

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  loading: false,
  error: null,
  isRegistered: false,

  setProfile: (profile) => set({ profile, isRegistered: true, error: null }),

  clearProfile: () =>
    set({ profile: null, error: null, loading: false, isRegistered: false }),

  setLoading: (loading) => set({ loading }),

  setError: (error) =>
    set((state) => ({
      error,
      ...(error
        ? { profile: null, isRegistered: false }
        : {}),
    })),
}));
