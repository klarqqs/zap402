/** Profile data from the Zap402 contract */
export interface Profile {
  owner: string;
  username: string;
  displayName: string;
  bio: string;
  imageUrl: string;
  xHandle: string;
  xFollowers: number;
  xEngagementAvg: number;
  creditScore: number;
  totalTipsReceived: string; // i128 as string
  totalTipsCount: number;
  balance: string; // i128 as string
  registeredAt: number;
  updatedAt: number;
}

/** Tip record from the contract */
export interface Tip {
  id: number;
  tipper: string;
  creator: string;
  amount: string; // i128 as string
  message: string;
  timestamp: number;
}

/** On-chain network ranking entry (`get_network`). */
export interface NetworkEntry {
  address: string;
  username: string;
  totalTipsReceived: string;
  creditScore: number;
  /** Zap/tip count when returned by the contract (optional). */
  totalTipsCount?: number;
  /** Registration time (unix seconds) when available, for “Joined” / filters. */
  registeredAt?: number;
}

/** Global contract statistics */
export interface ContractStats {
  totalCreators: number;
  totalTipsCount: number;
  totalTipsVolume: string;
  totalFeesCollected: string;
  feeBps: number;
}

/** `get_config` — tip/withdraw asset is `nativeToken` (SAC contract id; often USDC). */
export interface ContractConfig {
  admin: string;
  feeCollector: string;
  feeBps: number;
  nativeToken: string;
  totalCreators: number;
  totalTipsCount: number;
  totalTipsVolume: string;
  totalFeesCollected: string;
  isInitialized: boolean;
  version: number;
}

/** Credit score tiers */
export type CreditTier = 'new' | 'bronze' | 'silver' | 'gold' | 'diamond';

export const getCreditTier = (score: number): CreditTier => {
  if (score >= 80) return 'diamond';
  if (score >= 60) return 'gold';
  if (score >= 40) return 'silver';
  if (score >= 20) return 'bronze';
  return 'new';
};
