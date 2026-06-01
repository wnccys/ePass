'use client';

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { ContractCard } from "./contract-card";
import { FadeIn } from "@/components/ui/fade-in";

interface ContractsListProps {
    agreements: any[];
    userRole: string;
}

export function ContractsList({ agreements, userRole }: ContractsListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    // Debounce searchQuery with 300ms safety limit
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    // Filter agreements efficiently by ID
    const filteredAgreements = agreements.filter((agreement) => {
        if (!debouncedQuery.trim()) return true;
        return agreement._id.toLowerCase().includes(debouncedQuery.toLowerCase().trim());
    });

    return (
        <div className="space-y-8">
            {/* Search Bar - styled with the app's glassmorphism */}
            <div className="relative max-w-md w-full">
                <div className="glass-input rounded-full px-5 py-3.5 flex items-center gap-3">
                    <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                    <input
                        type="text"
                        placeholder="Search contracts by ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent flex-1 outline-none text-foreground text-sm placeholder:text-muted-foreground/60"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-muted/10"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Results Grid */}
            <FadeIn>
                {filteredAgreements.length === 0 ? (
                    <div className="glass-panel p-12 text-center rounded-3xl flex flex-col items-center justify-center border-dashed">
                        <p className="text-muted-foreground">
                            {searchQuery ? "No contracts match your search ID." : "No contracts found."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
