'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export type OnboardingPayload = {
    name: string;
    role: string;
    avatar?: File | null;
};

export async function completeOnboarding(data: OnboardingPayload) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const { name, role, avatar } = data;

    let imageUrl = undefined;
    if (avatar && avatar.size > 0) {
        const arrayBuffer = await avatar.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        imageUrl = `data:${avatar.type};base64,${base64}`;
    }

    await dbConnect();

    const updateData: any = {
        name,
        role,
        onboardingComplete: true, // <- Flip onboarding switch
    };

    if (imageUrl) {
        updateData.image = imageUrl;
    }

    await User.findByIdAndUpdate(session.user.id, updateData);

    return { success: true, imageUrl };
}