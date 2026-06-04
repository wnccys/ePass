'use client';

import Link from "next/link";
import { formatUnits } from "viem";
import { ShieldCheck, HelpCircle, ArrowUpRight, Coins, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function VaultCard({ agreement }: { agreement: any }) {
    const isFractionalized = agreement.status === 'active' || agreement.status === 'vault_created' || !!agreement.vaultAddress;

    return (
        <Link href={`/contracts/${agreement._id}`}>
            <Card className="glass-card hover:border-primary/30 transition-all p-5 space-y-4 cursor-pointer group relative">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                Vault Escrow & Fractionalization
                            </span>
                        </div>
                        <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                            {agreement.title || "Image Rights Agreement"}
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </h4>
                    </div>

                    <Badge variant="outline" className={`${isFractionalized ? 'bg-primary/10 text-primary border-primary/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'} font-medium text-[11px]`}>
                        {isFractionalized ? 'Vault Initialized' : 'Pending Vault'}
                    </Badge>
                </div>

                {/* Vault Info */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <p className="text-muted-foreground">Vault Address</p>
                        <p className="font-mono font-medium text-foreground mt-0.5">
                            {agreement.vaultAddress ? `${agreement.vaultAddress.slice(0, 8)}...${agreement.vaultAddress.slice(-6)}` : 'Not deployed yet'}
                        </p>
                    </div>

                    <div>
                        <p className="text-muted-foreground">Caution Deposited</p>
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
                            P_IMAGE Token Distribution
                        </span>
                        {isFractionalized && (
                            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10 flex items-center gap-0.5">
                                <Percent className="w-3 h-3" />
                                100% Minted
                            </span>
                        )}
                    </div>

                    {isFractionalized ? (
                        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground bg-black/5 dark:bg-white/5 p-2.5 rounded-lg border border-border/50">
                            <div>
                                <p className="text-[10px] uppercase font-semibold">Club Reserve</p>
                                <p className="font-semibold text-foreground mt-0.5">90,000 P_IMAGE (90%)</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-semibold">Player Upfront</p>
                                <p className="font-semibold text-foreground mt-0.5">10,000 P_IMAGE (10%)</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                            <HelpCircle className="w-4 h-4 text-amber-500" />
                            Token distribution will occur upon vault fractionalization.
                        </p>
                    )}
                </div>
            </Card>
        </Link>
    );
}
