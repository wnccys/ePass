"use client";

import { Loader, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMyAgreements } from "@/app/actions/agreements";
import { getServerUser } from "@/app/actions/profile";
import { ContractsList } from "./contracts-list";

export default function ContractsPage() {
    const { t } = useTranslation();
    const [user, setUser] = useState<any>(null);
    const [agreements, setAgreements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [userData, agreementsRes] = await Promise.all([
                    getServerUser(),
                    getMyAgreements(),
                ]);
                setUser(userData);
                if (agreementsRes.success) {
                    setAgreements(agreementsRes.agreements || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user)
        return (
            <div className="flex min-h-screen items-center justify-center p-24 text-center">
                {t("common.error")}
            </div>
        );

    return (
        <div className="container mx-auto max-w-5xl px-6 py-24 min-h-screen">
            <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
                <div>
                    <h1 className="font-light font-serif text-4xl tracking-tight">
                        {t("contracts.title")}
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        {t("contracts.subtitle")}
                    </p>
                </div>

                {user.role === "club" && (
                    <Link
                        href="/contracts/new"
                        className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90"
                    >
                        <Plus className="h-5 w-5" />
                        {t("contracts.proposeBtn")}
                    </Link>
                )}
            </div>

            {agreements.length === 0 ? (
                <div className="glass-panel flex flex-col items-center justify-center rounded-3xl border-dashed p-12 text-center">
                    <p className="mb-4 text-muted-foreground">
                        {t("contracts.noContracts")}
                    </p>
                    {user.role === "club" && (
                        <Link
                            href="/contracts/new"
                            className="font-medium text-primary hover:underline"
                        >
                            {t("contracts.createFirst")}
                        </Link>
                    )}
                </div>
            ) : (
                <ContractsList agreements={agreements} userRole={user.role} />
            )}
        </div>
    );
}
