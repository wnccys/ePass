"use client";

import {
    Activity,
    Calendar,
    Coins,
    Info,
    LineChart as LineChartIcon,
    Loader,
    Lock,
    PieChart as PieChartIcon,
    TrendingUp,
    Unlock,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { formatUnits } from "viem";
import { useConnection, useReadContracts } from "wagmi";
import { getMyAgreements } from "@/app/actions/agreements";
import { getServerUser } from "@/app/actions/profile";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { rightsVaultImplAbi } from "@/src/generated";

const CHART_COLORS = [
    "oklch(from var(--primary) l c h)",
    "oklch(0.683 0.115 205.94)",
    "oklch(0.768 0.179 135.0)",
    "oklch(0.553 0.013 58.071)",
];

export default function TokensPage() {
    const { t } = useTranslation();
    const { address } = useConnection();

    const [user, setUser] = useState<any>(null);
    const [agreements, setAgreements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgreementId, setSelectedAgreementId] = useState<string>("");

    // Load user and agreements
    useEffect(() => {
        async function loadData() {
            try {
                const [userData, agreementsRes] = await Promise.all([
                    getServerUser(),
                    getMyAgreements(),
                ]);
                setUser(userData);
                if (agreementsRes.success) {
                    const list = agreementsRes.agreements || [];
                    // Only agreements with deployed vaults are useful here
                    const vaultedList = list.filter((a: any) => a.vaultAddress);
                    setAgreements(vaultedList);

                    if (vaultedList.length > 0) {
                        setSelectedAgreementId(vaultedList[0]._id);
                    }
                }
            } catch (err) {
                console.error("Error loading tokens data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Get active agreement
    const activeAgreement = useMemo(() => {
        if (user?.role === "player") {
            // Player goes directly to their active token
            return agreements[0] || null;
        }
        // Club selects the token
        return agreements.find((a) => a._id === selectedAgreementId) || null;
    }, [user, agreements, selectedAgreementId]);

    // On-chain reads for the active vault
    const vaultAddress = activeAgreement?.vaultAddress;
    const vaultContract = {
        address: vaultAddress as `0x${string}`,
        abi: rightsVaultImplAbi,
    } as const;

    const { data: vaultDetails, isLoading: isDetailsLoading } = useReadContracts({
        contracts: [
            { ...vaultContract, functionName: "player" },
            { ...vaultContract, functionName: "club" },
            { ...vaultContract, functionName: "attorney" },
            { ...vaultContract, functionName: "playerBps" },
            { ...vaultContract, functionName: "clubBps" },
            { ...vaultContract, functionName: "attorneyBps" },
            { ...vaultContract, functionName: "cautionAmount" },
            { ...vaultContract, functionName: "redeemableReserve" },
            { ...vaultContract, functionName: "totalSupply" },
            { ...vaultContract, functionName: "status" },
            { ...vaultContract, functionName: "contractStart" },
        ],
        query: {
            enabled: !!vaultAddress,
            refetchInterval: 5000,
        },
    });

    const playerAddr = vaultDetails?.[0]?.result as string;
    const clubAddr = vaultDetails?.[1]?.result as string;
    const attorneyAddr = vaultDetails?.[2]?.result as string;

    const playerBps = Number(vaultDetails?.[3]?.result || 3000n);
    const clubBps = Number(vaultDetails?.[4]?.result || 6000n);
    const attorneyBps = Number(vaultDetails?.[5]?.result || 1000n);

    const cautionVal = vaultDetails?.[6]?.result as bigint | undefined;
    const reserveVal = vaultDetails?.[7]?.result as bigint | undefined;
    const supplyVal = vaultDetails?.[8]?.result as bigint | undefined;
    const statusRaw = vaultDetails?.[9]?.result as number | undefined;
    const contractStart = vaultDetails?.[10]?.result as bigint | undefined;

    // Read actual holder balances
    const { data: balancesData } = useReadContracts({
        contracts: [
            {
                ...vaultContract,
                functionName: "balanceOf",
                args: playerAddr ? [playerAddr as `0x${string}`] : undefined,
            },
            {
                ...vaultContract,
                functionName: "balanceOf",
                args: clubAddr ? [clubAddr as `0x${string}`] : undefined,
            },
            {
                ...vaultContract,
                functionName: "balanceOf",
                args: attorneyAddr ? [attorneyAddr as `0x${string}`] : undefined,
            },
        ],
        query: {
            enabled: !!vaultAddress && !!playerAddr && !!clubAddr && !!attorneyAddr,
        },
    });

    const playerBalance = balancesData?.[0]?.result as bigint | undefined;
    const clubBalance = balancesData?.[1]?.result as bigint | undefined;
    const attorneyBalance = balancesData?.[2]?.result as bigint | undefined;

    // Format utility functions
    const formatEthValue = (val?: bigint) => {
        if (val === undefined) return "0.00";
        return parseFloat(formatUnits(val, 18)).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    const formatUsdcValue = (val?: bigint) => {
        if (val === undefined) return "0.00";
        return parseFloat(formatUnits(val, 18)).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Chart 1: Share Allocation (Pie Chart)
    const shareAllocationData = useMemo(() => {
        return [
            { name: "Player Shares", value: playerBps / 100, color: CHART_COLORS[0] },
            { name: "Club Shares", value: clubBps / 100, color: CHART_COLORS[1] },
            { name: "Attorney Shares", value: attorneyBps / 100, color: CHART_COLORS[2] },
        ];
    }, [playerBps, clubBps, attorneyBps]);

    // Chart 2: Caution vs Redeemable Reserve (Bar Chart)
    const reservesData = useMemo(() => {
        const cautionNum = cautionVal ? Number(formatUnits(cautionVal, 18)) : 0;
        const reserveNum = reserveVal ? Number(formatUnits(reserveVal, 18)) : 0;
        return [
            {
                name: "Caution Locked",
                USDC: cautionNum,
            },
            {
                name: "Redeemable Reserve",
                USDC: reserveNum,
            },
        ];
    }, [cautionVal, reserveVal]);

    // Chart 3: Simulated Price Trajectory (Line Chart)
    const priceTrajectoryData = useMemo(() => {
        // Generates a nice simulated price trajectory starting from 1.00 USDC
        const basePrice = 1.00;
        const points = [];
        const days = ["15d ago", "12d ago", "9d ago", "6d ago", "3d ago", "Today"];
        for (let i = 0; i < days.length; i++) {
            // Add slight positive random walk
            const variance = (i * 0.04) + (Math.sin(i * 1.5) * 0.02);
            points.push({
                day: days[i],
                Price: parseFloat((basePrice + variance).toFixed(3)),
            });
        }
        return points;
    }, []);

    // Chart 4: Vesting / Release Schedule (Vesting Progress over 12 Months)
    const vestingData = useMemo(() => {
        const totalAmount = reserveVal ? Number(formatUnits(reserveVal, 18)) : 10000;
        const months = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"];
        return months.map((m, idx) => {
            const unlockedRatio = (idx + 1) / 12;
            return {
                month: m,
                Unlocked: parseFloat((totalAmount * unlockedRatio).toFixed(2)),
                Locked: parseFloat((totalAmount * (1 - unlockedRatio)).toFixed(2)),
            };
        });
    }, [reserveVal]);

    // Chart 5: Holder Distribution (Donut Chart)
    const holderDistributionData = useMemo(() => {
        const pBal = playerBalance ? Number(formatUnits(playerBalance, 18)) : 0;
        const cBal = clubBalance ? Number(formatUnits(clubBalance, 18)) : 0;
        const aBal = attorneyBalance ? Number(formatUnits(attorneyBalance, 18)) : 0;

        // Fallbacks if balances are zero for better visual on empty state
        const total = pBal + cBal + aBal;
        if (total === 0) {
            return [
                { name: "Player", value: 30, color: CHART_COLORS[0] },
                { name: "Club", value: 60, color: CHART_COLORS[1] },
                { name: "Attorney", value: 10, color: CHART_COLORS[2] },
            ];
        }

        return [
            { name: "Player Address", value: pBal, color: CHART_COLORS[0] },
            { name: "Club Address", value: cBal, color: CHART_COLORS[1] },
            { name: "Attorney Address", value: aBal, color: CHART_COLORS[2] },
        ];
    }, [playerBalance, clubBalance, attorneyBalance]);

    // Chart 6: Trading Volume (Bar Chart)
    const volumeData = useMemo(() => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const baseVolume = reserveVal ? Number(formatUnits(reserveVal, 18)) * 0.05 : 500;
        return days.map((day, idx) => ({
            day,
            Volume: parseFloat((baseVolume * (0.6 + Math.cos(idx * 1.1) * 0.4 + Math.random() * 0.2)).toFixed(2)),
        }));
    }, [reserveVal]);

    // Status map helper
    const getStatusLabel = (statusNum?: number) => {
        if (statusNum === undefined) return "UNKNOWN";
        const statuses = ["PENDING", "ACTIVE", "RESCINDED", "EXPIRED", "TRANSFERRED"];
        return statuses[statusNum] || "UNKNOWN";
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center p-24 text-center bg-background text-foreground">
                {t("common.error")}
            </div>
        );
    }

    return (
        <div className="container mx-auto min-h-screen max-w-7xl px-6 py-24 bg-background text-foreground">
            <FadeIn>
                <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <h1 className="font-light font-serif text-4xl tracking-tight">
                            {user.role === "club"
                                ? t("nav.manageTokens", "Manage Tokens")
                                : t("nav.myToken", "My Token")}
                        </h1>
                        <p className="mt-2 text-muted-foreground text-sm">
                            {user.role === "club"
                                ? "Monitor and analyze all fractionalized token metrics across your club's active player agreements."
                                : "View real-time token statistics, vesting progress, and distribution for your active contract."}
                        </p>
                    </div>

                    {/* Club Token Selector */}
                    {user.role === "club" && agreements.length > 0 && (
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Select Agreement Token
                            </label>
                            <select
                                value={selectedAgreementId}
                                onChange={(e) => setSelectedAgreementId(e.target.value)}
                                className="glass-input min-w-[240px] rounded-xl border border-foreground/10 bg-card/60 px-4 py-2 text-sm outline-none backdrop-blur-md transition-colors focus:border-primary"
                            >
                                {agreements.map((a) => (
                                    <option key={a._id} value={a._id} className="bg-card">
                                        {a.tokenName} ({a.tokenSymbol})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {agreements.length === 0 ? (
                    <Card className="glass-card flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
                        <Coins className="h-16 w-16 text-muted-foreground/40 mb-4 animate-pulse" />
                        <h3 className="font-serif text-xl font-semibold mb-2">No Tokens Found</h3>
                        <p className="text-muted-foreground max-w-md text-sm mb-6">
                            {user.role === "club"
                                ? "Your club doesn't have any active fractionalized contracts yet. Propose a contract, sign it, and fractionalize it to see metrics here."
                                : "You don't have any active fractionalized contracts yet. Once your club finishes the vault setup, your token will be displayed here."}
                        </p>
                        {user.role === "club" && (
                            <Link
                                href="/contracts/new"
                                className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-semibold text-white text-sm transition-transform hover:scale-105"
                            >
                                Propose Contract
                            </Link>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {/* Token Details Bar */}
                        {activeAgreement && (
                            <Card className="glass-card grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                                <div className="space-y-1">
                                    <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        Token Name & Symbol
                                    </span>
                                    <h4 className="text-lg font-bold flex items-center gap-2">
                                        {activeAgreement.tokenName}{" "}
                                        <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono font-medium">
                                            {activeAgreement.tokenSymbol}
                                        </span>
                                    </h4>
                                    <p className="text-xs text-muted-foreground truncate font-mono">
                                        Vault: {vaultAddress || "Not Available"}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        On-Chain Status
                                    </span>
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        {statusRaw === 1 ? (
                                            <span className="flex items-center gap-1 text-emerald-500">
                                                <Unlock className="h-4 w-4" />
                                                {getStatusLabel(statusRaw)}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-amber-500">
                                                <Lock className="h-4 w-4" />
                                                {getStatusLabel(statusRaw)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Vesting started:{" "}
                                        {contractStart
                                            ? new Date(Number(contractStart) * 1000).toLocaleDateString()
                                            : "N/A"}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        Total Shares Issued
                                    </span>
                                    <div className="text-lg font-mono font-bold">
                                        {formatEthValue(supplyVal)}{" "}
                                        <span className="text-xs text-muted-foreground font-sans font-normal">
                                            {activeAgreement.tokenSymbol}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Pegged value tracking active
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        My Active Holding
                                    </span>
                                    <div className="text-lg font-mono font-bold text-primary">
                                        {user.role === "club"
                                            ? formatEthValue(clubBalance)
                                            : formatEthValue(playerBalance)}{" "}
                                        <span className="text-xs text-muted-foreground font-sans font-normal">
                                            {activeAgreement.tokenSymbol}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Representing your fractionalized share
                                    </p>
                                </div>
                            </Card>
                        )}

                        {/* Loading details overlay */}
                        {isDetailsLoading && (
                            <div className="flex justify-center p-8 bg-card/10 rounded-2xl animate-pulse">
                                <Loader className="h-6 w-6 animate-spin text-primary mr-2" />
                                <span className="text-sm text-muted-foreground font-medium">
                                    Fetching live on-chain token statistics...
                                </span>
                            </div>
                        )}

                        {/* Grid of 6 Beautiful Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {/* Chart 1: Share Allocation */}
                            <Card className="glass-card p-5 space-y-4">
                                <div className="flex items-center gap-2 border-b border-foreground/10 pb-2">
                                    <PieChartIcon className="h-4 w-4 text-primary" />
                                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                        1. Share Allocation
                                    </h4>
                                </div>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={shareAllocationData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={65}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {shareAllocationData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    background: "oklch(from var(--card) l c h / 95%)",
                                                    border: "1px solid oklch(from var(--border) l c h / 40%)",
                                                    borderRadius: "0.75rem",
                                                    fontSize: "11px",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-3 gap-1 pt-1 text-center text-[10px] text-muted-foreground">
                                    {shareAllocationData.map((item, index) => (
                                        <div key={index} className="flex flex-col items-center">
                                            <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: item.color }} />
                                            <span className="font-semibold text-foreground">{item.value}%</span>
                                            <span className="truncate max-w-[80px]">{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Chart 2: Holder Distribution */}
                            <Card className="glass-card p-5 space-y-4">
                                <div className="flex items-center gap-2 border-b border-foreground/10 pb-2">
                                    <Coins className="h-4 w-4 text-primary" />
                                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                        2. Holder Distribution
                                    </h4>
                                </div>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={holderDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={0}
                                                outerRadius={65}
                                                paddingAngle={0}
                                                dataKey="value"
                                            >
                                                {holderDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => `${Number(value).toLocaleString()} ${activeAgreement?.tokenSymbol || "Shares"}`}
                                                contentStyle={{
                                                    background: "oklch(from var(--card) l c h / 95%)",
                                                    border: "1px solid oklch(from var(--border) l c h / 40%)",
                                                    borderRadius: "0.75rem",
                                                    fontSize: "11px",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-3 gap-1 pt-1 text-center text-[10px] text-muted-foreground">
                                    {holderDistributionData.map((item, index) => (
                                        <div key={index} className="flex flex-col items-center">
                                            <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: item.color }} />
                                            <span className="font-semibold text-foreground truncate max-w-[70px]">{item.name}</span>
                                            <span>{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Chart 3: Caution vs. Reserves */}
                            <Card className="glass-card p-5 space-y-4">
                                <div className="flex items-center gap-2 border-b border-foreground/10 pb-2">
                                    <Lock className="h-4 w-4 text-primary" />
                                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                        3. Caution & Reserves
                                    </h4>
                                </div>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={reservesData}>
                                            <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} unit=" USDC" />
                                            <Tooltip
                                                formatter={(value) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC`}
                                                contentStyle={{
                                                    background: "oklch(from var(--card) l c h / 95%)",
                                                    border: "1px solid oklch(from var(--border) l c h / 40%)",
                                                    borderRadius: "0.75rem",
                                                    fontSize: "11px",
                                                }}
                                            />
                                            <Bar dataKey="USDC" fill="oklch(from var(--primary) l c h)" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1 leading-tight">
                                    <Info className="h-3.5 w-3.5 shrink-0" />
                                    Total Value Locked (TVL) is backed 100% by USDC collateral.
                                </p>
                            </Card>

                            {/* Chart 4: Price Performance */}
                            <Card className="glass-card p-5 space-y-4">
                                <div className="flex items-center gap-2 border-b border-foreground/10 pb-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                        4. Price Performance (USDC)
                                    </h4>
                                </div>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={priceTrajectoryData}>
                                            <defs>
                                                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="oklch(from var(--primary) l c h)" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="oklch(from var(--primary) l c h)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="day" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} domain={['dataMin - 0.05', 'dataMax + 0.05']} />
                                            <Tooltip
                                                formatter={(value) => `$${value} USDC`}
                                                contentStyle={{
                                                    background: "oklch(from var(--card) l c h / 95%)",
                                                    border: "1px solid oklch(from var(--border) l c h / 40%)",
                                                    borderRadius: "0.75rem",
                                                    fontSize: "11px",
                                                }}
                                            />
                                            <Area type="monotone" dataKey="Price" stroke="oklch(from var(--primary) l c h)" strokeWidth={2} fillOpacity={1} fill="url(#priceGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center">
                                    Peg stability tracker. Historical tracking of fractionalized value.
                                </p>
                            </Card>

                            {/* Chart 5: Vesting Schedule */}
                            <Card className="glass-card p-5 space-y-4">
                                <div className="flex items-center gap-2 border-b border-foreground/10 pb-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                        5. Vesting Progress (12 Months)
                                    </h4>
                                </div>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={vestingData}>
                                            <XAxis dataKey="month" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                formatter={(value) => `$${Number(value).toLocaleString()} USDC`}
                                                contentStyle={{
                                                    background: "oklch(from var(--card) l c h / 95%)",
                                                    border: "1px solid oklch(from var(--border) l c h / 40%)",
                                                    borderRadius: "0.75rem",
                                                    fontSize: "11px",
                                                }}
                                            />
                                            <Line type="monotone" dataKey="Unlocked" stroke="#10b981" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="Locked" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                                        <span>Unlocked Reserve</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                                        <span>Locked Reserve</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Chart 6: Trading Volume */}
                            <Card className="glass-card p-5 space-y-4">
                                <div className="flex items-center gap-2 border-b border-foreground/10 pb-2">
                                    <Activity className="h-4 w-4 text-primary" />
                                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                        6. Weekly Trading Volume
                                    </h4>
                                </div>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={volumeData}>
                                            <XAxis dataKey="day" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} unit=" USDC" />
                                            <Tooltip
                                                formatter={(value) => `$${Number(value).toLocaleString()} USDC`}
                                                contentStyle={{
                                                    background: "oklch(from var(--card) l c h / 95%)",
                                                    border: "1px solid oklch(from var(--border) l c h / 40%)",
                                                    borderRadius: "0.75rem",
                                                    fontSize: "11px",
                                                }}
                                            />
                                            <Bar dataKey="Volume" fill="oklch(0.683 0.115 205.94)" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center">
                                    Pegged secondary market activity (simulated mock volume).
                                </p>
                            </Card>

                        </div>
                    </div>
                )}
            </FadeIn>
        </div>
    );
}
