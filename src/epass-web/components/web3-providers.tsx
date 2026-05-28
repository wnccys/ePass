'use client';

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { foundry } from "wagmi/chains";
import { WagmiProvider, http } from "wagmi";

export function Web3Providers({ children }: { children: React.ReactNode }) {
    // Instantiate inside the component to prevent SSR data leaks!
    const [queryClient] = useState(() => new QueryClient());
    const foundryRpcUrl = "http://127.0.0.1:8545";

    const config = getDefaultConfig({
        appName: 'Football Transfer Portal',
        projectId: 'ba9cdaa4859ae0262a0ecdc00bd534f1',
        chains: [foundry],
        wallets: [
            {
                groupName: 'Recommended',
                wallets: [injectedWallet],
            },
        ],
        ssr: true,
        transports: {
            [foundry.id]: http(foundryRpcUrl),
        },
    });

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}