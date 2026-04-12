import { useCallback, useMemo } from "react";
import {
  StellarWalletsKit,
  WalletNetwork,
  FREIGHTER_ID,
  XBULL_ID,
  FreighterModule,
  xBullModule,
} from "@creit.tech/stellar-wallets-kit";
import { useWalletStore } from "@/state/walletStore";
import { formatWalletConnectionError } from "@/utils/walletConnectError";

export { FREIGHTER_ID, XBULL_ID };

interface Freighter {
  getNetwork: () => Promise<string>;
  getAddress: () => Promise<string>;
}

let kitInstance: StellarWalletsKit | null = null;
let currentNetwork: WalletNetwork | null = null;

const getKit = (network: WalletNetwork) => {
  if (!kitInstance || currentNetwork !== network) {
    kitInstance = new StellarWalletsKit({
      network,
      selectedWalletId: FREIGHTER_ID,
      modules: [new FreighterModule(), new xBullModule()],
    });
    currentNetwork = network;
  }
  return kitInstance;
};

export const useWallet = () => {
  const {
    publicKey,
    connected,
    connecting,
    error,
    network,
    connect,
    disconnect,
    setConnecting,
    setError,
    setNetwork: storeSetNetwork,
  } = useWalletStore();

  const kitNetwork =
    network === "PUBLIC" ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET;
  const kit = useMemo(() => getKit(kitNetwork), [kitNetwork]);

  const finalizeWalletConnection = useCallback(
    async (walletId: string) => {
      kit.setWallet(walletId);
      const { address } = await kit.getAddress();

      try {
        const freighterWindow = window as unknown as { freighter?: Freighter };
        if (walletId === FREIGHTER_ID && freighterWindow.freighter) {
          const networkDetails = await freighterWindow.freighter.getNetwork();
          const detectedNetwork =
            networkDetails === "PUBLIC" ? "PUBLIC" : "TESTNET";
          if (detectedNetwork !== network) {
            storeSetNetwork(detectedNetwork);
          }
        }
      } catch (e) {
        console.warn("Network auto-detection failed:", e);
      }

      connect(address);
    },
    [kit, network, storeSetNetwork, connect],
  );

  const actions = useMemo(
    () => ({
      connect: async () => {
        setConnecting(true);
        setError(null);
        try {
          await kit.openModal({
            onWalletSelected: async (option) => {
              try {
                await finalizeWalletConnection(option.id);
              } catch (err) {
                console.error("Wallet connection failed:", err);
                setError(
                  formatWalletConnectionError(err, String(option.id)),
                );
                setConnecting(false);
              }
            },
            onClosed: () => {
              setConnecting(false);
            },
          });
        } catch (err) {
          console.error("Wallet modal failed:", err);
          setError(formatWalletConnectionError(err, FREIGHTER_ID));
          setConnecting(false);
        }
      },

      connectWithWallet: async (
        walletId: string,
      ): Promise<{ ok: boolean; errorMessage: string | null }> => {
        setConnecting(true);
        setError(null);
        try {
          await finalizeWalletConnection(walletId);
          return { ok: true, errorMessage: null };
        } catch (err) {
          const message = formatWalletConnectionError(err, walletId);
          console.error("Wallet connection failed:", err);
          setError(message);
          setConnecting(false);
          return { ok: false, errorMessage: message };
        }
      },

      disconnect: () => {
        disconnect();
      },

      setNetwork: (newNetwork: "TESTNET" | "PUBLIC") => {
        storeSetNetwork(newNetwork);
      },

      signTransaction: async (xdr: string): Promise<string> => {
        const { signedTxXdr } = await kit.signTransaction(xdr, {
          address: publicKey ?? undefined,
        });
        return signedTxXdr;
      },
    }),
    [
      publicKey,
      connect,
      disconnect,
      setConnecting,
      setError,
      storeSetNetwork,
      kit,
      finalizeWalletConnection,
    ],
  );

  return useMemo(
    () => ({ publicKey, connected, connecting, error, network, ...actions }),
    [publicKey, connected, connecting, error, network, actions],
  );
};
