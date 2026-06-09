"use server";

import { getServerSession } from "next-auth";
import { isAddress } from "viem";
import dbConnect from "@/lib/db";
import Agreement from "@/models/Agreement";
import User from "@/models/User";
import { authOptions } from "../api/auth/[...nextauth]/route";

export type CreateAgreementPayload = {
    title: string;
    description: string;
    playerWalletAddress: string;
    playerEmail: string;
    attorneyWalletAddress: string;
    attorneyEmail: string;
    tokenURI: string;
    cautionAmount: string;
    tokenName: string;
    tokenSymbol: string;
    nonce: number;
    deadline: string; // ISO date
    clubWalletAddress: string;
};

export async function createAgreement(data: CreateAgreementPayload) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };
    if (session.user.role !== "club")
        return { success: false, error: "Only clubs can create agreements" };

    await dbConnect();
    const clubUser = await User.findById(session.user.id);
    if (!clubUser) {
        return { success: false, error: "Club user not found" };
    }

    const {
        title,
        description,
        playerWalletAddress,
        playerEmail,
        attorneyWalletAddress,
        attorneyEmail,
        tokenURI,
        cautionAmount,
        tokenName,
        tokenSymbol,
        nonce,
        deadline,
        clubWalletAddress,
    } = data;

    // Server-side title & description validations
    if (!title || title.trim().length < 5) {
        return {
            success: false,
            error: "Title must be at least 5 characters long",
        };
    }
    if (!description || description.trim().length < 10) {
        return {
            success: false,
            error: "Description must be at least 10 characters long",
        };
    }

    // Token validations
    if (
        !tokenName ||
        tokenName.trim().length === 0 ||
        tokenName.length > 10 ||
        /\s/.test(tokenName)
    ) {
        return {
            success: false,
            error: "Token Name must be between 1 and 10 characters long with no spaces",
        };
    }
    if (
        !tokenSymbol ||
        !tokenSymbol.startsWith("$") ||
        tokenSymbol.length > 10 ||
        tokenSymbol.length < 2 ||
        /\s/.test(tokenSymbol) ||
        !/^\$[A-Za-z0-9_]+$/.test(tokenSymbol)
    ) {
        return {
            success: false,
            error: "Token Symbol must start with $, contain only letters/numbers/underscores, have no spaces, and be between 2 and 10 characters long (e.g. $TOKEN_E)",
        };
    }

    // Addr validation
    if (
        !isAddress(playerWalletAddress) ||
        !isAddress(attorneyWalletAddress) ||
        !isAddress(clubWalletAddress)
    ) {
        return { success: false, error: "Invalid wallet addresses" };
    }

    if (!playerEmail || !attorneyEmail) {
        return { success: false, error: "Emails are required" };
    }

    // Check player account
    const playerUser = await User.findOne({ email: playerEmail.toLowerCase() });
    if (!playerUser) {
        return {
            success: false,
            error: `Player account with email "${playerEmail}" does not exist. Please register the player first.`,
        };
    }

    // Check attorney account
    const attorneyUser = await User.findOne({
        email: attorneyEmail.toLowerCase(),
    });
    if (!attorneyUser) {
        return {
            success: false,
            error: `Attorney account with email "${attorneyEmail}" does not exist. Please register the attorney first.`,
        };
    }

    const rawDeadline = new Date(deadline);
    rawDeadline.setUTCMilliseconds(0);

    // Validate that the deadline is at least 3 days from now (with a 1-minute tolerance for network transit)
    const minDeadline = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000 - 60 * 1000,
    );
    if (rawDeadline.getTime() < minDeadline.getTime()) {
        return {
            success: false,
            error: "Deadline must be at least 3 days from now",
        };
    }

    try {
        const agreement = await Agreement.create({
            clubUserId: session.user.id,
            clubWalletAddress: clubWalletAddress.toLowerCase(),
            clubEmail: clubUser.email.toLowerCase(),
            playerWalletAddress: playerWalletAddress.toLowerCase(),
            playerEmail: playerEmail.toLowerCase(),
            attorneyWalletAddress: attorneyWalletAddress.toLowerCase(),
            attorneyEmail: attorneyEmail.toLowerCase(),
            title,
            description,
            tokenURI,
            cautionAmount,
            tokenName,
            tokenSymbol: tokenSymbol.toUpperCase(),
            nonce,
            deadline: rawDeadline,
            status: "pending_signatures",
        });

        // Assign agreement to the contracts list of the correct user accounts
        await User.findByIdAndUpdate(session.user.id, {
            $addToSet: { contracts: agreement._id },
        });

        // Player account
        await User.findOneAndUpdate(
            { email: playerEmail.toLowerCase() },
            { $addToSet: { contracts: agreement._id } },
        );

        // Attorney account
        await User.findOneAndUpdate(
            { email: attorneyEmail.toLowerCase() },
            { $addToSet: { contracts: agreement._id } },
        );

        return { success: true, agreementId: agreement._id.toString() };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to create agreement" };
    }
}

