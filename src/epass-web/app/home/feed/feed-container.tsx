"use client";

import { Layers, Link2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMyTransactions } from "@/app/actions/transactions";
import { ContractStatusCard } from "./contract-status-card";
import { TransactionCard } from "./transaction-card";
import { VaultCard } from "./vault-card";

type FeedItem =
    | { type: "transaction"; id: string; timestamp: number; data: any }
    | { type: "agreement"; id: string; timestamp: number; data: any };

export function FeedContainer({
    initialAgreements,
    initialTransactions,
    userRole,
}: {
    initialAgreements: any[];
    initialTransactions: any[];
    userRole: string;
}) {
    const { t } = useTranslation();
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
                type: "agreement",
                id: ag._id,
                timestamp: new Date(ag.updatedAt || ag.createdAt).getTime(),
                data: ag,
            });
        });

        // Add transactions to feed
        initialTransactions.forEach((tx: any) => {
            items.push({
                type: "transaction",
                id: tx._id,
                timestamp: new Date(tx.createdAt).getTime(),
                data: tx,
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
                setFeedItems((prev) => {
                    const existingIds = new Set(prev.map((item) => item.id));
                    const mixed = [...prev];

                    newTxs.forEach((tx: any) => {
                        if (!existingIds.has(tx._id)) {
                            mixed.push({
                                type: "transaction",
                                id: tx._id,
                                timestamp: new Date(tx.createdAt).getTime(),
                                data: tx,
                            });
                        }
                    });

                    // Re-sort
                    mixed.sort((a, b) => b.timestamp - a.timestamp);
                    return mixed;
                });

                setOffset((prev) => prev + newTxs.length);
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
            { threshold: 1.0 },
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
            <div className="flex items-center gap-2 border-border/40 border-b pb-2">
                <Layers className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                    {t("dashboard.feed.title")}
                </h2>
            </div>

            {feedItems.length === 0 ? (
                <div className="rounded-xl border border-border border-dashed bg-black/5 py-12 text-center dark:bg-white/5">
                    <p className="text-muted-foreground text-sm">
                        {t("dashboard.feed.empty")}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feedItems.map((item) => {
                        if (item.type === "transaction") {
                            return (
                                <TransactionCard
                                    key={item.id}
                                    transaction={item.data}
                                />
                            );
                        }

                        // If user is club, render a VaultCard if it's active or has a vaultAddress.
                        // The two cards describe the SAME contract, so they are intentionally
                        // glued into one unit with a link icon straddling the seam.
                        if (
                            userRole === "club" &&
                            (item.data.status === "active" ||
                                item.data.vaultAddress)
                        ) {
                            return (
                                <div key={item.id} className="relative">
                                    <ContractStatusCard
                                        agreement={item.data}
                                        userRole={userRole}
                                        grouped="top"
                                    />

                                    {/* Connector: link icon centered on the seam, adds no spacing */}
                                    <div className="pointer-events-none relative z-20 flex h-0 items-center justify-center">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/20 bg-background shadow-sm ring-1 ring-primary/30">
                                            <Link2 className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                    </div>

                                    <VaultCard
                                        agreement={item.data}
                                        grouped="bottom"
                                    />
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
                    {loading && (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    )}
                </div>
            )}
        </div>
    );
}
