'use client';

import { completeOnboarding } from "@/app/actions/onboarding";
import { AuthComponent } from "@/components/ui/sign-up";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function OnBoardingForm(
    { user }: { user: { name?: string | null; email?: string | null } }
) {
    const router = useRouter();
    const { update } = useSession();

    async function handleSubmit(formData: FormData) {
        const result = await completeOnboarding(formData);

        if (result.success) {
            // 1. Tell NextAuth to update the local session token cache
            await update();
            // 2. Refresh the current server layout smoothly
            router.refresh();
        }
    }

    return (
        <div>
            <AuthComponent />
        </div>
  );
}