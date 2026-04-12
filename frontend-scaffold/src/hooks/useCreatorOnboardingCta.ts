import { useOpenWalletConnect } from "@/components/wallet/WalletConnectModal";
import { networkSharePagePath } from "@/content/networkBoardEmpty";
import { useWallet } from "@/hooks/useWallet";
import { useProfileStore } from "@/state/profileStore";

/**
 * Shared landing CTA state: connect → deploy → open creator page, without duplicate logic.
 */
export function useCreatorOnboardingCta() {
  const { connected } = useWallet();
  const openWalletConnect = useOpenWalletConnect();
  const profile = useProfileStore((s) => s.profile);
  const isRegistered = useProfileStore((s) => s.isRegistered);
  const profileHref = networkSharePagePath(profile?.username, isRegistered);

  return {
    connected,
    isRegistered,
    profileHref,
    openWalletConnect,
  };
}
