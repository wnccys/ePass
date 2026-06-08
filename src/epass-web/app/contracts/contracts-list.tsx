"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FadeIn } from "@/components/ui/fade-in";
import { ContractCard } from "./contract-card";

interface ContractsListProps {
    agreements: any[];
    userRole: string;
}

export function ContractsList({ agreements, userRole }: ContractsListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const { t } = useTranslation();

    // Debounce searchQuery with 300ms safety limit
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    // Filter agreements efficiently by ID or Title
    const filteredAgreements = agreements.filter((agreement) => {
        if (!debouncedQuery.trim()) return true;
        const query = debouncedQuery.toLowerCase().trim();
        return (
            agreement._id.toLowerCase().includes(query) ||
            (agreement.title && agreement.title.toLowerCase().includes(query))
        );
    });

    return (
        <div className="space-y-8">
            {/* Search Bar - styled with the app's glassmorphism */}
            <div className="relative w-full max-w-md">
                <div className="glass-input flex items-center gap-3 rounded-full px-5 py-3.5">
                    <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t("contracts.searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground/60"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted/10 hover:text-foreground"
                        >
                            {t("common.clear")}
                        </button>
                    )}
                </div>
            </div>

            {/* Results Grid */}
            <FadeIn>
                {filteredAgreements.length === 0 ? (
                    <div className="glass-panel flex flex-col items-center justify-center rounded-3xl border-dashed p-12 text-center">
                        <p className="text-muted-foreground">
                            {searchQuery
                                ? t("contracts.noMatch")
                                : t("contracts.noContracts")}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAgreements.map((agreement: any) => (
                            <ContractCard
                                key={agreement._id}
                                agreement={agreement}
                                userRole={userRole}
                            />
                        ))}
                    </div>
                )}
            </FadeIn>
        </div>
    );
}
