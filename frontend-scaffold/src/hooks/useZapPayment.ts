import { useCallback, useMemo, useState } from "react";

import { useOpenWalletConnect } from "@/components/wallet/WalletConnectModal";
import { env, resolveUsdcContractIdForWallet } from "@/config/env";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "./useWallet";
import { useZap402 } from "@/hooks/useZap402";
import { sendSorobanTokenPayment, sendUnlockTokenPayment } from "@/services/unlockPayment";
import { useWalletStore } from "@/state/walletStore";
import type { NetworkDetails } from "@/utils/network";
import { buildAskTipMessage } from "@/utils/askOnChain";
import { formatUserFacingContractError } from "@/utils/error";

export type ZapPaymentStatus =
  | "idle"
  | "needs_wallet"
  | "confirming"
  | "signing"
  | "verifying"
  | "success"
  | "error";

export interface ZapPaymentState {
  status: ZapPaymentStatus;
  error: string | null;
  txHash: string | null;
}

export interface PayToUnlockOptions {
  creatorAddress: string;
}

/**
 * Layer 1 (Zap): Soroban `send_tip` using the contract’s configured tip SAC (USDC when so configured).
 * Unlocks: Soroban `send_tip` on Zap402 (same escrow as zaps) when `VITE_CONTRACT_ID` is set;
 * otherwise legacy direct USDC transfer to creator.
 * Pay-to-ask: Soroban `send_tip` with message `ask:<sha256>` when the contract is configured;
 * otherwise legacy direct USDC (no on-chain link to the question — prefer setting `VITE_CONTRACT_ID`).
 */
export function useZapPayment() {
  const { connected, publicKey, signTransaction } = useWallet();
  const { network } = useWalletStore();
  const openWalletConnect = useOpenWalletConnect();
  const { sendZap: contractSendZap } = useContract();
  const { sendZap, txHash, txStatus, error: zap402Error, reset } = useZap402();

  const networkDetails: NetworkDetails = useMemo(
    () => ({
      network,
      networkUrl:
        network === "PUBLIC"
          ? "https://horizon.stellar.org"
          : env.horizonUrl,
      networkPassphrase:
        network === "PUBLIC"
          ? "Public Global Stellar Network ; September 2015"
          : env.networkPassphrase,
    }),
    [network],
  );

  const [layer23State, setLayer23State] = useState<ZapPaymentState>({
    status: "idle",
    error: null,
    txHash: null,
  });

  const ensureWallet = useCallback(async (): Promise<boolean> => {
    if (connected && publicKey) return true;
    openWalletConnect();
    return false;
  }, [connected, publicKey, openWalletConnect]);

  const executeZap = useCallback(
    async (creator: string, zapAmount: string, message: string) => {
      if (!(await ensureWallet())) {
        throw new Error("Wallet required");
      }
      await sendZap(creator, zapAmount, message);
    },
    [ensureWallet, sendZap],
  );

  const payToUnlock = useCallback(
    async (
      contentId: string,
      amountStr: string,
      opts: PayToUnlockOptions,
    ): Promise<{ ok: boolean; txHash: string | null }> => {
      if (!(await ensureWallet()) || !publicKey) {
        setLayer23State({ status: "needs_wallet", error: null, txHash: null });
        throw new Error("Wallet required");
      }

      if (!opts.creatorAddress?.trim()) {
        throw new Error("Unlock requires the creator Stellar address.");
      }

      setLayer23State({ status: "signing", error: null, txHash: null });

      try {
        let hash: string;

        if (env.contractConfigured) {
          const msg = `unlock:${contentId}`;
          hash = await contractSendZap(opts.creatorAddress.trim(), amountStr, msg);
        } else {
          const tokenId = resolveUsdcContractIdForWallet(network);
          if (!tokenId) {
            throw new Error(
              "Set VITE_CONTRACT_ID for Zap402 unlocks (recommended), or VITE_USDC_CONTRACT_ID for legacy direct USDC. Testnet USDC defaults when unset.",
            );
          }
          hash = await sendUnlockTokenPayment({
            networkDetails,
            tokenContractId: tokenId,
            buyerPublicKey: publicKey,
            creatorAddress: opts.creatorAddress,
            amountHuman: amountStr,
            signTransaction,
          });
        }

        setLayer23State({
          status: "success",
          error: null,
          txHash: hash,
        });
        return { ok: true, txHash: hash };
      } catch (e) {
        const msg = formatUserFacingContractError(e);
        setLayer23State({
          status: "error",
          error: msg,
          txHash: null,
        });
        throw new Error(msg, { cause: e });
      }
    },
    [ensureWallet, publicKey, signTransaction, networkDetails, network, contractSendZap],
  );

  const payToAsk = useCallback(
    async (
      creatorAddress: string,
      message: string,
      priceUsdc = "0.05",
    ): Promise<string | null> => {
      if (!(await ensureWallet()) || !publicKey) {
        setLayer23State({ status: "needs_wallet", error: null, txHash: null });
        return null;
      }
      if (!creatorAddress?.trim()) {
        setLayer23State({
          status: "error",
          error: "Missing creator address.",
          txHash: null,
        });
        return null;
      }
      if (!message?.trim()) {
        setLayer23State({
          status: "error",
          error: "Ask message is required.",
          txHash: null,
        });
        return null;
      }

      setLayer23State({ status: "signing", error: null, txHash: null });

      try {
        const onChainMessage = await buildAskTipMessage(message.trim());

        if (env.contractConfigured) {
          const txHash = await contractSendZap(
            creatorAddress.trim(),
            priceUsdc,
            onChainMessage,
          );
          setLayer23State({
            status: "success",
            error: null,
            txHash,
          });
          return txHash;
        }

        const tokenId = resolveUsdcContractIdForWallet(network);
        if (!tokenId) {
          throw new Error(
            "Set VITE_USDC_CONTRACT_ID for mainnet pay-to-ask. Testnet uses a default USDC contract when unset.",
          );
        }
        const txHash = await sendSorobanTokenPayment({
          networkDetails,
          tokenContractId: tokenId,
          payerPublicKey: publicKey,
          recipientAddress: creatorAddress.trim(),
          amountHuman: priceUsdc,
          signTransaction,
        });
        setLayer23State({
          status: "success",
          error: null,
          txHash,
        });
        return txHash;
      } catch (e) {
        const msg = formatUserFacingContractError(e);
        setLayer23State({
          status: "error",
          error: msg,
          txHash: null,
        });
        throw new Error(msg, { cause: e });
      }
    },
    [
      ensureWallet,
      publicKey,
      signTransaction,
      networkDetails,
      network,
      contractSendZap,
    ],
  );

  const resetLayer23 = useCallback(() => {
    setLayer23State({ status: "idle", error: null, txHash: null });
  }, []);

  return {
    connected,
    connect: openWalletConnect,
    ensureWallet,
    executeZap,
    payToUnlock,
    payToAsk,
    zapTxHash: txHash,
    zapTxStatus: txStatus,
    zapError: zap402Error,
    resetZap: reset,
    layer23: layer23State,
    resetLayer23,
  };
}
