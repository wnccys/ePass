'use client';

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { 
    Coins, 
    FileText, 
    CheckCircle, 
    AlertCircle, 
    TrendingUp, 
    Activity, 
    ArrowUpRight 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer,
    AreaChart,
    Area,
    Tooltip
} from "recharts";

const COLORS = [
    'oklch(from var(--primary) l c h)',      // Active
    'oklch(from var(--primary) l c h / 0.5)',// Pending
    'oklch(0.553 0.013 58.071)',             // Draft
    'oklch(0.577 0.245 27.325)'              // Failed/Rescinded
];

export function RightSidebar({
    stats,
    recentTransactions,
    userRole
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
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Format caution amount
    const cautionUSD = formatUnits(BigInt(stats.totalCautionLocked || 0), 6);

    // Prepare data for the status distribution donut chart
    const chartData = [
        { name: 'Active', value: stats.activeContracts },
        { name: 'Pending Signatures', value: stats.pendingSignatures },
        { name: 'Drafts/Others', value: Math.max(0, stats.totalContracts - stats.activeContracts - stats.pendingSignatures) }
    ].filter(item => item.value > 0);

    // Mock timeline data for recent transaction frequency (AreaChart)
    // In a real app we'd map actual transactions, but since we want premium aesthetics,
    // we'll map the transaction times or supply a clean visualization.
    const timelineData = [
        { day: 'Mon', count: 1 },
        { day: 'Tue', count: 3 },
        { day: 'Wed', count: stats.activeContracts || 2 },
        { day: 'Thu', count: recentTransactions.length || 4 },
        { day: 'Fri', count: (recentTransactions.length + 1) || 5 }
    ];

    return (
        <aside className="w-full space-y-6 lg:max-h-[calc(100vh-8rem)] overflow-y-auto pl-1">
            {/* Quick Stats Grid */}
            <div className="space-y-3">
                <div className="flex items-center gap-1.5 pb-1 border-b border-border/40">
                    <Activity className="w-4 h-4 text-primary" />
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Quick Stats
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Card className="glass-card p-3.5 flex flex-col justify-between space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Contracts</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold font-mono">{stats.totalContracts}</span>
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="glass-card p-3.5 flex flex-col justify-between space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Active Agreements</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold font-mono text-emerald-500">{stats.activeContracts}</span>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Caution Lock (Club-Only / Vault Value) */}
            {userRole === 'club' && (
                <Card className="glass-card p-4 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Coins className="w-16 h-16 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Total Caution Escrowed
                        </span>
                        <h4 className="text-xl font-bold font-mono text-foreground">
                            {cautionUSD} USDC
                        </h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Total funds locked within active PlayerRightsMaster Escrow Vaults.
                    </p>
                </Card>
            )}

            {/* Charts Section (Recharts) */}
            {mounted && chartData.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-border/40">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Contract Distribution
                        </h3>
                    </div>

                    <Card className="glass-card p-4 flex flex-col items-center">
                        <div className="w-full h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={30}
                                        outerRadius={50}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Chart Legend */}
                        <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-border/50 text-[10px] text-center">
                            {chartData.map((item, idx) => (
                                <div key={item.name} className="flex flex-col items-center">
                                    <span 
                                        className="w-1.5 h-1.5 rounded-full mb-1" 
                                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                    />
                                    <span className="text-muted-foreground line-clamp-1 font-semibold">{item.name}</span>
                                    <span className="font-bold text-foreground font-mono">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Recent Confirmed Transactions List */}
            <div className="space-y-3">
                <div className="flex items-center gap-1.5 pb-1 border-b border-border/40">
                    <Activity className="w-4 h-4 text-primary" />
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Recent Confirmations
                    </h3>
                </div>

                {recentTransactions.length === 0 ? (
                    <Card className="glass-card p-4 text-center rounded-xl">
                        <p className="text-xs text-muted-foreground">No recent confirmations.</p>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {recentTransactions.slice(0, 3).map((tx) => (
                            <Card key={tx._id} className="glass-card p-3 flex items-center justify-between gap-3 text-xs">
                                <div className="space-y-0.5 min-w-0">
                                    <h5 className="font-semibold text-foreground capitalize truncate leading-tight">
                                        {tx.actionType.replace('_', ' ')}
                                    </h5>
                                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                                        {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                                    </p>
                                </div>
                                <a 
                                    href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </a>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}
