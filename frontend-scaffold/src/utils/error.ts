import {
  CONTRACT_NOT_CONFIGURED_CODE,
  getContractSetupInstructions,
} from "@/config/contractSetup";

export const ERRORS = {
  UNSUPPORTED_NETWORK:
    "Unsupported network selected, please use Futurenet in Freighter",
  FREIGHTER_NOT_AVAILABLE: "Please install Freighter to connect your wallet",
  UNABLE_TO_SUBMIT_TX: "Unable to submit transaction",
  UNABLE_TO_SIGN_TX: "Unable to sign transaction",
  WALLET_CONNECTION_REJECTED: "Wallet connection rejected",
  NETWORK: "Unable to connect. Please check your internet connection.",
  CONTRACT:
    "Check your internet connection and wallet network, then try again.",
  NOT_FOUND: "The requested content could not be found.",
};

export type ErrorCategory = 'network' | 'contract' | 'not-found' | 'unknown';

/** Transport / connectivity failures (not unfunded account or contract revert). */
export function isLikelyNetworkErrorMessage(message: string): boolean {
  const m = message.toLowerCase();
  if (!m.trim()) return false;
  if (
    m.includes("unable to connect") ||
    m.includes("check your internet connection") ||
    m.includes("internet connection appears to be") ||
    m.includes("you are offline") ||
    m.includes("network request failed") ||
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed") ||
    m.includes("connection refused") ||
    m.includes("connection reset") ||
    m.includes("socket hang up") ||
    m.includes("econnrefused") ||
    m.includes("econnreset") ||
    m.includes("enetunreach") ||
    m.includes("etimedout") ||
    m.includes("timed out") ||
    m.includes("err_internet_disconnected") ||
    m.includes("err_network_changed") ||
    m.includes("could not connect to the server")
  ) {
    return true;
  }
  if (m.includes("aborted") && (m.includes("fetch") || m.includes("signal"))) {
    return true;
  }
  return false;
}

export const categorizeError = (error: unknown): ErrorCategory => {
  if (!error) return "unknown";

  const raw = String(error);
  const errorString = raw.toLowerCase();

  if (isLikelyNetworkErrorMessage(raw)) {
    return "network";
  }

  if (
    errorString.includes("hosterror") ||
    errorString.includes("escalating error") ||
    errorString.includes("diagnostic event") ||
    errorString.includes("contract call failed") ||
    errorString.includes("simulation") ||
    errorString.includes("simulate transaction")
  ) {
    return "contract";
  }

  if (
    errorString.includes("not found") ||
    errorString.includes("404") ||
    errorString.includes("could not find")
  ) {
    return "not-found";
  }

  if (
    errorString.includes("network") ||
    errorString.includes("fetch") ||
    errorString.includes("connection")
  ) {
    return "network";
  }

  if (
    errorString.includes("contract") ||
    errorString.includes("soroban") ||
    errorString.includes("transaction")
  ) {
    return "contract";
  }

  return "contract";
};

const MAX_ERROR_MESSAGE_LEN = 480;

function clampErrorMessage(m: string): string {
  const t = m.trim();
  if (t.length <= MAX_ERROR_MESSAGE_LEN) return t;
  return `${t.slice(0, MAX_ERROR_MESSAGE_LEN - 1)}…`;
}

/** Soroban uses this classic “null” account as a simulation source; it is not the user’s wallet. */
export const STELLAR_NULL_ACCOUNT_ADDRESS =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

/** Stellar RPC/Horizon when the address has never received XLM (no ledger account). */
export function isStellarAccountNotFundedMessage(message: string): boolean {
  if (isLikelyNetworkErrorMessage(message)) return false;
  const m = message.toLowerCase();
  if (
    m.includes("hosterror") ||
    m.includes("diagnostic event") ||
    m.includes("simulation") ||
    m.includes("escalating error")
  ) {
    return false;
  }
  if (!m.includes("account not found")) return false;
  return /\bG[A-Z0-9]{55}\b/.test(message);
}

