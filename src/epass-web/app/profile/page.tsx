import { getCurrentUser } from "@/services/user";
import { OnBoardingForm } from "./onboarding-form";
import { PlayerProfile } from "./player";

export default async function Profile() {
    const user = await getCurrentUser();

    if (!user) return <div>No user data available</div>

    // Serialize user object to remove non-plain values like MongoDB ObjectId buffer
    const serializedUser = JSON.parse(JSON.stringify(user));

    if (!serializedUser.onboardingComplete) return <OnBoardingForm user={serializedUser} />

    return (
        <div>
            {serializedUser.role === "player" ?
                (
                    <PlayerProfile user={serializedUser} />
                ) : (
                    <div>club</div>
                )
            }
        </div>
    )
}