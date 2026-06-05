import { useEffect } from "react";
import { toast } from "sonner";
import { useChainId, useConnection } from "wagmi";
import { Loader, AlertCircle, CheckCircle2, Link as LinkIcon, HelpCircle } from "lucide-react";
import SiweButton from "@/components/siwe-sign";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

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

const TITLE_MAP: Record<string, string> = {
  "Ready to Mint": "readyToMint",
  "Deploy Vault Escrow": "deployVault",
  "Lock & Fractionalize NFT": "lockFractionalize",
  "Authorize Vault (Admin Only)": "authorizeVault",
  "Deposit Caution": "depositCaution",
  "Rescind Agreement (as Player)": "rescindAgreement",
  "Rescind Agreement (as Club)": "rescindAgreement",
  "Expire Agreement": "expireAgreement"
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
  const { t } = useTranslation();
  const isWrongChain = chainId !== expectedChainId;

  const isBusy = status !== 'idle' && status !== 'error' && status !== 'success';
  
  const key = TITLE_MAP[title];
  const translatedTitle = key ? t(`contracts.detail.${key}`) : title;
  
  const explanation = key 
    ? t(`contracts.detail.${key}Explanation`) 
    : (STEP_EXPLANATIONS[title] || Object.entries(STEP_EXPLANATIONS).find(([k]) => title.includes(k))?.[1]);

  // Translate descriptions dynamically
  let translatedDescription = description;
  if (description.includes("All signatures collected")) {
    translatedDescription = t("contracts.detail.readyToMintDesc");
  } else if (description.includes("Deploy a secure EIP-1167")) {
    translatedDescription = t("contracts.detail.deployVaultDesc");
  } else if (description.includes("Step 1 of 2: Approve the Vault Escrow")) {
    translatedDescription = t("contracts.detail.lockFractionalizeDescStep1");
  } else if (description.includes("Step 2 of 2: Lock the Player Rights NFT") || description.includes("Step 2 of 2: Authorize vault automatically")) {
    translatedDescription = t("contracts.detail.lockFractionalizeDescStep2");
  } else if (description.includes("As the owner of PlayerRightsMaster")) {
    translatedDescription = t("contracts.detail.authorizeVaultDesc");
  } else if (description.includes("Step 1 of 2: Approve the Vault Escrow clone to spend the caution")) {
    translatedDescription = t("contracts.detail.depositCautionDescStep1");
  } else if (description.includes("Step 2 of 2: Deposit the USDC caution") || description.includes("Step 2 of 2: Deposit USDC caution")) {
    translatedDescription = t("contracts.detail.depositCautionDescStep2");
  } else if (description.includes("Terminate the agreement. Since it is before 6 months, a penalty of 65% of the caution will go to the Club")) {
    translatedDescription = t("contracts.detail.rescindPlayerDesc");
  } else if (description.includes("Terminate the agreement. Since it is before 6 months, a penalty of 65% of the caution will go to the Player")) {
    translatedDescription = t("contracts.detail.rescindClubDesc");
  } else if (description.includes("The contract period has concluded.")) {
    translatedDescription = t("contracts.detail.expireDesc");
  }

  // Translate action names dynamically
  let translatedActionName = actionName;
  if (actionName === "Execute Mint") {
    translatedActionName = t("contracts.detail.executeMint");
  } else if (actionName === "Deploy Escrow") {
    translatedActionName = t("contracts.detail.deployEscrow");
  } else if (actionName === "Lock & Fractionalize NFT") {
    translatedActionName = t("contracts.detail.lockFractionalize");
  } else if (actionName === "Approve NFT to Vault") {
    translatedActionName = t("contracts.detail.approveNft");
  } else if (actionName === "Authorize Vault Clone") {
    translatedActionName = t("contracts.detail.authorizeVaultClone");
  } else if (actionName === "Approve USDC for Caution") {
    translatedActionName = t("contracts.detail.approveUsdc");
  } else if (actionName === "Deposit Caution") {
    translatedActionName = t("contracts.detail.depositCautionBtn");
  } else if (actionName === "Rescind Agreement") {
    translatedActionName = t("contracts.detail.rescindBtn");
  } else if (actionName === "Expire Agreement") {
    translatedActionName = t("contracts.detail.expireBtn");
  }

  useEffect(() => {
    if (status === 'success') {
      toast.custom((tToast) => (
        <div className="sonner-glass-toast flex flex-col w-full relative min-w-[320px]">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-foreground">{t("actions.success")}</p>
              <p className="text-xs text-muted-foreground">{t("contracts.detail.actionRequired")}</p>
            </div>
          </div>
          <div className="sonner-toast-progress" />
        </div>
      ), { duration: 4000 });
    }
  }, [status]);

  return (
    <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold">{translatedTitle}</h3>
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
        <p className="text-sm text-muted-foreground">{translatedDescription}</p>
      </div>

      {!isConnected ? (
        <div className="bg-muted p-4 rounded-xl flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">{t("contracts.detail.notConnected")}</p>
          <SiweButton />
        </div>
      ) : isWrongChain ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{t("contracts.detail.wrongNetwork", { chainId: expectedChainId })}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            onClick={onAction}
            disabled={isBusy}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isBusy && <Loader className="w-4 h-4 animate-spin" />}
            {translatedActionName}
          </button>

          {status === 'awaiting_wallet' && (
            <p className="text-sm text-amber-500 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              {t("actions.confirmWallet")}
            </p>
          )}

          {status === 'submitting' && (
            <p className="text-sm text-blue-500 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              {t("actions.submitting")}
            </p>
          )}

          {status === 'confirming' && (
            <p className="text-sm text-blue-500 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              {t("actions.confirming")}
            </p>
          )}

          {status === 'success' && (
            <p className="text-sm text-green-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t("actions.success")}
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
                title={t("common.copyHash")}
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
