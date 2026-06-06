'use client';

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { injectedWallet, safeWallet } from '@rainbow-me/rainbowkit/wallets';
import { foundry, sepolia } from "wagmi/chains";
import { WagmiProvider, createStorage, http, noopStorage } from "wagmi";
import { env } from "@/env";

export const chainMap =  {
    foundry: foundry,
    sepolia: sepolia
};

export const transports = {
    [foundry.id]: http(env.NEXT_PUBLIC_FOUNDRY_RPC_URL),
    [sepolia.id]: http(), // Uses Wagmi's public RPC endpoint or our Sepolia RPC env
}

export function Web3Providers({ children }: { children: React.ReactNode }) {
    // Instantiate inside the component to prevent SSR data leaks!
    const [queryClient] = useState(() => new QueryClient());

    const activeChain = chainMap[env.NEXT_PUBLIC_APP_NETWORK];

    const [config] = useState(() => {
        const storage = createStorage({
            key: "epass-wagmi",
            storage: typeof window !== "undefined" ? window.localStorage : noopStorage,
        });

        return getDefaultConfig({
            appName: 'Football Transfer Portal',
            projectId: env.NEXT_PUBLIC_RAINBOW_PROJECT_ID,
            chains: [activeChain],
            wallets: [
                {
                    groupName: 'Recommended',
                    wallets: [injectedWallet, safeWallet],
                },
            ],
            ssr: true,
            storage,
            transports
        });
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