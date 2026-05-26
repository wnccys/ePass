import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { LogoutButton } from "./logout-button";
import { Demo } from "@/components/ui/card-information";

export default async function Home() {
    const session = await getServerSession(authOptions)!;

    // Type Guard
    if (!session) {
        // TODO set better callback for unauthorized requests
        return <div>Access Denied</div>;
    }

    await dbConnect();
    const myProfile = await User.findById(session.user.id);

    return (
        <div>
            <div className="p-8">
                Hey { myProfile?.name }!
                <p>Your secure Mongoose ID is: {session.user.id}</p>
                <p>Your email from the database is: {myProfile?.email}</p> <br />
                <LogoutButton />
            </div>

            <Demo />
        </div>
    )
}