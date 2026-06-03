#!/bin/bash

# Default amount: 100 ETH (in wei, hex format)
# 100 ETH = 100 * 10^18 = 100000000000000000000 = 0x56bc75e2d63100000
AMOUNT="0x56bc75e2d63100000"
RPC_URL=${RPC_URL:-"http://127.0.0.1:8545"}

if [ "$#" -eq 0 ]; then
    echo "Usage: ./fund-addresses.sh <address1> [address2] [address3] ..."
    echo "Example: ./fund-addresses.sh 0x123... 0x456..."
    exit 1
fi

echo "Funding addresses on Anvil at $RPC_URL"

for ADDRESS in "$@"
do
    echo "Setting balance of $ADDRESS to 100 ETH..."
    # Using anvil_setBalance to magically mint ETH without needing a sender or gas
    cast rpc anvil_setBalance "$ADDRESS" "$AMOUNT" --rpc-url "$RPC_URL" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully funded $ADDRESS"
    else
        echo "❌ Failed to fund $ADDRESS"
    fi
done
