"use client";

import { ArrowUpRight, Coins, HelpCircle, Percent } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    useReadRightsVaultImplAttorneyBps,
    useReadRightsVaultImplCautionAmount,
    useReadRightsVaultImplCautionBps,
    useReadRightsVaultImplClubBps,
    useReadRightsVaultImplPlayerBps,
} from "@/src/generated";

export function VaultCard({
    agreement,
    grouped,
}: {
    agreement: any;
    grouped?: "top" | "bottom";
}) {
    const { t } = useTranslation();
    const isFractionalized =
        agreement.status === "active" ||
        agreement.status === "vault_created" ||
        !!agreement.vaultAddress;

    const tokenSymbol = agreement.tokenSymbol || "P_IMAGE";

    // Read contract values using wagmi-cli generated hooks
    const { data: cautionAmount } = useReadRightsVaultImplCautionAmount({
        address: agreement.vaultAddress as `0x${string}`,
        query: {
            enabled: !!agreement.vaultAddress,
        },
    });

    const { data: cautionBps } = useReadRightsVaultImplCautionBps({
        address: agreement.vaultAddress as `0x${string}`,
        query: {
            enabled: !!agreement.vaultAddress,
        },
    });

    const { data: playerBps } = useReadRightsVaultImplPlayerBps({
        address: agreement.vaultAddress as `0x${string}`,
        query: {
            enabled: !!agreement.vaultAddress,
        },
    });

    const { data: clubBps } = useReadRightsVaultImplClubBps({
        address: agreement.vaultAddress as `0x${string}`,
        query: {
            enabled: !!agreement.vaultAddress,
        },
    });

    const { data: attorneyBps } = useReadRightsVaultImplAttorneyBps({
        address: agreement.vaultAddress as `0x${string}`,
        query: {
            enabled: !!agreement.vaultAddress,
        },
    });

    // Fallbacks reflect the real default configurations used during deployment
    const playerShare = playerBps !== undefined ? Number(playerBps) / 100 : 30;
    const clubShare = clubBps !== undefined ? Number(clubBps) / 100 : 60;
    const attorneyShare =
        attorneyBps !== undefined ? Number(attorneyBps) / 100 : 10;
    const cautionPercentage =
        cautionBps !== undefined ? Number(cautionBps) / 100 : 50;

    const playerTokens = ((1000000 * playerShare) / 100).toLocaleString();
    const clubTokens = ((1000000 * clubShare) / 100).toLocaleString();
    const attorneyTokens = ((1000000 * attorneyShare) / 100).toLocaleString();

    const cautionAmountFormatted =
        cautionAmount !== undefined
            ? formatUnits(cautionAmount, 18)
            : formatUnits(BigInt(agreement.cautionAmount || 0), 6);

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
                                {t(
                                    "dashboard.feed.vaults.vaultEscrowFractionalization",
                                )}
                            </span>
                        </div>
                        <h4 className="flex items-center gap-1 font-semibold text-foreground text-sm transition-colors group-hover:text-primary">
                            {agreement.title ||
                                t("dashboard.feed.vaults.imageRightsAgreement")}
                            <ArrowUpRight className="h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                        </h4>
                    </div>

                    <Badge
                        variant="outline"
                        className={`${isFractionalized ? "border-primary/20 bg-primary/10 text-primary" : "border-amber-500/20 bg-amber-500/10 text-amber-500"} font-medium text-[11px]`}
                    >
                        {isFractionalized
                            ? t("dashboard.feed.vaults.vaultInitialized")
                            : t("dashboard.feed.vaults.pendingVault")}
                    </Badge>
                </div>

                {/* Vault Info */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <p className="text-muted-foreground">
                            {t("dashboard.feed.vaults.vaultAddress")}
                        </p>
                        <p className="mt-0.5 font-medium font-mono text-foreground">
                            {agreement.vaultAddress
                                ? `${agreement.vaultAddress.slice(0, 8)}...${agreement.vaultAddress.slice(-6)}`
                                : t("dashboard.feed.vaults.notDeployedYet")}
                        </p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">
                            {t("dashboard.feed.vaults.cautionDeposited")}
                        </p>
                        <p className="mt-0.5 font-semibold text-foreground">
                            {cautionAmountFormatted} USDC
                            <span className="ml-1 font-normal text-[10px] text-muted-foreground">
                                ({cautionPercentage}%)
                            </span>
                        </p>
                    </div>
                </div>

                {/* Token Distribution details */}
                <div className="space-y-2 border-border border-t pt-3">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex select-none items-center gap-1.5">
                            <span className="flex items-center gap-1 font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                <Coins className="h-3.5 w-3.5 text-primary" />
                                {t("dashboard.feed.vaults.tokenDistribution", {
                                    symbol: tokenSymbol,
                                })}
                            </span>
                            <div className="group/tooltip relative z-40 inline-block">
                                <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60 transition-colors hover:text-foreground" />
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 w-64 origin-bottom -translate-x-1/2 scale-95 rounded-2xl border border-foreground/10 bg-card/95 p-3.5 text-center text-[11px] text-muted-foreground normal-case leading-relaxed opacity-0 shadow-2xl backdrop-blur-md transition-all duration-300 group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100">
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-card/95" />
                                    <span className="mb-1 block font-semibold text-foreground text-xs">
                                        {t(
                                            "dashboard.feed.vaults.distributionHelpTitle",
                                        )}
                                    </span>
                                    {t(
                                        "dashboard.feed.vaults.distributionHelpText",
                                    )}
                                </div>
                            </div>
                        </div>
                        {isFractionalized && (
                            <span className="flex items-center gap-0.5 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-2 py-0.5 font-mono text-[10px] text-emerald-500">
                                <Percent className="h-3 w-3" />
                                {t("dashboard.feed.vaults.minted100")}
                            </span>
                        )}
                    </div>

                    {isFractionalized ? (
                        <div className="grid grid-cols-3 gap-3 rounded-lg border border-border/50 bg-black/5 p-2.5 text-muted-foreground text-xs dark:bg-white/5">
                            <div>
                                <p className="font-semibold text-[10px] uppercase">
                                    {t("dashboard.feed.vaults.clubReserve")}
                                </p>
                                <p className="mt-0.5 font-semibold text-foreground">
                                    {clubTokens} {tokenSymbol} ({clubShare}%)
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-[10px] uppercase">
                                    {t("dashboard.feed.vaults.playerUpfront")}
                                </p>
                                <p className="mt-0.5 font-semibold text-foreground">
                                    {playerTokens} {tokenSymbol} ({playerShare}
                                    %)
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-[10px] uppercase">
                                    {t("dashboard.feed.vaults.attorneyShare")}
                                </p>
                                <p className="mt-0.5 font-semibold text-foreground">
                                    {attorneyTokens} {tokenSymbol} (
                                    {attorneyShare}%)
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="flex items-center gap-1.5 text-muted-foreground text-xs italic">
                            <HelpCircle className="h-4 w-4 text-amber-500" />
                            {t("dashboard.feed.vaults.distributionWillOccur")}
                        </p>
                    )}
                </div>
            </Card>
        </Link>
    );
}
