'use client';

import Link from "next/link";
import { formatUnits } from "viem";
import { Clock, ShieldAlert, CheckCircle2, AlertCircle, ArrowUpRight, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ContractStatusCard({ agreement, userRole, grouped }: { agreement: any; userRole: string; grouped?: 'top' | 'bottom' }) {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'draft': 
                return { color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20', label: 'Draft' };
            case 'pending_signatures': 
                return { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Pending Signatures' };
            case 'ready': 
                return { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Ready to Mint' };
            case 'minted': 
                return { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Minted' };
            case 'vault_created': 
                return { color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', label: 'Vault Created' };
            case 'active': 
                return { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Active' };
            case 'rescinded': 
                return { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Rescinded' };
            case 'expired': 
                return { color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20', label: 'Expired' };
            default: 
                return { color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20', label: status };
        }
    };

    const statusConfig = getStatusConfig(agreement.status);

    // Calculate time remaining (for active contracts)
    const getTimeRemaining = (deadlineStr: string) => {
        if (!deadlineStr) return null;
        const deadline = new Date(deadlineStr);
        const diffTime = deadline.getTime() - Date.now();
        if (diffTime <= 0) return 'Expired';
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
            const diffMonths = Math.floor(diffDays / 30);
            return `${diffMonths} month${diffMonths > 1 ? 's' : ''} remaining`;
        }
        return `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`;
    };

    const timeRemaining = agreement.deadline ? getTimeRemaining(agreement.deadline) : null;

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
                                Contract Status Update
                            </span>
                        </div>
                        <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                            {agreement.title || "Image Rights Agreement"}
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </h4>
                    </div>

                    <Badge variant="outline" className={`${statusConfig.color} font-medium text-[11px]`}>
                        {statusConfig.label}
                    </Badge>
                </div>

                {/* Main Card Content */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <p className="text-muted-foreground">Caution Amount</p>
                        <p className="font-semibold text-foreground mt-0.5">
                            {formatUnits(BigInt(agreement.cautionAmount || 0), 6)} USDC
                        </p>
                    </div>

                    {userRole === 'club' && agreement.vaultAddress ? (
                        <div>
                            <p className="text-muted-foreground">Escrow Vault</p>
                            <p className="font-mono font-medium text-foreground mt-0.5">
                                {agreement.vaultAddress.slice(0, 6)}...{agreement.vaultAddress.slice(-4)}
                            </p>
                        </div>
                    ) : userRole === 'player' && agreement.status === 'active' && timeRemaining ? (
                        <div>
                            <p className="text-muted-foreground">Duration</p>
                            <p className="font-medium text-foreground mt-0.5 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                {timeRemaining}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-muted-foreground">Party Involved</p>
                            <p className="font-medium text-foreground mt-0.5 line-clamp-1">
                                {userRole === 'player' ? agreement.clubEmail : agreement.playerEmail}
                            </p>
                        </div>
                    )}
                </div>

                {/* Signature progress */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Signatures
                    </span>
                    <div className="flex gap-3">
                        <span className={`flex items-center gap-1 ${agreement.clubSignature ? 'text-green-500' : 'text-amber-500'}`}>
                            {agreement.clubSignature ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3 animate-pulse" />}
                            Club
                        </span>
                        <span className={`flex items-center gap-1 ${agreement.playerSignature ? 'text-green-500' : 'text-amber-500'}`}>
                            {agreement.playerSignature ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3 animate-pulse" />}
                            Player
                        </span>
                        <span className={`flex items-center gap-1 ${agreement.attorneySignature ? 'text-green-500' : 'text-amber-500'}`}>
                            {agreement.attorneySignature ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3 animate-pulse" />}
                            Attorney
                        </span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
