import { NextResponse } from "next/server";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getChainConfig } from "@/app/actions/chain";
import { env } from "@/env";
import { playerRightsMasterAbi } from "@/src/generated";

export async function POST(req: Request) {
    try {
        const { vaultAddress } = await req.json();

        const account = privateKeyToAccount(
            env.ADMIN_PRIVATE_KEY as `0x${string}`,
        );

        const chainConfig = getChainConfig();
        const chain = chainConfig.network;
        if (!chain) throw Error("Could not determine transport");

        const client = createWalletClient({
            account,
            chain,
            transport: http(chainConfig.rpcUrl),
        }).extend(publicActions);

        const masterNftAddress =
            env.NEXT_PUBLIC_PLAYER_RIGHTS_MASTER_ADDRESS as `0x${string}`;

        const { request } = await client.simulateContract({
            address: masterNftAddress,
            abi: playerRightsMasterAbi,
            functionName: "setAuthorizedOperator",
            args: [vaultAddress as `0x${string}`, true],
        });

        const hash = await client.writeContract(request);

        await client.waitForTransactionReceipt({ hash });

        return NextResponse.json({ success: true, hash });
    } catch (error) {
        console.log("An error occurred: ", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        );
    }
}
