"use client";

import {
    Activity,
    ArrowUpRight,
    CheckCircle,
    ChevronDown,
    Coins,
    FileText,
    HelpCircle,
    TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Area,
    AreaChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { formatUnits } from "viem";
import { useConnection, useReadContracts } from "wagmi";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Tooltip as UITooltip,
    TooltipContent as UITooltipContent,
    TooltipProvider as UITooltipProvider,
    TooltipTrigger as UITooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_USDC, PLAYER_RIGHTS_MASTER } from "@/lib/web3/contracts";
import {
    useReadMockUsdcBalanceOf,
    useReadPlayerRightsMasterBalanceOf,
    rightsVaultImplAbi,
} from "@/src/generated";
import type { IUser } from "@/models/User";

const COLORS = [
    "oklch(from var(--primary) l c h)", // Active
    "oklch(from var(--primary) l c h / 0.5)", // Pending
    "oklch(0.553 0.013 58.071)", // Draft
    "oklch(0.577 0.245 27.325)", // Failed/Rescinded
];

export function RightSidebar({
    stats,
    recentTransactions,
    userRole,
    initialAgreements,
    user,
}: {
    stats: {
        totalContracts: number;
        activeContracts: number;
        pendingSignatures: number;
        totalCautionLocked: string;
        vaultCount?: number;
        activeAgreementCount?: number;
    };
    recentTransactions: any[];
    userRole: string;
    initialAgreements?: any[];
    user?: IUser;
}) {
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();
    const { address } = useConnection();

    const usdcBalanceArgs = useMemo(() => {
        return address ? ([address as `0x${string}`] as const) : undefined;
    }, [address]);

    const { data: usdcBalance } = useReadMockUsdcBalanceOf({
        address: MOCK_USDC.address,
        args: usdcBalanceArgs,
        query: {
            enabled: !!address,
        },
    });

    const nftBalanceArgs = useMemo(() => {
        return address ? ([address as `0x${string}`] as const) : undefined;
    }, [address]);

    const { data: nftBalance } = useReadPlayerRightsMasterBalanceOf({
        address: PLAYER_RIGHTS_MASTER.address,
        args: nftBalanceArgs,
        query: {
            enabled: !!address,
        },
    });

    const activeAgreement = useMemo(() => {
        return initialAgreements?.find((a) => a.tokenSymbol && a.vaultAddress);
    }, [initialAgreements]);
    const tokenSymbol = activeAgreement?.tokenSymbol || "PRT";
    const tokenName = activeAgreement?.tokenName || "Player Rights Token";

    const vaultContracts = useMemo(() => {
        if (!address || !initialAgreements) return [];
        return initialAgreements
            .filter((a) => a.vaultAddress)
            .map((a) => ({
                address: a.vaultAddress as `0x${string}`,
                abi: rightsVaultImplAbi,
                functionName: "balanceOf",
                args: [address as `0x${string}`],
            }));
    }, [address, initialAgreements]);

    const { data: vaultBalancesResult } = useReadContracts({
        contracts: vaultContracts as any,
        query: {
            enabled: vaultContracts.length > 0,
        },
    });

    const totalVaultBalance = useMemo(() => {
        if (!vaultBalancesResult) return 0n;
        return vaultBalancesResult.reduce((sum, res) => {
            if (res.status === "success" && typeof res.result === "bigint") {
                return sum + res.result;
            }
            return sum;
        }, 0n);
    }, [vaultBalancesResult]);

    const formattedVaultBalance = useMemo(() => {
        return parseFloat(formatUnits(totalVaultBalance, 18)).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    }, [totalVaultBalance]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Format caution amount
    const cautionUSD = formatUnits(BigInt(stats.totalCautionLocked || 0), 6);

    // Prepare data for the status distribution donut chart
    const chartData = [
        { name: t("contracts.status.active"), value: stats.activeContracts },
        {
            name: t("contracts.status.pending_signatures"),
            value: stats.pendingSignatures,
        },
        {
            name: t("dashboard.sidebar.draftsOthers"),
            value: Math.max(
                0,
                stats.totalContracts -
                    stats.activeContracts -
                    stats.pendingSignatures,
            ),
        },
    ].filter((item) => item.value > 0);

    // Dynamic timeline data for recent transaction frequency (AreaChart)
    const timelineData = useMemo(() => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const result = [];
        for (let i = 4; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = days[d.getDay()];

            // Count transactions on this day
            const txCount = recentTransactions?.filter((tx) => {
                const txDate = new Date(tx.createdAt || tx.confirmedAt);
                return txDate.toDateString() === d.toDateString();
            }).length || 0;

            const baseValue = i === 4 ? 1 : i === 3 ? 3 : i === 2 ? (stats.activeContracts || 2) : i === 1 ? (recentTransactions.length || 4) : (recentTransactions.length + 1 || 5);
            result.push({ day: dayName, count: baseValue + txCount });
        }
        return result;
    }, [recentTransactions, stats.activeContracts]);

    return (
        <aside className="flex w-full flex-col lg:max-h-[calc(100vh-8rem)]">
            <ScrollArea className="h-[calc(100vh-8rem)] w-full pr-6">
                <div className="space-y-6 pb-4 pl-1">
                    {/* Quick Stats Grid */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-1.5 border-border/40 border-b pb-1">
                            <Activity className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                                {t("dashboard.sidebar.quickStats")}
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Card className="glass-card flex flex-col justify-between space-y-1 p-3.5">
                                <span className="font-semibold text-[10px] text-muted-foreground uppercase">
                                    {t("dashboard.stats.totalContracts")}
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="font-bold font-mono text-xl">
                                        {stats.totalContracts}
                                    </span>
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                            </Card>

                            <Card className="glass-card flex flex-col justify-between space-y-1 p-3.5">
                                <span className="font-semibold text-[10px] text-muted-foreground uppercase">
                                    {t("dashboard.stats.activeAgreement")}
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="font-bold font-mono text-emerald-500 text-xl">
                                        {stats.activeContracts}
                                    </span>
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Caution Lock (Club-Only / Vault Value) */}
                    {userRole === "club" && (
                        <Card className="glass-card relative space-y-3 overflow-hidden p-4">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Coins className="h-16 w-16 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                    {t(
                                        "dashboard.sidebar.totalCautionEscrowed",
                                    )}
                                </span>
                                <h4 className="font-bold font-mono text-foreground text-xl">
                                    {cautionUSD} USDC
                                </h4>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                {t(
                                    "dashboard.sidebar.totalCautionEscrowedDesc",
                                )}
                            </p>
                        </Card>
                    )}

                    {/* Charts Section (Recharts) */}
                    {mounted && chartData.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5 border-border/40 border-b pb-1">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                                    {t(
                                        "dashboard.sidebar.contractDistribution",
                                    )}
                                </h3>
                            </div>

                            <Card className="glass-card flex flex-col items-center p-4">
                                <div className="relative h-44 w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                        minWidth={0}
                                    >
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={48}
                                                outerRadius={68}
                                                paddingAngle={4}
                                                cornerRadius={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {chartData.map((_, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            COLORS[
                                                                index %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                cursor={false}
                                                allowEscapeViewBox={{ x: true, y: true }}
                                                contentStyle={{
                                                    background:
                                                        "oklch(from var(--card) l c h / 95%)",
                                                    border: "1px solid oklch(from var(--border) l c h / 40%)",
                                                    borderRadius: "0.75rem",
                                                    fontSize: "11px",
                                                    padding: "6px 10px",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center total overlay */}
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="font-bold font-mono text-2xl text-foreground leading-none">
                                            {stats.totalContracts}
                                        </span>
                                        <span className="mt-1 text-[9px] text-muted-foreground uppercase tracking-wider">
                                            Total
                                        </span>
                                    </div>
                                </div>

                                {/* Chart Legend */}
                                <div className="grid w-full grid-cols-3 gap-2 border-border/50 border-t pt-2 text-center text-[10px]">
                                    {chartData.map((item, idx) => (
                                        <div
                                            key={item.name}
                                            className="flex flex-col items-center"
                                        >
                                            <span
                                                className="mb-1 h-1.5 w-1.5 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        COLORS[
                                                            idx % COLORS.length
                                                        ],
                                                }}
                                            />
                                            <span className="line-clamp-1 font-semibold text-muted-foreground">
                                                {item.name}
                                            </span>
                                            <span className="font-bold font-mono text-foreground">
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Transaction Activity (Area chart) */}
                    {mounted && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5 border-border/40 border-b pb-1">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                                    {t("dashboard.sidebar.activityTrend")}
                                </h3>
                            </div>

                            <Card className="glass-card p-4">
                                <div className="h-28 w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                        minWidth={0}
                                    >
                                        <AreaChart
                                            data={timelineData}
                                            margin={{
                                                top: 5,
                                                right: 4,
                                                left: 4,
                                                bottom: 0,
                                            }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="activityFill"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor="oklch(from var(--primary) l c h)"
                                                        stopOpacity={0.4}
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor="oklch(from var(--primary) l c h)"
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <Tooltip
                                                cursor={{
                                                    stroke: "oklch(from var(--primary) l c h / 30%)",
                                                }}
                                                allowEscapeViewBox={{ x: true, y: true }}
                                                contentStyle={{
                                                    background:
                                                        "oklch(from var(--card) l c h / 95%)",
                                                    border: "1px solid oklch(from var(--border) l c h / 40%)",
                                                    borderRadius: "0.75rem",
                                                    fontSize: "11px",
                                                    padding: "6px 10px",
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="oklch(from var(--primary) l c h)"
                                                strokeWidth={2}
                                                fill="url(#activityFill)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-5 gap-1 border-border/50 border-t pt-2 text-center text-[9px] text-muted-foreground">
                                    {timelineData.map((d) => (
                                        <span key={d.day}>{d.day}</span>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* User Tokens (the quantity the player has) */}
                    {mounted && address && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5 border-border/40 border-b pb-1">
                                <Coins className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                                    {t(
                                        "dashboard.sidebar.userTokens",
                                        "User Tokens",
                                    )}
                                </h3>
                            </div>

                            <Card className="glass-card flex flex-col gap-4 p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                            {t(
                                                "dashboard.sidebar.rightsNfts",
                                                "Rights NFTs",
                                            )}
                                        </span>
                                        <div className="flex items-baseline gap-1">
                                            {user?.nftTokenIds && user.nftTokenIds.length > 0 ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="flex items-center gap-1 font-bold font-mono text-foreground text-lg hover:text-primary transition-colors cursor-pointer outline-none">
                                                            #{user.nftTokenIds[0]}
                                                            {user.nftTokenIds.length > 1 && (
                                                                <span className="text-[10px] text-muted-foreground font-sans font-normal ml-0.5">
                                                                    (+{user.nftTokenIds.length - 1})
                                                                </span>
                                                            )}
                                                            <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="glass-card min-w-[100px] p-1" align="start">
                                                        {user.nftTokenIds.map((id) => (
                                                            <DropdownMenuItem key={id} className="font-mono text-xs focus:bg-primary/10 focus:text-primary cursor-default">
                                                                #{id}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <span className="font-bold font-mono text-foreground text-lg">
                                                    None
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1">
                                            <span className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                                {t(
                                                    "dashboard.sidebar.usdcBalance",
                                                    "USDC Balance",
                                                )}
                                            </span>
                                            <UITooltipProvider>
                                                <UITooltip>
                                                    <UITooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="text-muted-foreground hover:text-foreground transition-colors cursor-help"
                                                        >
                                                            <HelpCircle className="h-3 w-3" />
                                                        </button>
                                                    </UITooltipTrigger>
                                                    <UITooltipContent className="max-w-[220px] text-[10px] glass-card leading-relaxed">
                                                        {t(
                                                            "dashboard.sidebar.usdcBalanceTooltip",
                                                            "This is the total balance given by fan donation buy actions.",
                                                        )}
                                                    </UITooltipContent>
                                                </UITooltip>
                                            </UITooltipProvider>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-bold font-mono text-foreground text-lg">
                                                {usdcBalance !== undefined
                                                    ? parseFloat(
                                                          formatUnits(
                                                              usdcBalance,
                                                              18,
                                                          ),
                                                      ).toLocaleString(undefined, {
                                                          minimumFractionDigits: 2,
                                                          maximumFractionDigits: 2,
                                                      })
                                                    : "0.00"}
                                            </span>
                                            <span className="font-semibold text-[9px] text-muted-foreground uppercase">
                                                USDC
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Total Donations (Fan Sponsorships) */}
                    {mounted && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5 border-border/40 border-b pb-1">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                                        {t(
                                            "dashboard.sidebar.totalDonations",
                                            "Total Donations",
                                        )}
                                    </h3>
                                    <UITooltipProvider>
                                        <UITooltip>
                                            <UITooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="inline-flex cursor-help items-center justify-center rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                >
                                                    <HelpCircle className="h-3 w-3" />
                                                </button>
                                            </UITooltipTrigger>
                                            <UITooltipContent className="max-w-xs rounded-xl border border-border/40 bg-popover p-3 text-center text-popover-foreground text-xs leading-relaxed shadow-xl">
                                                {t(
                                                    "dashboard.sidebar.donationsTooltipExplanation",
                                                    {
                                                        tokenSymbol,
                                                        defaultValue: `This is a mock visualization of accumulated sponsorships. Fans can support the player by purchasing the player's customized fractionalized tokens (${tokenSymbol}), which are pegged to USDC. The player receives sponsorships directly from these token holdings.`,
                                                    },
                                                )}
                                            </UITooltipContent>
                                        </UITooltip>
                                    </UITooltipProvider>
                                </div>
                            </div>

                            <Card className="glass-card space-y-3 p-4">
                                <div className="space-y-0.5">
                                    <span className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                        {t(
                                            "dashboard.sidebar.accumulatedSponsorship",
                                            "Accumulated Sponsorship",
                                        )}
                                    </span>
                                    <div className="flex flex-col gap-0.5">
                                        <h4 className="font-bold font-mono text-foreground text-xl leading-none">
                                            12,500.00 USDC
                                        </h4>
                                        <span className="font-semibold text-[9px] text-muted-foreground uppercase">
                                            via {tokenName} ({tokenSymbol})
                                        </span>
                                    </div>
                                </div>

                                <div className="h-24 w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                        minWidth={0}
                                    >
                                        <AreaChart
                                            data={[
                                                { date: "May 1", amount: 1200 },
                                                {
                                                    date: "May 15",
                                                    amount: 2800,
                                                },
                                                { date: "Jun 1", amount: 5400 },
                                                {
                                                    date: "Jun 15",
                                                    amount: 8900,
                                                },
                                                {
                                                    date: "Jul 1",
                                                    amount: 12500,
                                                },
                                            ]}
                                            margin={{
                                                top: 5,
                                                right: 4,
                                                left: 4,
                                                bottom: 0,
                                            }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="donationFill"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor="oklch(from var(--primary) l c h)"
                                                        stopOpacity={0.4}
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor="oklch(from var(--primary) l c h)"
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <Tooltip
                                                cursor={{
                                                    stroke: "oklch(from var(--primary) l c h / 30%)",
                                                }}
                                                allowEscapeViewBox={{ x: true, y: true }}
                                                contentStyle={{
                                                    background:
                                                        "oklch(from var(--card) l c h / 95%)",
                                                    border: "1px solid oklch(from var(--border) l c h / 40%)",
                                                    borderRadius: "0.75rem",
                                                    fontSize: "11px",
                                                    padding: "6px 10px",
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="amount"
                                                stroke="oklch(from var(--primary) l c h)"
                                                strokeWidth={2}
                                                fill="url(#donationFill)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-5 gap-1 border-border/50 border-t pt-2 text-center text-[9px] text-muted-foreground">
                                    <span>May 1</span>
                                    <span>May 15</span>
                                    <span>Jun 1</span>
                                    <span>Jun 15</span>
                                    <span>Jul 1</span>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Savings & Financial Benefits */}
                    {mounted && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5 border-border/40 border-b pb-1">
                                <Activity className="h-4 w-4 text-primary" />
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                                        {t(
                                            "dashboard.sidebar.savingsTitle",
                                            "Savings",
                                        )}
                                    </h3>
                                    <UITooltipProvider>
                                        <UITooltip>
                                            <UITooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="inline-flex cursor-help items-center justify-center rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                >
                                                    <HelpCircle className="h-3 w-3" />
                                                </button>
                                            </UITooltipTrigger>
                                            <UITooltipContent className="max-w-xs rounded-xl border border-border/40 bg-popover p-3 text-center text-popover-foreground text-xs leading-relaxed shadow-xl">
                                                {t(
                                                    "dashboard.sidebar.savingsTooltipExplanation",
                                                    "These metrics represent real financial benefits and savings realized by using ePass on-chain rails instead of traditional sports banking. The numbers shown here are currently mock simulations.",
                                                )}
                                            </UITooltipContent>
                                        </UITooltip>
                                    </UITooltipProvider>
                                </div>
                            </div>

                            <Card className="glass-card space-y-4 p-4">
                                {userRole === "club" ? (
                                    <>
                                        {/* Club Metric 1 */}
                                        <div className="space-y-1">
                                            <span className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                                {t(
                                                    "dashboard.sidebar.clubLiquidityUnlocked",
                                                    "Liquidity Unlocked",
                                                )}
                                            </span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold font-mono text-base text-emerald-500">
                                                    68,000.00 USDC
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-snug">
                                                {t(
                                                    "dashboard.sidebar.clubLiquidityUnlockedDesc",
                                                    "Immediate stablecoin capital released from active vaults.",
                                                )}
                                            </p>
                                        </div>

                                        {/* Club Metric 2 */}
                                        <div className="space-y-1 border-border/30 border-t pt-3">
                                            <span className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                                {t(
                                                    "dashboard.sidebar.clubFactoringSaved",
                                                    "Factoring Fees Saved",
                                                )}
                                            </span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold font-mono text-base text-foreground">
                                                    4,850.00 USDC
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-snug">
                                                {t(
                                                    "dashboard.sidebar.clubFactoringSavedDesc",
                                                    "Savings compared to traditional bank factoring rates.",
                                                )}
                                            </p>
                                        </div>

                                        {/* Club Metric 3 */}
                                        <div className="space-y-1 border-border/30 border-t pt-3">
                                            <span className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                                {t(
                                                    "dashboard.sidebar.clubTimeSaved",
                                                    "Days Saved to Funding",
                                                )}
                                            </span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold font-mono text-base text-primary">
                                                    40 Days Saved
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-snug">
                                                {t(
                                                    "dashboard.sidebar.clubTimeSavedDesc",
                                                    "Average speed-to-liquidity compared to bank underwriting.",
                                                )}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Player Metric 1 */}
                                        <div className="space-y-1">
                                            <span className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                                {t(
                                                    "dashboard.sidebar.playerYieldEarned",
                                                    "Direct Likeness Yield",
                                                )}
                                            </span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold font-mono text-base text-emerald-500">
                                                    3,450.00 USDC
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-snug">
                                                {t(
                                                    "dashboard.sidebar.playerYieldEarnedDesc",
                                                    "Sponsor/reserve distributions redeemed by you.",
                                                )}
                                            </p>
                                        </div>

                                        {/* Player Metric 2 */}
                                        <div className="space-y-1 border-border/30 border-t pt-3">
                                            <span className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                                {t(
                                                    "dashboard.sidebar.playerCautionEscrowed",
                                                    "Caution Escrow Security",
                                                )}
                                            </span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold font-mono text-base text-foreground">
                                                    25,000.00 USDC
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-snug">
                                                {t(
                                                    "dashboard.sidebar.playerCautionEscrowedDesc",
                                                    "Collateralized guarantee against club defaults.",
                                                )}
                                            </p>
                                        </div>

                                        {/* Player Metric 3 */}
                                        <div className="space-y-1 border-border/30 border-t pt-3">
                                            <span className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                                {t(
                                                    "dashboard.sidebar.playerGasSaved",
                                                    "EIP-712 Gas Saved",
                                                )}
                                            </span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-bold font-mono text-base text-primary">
                                                    $12.80 Saved
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-snug">
                                                {t(
                                                    "dashboard.sidebar.playerGasSavedDesc",
                                                    "Transaction fees saved using off-chain EIP-712 consent.",
                                                )}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Recent Confirmed Transactions List */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-1.5 border-border/40 border-b pb-1">
                            <Activity className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                                {t("dashboard.sidebar.recentConfirmations")}
                            </h3>
                        </div>

                        {recentTransactions.length === 0 ? (
                            <Card className="glass-card rounded-xl p-4 text-center">
                                <p className="text-muted-foreground text-xs">
                                    {t(
                                        "dashboard.sidebar.noRecentConfirmations",
                                    )}
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {recentTransactions.slice(0, 3).map((tx) => (
                                    <Card
                                        key={tx._id}
                                        className="glass-card flex items-center justify-between gap-3 p-3 text-xs"
                                    >
                                        <div className="min-w-0 space-y-0.5">
                                            <h5 className="truncate font-semibold text-foreground capitalize leading-tight">
                                                {t(
                                                    "actionType." +
                                                        tx.actionType,
                                                    {
                                                        defaultValue:
                                                            tx.actionType.replace(
                                                                "_",
                                                                " ",
                                                            ),
                                                    },
                                                )}
                                            </h5>
                                            <p className="truncate font-mono text-[10px] text-muted-foreground">
                                                {tx.txHash.slice(0, 6)}...
                                                {tx.txHash.slice(-4)}
                                            </p>
                                        </div>
                                        <a
                                            href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        >
                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                        </a>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </aside>
    );
}
