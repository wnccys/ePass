import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { parseSiweMessage, verifySiweMessage } from 'viem/siwe';

export async function POST(req: Request) {
    try {
        const { message, signature } = await req.json();
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not logged in via Google" }, { status: 401 });
        }

        const savedNonce = (await cookies()).get('siwe_nonce')?.value;
        const parsedMessage = parseSiweMessage(message as string);

        if (parsedMessage.nonce !== savedNonce) {
            return NextResponse.json({ error: "Invalid Nonce" }, { status: 403 });
        }

        const publicClient = createPublicClient({ chain: hardhat, transport: http() });

        const isValid = await verifySiweMessage(publicClient, {
            message,
            signature,
        });

        if (!isValid) throw new Error("Signature verification failed");

        // Link address with user
        await dbConnect();
        await User.findByIdAndUpdate(session.user.id, {
            walletAddress: parsedMessage.address,
        });

        return NextResponse.json({ success: true, address: parsedMessage.address });
    } catch (error) {
        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
}