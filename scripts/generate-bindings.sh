#!/usr/bin/env bash
# Generate TypeScript bindings from a deployed Soroban contract.
#
# Usage:
#   ./scripts/generate-bindings.sh <CONTRACT_ID>

set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage: ./scripts/generate-bindings.sh <CONTRACT_ID>"
    exit 1
fi

CONTRACT_ID="$1"
OUTPUT_DIR="frontend-scaffold/src/services/generated"

echo "Generating TypeScript bindings for contract: $CONTRACT_ID"

mkdir -p "$OUTPUT_DIR"

soroban contract bindings typescript \
    --network testnet \
    --contract-id "$CONTRACT_ID" \
    --output-dir "$OUTPUT_DIR"

echo "Bindings generated at: $OUTPUT_DIR"
