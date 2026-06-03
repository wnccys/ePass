'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";

export async function recordTransaction(data: { txHash: string, chainId: number, actionType: string, contractAddress: string, walletAddress: string, agreementId?: string }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    try {
        const transaction = await Transaction.create({
            userId: session.user.id,
            status: 'submitted',
            ...data,
            actionType: data.actionType as any
        });

        return { success: true, transactionId: transaction._id.toString() };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to record transaction" };
    }
}

export async function confirmTransaction(txHash: string, blockNumber: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    try {
        await Transaction.findOneAndUpdate({ txHash }, { 
            status: 'confirmed', 
            blockNumber, 
            confirmedAt: new Date() 
        });
        return { success: true };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to confirm transaction" };
    }
}

export async function failTransaction(txHash: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    try {
        await Transaction.findOneAndUpdate({ txHash }, { status: 'failed' });
        return { success: true };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to mark transaction as failed" };
    }
}
