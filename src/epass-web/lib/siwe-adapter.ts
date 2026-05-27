import { createAuthenticationAdapter } from "@rainbow-me/rainbowkit";
import { createSiweMessage } from "viem/siwe";

export const linkingAdapter = createAuthenticationAdapter({
    // 1. Fetch a fresh nonce from your backend
    getNonce: async () => {
        const response = await fetch('/api/siwe/nonce');
        const { nonce } = await response.json()
        return nonce;
    },
    // 2. Format the standardized EIP-4361 message
    createMessage: ({ nonce, address, chainId }) => {
        return createSiweMessage({
            domain: window.location.host,
            address,
            statement: 'Sign in to link this wallet to your Player/Club Profile.',
            uri: window.location.origin,
            version: '1',
            chainId,
            nonce
        })
    },
    // 3. Send the signature to your backend to verify and link
    verify: async ({ message, signature }) => {
        const verifyRes = await fetch('/api/siwe/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, signature }),
        });
        return Boolean(verifyRes.ok);
    },
    // 4. Keep the session active in the UI if verification succeeds
    signOut: async () => {/** Empty since Google NextAuth handles real logouts */ },
})