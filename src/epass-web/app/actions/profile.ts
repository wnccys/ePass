'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export type ProfilePayload = {
    name: string;
    role: string;
    bio?: string;
    avatar?: File | null;
    walletAddress?: string;
};

export async function updateProfile(data: ProfilePayload) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const { name, role, bio, avatar, walletAddress } = data;

    let imageUrl = undefined;
    if (avatar && avatar.size > 0) {
        const arrayBuffer = await avatar.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        imageUrl = `data:${avatar.type};base64,${base64}`;
    }

    await dbConnect();

    try {
        const normalizedWalletAddress = walletAddress?.toLowerCase();
        const updateData: any = { name, role };
        if (bio !== undefined) updateData.bio = bio;
        if (imageUrl) updateData.image = imageUrl;
        if (normalizedWalletAddress !== undefined) {
            const existingWalletOwner = await User.findOne({
                walletAddress: normalizedWalletAddress,
                _id: { $ne: session.user.id },
            }).select("_id");

            if (existingWalletOwner) {
                return { success: false, error: "This wallet is already linked to another account." };
            }

            updateData.walletAddress = normalizedWalletAddress;
            updateData.walletLinkedAt = normalizedWalletAddress ? new Date() : null;
        }

        await User.findByIdAndUpdate(session.user.id, updateData);

        return { success: true, imageUrl };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to update profile." };
    }
}