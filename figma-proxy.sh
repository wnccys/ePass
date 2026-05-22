#!/bin/bash

# Fix for WSL2 to Windows connection issues with Figma MCP
# Forwards IPv4 traffic to the IPv6 port the MCP server binds to

echo "Starting Figma MCP IPv4 to IPv6 Proxy..."

# Kill any existing background proxies so we don't get 'Address already in use' errors
pkill -f "socat TCP4-LISTEN:9224" 2>/dev/null || true

# Start the proxy in the background using nohup so it survives closing the terminal
nohup socat TCP4-LISTEN:9224,fork,bind=0.0.0.0 TCP6:[::1]:9223 > /tmp/figma-proxy.log 2>&1 &

echo "✅ Proxy running! Figma Desktop (Windows) can now reach the MCP server (WSL2)."
echo "You can check proxy logs anytime at: cat /tmp/figma-proxy.log"
