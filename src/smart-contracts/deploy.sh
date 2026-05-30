#!/bin/bash
set -euo pipefail

echo "=== ePass Contract Deployment ==="
echo ""

# Check if anvil is running
if ! curl -s http://127.0.0.1:8545 -X POST -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo "❌ Anvil is not running. Start it with: anvil"
    exit 1
fi

echo "✅ Anvil is running"
echo ""

# Deploy
forge script script/Deploy.s.sol:Deploy --broadcast --rpc-url http://127.0.0.1:8545

echo ""
echo "=== Deployment Complete ==="
echo "Copy the addresses above to src/epass-web/.env.local"
