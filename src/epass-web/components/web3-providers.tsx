"use client";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { injectedWallet, safeWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import { createStorage, http, noopStorage, WagmiProvider } from "wagmi";
import { foundry, sepolia } from "wagmi/chains";
import { env } from "@/env";
import { getCurrentChain } from "@/app/actions/chain";

export function Web3Providers({ children }: { children: React.ReactNode }) {
    // Instantiate inside the component to prevent SSR data leaks!
    const [queryClient] = useState(() => new QueryClient());

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
            chains: [getCurrentChain().network],
            wallets: [
                {
                    groupName: "Recommended",
                    wallets: [injectedWallet, safeWallet],
                },
            ],
            ssr: true,
            storage,
            transports: {
                [foundry.id]: http(env.NEXT_PUBLIC_FOUNDRY_RPC_URL),
                [sepolia.id]: http(env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
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
