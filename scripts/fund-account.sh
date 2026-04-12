#!/usr/bin/env bash
# Fund a Stellar Testnet account via Friendbot.
#
# Usage:
#   ./scripts/fund-account.sh <PUBLIC_KEY>

set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage: ./scripts/fund-account.sh <PUBLIC_KEY>"
    exit 1
fi

PUBLIC_KEY="$1"

echo "Funding testnet account: $PUBLIC_KEY"
RESPONSE=$(curl -s "https://friendbot.stellar.org?addr=$PUBLIC_KEY")

if echo "$RESPONSE" | grep -q '"successful"'; then
    echo "Account funded successfully!"
else
    echo "Friendbot response:"
    echo "$RESPONSE"
fi