export async function submitSignature(
    agreementId: string,
    signature: string,
    walletAddress: string,
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };
    if (!walletAddress)
        return { success: false, error: "Wallet address is required" };

    const role = session.user.role;
    const userWallet = walletAddress.toLowerCase();

    try {
        const agreement = await Agreement.findById(agreementId);
        if (!agreement) return { success: false, error: "Agreement not found" };
        if (agreement.status !== "pending_signatures")
            return {
                success: false,
                error: "Agreement is not pending signatures",
            };

        let match: boolean = false;
        if (role === "club" && agreement.clubWalletAddress === userWallet) {
            agreement.clubSignature = signature;
            match = true;
        } else if (
            role === "player" &&
            agreement.playerWalletAddress === userWallet
        ) {
            agreement.playerSignature = signature;
            match = true;
        }

        if (agreement.attorneyWalletAddress === userWallet) {
            agreement.attorneySignature = signature;
            match = true;
        }

        // True if wallet doesn't match none of the addresses
        if (!match)
            return {
                success: false,
                error: "Wallet is not valid for this contract",
            };

        // Update agreement db status when all signatures has been set
        if (
            agreement.clubSignature &&
            agreement.playerSignature &&
            agreement.attorneySignature
        ) {
            agreement.status = "ready";
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

export async function getMyAgreements() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    try {
        const user = await User.findById(session.user.id)
            .select("contracts")
            .lean();
        if (!user || !user.contracts || user.contracts.length === 0) {
            return { success: true, agreements: [] };
        }

        const agreements = await Agreement.find({
            _id: { $in: user.contracts },
        })
            .lean()
            .sort({ createdAt: -1 });

        const serialized = JSON.parse(JSON.stringify(agreements));
        return { success: true, agreements: serialized };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to fetch agreements" };
    }
}

/**
 * Update Agreement data on db: mintTxHash, nftTokenId, vaultAddress, status
 */
export async function updateAgreementOnChain(
    id: string,
    data: {
        mintTxHash?: string;
        nftTokenId?: number;
        vaultAddress?: string;
        status?: string;
    },
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    try {
        const agreement = await Agreement.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true },
        );

        if (
            agreement &&
            data.nftTokenId !== undefined &&
            data.nftTokenId !== null
        ) {
            console.log(
                `[updateAgreementOnChain] Adding nftTokenId ${data.nftTokenId} to club ${agreement.clubUserId} and player ${agreement.playerEmail}`,
            );

            // Add to club
            const clubUpdate = await User.findByIdAndUpdate(
                agreement.clubUserId,
                { $addToSet: { nftTokenIds: data.nftTokenId } },
                { new: true },
            );
            console.log(
                `[updateAgreementOnChain] Club user updated:`,
                clubUpdate
                    ? `Success (nftTokenIds: ${JSON.stringify(clubUpdate.nftTokenIds)})`
                    : `Failed (User ${agreement.clubUserId} not found)`,
            );

            // Add to player
            const playerUpdate = await User.findOneAndUpdate(
                { email: agreement.playerEmail.toLowerCase() },
                { $addToSet: { nftTokenIds: data.nftTokenId } },
                { new: true },
            );
            console.log(
                `[updateAgreementOnChain] Player user updated:`,
                playerUpdate
                    ? `Success (nftTokenIds: ${JSON.stringify(playerUpdate.nftTokenIds)})`
                    : `Failed (Player ${agreement.playerEmail} not found)`,
            );
        }

        return { success: true };
    } catch (err) {
        console.error("[updateAgreementOnChain] Error:", err);
        return {
            success: false,
            error: "Failed to update agreement on-chain data",
        };
    }
}

