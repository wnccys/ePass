import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { LogoutButton } from "./logout-button";

export default async function Home() {
    const session = await getServerSession(authOptions);

    await dbConnect();

    // Type Guard
    if (!session) {
        return <div>Access Denied</div>;
    }

    const myProfile = await User.findById(session.user.id);

    return (
        <div className="p-8">
            Hey { myProfile?.name }!
            <p>Your secure Mongoose ID is: {session.user.id}</p>
            <p>Your email from the database is: {myProfile?.email}</p> <br />
            <LogoutButton />
        </div>
    )
}