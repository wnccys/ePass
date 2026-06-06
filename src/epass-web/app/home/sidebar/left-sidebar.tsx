'use client';

import Link from "next/link";
import { formatUnits } from "viem";
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export function LeftSidebar({
    walletAddress,
    expiringAgreements,
    pendingSignatures
}: {
    walletAddress?: string;
    expiringAgreements: any[];
    pendingSignatures: any[];
}) {
    const { t } = useTranslation();

    return (
        <aside className="w-full space-y-6 lg:max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
            {/* Warning: No Wallet Connected */}
            {!walletAddress && (
                <Card className="border border-amber-500/30 bg-amber-500/10 p-4 rounded-xl text-amber-600 dark:text-amber-400 space-y-2">
                    <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <h5 className="font-semibold text-sm">{t("dashboard.sidebar.walletDisconnected")}</h5>
                            <p className="text-xs opacity-95 leading-relaxed mt-0.5">
                                {t("dashboard.sidebar.walletDisconnectedDesc")}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Pending Signatures */}
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-border/40">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("dashboard.sidebar.pendingActions")}
                    </h3>
                    {pendingSignatures.length > 0 && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono text-[10px]">
                            {pendingSignatures.length}
                        </Badge>
                    )}
                </div>

                {pendingSignatures.length === 0 ? (
                    <Card className="glass-card p-4 text-center rounded-xl">
                        <p className="text-xs text-muted-foreground">{t("dashboard.sidebar.noPending")}</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {pendingSignatures.map((ag) => (
                            <Card key={ag._id} className="glass-card p-4 space-y-3 border-amber-500/20">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-foreground text-xs line-clamp-1">
                                        {ag.title}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground">
                                        Caution: {formatUnits(BigInt(ag.cautionAmount || 0), 6)} USDC
                                    </p>
                                </div>
                                <Link 
                                    href={`/contracts/${ag._id}`}
                                    className="flex items-center justify-between text-[11px] font-medium text-amber-500 hover:text-amber-400 transition-colors w-full"
                                >
                                    <span>{t("contracts.detail.signAction")}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Expiring Soon */}
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-border/40">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("dashboard.sidebar.expiringSoon")}
                    </h3>
                    {expiringAgreements.length > 0 && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 font-mono text-[10px]">
                            {expiringAgreements.length}
                        </Badge>
                    )}
                </div>

                {expiringAgreements.length === 0 ? (
                    <Card className="glass-card p-4 text-center rounded-xl">
                        <p className="text-xs text-muted-foreground">{t("dashboard.sidebar.noExpiring")}</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {expiringAgreements.map((ag) => {
                            const diffTime = new Date(ag.deadline).getTime() - Date.now();
                            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            return (
                                <Card key={ag._id} className="glass-card p-4 space-y-2 border-red-500/20">
                                    <h4 className="font-semibold text-foreground text-xs line-clamp-1">
                                        {ag.title}
                                    </h4>
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-red-500 font-medium">
                                            {daysLeft <= 0 ? t("contracts.status.expired") : t("dashboard.sidebar.daysLeft", { count: daysLeft })}
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
