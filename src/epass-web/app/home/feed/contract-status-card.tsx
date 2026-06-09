"use client";

import { ArrowUpRight, Calendar, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useReadRightsVaultImplTimeRemaining } from "@/src/generated";

export function ContractStatusCard({
    agreement,
    userRole,
    grouped,
}: {
    agreement: any;
    userRole: string;
    grouped?: "top" | "bottom";
}) {
    const { t } = useTranslation();
    const getStatusConfig = (status: string) => {
        switch (status) {
            case "draft":
                return {
                    color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
                    label: t("contracts.status.draft"),
                };
            case "pending_signatures":
                return {
                    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                    label: t("contracts.status.pending_signatures"),
                };
            case "ready":
                return {
                    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                    label: t("contracts.detail.readyToMint"),
                };
            case "minted":
                return {
                    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                    label: t("contracts.status.minted"),
                };
            case "vault_created":
                return {
                    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
                    label: t("contracts.status.vault_created"),
                };
            case "pending_deposit":
                return {
                    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                    label: t("contracts.status.pending_deposit"),
                };
            case "active":
                return {
                    color: "bg-green-500/10 text-green-500 border-green-500/20",
                    label: t("contracts.status.active"),
                };
            case "rescinded":
                return {
                    color: "bg-red-500/10 text-red-500 border-red-500/20",
                    label: t("contracts.status.rescinded"),
                };
            case "expired":
                return {
                    color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
                    label: t("contracts.status.expired"),
                };
            default:
                return {
                    color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
                    label: status,
                };
        }
    };

    const statusConfig = getStatusConfig(agreement.status);

    const isBelowMinted = ["draft", "pending_signatures", "ready"].includes(
        agreement.status,
    );

    const { data: timeRemainingOnChain } = useReadRightsVaultImplTimeRemaining({
        address: agreement.vaultAddress as `0x${string}`,
        query: {
            enabled: !!agreement.vaultAddress && !isBelowMinted,
        },
    });

    const displayDuration = useMemo(() => {
        if (isBelowMinted) {
            return agreement.deadline
                ? new Date(agreement.deadline).toLocaleString()
                : "N/A";
        }

        if (timeRemainingOnChain !== undefined) {
            if (timeRemainingOnChain > 0n) {
                const days = timeRemainingOnChain / 86400n;
                const hours = (timeRemainingOnChain % 86400n) / 3600n;
                return `${days.toString()}d ${hours.toString()}h`;
            }
            return t("contracts.status.expired");
        }

        return agreement.deadline
            ? new Date(agreement.deadline).toLocaleString()
            : "N/A";
    }, [agreement.deadline, isBelowMinted, timeRemainingOnChain, t]);

    return (
        <Link href={`/contracts/${agreement._id}`} className="block">
            <Card
                className={`glass-card group relative cursor-pointer space-y-4 p-5 transition-all hover:border-primary/30 ${
                    grouped === "top"
                        ? "rounded-b-none"
                        : grouped === "bottom"
                          ? "rounded-t-none"
                          : ""
                }`}
            >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                {t("common.statusUpdate")}
                            </span>
                        </div>
                        <h4 className="flex items-center gap-1 font-semibold text-foreground text-sm transition-colors group-hover:text-primary">
                            {agreement.title ||
                                t("contracts.detail.onChainAgreement")}
                            <ArrowUpRight className="h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                        </h4>
                    </div>

                    <Badge
                        variant="outline"
                        className={`${statusConfig.color} font-medium text-[11px]`}
                    >
                        {statusConfig.label}
                    </Badge>
                </div>

                {/* Main Card Content */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <p className="text-muted-foreground">
                            {t("contracts.cautionAmount")}
                        </p>
                        <p className="mt-0.5 font-semibold text-foreground">
                            {formatUnits(
                                BigInt(agreement.cautionAmount || 0),
                                6,
                            )}{" "}
                            USDC
                        </p>
                    </div>

                    {userRole === "club" && agreement.vaultAddress ? (
                        <div>
                            <p className="text-muted-foreground">
                                {t("common.escrowVault")}
                            </p>
                            <p className="mt-0.5 font-medium font-mono text-foreground">
                                {agreement.vaultAddress.slice(0, 6)}...
                                {agreement.vaultAddress.slice(-4)}
                            </p>
                        </div>
                    ) : isBelowMinted ||
                      agreement.status === "active" ||
                      agreement.status === "minted" ||
                      agreement.status === "vault_created" ? (
                        <div>
                            <p className="text-muted-foreground">
                                {t("common.duration")}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 font-medium text-foreground">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                {displayDuration}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-muted-foreground">
                                {t("common.partyInvolved")}
                            </p>
                            <p className="mt-0.5 line-clamp-1 font-medium text-foreground">
                                {userRole === "player"
                                    ? agreement.clubEmail
                                    : agreement.playerEmail}
                            </p>
                        </div>
                    )}
                </div>

                {/* Signature progress */}
                <div className="flex items-center justify-between border-border border-t pt-3 text-xs">
                    <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                        {t("contracts.detail.signatures")}
                    </span>
                    <div className="flex gap-3">
                        <span
                            className={`flex items-center gap-1 ${agreement.clubSignature ? "text-green-500" : "text-amber-500"}`}
                        >
                            {agreement.clubSignature ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : (
                                <Clock className="h-3 w-3 animate-pulse" />
                            )}
                            {t("contracts.detail.club")}
                        </span>
                        <span
                            className={`flex items-center gap-1 ${agreement.playerSignature ? "text-green-500" : "text-amber-500"}`}
                        >
                            {agreement.playerSignature ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : (
                                <Clock className="h-3 w-3 animate-pulse" />
                            )}
                            {t("contracts.detail.player")}
                        </span>
                        <span
                            className={`flex items-center gap-1 ${agreement.attorneySignature ? "text-green-500" : "text-amber-500"}`}
                        >
                            {agreement.attorneySignature ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : (
                                <Clock className="h-3 w-3 animate-pulse" />
                            )}
                            {t("contracts.detail.attorney")}
                        </span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
