'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function completeOnboarding(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const username = formData.get("username") as string;

    await dbConnect();

    await User.findByIdAndUpdate(session.user.id, {
        username: username,
        onboardingComplete: true, // <- Flip onboarding switch
    });

    return { success: true };
}