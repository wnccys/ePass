'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Agreement from "@/models/Agreement";
import User from "@/models/User";

export async function getDashboardStats() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const email = session.user.email?.toLowerCase();
    const role = session.user.role;

    await dbConnect();
    try {
        const user = await User.findById(session.user.id).select("contracts").lean();
        if (!user || !user.contracts || user.contracts.length === 0) {
            return {
                success: true,
                stats: {
                    totalContracts: 0,
                    activeContracts: 0,
                    pendingSignatures: 0,
                    totalCautionLocked: "0",
                    vaultCount: role === 'club' ? 0 : undefined,
                    activeAgreementCount: role === 'player' ? 0 : undefined
                }
            };
        }

        // Fetch all agreements for the user
        const agreements = await Agreement.find({
            _id: { $in: user.contracts }
        }).lean();

        const totalContracts = agreements.length;
        const activeContracts = agreements.filter(a => a.status === 'active').length;
        
        // Count pending signatures for THIS user
        const pendingSignatures = agreements.filter(a => {
            if (a.status !== 'pending_signatures') return false;
            let isPending = false;
            if (role === 'club' && a.clubEmail === email && !a.clubSignature) {
                isPending = true;
            } else if (role === 'player' && a.playerEmail === email && !a.playerSignature) {
                isPending = true;
            }
            if (a.attorneyEmail === email && !a.attorneySignature) {
                isPending = true;
            }
            return isPending;
        }).length;

        // Calculate total caution value locked (for active agreements)
        let totalCautionWei = BigInt(0);
        for (const agreement of agreements) {
            if (agreement.status === 'active' && agreement.cautionAmount) {
                try {
                    totalCautionWei += BigInt(agreement.cautionAmount);
                } catch (e) {
                    console.error("Failed to parse caution amount:", agreement.cautionAmount);
                }
            }
        }

        // Vault counts
        const vaultCount = agreements.filter(a => !!a.vaultAddress).length;

        return {
            success: true,
            stats: {
                totalContracts,
                activeContracts,
                pendingSignatures,
                totalCautionLocked: totalCautionWei.toString(),
                vaultCount: role === 'club' ? vaultCount : undefined,
                activeAgreementCount: role === 'player' ? activeContracts : undefined
            }
        };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to fetch dashboard stats" };
    }
}
