import React from "react";

import { useProfile } from "@/hooks/useProfile";

/**
 * Single in-app subscription that loads the connected wallet’s profile into the store.
 * Header/footer read the store only (no duplicate get_profile calls).
 */
const ProfileStoreSync: React.FC = () => {
  useProfile();
  return null;
};

export default ProfileStoreSync;
