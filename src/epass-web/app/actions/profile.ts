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
};

export async function updateProfile(data: ProfilePayload) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const { name, role, bio, avatar } = data;

    let imageUrl = undefined;
    if (avatar && avatar.size > 0) {
        const arrayBuffer = await avatar.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        imageUrl = `data:${avatar.type};base64,${base64}`;
    }

    await dbConnect();

    try {
        const updateData: any = { name, role };
        if (bio !== undefined) updateData.bio = bio;
        if (imageUrl) updateData.image = imageUrl;

        await User.findByIdAndUpdate(session.user.id, updateData);

        return { success: true, imageUrl };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Failed to update profile." };
    }
}

export async function getServerUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    await dbConnect();
    const userDoc = await User.findById(session.user.id).lean();
    if (!userDoc) return null;
    return JSON.parse(JSON.stringify(userDoc));
}