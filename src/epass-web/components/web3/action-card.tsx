import { useChainId, useConnection } from "wagmi";
import { Loader, AlertCircle, CheckCircle2, Link as LinkIcon, HelpCircle } from "lucide-react";
import SiweButton from "@/components/siwe-sign";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

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

const STEP_EXPLANATIONS: Record<string, string> = {
  "Ready to Mint": "RightsMinter validates the EIP-712 signatures from all 3 parties (Player, Club, Attorney) and mints the Player Rights Master (PRM) NFT to the club.",
  "Deploy Vault Escrow": "RightsVaultFactory deploys a gas-efficient proxy clone of the vault implementation to manage the escrow lifecycle and fractionalized ERC20 tokens.",
  "Lock & Fractionalize NFT": "Locks the Master NFT in the vault and mints fractionalized ERC20 rights tokens distributed to the Player, Club, and Attorney based on their agreed share percentage.",
  "Authorize Vault (Admin Only)": "Authorizes the newly deployed Vault Escrow clone to interact with the PlayerRightsMaster NFT registry so it can safely lock the NFT.",
  "Deposit Caution": "Deposits USDC caution money into the vault. 50% is locked as a guarantee (caution) and 50% is added to the redeemable reserve for share liquidity, changing status to ACTIVE.",
  "Rescind Agreement (as Player)": "Prematurely terminates the contract. If done before 6 months (HALF_TIME), a 65% penalty of the caution deposit is applied, distributing the funds to the other party.",
  "Rescind Agreement (as Club)": "Prematurely terminates the contract. If done before 6 months (HALF_TIME), a 65% penalty of the caution deposit is applied, distributing the funds to the other party.",
  "Expire Agreement": "Concludes the active contract after the 365-day duration, returning 100% of the locked caution deposit back to the Club."
};

/**
 * Generic component that acts like a bridge between the entire flow and contract execution
 */
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
  const explanation = STEP_EXPLANATIONS[title] || Object.entries(STEP_EXPLANATIONS).find(([key]) => title.includes(key))?.[1];

  return (
    <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold">{title}</h3>
          {explanation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-help inline-flex items-center justify-center p-0.5 rounded-full hover:bg-muted"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs p-3 bg-popover text-popover-foreground border border-border/40 shadow-xl rounded-xl leading-relaxed text-center">
                  {explanation}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
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
    </div>
  );
}
