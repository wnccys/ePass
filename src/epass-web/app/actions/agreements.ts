'use server';

import { isAddress } from "viem";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Agreement from "@/models/Agreement";
import User from "@/models/User";

export type CreateAgreementPayload = {
    playerWalletAddress: string;
    playerEmail: string;
    attorneyWalletAddress: string;
    attorneyEmail: string;
    tokenURI: string;
    cautionAmount: string;
    nonce: number;
    deadline: string; // ISO date
    clubWalletAddress: string;
};

export async function createAgreement(data: CreateAgreementPayload) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };
    if (session.user.role !== 'club') return { success: false, error: "Only clubs can create agreements" };

    await dbConnect();
    const clubUser = await User.findById(session.user.id);
    if (!clubUser) {
        return { success: false, error: "Club user not found" };
    }

    const { playerWalletAddress, playerEmail, attorneyWalletAddress, attorneyEmail, tokenURI, cautionAmount, nonce, deadline, clubWalletAddress } = data;

    // Addr validation
    if (!isAddress(playerWalletAddress) || !isAddress(attorneyWalletAddress) || !isAddress(clubWalletAddress)) {
        return { success: false, error: "Invalid wallet addresses" };
    }

    if (!playerEmail || !attorneyEmail) {
        return { success: false, error: "Emails are required" };
    }

    // Check player account
    const playerUser = await User.findOne({ email: playerEmail.toLowerCase() });
    if (!playerUser) {
        return { success: false, error: `Player account with email "${playerEmail}" does not exist. Please register the player first.` };
    }

    // Check attorney account
    const attorneyUser = await User.findOne({ email: attorneyEmail.toLowerCase() });
    if (!attorneyUser) {
        return { success: false, error: `Attorney account with email "${attorneyEmail}" does not exist. Please register the attorney first.` };
    }

    try {
        const agreement = await Agreement.create({
            clubUserId: session.user.id,
            clubWalletAddress: clubWalletAddress.toLowerCase(),
            playerWalletAddress: playerWalletAddress.toLowerCase(),
            playerEmail: playerEmail.toLowerCase(),
            attorneyWalletAddress: attorneyWalletAddress.toLowerCase(),
            attorneyEmail: attorneyEmail.toLowerCase(),
            tokenURI,
            cautionAmount,
            nonce,
            deadline: new Date(deadline),
            status: 'pending_signatures'
        });

        // Assign agreement to the contracts list of the correct user accounts
        await User.findByIdAndUpdate(session.user.id, {
            $addToSet: { contracts: agreement._id }
        });

        // Player account
        await User.findOneAndUpdate(
            { email: playerEmail.toLowerCase() },
            { $addToSet: { contracts: agreement._id } }
        );

        // Attorney account
        await User.findOneAndUpdate(
            { email: attorneyEmail.toLowerCase() },
            { $addToSet: { contracts: agreement._id } }
        );

        return { success: true, agreementId: agreement._id.toString() };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to create agreement" };
    }
}

export async function submitSignature(agreementId: string, role: 'player' | 'club' | 'attorney', signature: string, walletAddress: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    if (!walletAddress) return { success: false, error: "Wallet address is required" };

    const userWallet = walletAddress.toLowerCase();

    try {
        const agreement = await Agreement.findById(agreementId);
        if (!agreement) return { success: false, error: "Agreement not found" };
        if (agreement.status !== 'pending_signatures') return { success: false, error: "Agreement is not pending signatures" };

        let roleMatched = false;
        if (role === 'club' && agreement.clubWalletAddress === userWallet) {
            agreement.clubSignature = signature;
            roleMatched = true;
        } else if (role === 'player' && agreement.playerWalletAddress === userWallet) {
            agreement.playerSignature = signature;
            roleMatched = true;
        } else if (role === 'attorney' && agreement.attorneyWalletAddress === userWallet) {
            agreement.attorneySignature = signature;
            roleMatched = true;
        }

        if (!roleMatched) return { success: false, error: `Caller is not the authorized ${role}` };

        if (agreement.clubSignature && agreement.playerSignature && agreement.attorneySignature) {
            agreement.status = 'ready';
        }

        await agreement.save();
        return { success: true };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to submit signature" };
    }
}

export async function getAgreement(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    try {
        const agreement = await Agreement.findById(id).lean();
        if (!agreement) return { success: false, error: "Agreement not found" };

        // Serialize object ids
        const serialized = JSON.parse(JSON.stringify(agreement));
        return { success: true, agreement: serialized };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to fetch agreement" };
    }
}

export async function getMyAgreements(walletAddress?: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    try {
        const query: any = {
            $or: [
                { clubUserId: session.user.id }
            ]
        };

        const targetWallet = walletAddress || session.user.walletAddress;
        if (targetWallet) {
            const wallet = targetWallet.toLowerCase();
            query.$or.push({ playerWalletAddress: wallet });
            query.$or.push({ attorneyWalletAddress: wallet });
            query.$or.push({ clubWalletAddress: wallet });
        }

        const agreements = await Agreement.find(query).lean().sort({ createdAt: -1 });

        const serialized = JSON.parse(JSON.stringify(agreements));
        return { success: true, agreements: serialized };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to fetch agreements" };
    }
}

export async function updateAgreementOnChain(id: string, data: { mintTxHash?: string, nftTokenId?: number, vaultAddress?: string, status?: string }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    try {
        await Agreement.findByIdAndUpdate(id, { $set: data });
        return { success: true };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to update agreement on-chain data" };
    }
}
