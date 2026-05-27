'use client';

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitAuthenticationProvider, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { hardhat, mainnet } from "wagmi/chains";
import { WagmiProvider, http } from "wagmi";
import { linkingAdapter } from '@/lib/siwe-adapter';

export function Web3Providers({ children }: { children: React.ReactNode }) {
    // Instantiate inside the component to prevent SSR data leaks!
    const [queryClient] = useState(() => new QueryClient());

    const config = getDefaultConfig({
        appName: 'Football Transfer Portal',
        projectId: 'ba9cdaa4859ae0262a0ecdc00bd534f1',
        chains: [mainnet, hardhat],
        ssr: true, // TWEAK 2: You MUST add this for Next.js App Router
        transports: {
            [mainnet.id]: http(),
            [hardhat.id]: http(),
        },
    });

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitAuthenticationProvider adapter={linkingAdapter} status="unauthenticated">
                <RainbowKitProvider>
                    {children}
                </RainbowKitProvider>
                </RainbowKitAuthenticationProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}