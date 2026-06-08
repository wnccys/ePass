import { env } from "@/env";
import { http } from "viem";
import { foundry, sepolia } from "wagmi/chains";

const chainConfig =
    env.NODE_ENV === "production"
        ?  { network: sepolia, transport: http(env.NEXT_PUBLIC_SEPOLIA_RPC_URL) }
        : { network: foundry, transport: http(env.NEXT_PUBLIC_FOUNDRY_RPC_URL) };

/**
 * Wrapper for chain configuration specifier
 */
export function getChainConfig() {
    return chainConfig;
}