'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function completeOnboarding(data: { name: string; role: string }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const { name, role } = data;

    await dbConnect();

    await User.findByIdAndUpdate(session.user.id, {
        name: name,
        role: role,
        onboardingComplete: true, // <- Flip onboarding switch
    });

    return { success: true };
}