#!/bin/bash
set -euo pipefail

echo "=== ePass Contract Deployment & Env Sync ==="

if ! curl -s http://127.0.0.1:8545 -X POST -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo "❌ Anvil is not running. Start it with: anvil"
    exit 1
fi

echo "✅ Anvil is running. Deploying contracts..."

# Capture the output of forge script
OUTPUT=$(forge script script/Deploy.s.sol:Deploy --broadcast --rpc-url http://127.0.0.1:8545)
echo "$OUTPUT"

echo "=== Syncing to .env ==="

ENV_FILE="../epass-web/.env"

# Ensure .env exists, if not, copy from .env.example
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  $ENV_FILE not found, creating from .env.example..."
    cp ../epass-web/.env.example "$ENV_FILE"
fi

# Extract addresses from output portably
USDC=$(echo "$OUTPUT" | grep "NEXT_PUBLIC_MOCK_USDC_ADDRESS=" | cut -d'=' -f2 | tr -d '\r' | tr -d '\n')
MINTER=$(echo "$OUTPUT" | grep "NEXT_PUBLIC_RIGHTS_MINTER_ADDRESS=" | cut -d'=' -f2 | tr -d '\r' | tr -d '\n')
MASTER=$(echo "$OUTPUT" | grep "NEXT_PUBLIC_PLAYER_RIGHTS_MASTER_ADDRESS=" | cut -d'=' -f2 | tr -d '\r' | tr -d '\n')
FACTORY=$(echo "$OUTPUT" | grep "NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=" | cut -d'=' -f2 | tr -d '\r' | tr -d '\n')

if [[ -z "$USDC" || -z "$MINTER" || -z "$MASTER" || -z "$FACTORY" ]]; then
    echo "❌ Failed to extract one or more addresses from deployment output."
    exit 1
fi

# Update .env portably (works on Linux/macOS without sed -i incompatibilities)
update_env() {
    local key=$1
    local value=$2
    if grep -q "^${key}=" "$ENV_FILE"; then
        # Exclude old key, append new key to temp file, then overwrite
        grep -v "^${key}=" "$ENV_FILE" > "$ENV_FILE.tmp"
        echo "${key}=${value}" >> "$ENV_FILE.tmp"
        mv "$ENV_FILE.tmp" "$ENV_FILE"
    else
        # Append if not found
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

update_env "NEXT_PUBLIC_MOCK_USDC_ADDRESS" "$USDC"
update_env "NEXT_PUBLIC_RIGHTS_MINTER_ADDRESS" "$MINTER"
update_env "NEXT_PUBLIC_PLAYER_RIGHTS_MASTER_ADDRESS" "$MASTER"
update_env "NEXT_PUBLIC_VAULT_FACTORY_ADDRESS" "$FACTORY"

echo "✅ Variables synced to $ENV_FILE!"
