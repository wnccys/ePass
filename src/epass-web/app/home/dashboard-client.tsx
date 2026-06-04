'use client';

import { useSession } from "next-auth/react";
import { LeftSidebar } from "./sidebar/left-sidebar";
import { RightSidebar } from "./sidebar/right-sidebar";
import { FeedContainer } from "./feed/feed-container";
import { ChatInput } from "./chat/chat-input";
import { IUser } from "@/models/User";


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

    if (!user) throw Error("Could not find user");

    // Filter transactions to get confirmed ones for the right sidebar
    const recentConfirmedTxs = initialTransactions.filter(
        (tx) => tx.status === 'confirmed'
    );

    return (
        <div className="w-full max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)_256px] xl:grid-cols-[260px_minmax(0,1fr)_304px] gap-6 xl:gap-8 items-start">

                {/* Left Sidebar - Sticky */}
                <div className="lg:sticky lg:top-24 space-y-6 order-2 lg:order-1">
                    <LeftSidebar
                        walletAddress={walletAddress}
                        expiringAgreements={expiringAgreements}
                        pendingSignatures={pendingSignatures}
                    />
                </div>

                {/* Center Main Feed Column */}
                <div className="space-y-8 order-1 lg:order-2">
                    {/* Welcome Header */}
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Welcome back, <span suppressHydrationWarning className="text-primary font-semibold">{user?.name || "User"}</span>
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Here is the status of your football image rights escrow agreements and actions.
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
                <div className="lg:sticky lg:top-24 space-y-6 order-3">
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
