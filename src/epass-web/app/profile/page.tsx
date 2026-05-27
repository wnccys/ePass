import { getCurrentUser } from "@/services/user";
import { OnBoardingForm } from "./onboarding-form";
import { PlayerProfile } from "./player";

export default async function Profile() {
    const user = await getCurrentUser();

    if (!user) return <div>No user data available</div>
    if (!user.onboardingComplete) return <OnBoardingForm user={user} />

    return (
        <div>
            {user.role === "player" ?
                (
                    <PlayerProfile user={user} />
                ) : (
                    <div>club</div>
                )
            }
        </div>
    )
}