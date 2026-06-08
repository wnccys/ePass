"use client";

import {
    AlertCircle,
    ArrowDownCircle,
    Check,
    CheckSquare,
    Copy,
    ExternalLink,
    Grid,
    Hourglass,
    Loader2,
    Lock,
    ShieldAlert,
    Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function TransactionCard({ transaction }: { transaction: any }) {
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation();

    const getActionTypeConfig = (type: string) => {
        switch (type) {
            case "execute_mint":
                return {
                    icon: Sparkles,
                    label: t("dashboard.feed.transactions.mintNftRights"),
                    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
                };
            case "create_vault":
                return {
                    icon: Lock,
                    label: t("dashboard.feed.transactions.createEscrowVault"),
                    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
                };
            case "fractionalize":
                return {
                    icon: Grid,
                    label: t("dashboard.feed.transactions.fractionalizeRights"),
                    color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
                };
            case "approve_token":
                return {
                    icon: CheckSquare,
                    label: t(
                        "dashboard.feed.transactions.approveTokenAllowance",
                    ),
                    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
                };
            case "approve_usdc_to_vault":
                return {
                    icon: CheckSquare,
                    label: t("dashboard.feed.transactions.approveUsdcToVault"),
                    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
                };
            case "authorize_vault":
                return {
                    icon: Lock,
                    label: t("dashboard.feed.transactions.authorizeVault"),
                    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
                };
            case "deposit_caution":
                return {
                    icon: ArrowDownCircle,
                    label: t("dashboard.feed.transactions.depositCautionUsdc"),
                    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
                };
            case "rescind_player":
            case "rescind_club":
                return {
                    icon: ShieldAlert,
                    label: t("dashboard.feed.transactions.rescindContract"),
                    color: "text-red-500 bg-red-500/10 border-red-500/20",
                };
            case "expire_contract":
                return {
                    icon: Hourglass,
                    label: t("dashboard.feed.transactions.contractExpired"),
                    color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
                };
            default:
                return {
                    icon: Sparkles,
                    label: type,
                    color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
                };
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "confirmed":
                return {
                    icon: Check,
                    label: t("dashboard.feed.transactions.confirmed"),
                    className:
                        "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                };
            case "submitted":
                return {
                    icon: Loader2,
                    label: t("dashboard.feed.transactions.submitted"),
                    className:
                        "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse",
                };
            case "failed":
                return {
                    icon: AlertCircle,
                    label: t("dashboard.feed.transactions.failed"),
                    className: "bg-red-500/10 text-red-500 border-red-500/20",
                };
            default:
                return {
                    icon: Loader2,
                    label: status,
                    className:
                        "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
                };
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
        <Card className="glass-card group relative cursor-default space-y-4 overflow-hidden p-5 transition-all hover:border-primary/30">
            {/* Top row: action icon & description + status badge */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`rounded-xl border p-2.5 ${actionConfig.color}`}
                    >
                        <ActionIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground text-sm leading-tight">
                            {actionConfig.label}
                        </h4>
                        {transaction.agreementId?.title && (
                            <p className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">
                                {t(
                                    "dashboard.feed.transactions.contractLabel",
                                    { title: transaction.agreementId.title },
                                )}
                            </p>
                        )}
                    </div>
                </div>

                <Badge
                    variant="outline"
                    className={`flex items-center gap-1 py-0.5 font-medium text-[11px] ${statusConfig.className}`}
                >
                    {transaction.status === "submitted" && (
                        <StatusIcon className="h-3 w-3 animate-spin" />
                    )}
                    {transaction.status !== "submitted" && (
                        <StatusIcon className="h-3 w-3" />
                    )}
                    {statusConfig.label}
                </Badge>
            </div>

            {/* Bottom info row */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-border border-t pt-3 text-xs">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-muted-foreground">
                        {transaction.txHash.slice(0, 6)}...
                        {transaction.txHash.slice(-4)}
                    </span>
                    <button
                        onClick={copyTxHash}
                        className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title={t("dashboard.feed.transactions.copyTxHash")}
                    >
                        {copied ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                            <Copy className="h-3 w-3" />
                        )}
                    </button>
                    <a
                        href={`https://sepolia.etherscan.io/tx/${transaction.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title={t("dashboard.feed.transactions.viewOnExplorer")}
                    >
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>

                <span
                    className="font-mono text-[10px] text-muted-foreground"
                    suppressHydrationWarning
                >
                    {new Date(transaction.createdAt).toLocaleDateString()}{" "}
                    {new Date(transaction.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </span>
            </div>
        </Card>
    );
}
