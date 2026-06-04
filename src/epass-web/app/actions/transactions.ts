'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";


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

export async function getMyTransactions(limit = 10, offset = 0) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    try {
        const user = await User.findById(session.user.id).select("contracts").lean();
        const contractIds = user?.contracts || [];

        const query = {
            $or: [
                { userId: session.user.id },
                { agreementId: { $in: contractIds } }
            ]
        };

        const transactions = await Transaction.find(query)
            .populate('agreementId', 'title status')
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean();

        // Include any related models if necessary (populate already handles agreementId)
        const serialized = JSON.parse(JSON.stringify(transactions));
        return { success: true, transactions: serialized };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to fetch transactions" };
    }
}

