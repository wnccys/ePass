import { useState } from "react";
import { useWriteContract } from "wagmi";
import { recordTransaction } from "@/app/actions/transactions";

type ActionStatus =
    | "idle"
    | "simulating"
    | "awaiting_wallet"
    | "submitting"
    | "confirming"
    | "success"
    | "error";

export function useContractAction(config: any) {
    const [status, setStatus] = useState<ActionStatus>("idle");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const { mutateAsync } = useWriteContract();

    const execute = async (
        contractAddress: `0x${string}`,
        abi: any,
        functionName: string,
        args: any[],
        actionType: any,
        chainId: number,
        walletAddress: string,
        agreementId?: string,
    ) => {
        try {
            setStatus("awaiting_wallet");
            setErrorMsg(null);

            const txHash = await mutateAsync({
                address: contractAddress,
                abi,
                functionName,
                args,
            });

            setStatus("submitting");
            setTxHash(txHash);

            // Record tx to DB
            await recordTransaction({
                txHash,
                chainId,
                actionType,
                contractAddress,
                walletAddress,
                agreementId,
            });

            setStatus("confirming");
            // Wait for transaction receipt
            // Not awaiting here to avoid blocking execution in the frontend,
            // but ideally we should use wagmi's waitForTransactionReceipt
            // or viem's publicClient.
            // Since publicClient is not available here easily, we rely on the component to check status or just return it.
            return txHash;
        } catch (err: any) {
            console.error(err);
            setStatus("error");

            if (err.message.includes("User rejected")) {
                setErrorMsg("Transaction was rejected in your wallet.");
            } else {
                setErrorMsg(
                    err.shortMessage || err.message || "Transaction failed.",
                );
            }
            throw err;
        }
    };

    return { execute, status, setStatus, errorMsg, setErrorMsg, txHash };
}
