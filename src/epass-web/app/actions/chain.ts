import type { Chain } from "viem";
import { foundry, sepolia } from "viem/chains";
import { env } from "@/env";

export interface ChainConfig {
    network: Chain;
    rpcUrl: string;
}

export function getChainConfig(): ChainConfig {
    const isProd = env.NODE_ENV === "production";

    return isProd
        ? { network: sepolia, rpcUrl: env.NEXT_PUBLIC_SEPOLIA_RPC_URL }
        : { network: foundry, rpcUrl: env.NEXT_PUBLIC_FOUNDRY_RPC_URL };
}
