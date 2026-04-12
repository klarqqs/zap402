import { useMemo, useCallback } from 'react';
import {
  Contract,
  TimeoutInfinite,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";

import { useWallet } from '@/hooks/useWallet';
import { env } from '@/config/env';
import { CONTRACT_NOT_CONFIGURED_CODE } from '@/config/contractSetup';
import {
  getServer,
  getTxBuilder,
  simulateTx,
  submitTx,
  accountToScVal,
  numberToI128,
  BASE_FEE,
} from '@/services';
import { NetworkDetails } from '@/utils/network';
import { useWalletStore } from '@/state/walletStore';
import {
  Profile,
  Tip,
  NetworkEntry,
  ContractStats,
  ContractConfig,
  getCreditTier as calculateCreditTier,
} from '@/types/contract';
import { ProfileFormData } from '@/types/profile';
import { humanToSevenDecimalMinorUnits } from '@/utils/format';
import {
  contractStatsFromRpc,
  contractConfigFromRpc,
  networkEntryFromRpc,
  profileFromRpc,
  tipFromRpc,
} from '@/utils/profileFromRpc';

/**
 * Safely converts a numeric string to a BigInt.
 * Validates that the input is a non-empty string of digits.
 * @param amount The string to convert.
 * @returns The converted BigInt.
 * @throws Error if the amount format is invalid.
 */
function safeStringToBigInt(amount: string): bigint {
  if (!amount || !/^\d+$/.test(amount)) {
    throw new Error("Invalid amount format");
  }
  return BigInt(amount);
}

/**
 * Hook providing typed methods for all Zap402 contract operations.
 */
export const useContract = () => {
  const wallet = useWallet();
  const { network } = useWalletStore();
  
  const networkDetails: NetworkDetails = useMemo(() => ({
    network,
    networkUrl: network === 'TESTNET' ? env.horizonUrl : 'https://horizon.stellar.org',
    networkPassphrase: network === 'TESTNET' 
      ? 'Test SDF Network ; September 2015' 
      : 'Public Global Stellar Network ; September 2015',
  }), [network]);
  
  const server = useMemo(() => getServer(networkDetails), [networkDetails]);
  const contractId = env.contractId;

  // --- Read-only Methods ---

  /** Simulation source must be a funded account; `address` is only passed to `get_profile`. */
  const getProfile = useCallback(async (address: string): Promise<Profile> => {
    const contract = new Contract(contractId);
    const simSource =
      (import.meta.env.VITE_READONLY_SIM_ACCOUNT as string | undefined)?.trim() ||
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    const txBuilder = await getTxBuilder(
      simSource,
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );
    const tx = txBuilder
      .addOperation(contract.call("get_profile", accountToScVal(address)))
      .setTimeout(TimeoutInfinite)
      .build();

    const raw = await simulateTx<unknown>(tx, server);
    return profileFromRpc(raw);
  }, [contractId, server, networkDetails]);

  const getProfileByUsername = useCallback(async (username: string): Promise<Profile> => {
    if (!env.contractConfigured) {
      throw new Error(CONTRACT_NOT_CONFIGURED_CODE);
    }

    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );
    const tx = txBuilder
      .addOperation(contract.call("get_profile_by_username", nativeToScVal(username)))
      .setTimeout(TimeoutInfinite)
      .build();

    const raw = await simulateTx<unknown>(tx, server);
    return profileFromRpc(raw);
  }, [contractId, wallet.publicKey, server, networkDetails]);

  const getAllUsernames = useCallback(async (offset: number, limit: number): Promise<string[]> => {
    if (!env.contractConfigured) {
      throw new Error(CONTRACT_NOT_CONFIGURED_CODE);
    }
    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );
    const tx = txBuilder
      .addOperation(
        contract.call(
          "get_all_usernames",
          nativeToScVal(offset, { type: "u32" }),
          nativeToScVal(limit, { type: "u32" })
        )
      )
      .setTimeout(TimeoutInfinite)
      .build();

    const raw = await simulateTx<unknown>(tx, server);
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => String(item ?? "").trim()).filter(Boolean);
  }, [contractId, wallet.publicKey, server, networkDetails]);

  const getProfilesPage = useCallback(async (offset: number, limit: number): Promise<Profile[]> => {
    if (!env.contractConfigured) {
      throw new Error(CONTRACT_NOT_CONFIGURED_CODE);
    }
    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );
    const tx = txBuilder
      .addOperation(
        contract.call(
          "get_profiles_page",
          nativeToScVal(offset, { type: "u32" }),
          nativeToScVal(limit, { type: "u32" })
        )
      )
      .setTimeout(TimeoutInfinite)
      .build();

    const raw = await simulateTx<unknown>(tx, server);
    if (!Array.isArray(raw)) return [];
    return raw.map(profileFromRpc);
  }, [contractId, wallet.publicKey, server, networkDetails]);

  const getNetwork = useCallback(async (limit: number): Promise<NetworkEntry[]> => {
    if (!env.contractConfigured) {
      throw new Error(CONTRACT_NOT_CONFIGURED_CODE);
    }
    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );
    const tx = txBuilder
      .addOperation(contract.call("get_network", nativeToScVal(limit, { type: "u32" })))
      .setTimeout(TimeoutInfinite)
      .build();

    const raw = await simulateTx<unknown>(tx, server);
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map(networkEntryFromRpc);
  }, [contractId, wallet.publicKey, server, networkDetails]);

  const getStats = useCallback(async (): Promise<ContractStats> => {
    if (!env.contractConfigured) {
      throw new Error(CONTRACT_NOT_CONFIGURED_CODE);
    }
    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );
    const tx = txBuilder
      .addOperation(contract.call("get_stats"))
      .setTimeout(TimeoutInfinite)
      .build();

    const raw = await simulateTx<unknown>(tx, server);
    return contractStatsFromRpc(raw);
  }, [contractId, wallet.publicKey, server, networkDetails]);

  const getContractConfig = useCallback(async (): Promise<ContractConfig> => {
    if (!env.contractConfigured) {
      throw new Error(CONTRACT_NOT_CONFIGURED_CODE);
    }
    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );
    const tx = txBuilder
      .addOperation(contract.call("get_config"))
      .setTimeout(TimeoutInfinite)
      .build();

    const raw = await simulateTx<unknown>(tx, server);
    return contractConfigFromRpc(raw);
  }, [contractId, wallet.publicKey, server, networkDetails]);

  const getMinTipAmount = useCallback(async (): Promise<string> => {
    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );
    const tx = txBuilder
      .addOperation(contract.call("get_min_tip_amount"))
      .setTimeout(TimeoutInfinite)
      .build();

    const minTipStroops = await simulateTx<unknown>(tx, server);
    // i128 from RPC is often bigint — never divide bigint by 1e7 (number).
    return (Number(minTipStroops) / 1e7).toString();
  }, [contractId, wallet.publicKey, server, networkDetails]);

  const getRecentTips = useCallback(async (creator: string, limit: number, offset: number): Promise<Tip[]> => {
    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );
    const tx = txBuilder
      .addOperation(
        contract.call(
          "get_recent_tips",
          accountToScVal(creator),
          nativeToScVal(limit, { type: "u32" }),
          nativeToScVal(offset, { type: "u32" })
        )
      )
      .setTimeout(TimeoutInfinite)
      .build();

    const raw = await simulateTx<unknown>(tx, server);
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map(tipFromRpc);
  }, [contractId, wallet.publicKey, server, networkDetails]);

  const getCreatorTipCount = useCallback(async (creator: string): Promise<number> => {
    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );
    const tx = txBuilder
      .addOperation(contract.call("get_creator_tip_count", accountToScVal(creator)))
      .setTimeout(TimeoutInfinite)
      .build();

    const raw = await simulateTx<unknown>(tx, server);
    return Number(raw);
  }, [contractId, wallet.publicKey, server, networkDetails]);

  const getTipsByTipper = useCallback(async (tipper: string, limit: number): Promise<Tip[]> => {
    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );
    const tx = txBuilder
      .addOperation(
        contract.call(
          "get_tips_by_tipper",
          accountToScVal(tipper),
          nativeToScVal(limit, { type: "u32" })
        )
      )
      .setTimeout(TimeoutInfinite)
      .build();

    const raw = await simulateTx<unknown>(tx, server);
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map(tipFromRpc);
  }, [contractId, wallet.publicKey, server, networkDetails]);

  const getTipperTipCount = useCallback(async (tipper: string): Promise<number> => {
    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );
    const tx = txBuilder
      .addOperation(contract.call("get_tipper_tip_count", accountToScVal(tipper)))
      .setTimeout(TimeoutInfinite)
      .build();

    const raw = await simulateTx<unknown>(tx, server);
    return Number(raw);
  }, [contractId, wallet.publicKey, server, networkDetails]);

  const getCreditTier = useCallback(async (address: string) => {
    const profile = await getProfile(address);
    const tier = calculateCreditTier(profile.creditScore);
    return { score: profile.creditScore, tier };
  }, [getProfile]);

  // --- Write Methods ---

  const registerProfile = useCallback(async (data: ProfileFormData): Promise<string> => {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    if (!env.contractConfigured) {
      throw new Error(CONTRACT_NOT_CONFIGURED_CODE);
    }

    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey,
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );

    const built = txBuilder
      .addOperation(
        contract.call(
          "register_profile",
          accountToScVal(wallet.publicKey),
          nativeToScVal(data.username),
          nativeToScVal(data.displayName),
          nativeToScVal(data.bio),
          nativeToScVal(data.imageUrl),
          nativeToScVal(data.xHandle)
        )
      )
      .setTimeout(TimeoutInfinite)
      .build();

    const prepared = await server.prepareTransaction(built);
    const xdr = prepared.toXDR();
    const signedXdr = await wallet.signTransaction(xdr);
    return submitTx(signedXdr, networkDetails.networkPassphrase, server);
  }, [contractId, wallet, server, networkDetails]);

  const updateProfile = useCallback(async (data: Partial<ProfileFormData>): Promise<string> => {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    if (!env.contractConfigured) {
      throw new Error(CONTRACT_NOT_CONFIGURED_CODE);
    }

    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey,
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );

    /**
     * `Option<String>` for Soroban/Rust: `None` is {@link xdr.ScVal.scvVoid}, `Some(x)` is the
     * inner string as {@link xdr.ScVal.scvString}. Do NOT use `{ type: "some", value }` — that
     * encodes as {@link xdr.ScVal.scvMap} and the contract hits `UnreachableCodeReached`.
     */
    const optionalStringToScVal = (value?: string): xdr.ScVal => {
      if (value !== undefined && value !== "") {
        return nativeToScVal(value, { type: "string" });
      }
      return nativeToScVal(null);
    };

    const built = txBuilder
      .addOperation(
        contract.call(
          "update_profile",
          accountToScVal(wallet.publicKey),
          optionalStringToScVal(data.displayName),
          optionalStringToScVal(data.bio),
          optionalStringToScVal(data.imageUrl),
          optionalStringToScVal(data.xHandle)
        )
      )
      .setTimeout(TimeoutInfinite)
      .build();

    const prepared = await server.prepareTransaction(built);
    const xdr_tx = prepared.toXDR();
    const signedXdr = await wallet.signTransaction(xdr_tx);
    return submitTx(signedXdr, networkDetails.networkPassphrase, server);
  }, [contractId, wallet, server, networkDetails]);

  const sendZap = useCallback(async (creator: string, amount: string, message: string): Promise<string> => {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    if (!env.contractConfigured) {
      throw new Error(CONTRACT_NOT_CONFIGURED_CODE);
    }

    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey,
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );

    // Tip asset minor units (7 decimals — USDC or native SAC per contract config)
    const minorUnits = humanToSevenDecimalMinorUnits(amount).toString();

    const built = txBuilder
      .addOperation(
        contract.call(
          "send_tip",
          accountToScVal(wallet.publicKey),
          accountToScVal(creator),
          numberToI128(safeStringToBigInt(minorUnits)),
          nativeToScVal(message)
        )
      )
      .setTimeout(TimeoutInfinite)
      .build();

    const prepared = await server.prepareTransaction(built);
    const xdr = prepared.toXDR();
    const signedXdr = await wallet.signTransaction(xdr);
    return submitTx(signedXdr, networkDetails.networkPassphrase, server);
  }, [contractId, wallet, server, networkDetails]);

  const withdrawTips = useCallback(async (amount: string): Promise<string> => {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    if (!env.contractConfigured) {
      throw new Error(CONTRACT_NOT_CONFIGURED_CODE);
    }

    const contract = new Contract(contractId);
    const txBuilder = await getTxBuilder(
      wallet.publicKey,
      BASE_FEE,
      server,
      networkDetails.networkPassphrase
    );

    const minorUnits = humanToSevenDecimalMinorUnits(amount).toString();

    const built = txBuilder
      .addOperation(
        contract.call(
          "withdraw_tips",
          accountToScVal(wallet.publicKey),
          numberToI128(safeStringToBigInt(minorUnits))
        )
      )
      .setTimeout(TimeoutInfinite)
      .build();

    const prepared = await server.prepareTransaction(built);
    const xdr = prepared.toXDR();
    const signedXdr = await wallet.signTransaction(xdr);
    return submitTx(signedXdr, networkDetails.networkPassphrase, server);
  }, [contractId, wallet, server, networkDetails]);

  return {
    getProfile,
    getProfileByUsername,
    getAllUsernames,
    getProfilesPage,
    getNetwork,
    getStats,
    getContractConfig,
    getMinTipAmount,
    getRecentTips,
    getCreatorTipCount,
    getTipsByTipper,
    getTipperTipCount,
    getCreditTier,
    registerProfile,
    updateProfile,
    sendZap,
    withdrawTips,
  };
};
