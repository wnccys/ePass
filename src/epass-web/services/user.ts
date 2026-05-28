import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust your path
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { cache } from "react";

// `cache` ensures that no matter how many Server Components call this
// during a single page load, the database is only queried once.
export const getCurrentUser = cache(async () => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return null; // Not logged in
    }

    await dbConnect();
    const userDoc = await User.findById(session.user.id).lean();

    if (!userDoc) return null;

    return userDoc;
});