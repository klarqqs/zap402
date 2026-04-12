/**
 * Marketing / product URLs and social links (single source of truth for shell + landing).
 */
export const site = {
  name: "Zap402",
  tagline: "USDC-first creator payouts on Stellar — zaps, unlocks, and AI",
  githubRepo: "https://github.com/Akanimoh12/stellar-tipz",
  githubOrgRepo: "https://github.com/Akanimoh12/Stellar-Tipz",
  twitter: "https://twitter.com/TipzApp",
  stellarDiscord: "https://discord.gg/stellardev",
  sorobanDocs: "https://soroban.stellar.org/docs",
  sorobanHome: "https://soroban.stellar.org",
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
