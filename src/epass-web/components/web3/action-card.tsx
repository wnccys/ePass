import {
    AlertCircle,
    CheckCircle2,
    HelpCircle,
    Link as LinkIcon,
    Loader,
} from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useChainId, useConnection } from "wagmi";
import SiweButton from "@/components/siwe-sign";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChain } from "@/app/context/ChainContext";

interface ActionCardProps {
    title: string;
    description: string;
    actionName: string;
    onAction: () => Promise<void>;
    status:
        | "idle"
        | "simulating"
        | "awaiting_wallet"
        | "submitting"
        | "confirming"
        | "success"
        | "error";
    errorMsg?: string | null;
    txHash?: string | null;
}

const STEP_EXPLANATIONS: Record<string, string> = {
    "Ready to Mint":
        "RightsMinter validates the EIP-712 signatures from all 3 parties (Player, Club, Attorney) and mints the Player Rights Master (PRM) NFT to the club.",
    "Deploy Vault Escrow":
        "RightsVaultFactory deploys a gas-efficient proxy clone of the vault implementation to manage the escrow lifecycle and fractionalized ERC20 tokens.",
    "Lock & Fractionalize NFT":
        "Locks the Master NFT in the vault and mints fractionalized ERC20 rights tokens distributed to the Player, Club, and Attorney based on their agreed share percentage.",
    "Authorize Vault (Admin Only)":
        "Authorizes the newly deployed Vault Escrow clone to interact with the PlayerRightsMaster NFT registry so it can safely lock the NFT.",
    "Deposit Caution":
        "Deposits USDC caution money into the vault. 50% is locked as a guarantee (caution) and 50% is added to the redeemable reserve for share liquidity, changing status to ACTIVE.",
    "Rescind Agreement (as Player)":
        "Prematurely terminates the contract. If done before 6 months (HALF_TIME), a 65% penalty of the caution deposit is applied, distributing the funds to the other party.",
    "Rescind Agreement (as Club)":
        "Prematurely terminates the contract. If done before 6 months (HALF_TIME), a 65% penalty of the caution deposit is applied, distributing the funds to the other party.",
    "Expire Agreement":
        "Concludes the active contract after the 365-day duration, returning 100% of the locked caution deposit back to the Club.",
};

