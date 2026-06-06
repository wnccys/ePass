import { getCurrentUser } from "@/services/user";
import { OnBoardingForm } from "./onboarding-form";
import { PlayerProfile } from "./player";
import { ClubProfile } from "./club";

export default async function Profile() {
    const user = await getCurrentUser();

    if (!user) return <div>No user data available</div>

    // Serialize user object to remove non-plain values like MongoDB ObjectId buffer
    const serializedUser = JSON.parse(JSON.stringify(user));

    if (!serializedUser.onboardingComplete) {
        return (
            <div className="relative min-h-screen w-full flex flex-col justify-center items-center">
                <OnBoardingForm user={serializedUser} />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full flex flex-col">
            {serializedUser.role === "player" ?
                (
                    <PlayerProfile user={serializedUser} />
                ) : (
                    <ClubProfile user={serializedUser} />
                )
            }
        </div>
    )
}