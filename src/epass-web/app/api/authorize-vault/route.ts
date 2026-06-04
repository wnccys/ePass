 import { playerRightsMasterAbi } from '@/src/generated';
import { NextResponse } from 'next/server';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';

export async function POST(req: Request) {
    try {
        const { vaultAddress } = await req.json();

        const account = privateKeyToAccount(process.env.ADMIN_PRIVATE_KEY as `0x${string}`);

        const client = createWalletClient({
            account,
            chain: foundry,
            transport: http(process.env.NEXT_PUBLIC_FOUNDRY_RPC_URL),
        }).extend(publicActions)

        const masterNftAddress = process.env.NEXT_PUBLIC_PLAYER_RIGHTS_MASTER_ADDRESS as `0x${string}`;

        const { request } = await client.simulateContract({
            address: masterNftAddress,
            abi: playerRightsMasterAbi,
            functionName: 'setAuthorizedOperator',
            args: [vaultAddress as `0x${string}`, true]
        });

        const hash = await client.writeContract(request);

        await client.waitForTransactionReceipt({ hash });

        return NextResponse.json({ success: true, hash });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}