import { useChainId, useConnection } from "wagmi";
import { Card } from "@/components/ui/card";
import { Loader, AlertCircle, CheckCircle2, Link as LinkIcon } from "lucide-react";
import SiweButton from "@/components/siwe-sign";

interface ActionCardProps {
  title: string;
  description: string;
  actionName: string;
  onAction: () => Promise<void>;
  status: 'idle' | 'simulating' | 'awaiting_wallet' | 'submitting' | 'confirming' | 'success' | 'error';
  errorMsg?: string | null;
  txHash?: string | null;
  expectedChainId?: number;
}

export function ActionCard({
  title,
  description,
  actionName,
  onAction,
  status,
  errorMsg,
  txHash,
  expectedChainId = 31337, // default foundry
}: ActionCardProps) {
  const { isConnected } = useConnection();
  const chainId = useChainId();
  const isWrongChain = chainId !== expectedChainId;

  const isBusy = status !== 'idle' && status !== 'error' && status !== 'success';

  return (
    <Card className="glass-panel p-6 flex flex-col gap-4">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {!isConnected ? (
        <div className="bg-muted p-4 rounded-xl flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">Connect your wallet to perform this action</p>
          <SiweButton />
        </div>
      ) : isWrongChain ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">Wrong network. Please switch your wallet to chain ID {expectedChainId}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            onClick={onAction}
            disabled={isBusy}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isBusy && <Loader className="w-4 h-4 animate-spin" />}
            {actionName}
          </button>

          {status === 'awaiting_wallet' && (
            <p className="text-sm text-amber-500 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Please confirm the transaction in your wallet.
            </p>
          )}

          {status === 'submitting' && (
            <p className="text-sm text-blue-500 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Submitting transaction...
            </p>
          )}

          {status === 'confirming' && (
            <p className="text-sm text-blue-500 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Waiting for transaction confirmation...
            </p>
          )}

          {status === 'success' && (
            <p className="text-sm text-green-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Transaction successful!
            </p>
          )}

          {errorMsg && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </p>
          )}

          {txHash && (
            <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground truncate mr-2">
                Tx: {txHash}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(txHash)}
                className="p-1.5 hover:bg-foreground/5 rounded-md transition-colors"
                title="Copy hash"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
