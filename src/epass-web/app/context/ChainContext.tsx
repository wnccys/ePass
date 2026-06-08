"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { Chain } from "viem";
import { foundry, sepolia } from "viem/chains";

const chains = {
    [foundry.id]: foundry,
    [sepolia.id]: sepolia,
} as const;

export interface ChainConfig {
    network: Chain;
    rpcUrl: string;
}

const ChainContext = createContext<ChainConfig | null>(null);

export function ChainProvider({
    children,
    value,
}: {
    children: ReactNode;
    value: {
        networkId: number;
        rpcUrl: string;
    };
}) {
    const network = chains[value.networkId as keyof typeof chains];
    const clientValue = {
        network,
        rpcUrl: value.rpcUrl,
    };

    return (
        <ChainContext.Provider value={clientValue}>
            {children}
        </ChainContext.Provider>
    );
}

export function useChain() {
    const context = useContext(ChainContext);
    if (!context) {
        throw new Error("useChain must be used within a ChainProvider.");
    }
    return context;
}
