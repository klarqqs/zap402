type NetworkType = "TESTNET" | "FUTURENET" | "MAINNET";

/**
 * Circle testnet USDC on Soroban (Stellar Asset Contract). Same id as classic
 * `USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` once deployed.
 * Used when `VITE_USDC_CONTRACT_ID` is unset and the wallet is on testnet.
 */
export const STELLAR_TESTNET_USDC_CONTRACT_ID =
  "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

interface EnvConfig {
  sorobanRpcUrl: string;
  horizonUrl: string;
  networkPassphrase: string;
  contractId: string;
  contractConfigured: boolean;
  network: NetworkType;
  /** Stellar asset contract (e.g. USDC SAC) for Soroban unlock payments. */
  usdcContractId: string;
  /** Optional ImgBB API key — enables “Upload photo” for profile avatars (free tier: api.imgbb.com). */
  imgbbApiKey: string;
}

/**
 * Safely reads environment variables from Vite
 */
function getEnv(): EnvConfig {
  const {
    VITE_SOROBAN_RPC_URL,
    VITE_HORIZON_URL,
    VITE_NETWORK_PASSPHRASE,
    VITE_CONTRACT_ID,
    VITE_NETWORK,
    VITE_USDC_CONTRACT_ID,
    VITE_IMGBB_API_KEY,
  } = (import.meta as unknown as { env: Record<string, string | undefined> }).env

  const contractId = (VITE_CONTRACT_ID || "").trim();

  return {
    sorobanRpcUrl:
      VITE_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",

    horizonUrl:
      VITE_HORIZON_URL || "https://horizon-testnet.stellar.org",

    networkPassphrase:
      VITE_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",

    contractId,
    contractConfigured: contractId.length > 0,

    network: (VITE_NETWORK as NetworkType) || "TESTNET",
    usdcContractId: (VITE_USDC_CONTRACT_ID || "").trim(),
    imgbbApiKey: (VITE_IMGBB_API_KEY || "").trim(),
  };
}

export const env = getEnv();

/**
 * Resolves Soroban token contract for USDC unlocks.
 * - `VITE_USDC_CONTRACT_ID` wins when set (any network).
 * - On testnet, falls back to public test USDC SAC so local dev works without extra env.
 * - On mainnet (`PUBLIC`), you must set `VITE_USDC_CONTRACT_ID` to the real USDC contract.
 */
export function resolveUsdcContractIdForWallet(
  walletNetwork: "TESTNET" | "PUBLIC",
): string {
  if (env.usdcContractId) return env.usdcContractId;
  if (walletNetwork === "TESTNET") return STELLAR_TESTNET_USDC_CONTRACT_ID;
  return "";
}