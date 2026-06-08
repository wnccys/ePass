"use client";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { injectedWallet, safeWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import { createStorage, http, noopStorage, WagmiProvider } from "wagmi";
import { env } from "@/env";
import { useChain } from "@/app/context/ChainContext";

export function Web3Providers({ children }: { children: React.ReactNode }) {
    // Instantiate inside the component to prevent SSR data leaks!
    const [queryClient] = useState(() => new QueryClient());

    const { network, rpcUrl } = useChain();

    const [config] = useState(() => {
        const storage = createStorage({
            key: "epass-wagmi",
            storage:
                typeof window !== "undefined"
                    ? window.localStorage
                    : noopStorage,
        });

        return getDefaultConfig({
            appName: "ePass Football",
            projectId: env.NEXT_PUBLIC_RAINBOW_PROJECT_ID,
            chains: [network],
            wallets: [
                {
                    groupName: "Recommended",
                    wallets: [injectedWallet, safeWallet],
                },
            ],
            ssr: true,
            storage,
            transports: {
                [network.id]: http(rpcUrl),
            },
        });
    });

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>{children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