const TITLE_MAP: Record<string, string> = {
    "Ready to Mint": "readyToMint",
    "Deploy Vault Escrow": "deployVault",
    "Lock & Fractionalize NFT": "lockFractionalize",
    "Authorize Vault (Admin Only)": "authorizeVault",
    "Deposit Caution": "depositCaution",
    "Rescind Agreement (as Player)": "rescindAgreement",
    "Rescind Agreement (as Club)": "rescindAgreement",
    "Expire Agreement": "expireAgreement",
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
}: ActionCardProps) {
    const { isConnected } = useConnection();
    const chainId = useChainId();
    const { t } = useTranslation();

    const { network } = useChain();
    const expectedChainId = network.id;
    const isWrongChain = chainId !== expectedChainId;

    const isBusy =
        status !== "idle" && status !== "error" && status !== "success";

    const key = TITLE_MAP[title];
    const translatedTitle = key ? t(`contracts.detail.${key}`) : title;

    const explanation = key
        ? t(`contracts.detail.${key}Explanation`)
        : STEP_EXPLANATIONS[title] ||
          Object.entries(STEP_EXPLANATIONS).find(([k]) =>
              title.includes(k),
          )?.[1];

    // Translate descriptions dynamically
    let translatedDescription = description;
    if (description.includes("All signatures collected")) {
        translatedDescription = t("contracts.detail.readyToMintDesc");
    } else if (description.includes("Deploy a secure EIP-1167")) {
        translatedDescription = t("contracts.detail.deployVaultDesc");
    } else if (description.includes("Step 1 of 2: Approve the Vault Escrow")) {
        translatedDescription = t(
            "contracts.detail.lockFractionalizeDescStep1",
        );
    } else if (
        description.includes("Step 2 of 2: Lock the Player Rights NFT") ||
        description.includes("Step 2 of 2: Authorize vault automatically")
    ) {
        translatedDescription = t(
            "contracts.detail.lockFractionalizeDescStep2",
        );
    } else if (description.includes("As the owner of PlayerRightsMaster")) {
        translatedDescription = t("contracts.detail.authorizeVaultDesc");
    } else if (
        description.includes(
            "Step 1 of 2: Approve the Vault Escrow clone to spend the caution",
        )
    ) {
        translatedDescription = t("contracts.detail.depositCautionDescStep1");
    } else if (
        description.includes("Step 2 of 2: Deposit the USDC caution") ||
        description.includes("Step 2 of 2: Deposit USDC caution")
    ) {
        translatedDescription = t("contracts.detail.depositCautionDescStep2");
    } else if (
        description.includes(
            "Terminate the agreement. Since it is before 6 months, a penalty of 65% of the caution will go to the Club",
        )
    ) {
        translatedDescription = t("contracts.detail.rescindPlayerDesc");
    } else if (
        description.includes(
            "Terminate the agreement. Since it is before 6 months, a penalty of 65% of the caution will go to the Player",
        )
    ) {
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
        if (status === "success") {
            toast.custom(
                (tToast) => (
                    <div className="sonner-glass-toast relative flex w-full min-w-[320px] flex-col">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <div className="space-y-1">
                                <p className="font-semibold text-foreground text-sm">
                                    {t("actions.success")}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {t("contracts.detail.actionRequired")}
                                </p>
                            </div>
                        </div>
                        <div className="sonner-toast-progress" />
                    </div>
                ),
                { duration: 4000 },
            );
        }
    }, [status]);

    return (
        <div className="glass-panel flex flex-col gap-4 rounded-xl p-6">
            <div>
                <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-semibold">{translatedTitle}</h3>
                    {explanation && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex cursor-help items-center justify-center rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        <HelpCircle className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs rounded-xl border border-border/40 bg-popover p-3 text-center text-popover-foreground text-xs leading-relaxed shadow-xl">
                                    {explanation}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <p className="text-muted-foreground text-sm">
                    {translatedDescription}
                </p>
            </div>

            {!isConnected ? (
                <div className="flex flex-col items-center gap-3 rounded-xl bg-muted p-4">
                    <p className="text-muted-foreground text-sm">
                        {t("contracts.detail.notConnected")}
                    </p>
                    <SiweButton />
                </div>
            ) : isWrongChain ? (
                <div className="flex items-center gap-3 rounded-xl bg-destructive/10 p-4 text-destructive">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm">
                        {t("contracts.detail.wrongNetwork", {
                            chainId: expectedChainId,
                        })}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <button
                        onClick={onAction}
                        disabled={isBusy}
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isBusy && <Loader className="h-4 w-4 animate-spin" />}
                        {translatedActionName}
                    </button>

                    {status === "awaiting_wallet" && (
                        <p className="flex items-center gap-2 text-amber-500 text-sm">
                            <Loader className="h-4 w-4 animate-spin" />
                            {t("actions.confirmWallet")}
                        </p>
                    )}

                    {status === "submitting" && (
                        <p className="flex items-center gap-2 text-blue-500 text-sm">
                            <Loader className="h-4 w-4 animate-spin" />
                            {t("actions.submitting")}
                        </p>
                    )}

                    {status === "confirming" && (
                        <p className="flex items-center gap-2 text-blue-500 text-sm">
                            <Loader className="h-4 w-4 animate-spin" />
                            {t("actions.confirming")}
                        </p>
                    )}

                    {status === "success" && (
                        <p className="flex items-center gap-2 text-green-500 text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            {t("actions.success")}
                        </p>
                    )}

                    {errorMsg && (
                        <p className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {errorMsg}
                        </p>
                    )}

                    {txHash && (
                        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                            <span className="mr-2 truncate font-mono text-muted-foreground text-xs">
                                Tx: {txHash}
                            </span>
                            <button
                                onClick={() =>
                                    navigator.clipboard.writeText(txHash)
                                }
                                className="rounded-md p-1.5 transition-colors hover:bg-foreground/5"
                                title={t("common.copyHash")}
                            >
                                <LinkIcon className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
