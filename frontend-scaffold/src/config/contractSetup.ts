/**
 * Thrown when `VITE_CONTRACT_ID` is empty — Vite only reads `.env` at dev/build time.
 * Map this code to {@link getContractSetupInstructions} in user-facing UI.
 */
export const CONTRACT_NOT_CONFIGURED_CODE = "CONTRACT_NOT_CONFIGURED";

/** Path relative to the repository root (where developers clone). */
export const CONTRACT_ENV_FILE_HINT = "frontend-scaffold/.env";

export function getContractSetupInstructions(): string {
  return [
    `Copy frontend-scaffold/.env.example to ${CONTRACT_ENV_FILE_HINT}.`,
    "Deploy the Zap402 WASM on Stellar testnet (see repo README → “Build & deploy contract (testnet)”).",
    "Paste the deployed contract address into VITE_CONTRACT_ID= (starts with C).",
    "Restart the dev server so Vite picks up the change.",
  ].join(" ");
}

/** True when the UI should show env/setup help instead of a heavy error card. */
export function isContractConfigurationHelpText(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t === CONTRACT_NOT_CONFIGURED_CODE) return true;
  if (t === getContractSetupInstructions()) return true;
  const low = t.toLowerCase();
  if (low.includes("vite_contract_id") && low.includes(".env")) return true;
  if (low.includes("contract id is not set")) return true;
  if (low.includes("vite_contract_id") && low.includes("restart")) return true;
  return false;
}
