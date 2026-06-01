import { getMyAgreements } from "@/app/actions/agreements";
import { getCurrentUser } from "@/services/user";
import { ContractsList } from "./contracts-list";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ContractsPage() {
  const user = await getCurrentUser();
  if (!user) return <div>Unauthorized</div>;

  const res = await getMyAgreements();
  const agreements = res.success ? res.agreements : [];

  return (
    <div className="container max-w-5xl mx-auto py-24 px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif font-light tracking-tight">Contracts</h1>
          <p className="text-muted-foreground mt-2">Manage your on-chain agreements and image rights.</p>
        </div>

        {user.role === 'club' && (
          <Link
            href="/contracts/new"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Propose Contract
          </Link>
        )}
      </div>

      {agreements.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl flex flex-col items-center justify-center border-dashed">
          <p className="text-muted-foreground mb-4">No contracts found.</p>
          {user.role === 'club' && (
            <Link href="/contracts/new" className="text-primary hover:underline font-medium">
              Create your first contract
            </Link>
          )}
        </div>
      ) : (
        <ContractsList agreements={agreements} userRole={user.role} />
      )}
    </div>
  );
}
