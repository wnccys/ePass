"use client";

import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
    ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function LeftSidebar({
    walletAddress,
    expiringAgreements,
    pendingSignatures,
}: {
    walletAddress?: string;
    expiringAgreements: any[];
    pendingSignatures: any[];
}) {
    const { t } = useTranslation();

    return (
        <aside className="w-full space-y-6 overflow-y-auto pr-1 lg:max-h-[calc(100vh-8rem)]">
            {/* Warning: No Wallet Connected */}
            {!walletAddress && (
                <Card className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
                    <div className="flex items-start gap-2.5">
                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <div>
                            <h5 className="font-semibold text-sm">
                                {t("dashboard.sidebar.walletDisconnected")}
                            </h5>
                            <p className="mt-0.5 text-xs leading-relaxed opacity-95">
                                {t("dashboard.sidebar.walletDisconnectedDesc")}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Pending Signatures */}
            <div className="space-y-3">
                <div className="flex items-center justify-between border-border/40 border-b pb-1">
                    <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                        {t("dashboard.sidebar.pendingActions")}
                    </h3>
                    {pendingSignatures.length > 0 && (
                        <Badge
                            variant="outline"
                            className="border-amber-500/20 bg-amber-500/10 font-mono text-[10px] text-amber-500"
                        >
                            {pendingSignatures.length}
                        </Badge>
                    )}
                </div>

                {pendingSignatures.length === 0 ? (
                    <Card className="glass-card rounded-xl p-4 text-center">
                        <p className="text-muted-foreground text-xs">
                            {t("dashboard.sidebar.noPending")}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {pendingSignatures.map((ag) => (
                            <Card
                                key={ag._id}
                                className="glass-card space-y-3 border-amber-500/20 p-4"
                            >
                                <div className="space-y-1">
                                    <h4 className="line-clamp-1 font-semibold text-foreground text-xs">
                                        {ag.title}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground">
                                        Caution:{" "}
                                        {formatUnits(
                                            BigInt(ag.cautionAmount || 0),
                                            6,
                                        )}{" "}
                                        USDC
                                    </p>
                                </div>
                                <Link
                                    href={`/contracts/${ag._id}`}
                                    className="flex w-full items-center justify-between font-medium text-[11px] text-amber-500 transition-colors hover:text-amber-400"
                                >
                                    <span>
                                        {t("contracts.detail.signAction")}
                                    </span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Expiring Soon */}
            <div className="space-y-3">
                <div className="flex items-center justify-between border-border/40 border-b pb-1">
                    <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                        {t("dashboard.sidebar.expiringSoon")}
                    </h3>
                    {expiringAgreements.length > 0 && (
                        <Badge
                            variant="outline"
                            className="border-red-500/20 bg-red-500/10 font-mono text-[10px] text-red-500"
                        >
                            {expiringAgreements.length}
                        </Badge>
                    )}
                </div>

                {expiringAgreements.length === 0 ? (
                    <Card className="glass-card rounded-xl p-4 text-center">
                        <p className="text-muted-foreground text-xs">
                            {t("dashboard.sidebar.noExpiring")}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {expiringAgreements.map((ag) => {
                            const diffTime =
                                new Date(ag.deadline).getTime() - Date.now();
                            const daysLeft = Math.ceil(
                                diffTime / (1000 * 60 * 60 * 24),
                            );

                            return (
                                <Card
                                    key={ag._id}
                                    className="glass-card space-y-2 border-red-500/20 p-4"
                                >
                                    <h4 className="line-clamp-1 font-semibold text-foreground text-xs">
                                        {ag.title}
                                    </h4>
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="font-medium text-red-500">
                                            {daysLeft <= 0
                                                ? t("contracts.status.expired")
                                                : t(
                                                      "dashboard.sidebar.daysLeft",
                                                      { count: daysLeft },
                                                  )}
                                        </span>
                                        <Link
                                            href={`/contracts/${ag._id}`}
                                            className="text-primary hover:underline"
                                        >
                                            {t("common.view")}
                                        </Link>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
}
