'use client';

import Link from "next/link";
import { formatUnits } from "viem";
import { HelpCircle, ArrowUpRight, Coins, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export function VaultCard({ agreement, grouped }: { agreement: any; grouped?: 'top' | 'bottom' }) {
    const { t } = useTranslation();
    const isFractionalized = agreement.status === 'active' || agreement.status === 'vault_created' || !!agreement.vaultAddress;

    const tokenSymbol = agreement.tokenSymbol || 'P_IMAGE';
    const playerShare = agreement.playerShare ?? 10;
    const clubShare = agreement.clubShare ?? 90;
    const playerTokens = ((1000000 * playerShare) / 100).toLocaleString();
    const clubTokens = ((1000000 * clubShare) / 100).toLocaleString();

    return (
        <Link href={`/contracts/${agreement._id}`} className="block">
            <Card className={`glass-card hover:border-primary/30 transition-all p-5 space-y-4 cursor-pointer group relative ${
                grouped === 'top' ? 'rounded-b-none' : grouped === 'bottom' ? 'rounded-t-none' : ''
            }`}>
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                {t('dashboard.feed.vaults.vaultEscrowFractionalization')}
                            </span>
                        </div>
                        <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                            {agreement.title || t('dashboard.feed.vaults.imageRightsAgreement')}
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </h4>
                    </div>

                    <Badge variant="outline" className={`${isFractionalized ? 'bg-primary/10 text-primary border-primary/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'} font-medium text-[11px]`}>
                        {isFractionalized ? t('dashboard.feed.vaults.vaultInitialized') : t('dashboard.feed.vaults.pendingVault')}
                    </Badge>
                </div>

                {/* Vault Info */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <p className="text-muted-foreground">{t('dashboard.feed.vaults.vaultAddress')}</p>
                        <p className="font-mono font-medium text-foreground mt-0.5">
                            {agreement.vaultAddress ? `${agreement.vaultAddress.slice(0, 8)}...${agreement.vaultAddress.slice(-6)}` : t('dashboard.feed.vaults.notDeployedYet')}
                        </p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">{t('dashboard.feed.vaults.cautionDeposited')}</p>
                        <p className="font-semibold text-foreground mt-0.5">
                            {formatUnits(BigInt(agreement.cautionAmount || 0), 6)} USDC
                        </p>
                    </div>
                </div>

                {/* Token Distribution details */}
                <div className="pt-3 border-t border-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-primary" />
                            {t('dashboard.feed.vaults.tokenDistribution', { symbol: tokenSymbol })}
                        </span>
                        {isFractionalized && (
                            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10 flex items-center gap-0.5">
                                <Percent className="w-3 h-3" />
                                {t('dashboard.feed.vaults.minted100')}
                            </span>
                        )}
                    </div>

                    {isFractionalized ? (
                        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground bg-black/5 dark:bg-white/5 p-2.5 rounded-lg border border-border/50">
                            <div>
                                <p className="text-[10px] uppercase font-semibold">{t('dashboard.feed.vaults.clubReserve')}</p>
                                <p className="font-semibold text-foreground mt-0.5">{clubTokens} {tokenSymbol} ({clubShare}%)</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-semibold">{t('dashboard.feed.vaults.playerUpfront')}</p>
                                <p className="font-semibold text-foreground mt-0.5">{playerTokens} {tokenSymbol} ({playerShare}%)</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                            <HelpCircle className="w-4 h-4 text-amber-500" />
                            {t('dashboard.feed.vaults.distributionWillOccur')}
                        </p>
                    )}
                </div>
            </Card>
        </Link>
    );
}
