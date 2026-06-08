"use client";

import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import type { IUser } from "@/models/User";
import { ChatInput } from "./chat/chat-input";
import { FeedContainer } from "./feed/feed-container";
import { LeftSidebar } from "./sidebar/left-sidebar";
import { RightSidebar } from "./sidebar/right-sidebar";

export function DashboardClient({
    initialAgreements,
    initialTransactions,
    expiringAgreements,
    pendingSignatures,
    user,
    stats,
}: {
    initialAgreements: any[];
    initialTransactions: any[];
    expiringAgreements: any[];
    pendingSignatures: any[];
    user: IUser;
    stats: any;
}) {
    const { data: session } = useSession();
    const walletAddress = session?.user.walletAddress;
    const { t } = useTranslation();

    if (!user) throw Error("Could not find user");

    // Filter transactions to get confirmed ones for the right sidebar
    const recentConfirmedTxs = initialTransactions.filter(
        (tx) => tx.status === "confirmed",
    );

    return (
        <div className="mx-auto w-full max-w-360 px-4 py-24 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)_256px] xl:grid-cols-[260px_minmax(0,1fr)_304px] xl:gap-8">
                {/* Left Sidebar - Sticky */}
                <div className="order-2 space-y-6 lg:sticky lg:top-24 lg:order-1">
                    <LeftSidebar
                        walletAddress={walletAddress}
                        expiringAgreements={expiringAgreements}
                        pendingSignatures={pendingSignatures}
                    />
                </div>

                {/* Center Main Feed Column */}
                <div className="order-1 space-y-8 lg:order-2">
                    {/* Welcome Header */}
                    <div className="space-y-1">
                        <h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
                            {t("dashboard.welcome")}
                            <span
                                suppressHydrationWarning
                                className="font-semibold text-primary"
                            >
                                {user?.name || "User"}
                            </span>
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {t("dashboard.subtitle")}
                        </p>
                    </div>

                    {/* AI Chat Area (Phase 2) */}
                    <ChatInput />

                    {/* Infinite Activity Feed */}
                    <FeedContainer
                        initialAgreements={initialAgreements}
                        initialTransactions={initialTransactions}
                        userRole={user.role}
                    />
                </div>

                {/* Right Sidebar - Sticky */}
                <div className="order-3 space-y-6 lg:sticky lg:top-24">
                    <RightSidebar
                        stats={stats}
                        recentTransactions={recentConfirmedTxs}
                        userRole={user.role}
                    />
                </div>
            </div>
        </div>
    );
}
