import { AuthComponent } from "@/components/ui/sign-up";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PublicNavbar } from "@/components/public-navbar";

export default async function LoginPage() {
    const session = await getServerSession(authOptions);
    // If not logged, render signin form
    if (!session) {
        return (
            <>
                <PublicNavbar />
                <AuthComponent />
            </>
        );
    }

    redirect("/home");
}