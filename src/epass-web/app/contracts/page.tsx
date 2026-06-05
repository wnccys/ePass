'use client';

import { getMyAgreements } from "@/app/actions/agreements";
import { getServerUser } from "@/app/actions/profile";
import { ContractsList } from "./contracts-list";
import Link from "next/link";
import { Plus, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

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
          getMyAgreements()
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <div className="py-24 text-center">{t("common.error")}</div>;

  return (
    <div className="container max-w-5xl mx-auto py-24 px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif font-light tracking-tight">{t("contracts.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("contracts.subtitle")}</p>
        </div>

        {user.role === 'club' && (
          <Link
            href="/contracts/new"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t("contracts.proposeBtn")}
          </Link>
        )}
      </div>

      {agreements.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl flex flex-col items-center justify-center border-dashed">
          <p className="text-muted-foreground mb-4">{t("contracts.noContracts")}</p>
          {user.role === 'club' && (
            <Link href="/contracts/new" className="text-primary hover:underline font-medium">
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
