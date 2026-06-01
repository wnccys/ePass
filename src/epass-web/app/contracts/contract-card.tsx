import Link from "next/link";
import { formatUnits } from "viem";
import { Clock, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ContractCard({ agreement, userRole }: { agreement: any, userRole: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft': return { color: 'bg-zinc-500/10 text-zinc-500', label: 'Draft' };
      case 'pending_signatures': return { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Pending Signatures' };
      case 'ready': return { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Ready to Mint' };
      case 'minted': return { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Minted' };
      case 'vault_created': return { color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', label: 'Vault Created' };
      case 'active': return { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Active' };
      case 'rescinded': return { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Rescinded' };
      case 'expired': return { color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20', label: 'Expired' };
      default: return { color: 'bg-zinc-500/10 text-zinc-500', label: status };
    }
  };

  const statusConfig = getStatusConfig(agreement.status);
  
  const targetWallet = userRole === 'player' ? agreement.clubWalletAddress : agreement.playerWalletAddress;
  const targetRole = userRole === 'player' ? 'Club' : 'Player';

  return (
    <Link href={`/contracts/${agreement._id}`}>
      <Card className="glass-card hover:border-primary/30 transition-all p-6 space-y-4 cursor-pointer group h-full flex flex-col">
        <div className="flex items-start justify-between">
          <Badge variant="outline" className={`${statusConfig.color} font-medium`}>
            {statusConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(agreement.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h4 className="font-semibold text-foreground text-base line-clamp-1 group-hover:text-primary transition-colors">
              {agreement.title || "Image Rights Agreement"}
            </h4>
            {agreement.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {agreement.description}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{targetRole}</p>
            <p className="font-mono text-sm break-all text-foreground mt-1">
              {targetWallet.slice(0, 8)}...{targetWallet.slice(-6)}
            </p>
          </div>
          
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Caution Amount</p>
            <p className="font-semibold text-foreground mt-1">
              {formatUnits(BigInt(agreement.cautionAmount), 6)} USDC
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
          <div className="flex gap-3">
            <span className={`flex items-center gap-1 ${agreement.clubSignature ? 'text-green-500' : 'text-amber-500'}`}>
              {agreement.clubSignature ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              Club
            </span>
            <span className={`flex items-center gap-1 ${agreement.playerSignature ? 'text-green-500' : 'text-amber-500'}`}>
              {agreement.playerSignature ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              Player
            </span>
            <span className={`flex items-center gap-1 ${agreement.attorneySignature ? 'text-green-500' : 'text-amber-500'}`}>
              {agreement.attorneySignature ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              Attorney
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