/** Turn "Account not found: G…" into actionable copy (fund via Friendbot on testnet). */
function clarifyStellarUnfundedAccount(message: string): string {
  if (!isStellarAccountNotFundedMessage(message)) return message;

  const allAddrs = message.match(/\b(G[A-Z0-9]{55})\b/g) ?? [];
  const userAddr =
    allAddrs.find((a) => a !== STELLAR_NULL_ACCOUNT_ADDRESS) ?? null;

  if (!userAddr) {
    return (
      "Stellar couldn’t find an on-chain account for this request. " +
      "If you’re new on Testnet, fund **your** wallet with a little XLM first (Friendbot — paste the address shown in your wallet, not a placeholder). " +
      "That reserve covers network fees only, not your USDC balance. On Mainnet, send a small amount of XLM to this wallet before signing again."
    );
  }

  const friendbotUrl = `https://friendbot.stellar.org/?addr=${encodeURIComponent(userAddr)}`;
  return (
    "Your wallet isn’t on the Stellar ledger yet (no funded account). " +
    "You need a small XLM balance so the network can charge fees — that’s separate from USDC for tips. " +
    `On Testnet you can use Friendbot with your address. On Mainnet, send a little XLM from an exchange or another wallet first. ` +
    `Testnet: ${friendbotUrl}`
  );
}

