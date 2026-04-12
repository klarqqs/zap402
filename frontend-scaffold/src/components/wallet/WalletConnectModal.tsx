import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useProfileStore } from "@/state/profileStore";
import { TERMINAL_DEFAULT_PATH } from "@/constants/terminalNav";

const PROFILE_SYNC_TIMEOUT_MS = 3500;

function shouldRouteAfterConnect(pathname: string): boolean {
  if (pathname.startsWith("/terminal")) return false;
  if (pathname === "/register") return false;
  if (pathname === "/profile/edit" || pathname === "/profile/purchases") return false;
  return true;
}

async function waitForProfileResolution(): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < PROFILE_SYNC_TIMEOUT_MS) {
    const { loading, isRegistered } = useProfileStore.getState();
    if (!loading) return isRegistered;
    await new Promise((resolve) => window.setTimeout(resolve, 120));
  }
  return useProfileStore.getState().isRegistered;
}

export type WalletConnectModalContextValue = {
  openConnectModal: () => void;
};

const WalletConnectModalContext =
  createContext<WalletConnectModalContextValue | null>(null);

export function useWalletConnectModal(): WalletConnectModalContextValue {
  const ctx = useContext(WalletConnectModalContext);
  if (!ctx) {
    throw new Error(
      "useWalletConnectModal must be used within WalletConnectModalProvider",
    );
  }
  return ctx;
}

/** Always opens the default Stellar Wallets Kit modal. */
export function useOpenWalletConnect(): () => void {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { connect } = useWallet();
  return useCallback(() => {
    void (async () => {
      await connect();
      if (!shouldRouteAfterConnect(pathname)) return;
      await waitForProfileResolution();
      navigate(TERMINAL_DEFAULT_PATH, { replace: true });
    })();
  }, [connect, navigate, pathname]);
}

export function WalletConnectModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { connect } = useWallet();

  const openConnectModal = useCallback(() => {
    void (async () => {
      await connect();
      if (!shouldRouteAfterConnect(pathname)) return;
      await waitForProfileResolution();
      navigate(TERMINAL_DEFAULT_PATH, { replace: true });
    })();
  }, [connect, navigate, pathname]);

  const value = useMemo(() => ({ openConnectModal }), [openConnectModal]);

  return (
    <WalletConnectModalContext.Provider value={value}>
      {children}
    </WalletConnectModalContext.Provider>
  );
}