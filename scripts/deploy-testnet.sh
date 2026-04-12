#!/usr/bin/env bash
# Deploy Zap402 to Stellar Testnet and initialize with USDC as the tip / withdrawal SAC
# (Option B — clean deploy; aligns with frontend USDC-first flows).
#
# Usage:
#   ./scripts/deploy-testnet.sh [KEY_NAME]
#
# KEY_NAME defaults to "zap402-deployer" (pass e.g. "Zap402-deployer" if you reuse an old key).

set -euo pipefail

KEY_NAME="${1:-zap402-deployer}"

# Circle testnet USDC on Soroban — same default as frontend-scaffold `STELLAR_TESTNET_USDC_CONTRACT_ID`.
TESTNET_USDC_SAC="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Zap402 — Testnet deployment (USDC tip asset) ==="
echo ""

if ! command -v soroban &> /dev/null; then
    echo "Error: soroban CLI not found. Install with:"
    echo "  cargo install --locked soroban-cli"
    exit 1
fi

if ! soroban keys address "$KEY_NAME" &> /dev/null; then
    echo "Generating new key: $KEY_NAME"
    soroban keys generate "$KEY_NAME" --network testnet
fi

DEPLOYER_ADDR="$(soroban keys address "$KEY_NAME")"
echo "Deployer address: $DEPLOYER_ADDR"

echo "Funding account via Friendbot..."
curl -sS "https://friendbot.stellar.org?addr=$DEPLOYER_ADDR" > /dev/null || true
echo "Friendbot request sent (ignore error if already funded)."
echo ""

echo "Building WASM..."
(cd "$REPO_ROOT/contracts" && cargo build --target wasm32-unknown-unknown --release)

WASM_PATH="$REPO_ROOT/contracts/target/wasm32-unknown-unknown/release/zap402_contract.wasm"

if [ ! -f "$WASM_PATH" ]; then
    echo "Error: Wasm not found at $WASM_PATH"
    exit 1
fi

echo "Deploying contract..."
CONTRACT_ID=$(soroban contract deploy \
    --wasm "$WASM_PATH" \
    --source "$KEY_NAME" \
    --network testnet)

echo ""
echo "=== Deployed ==="
echo "Contract ID: $CONTRACT_ID"
echo ""

echo "Initializing (admin + fee collector = deployer, 2% fee, tip token = testnet USDC SAC)..."
soroban contract invoke \
    --id "$CONTRACT_ID" \
    --source "$KEY_NAME" \
    --network testnet \
    -- \
    initialize \
    --admin "$DEPLOYER_ADDR" \
    --fee_collector "$DEPLOYER_ADDR" \
    --fee_bps 200 \
    --native_token "$TESTNET_USDC_SAC"

echo ""
echo "=== Done ==="
echo "Contract ID: $CONTRACT_ID"
echo ""
echo "Next steps:"
echo "  1. Put this in frontend-scaffold/.env and restart Vite:"
echo "       VITE_CONTRACT_ID=$CONTRACT_ID"
echo "  2. Optional (explicit USDC id; testnet default matches if unset):"
echo "       VITE_USDC_CONTRACT_ID=$TESTNET_USDC_SAC"
echo "  3. Re-register profiles on this new contract (old contract state does not carry over)."
echo "  4. Wallets need a USDC trustline + test USDC to tip and withdraw in USDC."
echo ""
echo "Sanity check (get_config should list native_token = USDC SAC above):"
soroban contract invoke \
    --id "$CONTRACT_ID" \
    --source "$KEY_NAME" \
    --network testnet \
    --send no \
    -- \
    get_config || true
