'use client';

import { useState } from "react";
import { 
    Sparkles, 
    Lock, 
    Grid, 
    CheckSquare, 
    ArrowDownCircle, 
    ShieldAlert, 
    Hourglass, 
    Copy, 
    Check, 
    ExternalLink, 
    AlertCircle, 
    Loader2 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export function TransactionCard({ transaction }: { transaction: any }) {
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation();

    const getActionTypeConfig = (type: string) => {
        switch (type) {
            case 'execute_mint':
                return { icon: Sparkles, label: t('dashboard.feed.transactions.mintNftRights'), color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
            case 'create_vault':
                return { icon: Lock, label: t('dashboard.feed.transactions.createEscrowVault'), color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' };
            case 'fractionalize':
                return { icon: Grid, label: t('dashboard.feed.transactions.fractionalizeRights'), color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' };
            case 'approve_token':
                return { icon: CheckSquare, label: t('dashboard.feed.transactions.approveTokenAllowance'), color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
            case 'deposit_caution':
                return { icon: ArrowDownCircle, label: t('dashboard.feed.transactions.depositCautionUsdc'), color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
            case 'rescind_player':
            case 'rescind_club':
                return { icon: ShieldAlert, label: t('dashboard.feed.transactions.rescindContract'), color: 'text-red-500 bg-red-500/10 border-red-500/20' };
            case 'expire_contract':
                return { icon: Hourglass, label: t('dashboard.feed.transactions.contractExpired'), color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' };
            default:
                return { icon: Sparkles, label: type, color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' };
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'confirmed':
                return { icon: Check, label: t('dashboard.feed.transactions.confirmed'), className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
            case 'submitted':
                return { icon: Loader2, label: t('dashboard.feed.transactions.submitted'), className: 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' };
            case 'failed':
                return { icon: AlertCircle, label: t('dashboard.feed.transactions.failed'), className: 'bg-red-500/10 text-red-500 border-red-500/20' };
            default:
                return { icon: Loader2, label: status, className: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' };
        }
    };

    const actionConfig = getActionTypeConfig(transaction.actionType);
    const statusConfig = getStatusConfig(transaction.status);
    const ActionIcon = actionConfig.icon;
    const StatusIcon = statusConfig.icon;

    const copyTxHash = () => {
        navigator.clipboard.writeText(transaction.txHash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="glass-card hover:border-primary/30 transition-all p-5 space-y-4 cursor-default group relative overflow-hidden">
            {/* Top row: action icon & description + status badge */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${actionConfig.color}`}>
                        <ActionIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground text-sm leading-tight">
                            {actionConfig.label}
                        </h4>
                        {transaction.agreementId?.title && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {t('dashboard.feed.transactions.contractLabel', { title: transaction.agreementId.title })}
                            </p>
                        )}
                    </div>
                </div>

                <Badge variant="outline" className={`flex items-center gap-1 text-[11px] font-medium py-0.5 ${statusConfig.className}`}>
                    {transaction.status === 'submitted' && <StatusIcon className="w-3 h-3 animate-spin" />}
                    {transaction.status !== 'submitted' && <StatusIcon className="w-3 h-3" />}
                    {statusConfig.label}
                </Badge>
            </div>

            {/* Bottom info row */}
            <div className="pt-3 border-t border-border flex items-center justify-between gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono">
                        {transaction.txHash.slice(0, 6)}...{transaction.txHash.slice(-4)}
                    </span>
                    <button 
                        onClick={copyTxHash}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title={t('dashboard.feed.transactions.copyTxHash')}
                    >
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <a 
                        href={`https://sepolia.etherscan.io/tx/${transaction.txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title={t('dashboard.feed.transactions.viewOnExplorer')}
                    >
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                <span className="text-muted-foreground font-mono text-[10px]" suppressHydrationWarning>
                    {new Date(transaction.createdAt).toLocaleDateString()} {new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </Card>
    );
}
