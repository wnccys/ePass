import { AlertCircle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function ContractCard({
    agreement,
    userRole,
}: {
    agreement: any;
    userRole: string;
}) {
    const { t } = useTranslation();

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "draft":
                return {
                    color: "bg-zinc-500/10 text-zinc-500",
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
                    label: t("contracts.status.ready"),
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
                return { color: "bg-zinc-500/10 text-zinc-500", label: status };
        }
    };

    const statusConfig = getStatusConfig(agreement.status);

    const targetWallet =
        userRole === "player"
            ? agreement.clubWalletAddress
            : agreement.playerWalletAddress;
    const targetRole =
        userRole === "player" ? t("common.club") : t("common.player");

    return (
        <Link href={`/contracts/${agreement._id}`}>
            <Card className="glass-card group flex h-full cursor-pointer flex-col space-y-4 p-6 transition-all hover:border-primary/30">
                <div className="flex items-start justify-between">
                    <Badge
                        variant="outline"
                        className={`${statusConfig.color} font-medium`}
                    >
                        {statusConfig.label}
                    </Badge>
                    <span
                        className="font-mono text-muted-foreground text-xs"
                        suppressHydrationWarning
                    >
                        {new Date(agreement.createdAt).toLocaleDateString()}
                    </span>
                </div>

                <div className="flex-1 space-y-3">
                    <div>
                        <h4 className="line-clamp-1 font-semibold text-base text-foreground transition-colors group-hover:text-primary">
                            {agreement.title || t("contracts.title")}
                        </h4>
                        {agreement.description && (
                            <p className="mt-1 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                                {agreement.description}
                            </p>
                        )}
                    </div>

                    <div className="border-border border-t pt-2">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                {targetRole}
                            </p>
                            {targetRole === t("common.player") &&
                                agreement.playerEmail && (
                                    <span className="rounded-full border border-primary/10 bg-primary/5 px-2 py-0.5 font-mono text-[10px] text-primary/80">
                                        {agreement.playerEmail}
                                    </span>
                                )}
                            {targetRole === t("common.club") &&
                                agreement.clubEmail && (
                                    <span className="rounded-full border border-primary/10 bg-primary/5 px-2 py-0.5 font-mono text-[10px] text-primary/80">
                                        {agreement.clubEmail}
                                    </span>
                                )}
                        </div>
                        <p className="mt-1 break-all font-mono text-foreground text-sm">
                            {targetWallet.slice(0, 8)}...
                            {targetWallet.slice(-6)}
                        </p>
                    </div>

                    <div className="flex items-center justify-between border-border border-t pt-2">
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wider">
                                {t("contracts.cautionAmount")}
                            </p>
                            <p className="mt-1 font-semibold text-foreground">
                                {formatUnits(
                                    BigInt(agreement.cautionAmount),
                                    6,
                                )}{" "}
                                USDC
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                {t("contracts.rightsToken")}
                            </span>
                            <Badge
                                variant="outline"
                                className="glass-badge px-2.5 py-1 font-medium font-mono text-foreground/85 text-xs tracking-wider"
                            >
                                {agreement.tokenSymbol}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between border-border border-t pt-4 text-xs">
                    <div className="flex gap-3">
                        <span
                            className={`flex items-center gap-1 ${agreement.clubSignature ? "text-green-500" : "text-amber-500"}`}
                        >
                            {agreement.clubSignature ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : (
                                <Clock className="h-3 w-3" />
                            )}
                            {t("common.club")}
                        </span>
                        <span
                            className={`flex items-center gap-1 ${agreement.playerSignature ? "text-green-500" : "text-amber-500"}`}
                        >
                            {agreement.playerSignature ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : (
                                <Clock className="h-3 w-3" />
                            )}
                            {t("common.player")}
                        </span>
                        <span
                            className={`flex items-center gap-1 ${agreement.attorneySignature ? "text-green-500" : "text-amber-500"}`}
                        >
                            {agreement.attorneySignature ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : (
                                <Clock className="h-3 w-3" />
                            )}
                            {t("common.attorney")}
                        </span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
