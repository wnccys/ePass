'use client';

import { useEffect, useState, useRef } from "react";
import { TransactionCard } from "./transaction-card";
import { ContractStatusCard } from "./contract-status-card";
import { VaultCard } from "./vault-card";
import { getMyTransactions } from "@/app/actions/transactions";
import { Loader2, Layers } from "lucide-react";

type FeedItem = 
    | { type: 'transaction'; id: string; timestamp: number; data: any }
    | { type: 'agreement'; id: string; timestamp: number; data: any };

export function FeedContainer({ 
    initialAgreements, 
    initialTransactions,
    userRole 
}: { 
    initialAgreements: any[]; 
    initialTransactions: any[];
    userRole: string;
}) {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [offset, setOffset] = useState(initialTransactions.length);
    const [hasMore, setHasMore] = useState(initialTransactions.length >= 10);
    const [loading, setLoading] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Initial mix of feed items
    useEffect(() => {
        const items: FeedItem[] = [];

        // Add agreements to feed
        initialAgreements.forEach((ag: any) => {
            items.push({
                type: 'agreement',
                id: ag._id,
                timestamp: new Date(ag.updatedAt || ag.createdAt).getTime(),
                data: ag
            });
        });

        // Add transactions to feed
        initialTransactions.forEach((tx: any) => {
            items.push({
                type: 'transaction',
                id: tx._id,
                timestamp: new Date(tx.createdAt).getTime(),
                data: tx
            });
        });

        // Sort: newest first
        items.sort((a, b) => b.timestamp - a.timestamp);
        setFeedItems(items);
    }, [initialAgreements, initialTransactions]);

    // Infinite scroll loading
    const loadMoreTransactions = async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            const res = await getMyTransactions(10, offset);
            if (res.success && res.transactions) {
                const newTxs = res.transactions;
                if (newTxs.length < 10) {
                    setHasMore(false);
                }

                // Add to feed items
                setFeedItems(prev => {
                    const existingIds = new Set(prev.map(item => item.id));
                    const mixed = [...prev];

                    newTxs.forEach((tx: any) => {
                        if (!existingIds.has(tx._id)) {
                            mixed.push({
                                type: 'transaction',
                                id: tx._id,
                                timestamp: new Date(tx.createdAt).getTime(),
                                data: tx
                            });
                        }
                    });

                    // Re-sort
                    mixed.sort((a, b) => b.timestamp - a.timestamp);
                    return mixed;
                });

                setOffset(prev => prev + newTxs.length);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Error loading more transactions:", err);
        } finally {
            setLoading(false);
        }
    };

    // Set up intersection observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMoreTransactions();
                }
            },
            { threshold: 1.0 }
        );

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) {
            observer.observe(currentSentinel);
        }

        return () => {
            if (currentSentinel) {
                observer.unobserve(currentSentinel);
            }
        };
    }, [offset, hasMore, loading]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Layers className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    Activity Feed
                </h2>
            </div>

            {feedItems.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl bg-black/5 dark:bg-white/5">
                    <p className="text-sm text-muted-foreground">No recent activity found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feedItems.map((item) => {
                        if (item.type === 'transaction') {
                            return (
                                <TransactionCard 
                                    key={item.id} 
                                    transaction={item.data} 
                                />
                            );
                        }

                        // If user is club, render a VaultCard if it's active or has a vaultAddress
                        if (userRole === 'club' && (item.data.status === 'active' || item.data.vaultAddress)) {
                            return (
                                <div key={item.id} className="space-y-4">
                                    <ContractStatusCard 
                                        agreement={item.data} 
                                        userRole={userRole} 
                                    />
                                    <VaultCard agreement={item.data} />
                                </div>
                            );
                        }

                        return (
                            <ContractStatusCard 
                                key={item.id} 
                                agreement={item.data} 
                                userRole={userRole} 
                            />
                        );
                    })}
                </div>
            )}

            {/* Scroll Sentinel */}
            {hasMore && (
                <div 
                    ref={sentinelRef} 
                    className="flex justify-center py-4 text-muted-foreground"
                >
                    {loading && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
                </div>
            )}
        </div>
    );
}
