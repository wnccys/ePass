import { getServerSession } from "next-auth/next";
import { OnBoardingForm } from "./onboarding-form";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function Profile() {
    const session = await getServerSession(authOptions);
    if (!session!.user.onboardingComplete) return <OnBoardingForm user={session!.user} />

    return (
        <div>
            {session!.user.role === "player" ? (
                <div>player</div>
            ) : (
                <div>club</div>
            )
        }
    </div>
    )
}