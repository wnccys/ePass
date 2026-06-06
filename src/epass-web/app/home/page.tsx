import { getCurrentUser } from "@/services/user";
import { redirect } from "next/navigation";
import { getMyAgreements, getExpiringAgreements, getPendingSignatures } from "@/app/actions/agreements";
import { getMyTransactions } from "@/app/actions/transactions";
import { getDashboardStats } from "@/app/actions/dashboard";
import { DashboardClient } from "./dashboard-client";
import { IUser } from "@/models/User";

export default async function Home() {
    const user = await getCurrentUser();

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center text-foreground font-serif">Invalid user session</div>;
    }

    // Bounce to onboarding if not complete
    if (!user.onboardingComplete) {
        redirect("/profile");
    }

    // Fetch dashboard data in parallel
    const [
        agreementsRes,
        transactionsRes,
        expiringRes,
        pendingRes,
        statsRes
    ] = await Promise.all([
        getMyAgreements(),
        getMyTransactions(10, 0),
        getExpiringAgreements(),
        getPendingSignatures(),
        getDashboardStats()
    ]);

    const initialAgreements = agreementsRes.success ? agreementsRes.agreements || [] : [];
    const initialTransactions = transactionsRes.success ? transactionsRes.transactions || [] : [];
    const expiringAgreements = expiringRes.success ? expiringRes.agreements || [] : [];
    const pendingSignatures = pendingRes.success ? pendingRes.agreements || [] : [];

    const stats = statsRes.success && statsRes.stats ? statsRes.stats : {
        totalContracts: 0,
        activeContracts: 0,
        pendingSignatures: 0,
        totalCautionLocked: "0",
        vaultCount: user.role === 'club' ? 0 : undefined,
        activeAgreementCount: user.role === 'player' ? 0 : undefined
    };

    const parsedUser = JSON.parse(JSON.stringify(user));

    return (
        <DashboardClient
            initialAgreements={initialAgreements}
            user={parsedUser as IUser}
            initialTransactions={initialTransactions}
            expiringAgreements={expiringAgreements}
            pendingSignatures={pendingSignatures}
            stats={stats}
        />
    );
}