/** Zap402 `ContractError::NotInitialized` — WASM deployed but `initialize` was never invoked. */
function clarifyZap402NotInitialized(message: string): string {
  if (/Error\s*\(\s*Contract\s*,\s*#2\s*\)/i.test(message)) {
    return (
      "This Zap402 contract is not initialized yet. " +
      "Deploy only uploads the WASM; you still need to invoke initialize once (admin, fee_collector, fee_bps, tip asset SAC — use USDC’s contract id for USDC-only flows). " +
      "See docs/DEPLOYMENT.md in the repo for the exact stellar/soroban contract invoke command, then try registering again."
    );
  }
  return message;
}

/** Zap402 `ContractError::NotRegistered` — `get_profile` when the address has no creator profile. */
function clarifyZap402NotRegistered(message: string): string {
  if (isAddressWithoutProfileError(message)) {
    return (
      "This wallet doesn’t have a Zap402 creator profile on-chain yet. " +
      "Register from the Register page (or Profile), then open the terminal again."
    );
  }
  return message;
}

/** Zap402 `ContractError::AlreadyRegistered` — `register_profile` when this address already has a profile. */
function clarifyZap402AlreadyRegistered(message: string): string {
  if (
    /Error\s*\(\s*Contract\s*,\s*#4\s*\)/i.test(message) ||
    /topics:\s*\[error,\s*Error\s*\(\s*Contract\s*,\s*#4\s*\)\]/i.test(message)
  ) {
    return (
      "You already have a creator page with this wallet. " +
      "Open Creator home to manage tips and settings, or Edit profile to change your details. " +
      "One wallet address can only register once — use another wallet if you need a separate page."
    );
  }
  return message;
}

/** Zap402 `register_profile` invalid input (commonly username format mismatch). */
function clarifyZap402RegisterInvalidInput(message: string): string {
  const m = message.toLowerCase();
  const isContract7 =
    /error\s*\(\s*contract\s*,\s*#7\s*\)/i.test(message) ||
    /topics:\s*\[error,\s*error\s*\(\s*contract\s*,\s*#7\s*\)\]/i.test(message);
  const isRegisterCall = m.includes("register_profile");
  if (isContract7 && isRegisterCall) {
    return (
      "Profile registration failed due to invalid profile input. " +
      "For username, use 3-32 chars: start with a letter, then lowercase letters, numbers, or underscores only. " +
      "Hyphens are not supported by this contract version."
    );
  }
  return message;
}

/** Old @stellar/stellar-sdk cannot parse newer Soroban RPC XDR (e.g. simulation return value). */
function clarifySdkXdrMismatch(message: string): string {
  if (/bad union switch/i.test(message)) {
    return (
      "The app could not decode the network response (XDR / protocol mismatch). " +
      "This usually means @stellar/stellar-sdk is outdated compared to testnet. " +
      "Use @stellar/stellar-sdk v14+ (see package.json), run npm install, restart the dev server, and try again."
    );
  }
  return message;
}

/** Zap402 `ContractError::CannotTipSelf` = 11 — tipper and creator are the same address. */
function clarifyCannotTipSelf(message: string): string {
  const m = message.toLowerCase();
  if (
    /error\s*\(\s*contract\s*,\s*#11\s*\)/i.test(message) ||
    /topics:\s*\[error,\s*error\s*\(\s*contract\s*,\s*#11\s*\)\]/i.test(message) ||
    (m.includes("contract") && m.includes("#11") && m.includes("send_tip"))
  ) {
    return (
      "You can’t zap your own profile — the contract rejects tips when your wallet is the same as the creator. " +
      "Switch to a different wallet in Freighter (or another Stellar wallet), or ask someone else to open your public zap link."
    );
  }
  return message;
}

/** Freighter / wallet declined or closed the signing prompt — not a network failure. */
function clarifyWalletRejected(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("user rejected") ||
    m.includes("rejected the request") ||
    m.includes("request rejected") ||
    m.includes("denied transaction") ||
    m.includes("user denied") ||
    m.includes("cancelled") ||
    m.includes("canceled") ||
    m.includes("closed the window")
  ) {
    return (
      "The transaction was not signed in your wallet (declined or closed). " +
      "Nothing was charged. Try again when you’re ready to approve."
    );
  }
  return message;
}

/** Soroban Stellar Asset Contract: TrustlineMissingError (#13) when a classic account has no trustline for the asset. */
function clarifyUsdcTrustlineMissing(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("trustline entry is missing") ||
    m.includes("trustline is missing") ||
    (m.includes("#13") && m.includes("trustline"))
  ) {
    return (
      "Your Stellar account doesn’t have a USDC trustline for this network, so the wallet cannot send USDC for this unlock. " +
      "Add a USDC trustline in your wallet for the same USDC this app uses and fund USDC. " +
      "On Testnet, a common test USDC issuer is GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5. " +
      "You still need a small Stellar account reserve (not USDC) so the network can charge transaction fees."
    );
  }
  return message;
}

function clarifySorobanUserMessages(message: string): string {
  return clarifySdkXdrMismatch(
    clarifyZap402NotRegistered(
      clarifyZap402AlreadyRegistered(
        clarifyZap402RegisterInvalidInput(
        clarifyZap402NotInitialized(
          clarifyZap402InvalidAction(
          clarifyStellarUnfundedAccount(
            clarifyWalletRejected(
              clarifyUsdcTrustlineMissing(clarifyCannotTipSelf(message)),
            ),
          ),
          ),
        ),
        ),
      ),
    ),
  );
}

/** Older or incompatible Zap402 WASM can trap update_profile with InvalidAction. */
function clarifyZap402InvalidAction(message: string): string {
  const m = message.toLowerCase();
  const looksInvalidAction =
    m.includes("invalidaction") ||
    (m.includes("wasmvm") && m.includes("unreachablecodereached"));
  const looksProfileUpdate =
    m.includes("update_profile") ||
    m.includes("fn_call") && m.includes("update_profile");
  if (looksInvalidAction && looksProfileUpdate) {
    return (
      "Profile update failed because the deployed contract appears to be an older or incompatible build. " +
      "Point VITE_CONTRACT_ID to your latest deployed Zap402 contract (or redeploy + initialize), then restart the app and try again."
    );
  }
  return message;
}

/** Readable message from thrown values (SDK sometimes uses non-`Error` rejects). */
export function errorMessageFromUnknown(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

/**
 * `get_profile` failed because this address is not registered as a creator (or similar RPC text).
 *
 * Important: do **not** treat generic “not found” substrings as “no profile” — many RPC/SDK errors
 * mention “not found” (HTTP 404, contract lookup, etc.) and would incorrectly clear the profile store.
 */
export function isNoCreatorProfileContractError(err: unknown): boolean {
  const msg = errorMessageFromUnknown(err);
  if (isStellarAccountNotFundedMessage(msg)) return false;
  if (msg.includes(CONTRACT_NOT_CONFIGURED_CODE)) return false;
  if (isLikelyNetworkError(err)) return false;
  if (isAddressWithoutProfileError(msg)) return true;
  const low = msg.toLowerCase();
  return low.includes("profile not found");
}

/**
 * Soroban `prepareTransaction` throws `simResponse.error`, which is often a string or JSON-RPC
 * object — not an `Error`. Same for some RPC failures. Pull a human-readable message when possible.
 */
function messageFromRpcOrUnknown(error: unknown): string | undefined {
  if (error == null) return undefined;

  if (typeof error === "string") {
    const t = error.trim();
    return t.length > 0 ? t : undefined;
  }

  if (error instanceof Error) {
    const m = error.message?.trim();
    if (m) return m;
    if (error.cause !== undefined) {
      return messageFromRpcOrUnknown(error.cause);
    }
    return undefined;
  }

  if (typeof error === "object") {
    const o = error as Record<string, unknown>;
    // JSON-RPC envelope: { error: { message, data } }
    if (o.error && typeof o.error === "object") {
      const inner = o.error as Record<string, unknown>;
      if (typeof inner.message === "string" && inner.message.trim()) {
        return inner.message.trim();
      }
      if (typeof inner.data === "string" && inner.data.trim()) {
        return inner.data.trim();
      }
    }
    for (const key of ["message", "detail", "errorMessage"] as const) {
      const v = o[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
  }

  return undefined;
}

/** Safe, readable message for transaction / contract failures in the UI. */
export function formatUserFacingContractError(error: unknown): string {
  if (typeof error === "string") {
    const t = error.trim();
    if (t === CONTRACT_NOT_CONFIGURED_CODE) {
      return getContractSetupInstructions();
    }
    if (t.length > 0) {
      return clampErrorMessage(clarifySorobanUserMessages(t));
    }
  }

  const resolved = messageFromRpcOrUnknown(error);
  if (resolved) {
    if (resolved === CONTRACT_NOT_CONFIGURED_CODE) {
      return getContractSetupInstructions();
    }
    return clampErrorMessage(clarifySorobanUserMessages(resolved));
  }

  if (error && typeof error === "object") {
    try {
      const s = JSON.stringify(error);
      if (s && s !== "{}" && s.length <= MAX_ERROR_MESSAGE_LEN + 80) {
        return clampErrorMessage(clarifySorobanUserMessages(s));
      }
    } catch {
      /* ignore */
    }
  }

  return (
    "We couldn’t complete that on-chain action. " +
    "Confirm Freighter is on the same network as this app (e.g. Testnet), your account has a small Stellar fee reserve and USDC where needed, and VITE_CONTRACT_ID matches the contract you deployed. " +
    "Check the browser console for the raw error if it keeps happening."
  );
}

export function isLikelyNetworkError(error: unknown): boolean {
  const fromMsg = messageFromRpcOrUnknown(error);
  const s = `${fromMsg ?? ""} ${String(error)}`.toLowerCase();
  return (
    s.includes("failed to fetch") ||
    s.includes("network error") ||
    s.includes("network request failed") ||
    s.includes("load failed")
  );
}

/**
 * Soroban simulates `get_profile_by_username` as failing when no profile exists.
 * The RPC returns an error string (often referencing contract error #14 = NotFound).
 */
export function isLikelyProfileMissingSimulationError(message: string): boolean {
  if (isStellarAccountNotFundedMessage(message)) return false;
  const m = message.toLowerCase();
  if (m.includes('not found') || m.includes('notfound')) return true;
  // Zap402 `ContractError::NotFound` (repr 14) in host / VM error text
  if (/#14\b/.test(m)) return true;
  if (/\bcontract\b.*\b14\b/.test(m)) return true;
  if (m.includes('hosterror') && m.includes('14')) return true;
  return false;
}

/**
 * `get_profile` when the address has no creator profile (ContractError::NotRegistered = 5).
 */
export function isAddressWithoutProfileError(message: string): boolean {
  const m = message.toLowerCase();
  if (m.includes('not registered') || m.includes('notregistered')) return true;
  if (/#5\b/.test(message)) return true;
  if (m.includes('hosterror') && /\b5\b/.test(m)) return true;
  return false;
}

/**
 * `register_profile` failed because this address already has a profile (Zap402 `ContractError::AlreadyRegistered` = 4).
 */
export function isAlreadyRegisteredContractError(err: unknown): boolean {
  const msg = errorMessageFromUnknown(err);
  return (
    /Error\s*\(\s*Contract\s*,\s*#4\s*\)/i.test(msg) ||
    /topics:\s*\[error,\s*Error\s*\(\s*Contract\s*,\s*#4\s*\)\]/i.test(msg)
  );
}
