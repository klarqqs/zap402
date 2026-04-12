/**
 * Marketing / product URLs and social links (single source of truth for shell + landing).
 */

export const site = {
  name: "Zap402",
  tagline: "The payment layer for AI commerce — pay-per-query agents on Stellar",
  description: "Browse 20+ AI agents, pay per prompt in USDC, get on-chain receipts. Every query is a closed deal on Stellar.",
  githubRepo: "https://github.com/klarqqs/zap402",
  githubOrgRepo: "https://github.com/klarqqs/zap402",
  twitter: "https://twitter.com/zap402",
  stellarDiscord: "https://discord.gg/stellardev",
  sorobanDocs: "https://soroban.stellar.org/docs",
  sorobanHome: "https://soroban.stellar.org",
  x402Docs: "https://x402.org",
  docsUrl: "https://zap402.xyz/docs",
} as const;
 

/** Public URL for /@username links (env override, else current origin in the browser). */
export function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_APP_URL as string | undefined;
  if (fromEnv?.trim()) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export const contractSpecUrl = `${site.githubOrgRepo}/blob/main/docs/CONTRACT_SPEC.md`;
export const docsUrl = `${site.githubOrgRepo}/blob/main/README.md`;
/** Product updates & notes (X until a dedicated blog exists). */
export const blogUrl = site.twitter;