export async function excludeAgreementFromAccount(agreementId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    try {
        const agreement = await Agreement.findById(agreementId);
        if (!agreement) {
            return { success: false, error: "Agreement not found" };
        }

        const allowedStatuses = ["draft", "pending_signatures", "ready"];
        if (!allowedStatuses.includes(agreement.status)) {
            return {
                success: false,
                error: "Cannot exclude an on-chain contract.",
            };
        }

        // Pull from the current user's list
        await User.findByIdAndUpdate(session.user.id, {
            $pull: { contracts: agreementId },
        });

        // If the current user is the club, also pull from player and attorney contracts lists
        const isClub =
            agreement.clubUserId.toString() === session.user.id ||
            agreement.clubEmail.toLowerCase() ===
                session.user.email?.toLowerCase();

        if (isClub) {
            // Player account
            await User.findOneAndUpdate(
                { email: agreement.playerEmail.toLowerCase() },
                { $pull: { contracts: agreementId } },
            );

            // Attorney account
            await User.findOneAndUpdate(
                { email: agreement.attorneyEmail.toLowerCase() },
                { $pull: { contracts: agreementId } },
            );
        }

        return { success: true };
    } catch (err) {
        console.error(err);
        return {
            success: false,
            error: "Failed to exclude agreement from account.",
        };
    }
}

export async function getExpiringAgreements() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    await dbConnect();
    try {
        const user = await User.findById(session.user.id)
            .select("contracts")
            .lean();
        if (!user || !user.contracts || user.contracts.length === 0) {
            return { success: true, agreements: [] };
        }

        const now = new Date();
        const thirtyDaysFromNow = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
        );

        const agreements = await Agreement.find({
            _id: { $in: user.contracts },
            status: { $in: ["pending_signatures", "ready"] },
            deadline: { $gte: now, $lte: thirtyDaysFromNow },
        })
            .lean()
            .sort({ deadline: 1 });

        const serialized = JSON.parse(JSON.stringify(agreements));
        return { success: true, agreements: serialized };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to fetch expiring agreements" };
    }
}

export async function getPendingSignatures() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const email = session.user.email?.toLowerCase();
    const role = session.user.role;

    await dbConnect();
    try {
        const user = await User.findById(session.user.id)
            .select("contracts")
            .lean();
        if (!user || !user.contracts || user.contracts.length === 0) {
            return { success: true, agreements: [] };
        }

        // Fetch all agreements pending signatures in user's contracts
        const agreements = await Agreement.find({
            _id: { $in: user.contracts },
            status: "pending_signatures",
        })
            .lean()
            .sort({ createdAt: -1 });

        // Filter the agreements to only those where this specific user has a signature pending
        const pending = agreements.filter((agreement) => {
            let isPending = false;

            // Check based on role/email
            if (
                role === "club" &&
                agreement.clubEmail === email &&
                !agreement.clubSignature
            ) {
                isPending = true;
            } else if (
                role === "player" &&
                agreement.playerEmail === email &&
                !agreement.playerSignature
            ) {
                isPending = true;
            }

            // Check if they are the attorney (can be player or club role acting as attorney)
            if (
                agreement.attorneyEmail === email &&
                !agreement.attorneySignature
            ) {
                isPending = true;
            }

            return isPending;
        });

        const serialized = JSON.parse(JSON.stringify(pending));
        return { success: true, agreements: serialized };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to fetch pending signatures" };
    }
}
