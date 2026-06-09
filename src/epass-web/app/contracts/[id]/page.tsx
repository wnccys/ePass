"use client";

import {
    AlertTriangle,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    FileText,
    HelpCircle,
    KeyRound,
    Loader,
    Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    BaseError,
    ContractFunctionRevertedError,
    formatUnits,
    parseEventLogs,
} from "viem";
import { useChainId, useConnection, usePublicClient } from "wagmi";
import {
    excludeAgreementFromAccount,
    getAgreement,
    submitSignature,
    updateAgreementOnChain,
} from "@/app/actions/agreements";
import {
    confirmTransaction,
    failTransaction,
    recordTransaction,
} from "@/app/actions/transactions";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ActionCard } from "@/components/web3/action-card";
import { useEip712Signing } from "@/hooks/use-eip712-signing";
import {
    MOCK_USDC,
    PLAYER_RIGHTS_MASTER,
    RIGHTS_MINTER,
    VAULT_FACTORY,
} from "@/lib/web3/contracts";
import {
    rightsVaultFactoryAbi,
    useReadMockUsdcAllowance,
    useReadMockUsdcBalanceOf,
    useReadPlayerRightsMasterAuthorizedOperators,
    useReadPlayerRightsMasterGetApproved,
    useReadPlayerRightsMasterOwner,
    useReadRightsVaultImplIsBeforeHalfTime,
    useReadRightsVaultImplTimeRemaining,
    useWriteMockUsdcApprove,
    useWriteMockUsdcMint,
    useWritePlayerRightsMasterApprove,
    useWritePlayerRightsMasterSetAuthorizedOperator,
    useWriteRightsMinterExecuteMint,
    useWriteRightsVaultFactoryCreateVault,
    useWriteRightsVaultImplDepositCaution,
    useWriteRightsVaultImplExpireContract,
    useWriteRightsVaultImplFractionalize,
    useWriteRightsVaultImplRescindByClub,
    useWriteRightsVaultImplRescindByPlayer,
} from "@/src/generated";

import type { SerializedAgreement } from "@/types/agreement";

export default function ContractDetailPage() {
    const { t } = useTranslation();
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { address } = useConnection();
    const chainId = useChainId();

    const [agreement, setAgreement] = useState<SerializedAgreement | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [isExcluding, setIsExcluding] = useState(false);

    // Signature hook
    const {
        signAgreement,
        status: signStatus,
        errorMsg: signError,
    } = useEip712Signing(chainId);

    // Contracts action hooks
    const { mutateAsync: executeMintContract } =
        useWriteRightsMinterExecuteMint();
    const { mutateAsync: createVaultContract } =
        useWriteRightsVaultFactoryCreateVault();
    const { mutateAsync: approveNft } = useWritePlayerRightsMasterApprove();
    const { mutateAsync: fractionalizeNft } =
        useWriteRightsVaultImplFractionalize();
    const { mutateAsync: approveUsdc } = useWriteMockUsdcApprove();
    const { mutateAsync: depositCautionContract } =
        useWriteRightsVaultImplDepositCaution();
    const { mutateAsync: mintMockUsdc } = useWriteMockUsdcMint();
    const { mutateAsync: rescindByPlayerContract } =
        useWriteRightsVaultImplRescindByPlayer();
    const { mutateAsync: rescindByClubContract } =
        useWriteRightsVaultImplRescindByClub();
    const { mutateAsync: expireContractAction } =
        useWriteRightsVaultImplExpireContract();

    const publicClient = usePublicClient();

    const [mintStatus, setMintStatus] = useState<
        | "idle"
        | "simulating"
        | "awaiting_wallet"
        | "submitting"
        | "confirming"
        | "success"
        | "error"
    >("idle");
    const [mintErrorMsg, setMintErrorMsg] = useState<string | null>(null);
    const [mintTxHash, setMintTxHash] = useState<string | null>(null);

    const [actionStatus, setActionStatus] = useState<
        | "idle"
        | "simulating"
        | "awaiting_wallet"
        | "submitting"
        | "confirming"
        | "success"
        | "error"
    >("idle");
    const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
    const [actionTxHash, setActionTxHash] = useState<string | null>(null);
    const [faucetLoading, setFaucetLoading] = useState(false);

    // Read hooks memoized arguments
    const getApprovedArgs = useMemo(() => {
        return agreement?.nftTokenId
            ? ([BigInt(agreement.nftTokenId)] as const)
            : undefined;
    }, [agreement?.nftTokenId]);

    const { data: approvedAddress, refetch: refetchApproved } =
        useReadPlayerRightsMasterGetApproved({
            address: PLAYER_RIGHTS_MASTER.address,
            args: getApprovedArgs,
            query: {
                enabled: !!agreement?.nftTokenId,
            },
        });

    const authorizedOperatorsArgs = useMemo(() => {
        return agreement?.vaultAddress
            ? ([agreement.vaultAddress as `0x${string}`] as const)
            : undefined;
    }, [agreement?.vaultAddress]);

    const { data: isVaultAuthorized, refetch: refetchAuthorized } =
        useReadPlayerRightsMasterAuthorizedOperators({
            address: PLAYER_RIGHTS_MASTER.address,
            args: authorizedOperatorsArgs,
            query: {
                enabled: !!agreement?.vaultAddress,
            },
        });

    const usdcAllowanceArgs = useMemo(() => {
        return address && agreement?.vaultAddress
            ? ([
                  address as `0x${string}`,
                  agreement.vaultAddress as `0x${string}`,
              ] as const)
            : undefined;
    }, [address, agreement?.vaultAddress]);

    const { data: usdcAllowance, refetch: refetchAllowance } =
        useReadMockUsdcAllowance({
            address: MOCK_USDC.address,
            args: usdcAllowanceArgs,
            query: {
                enabled: !!address && !!agreement?.vaultAddress,
            },
        });

    const usdcBalanceArgs = useMemo(() => {
        return address ? ([address as `0x${string}`] as const) : undefined;
    }, [address]);

    const { data: usdcBalance, refetch: refetchUsdcBalance } =
        useReadMockUsdcBalanceOf({
            address: MOCK_USDC.address,
            args: usdcBalanceArgs,
            query: {
                enabled: !!address,
            },
        });

    const {
        data: timeRemaining,
        refetch: refetchTimeRemaining,
        isError: isTimeRemainingError,
    } = useReadRightsVaultImplTimeRemaining({
        address: agreement?.vaultAddress as `0x${string}`,
        query: {
            enabled:
                !!agreement?.vaultAddress && agreement?.status === "active",
        },
    });

    const {
        data: isBeforeHalfTime,
        refetch: refetchHalfTime,
        isError: isHalfTimeError,
    } = useReadRightsVaultImplIsBeforeHalfTime({
        address: agreement?.vaultAddress as `0x${string}`,
        query: {
            enabled:
                !!agreement?.vaultAddress && agreement?.status === "active",
        },
    });

    // Fetch specific [id] based agreement data and set its state
    useEffect(() => {
        fetchAgreement();
    }, [id]);
    const fetchAgreement = async () => {
        const res = await getAgreement(id);
        if (res.success) {
            setAgreement(res.agreement);
            refetchApproved?.();
            refetchAuthorized?.();
            refetchAllowance?.();
            refetchUsdcBalance?.();
            refetchTimeRemaining?.();
            refetchHalfTime?.();
        }
        setLoading(false);
    };

    // Submit the signature
    const handleSign = async () => {
        if (!agreement || !address) return;

        try {
            // Keccak-256 string representing the signed transaction
            const sig = await signAgreement(agreement);

            if (session?.user?.role) {
                // Save the signature to db agreement repr
                await submitSignature(id, sig as string, address);
                // Update agreement status (re-renders this component's agreement data)
                await fetchAgreement();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleMint = async () => {
        if (
            !agreement ||
            !agreement.playerSignature ||
            !agreement.clubSignature ||
            !agreement.attorneySignature ||
            !address
        )
            return;

        setMintStatus("awaiting_wallet");
        setMintErrorMsg(null);
        setMintTxHash(null);

        const req = {
            player: agreement.playerWalletAddress as `0x${string}`,
            club: agreement.clubWalletAddress as `0x${string}`,
            attorney: agreement.attorneyWalletAddress as `0x${string}`,
            tokenURI: agreement.tokenURI,
            nonce: BigInt(agreement.nonce!),
            deadline: BigInt(new Date(agreement.deadline!).getTime() / 1000),
        };

        let txHash: `0x${string}` | undefined;

        try {
            txHash = await executeMintContract({
                address: RIGHTS_MINTER.address,
                args: [
                    req,
                    agreement.playerSignature as `0x${string}`,
                    agreement.clubSignature as `0x${string}`,
                    agreement.attorneySignature as `0x${string}`,
                ],
            });

            if (!txHash) throw new Error("Transaction hash was not returned.");

            setMintTxHash(txHash);
            setMintStatus("submitting");

            // Record transaction to database as 'submitted'
            await recordTransaction({
                txHash,
                chainId,
                actionType: "execute_mint",
                contractAddress: RIGHTS_MINTER.address,
                walletAddress: address,
                agreementId: id,
            });

            setMintStatus("confirming");

            if (!publicClient)
                throw new Error("Public client is not available.");

            // Wait for transaction receipt
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
            });

            if (receipt.status === "success") {
                setMintStatus("success");

                // Update database transaction status to 'confirmed'
                await confirmTransaction(txHash, Number(receipt.blockNumber));

                // Parse logs to decode the exact tokenId of the minted agreement
                let nftTokenId = 1;
                try {
                    const parsedLogs = parseEventLogs({
                        abi: RIGHTS_MINTER.abi,
                        eventName: "AgreementAuthorized",
                        logs: receipt.logs,
                    });
                    const eventArgs = parsedLogs[0]?.args as any;
                    if (eventArgs && "tokenId" in eventArgs) {
                        nftTokenId = Number(eventArgs.tokenId);
                    }
                } catch (parseErr) {
                    console.error(
                        "Failed to parse event logs for tokenId:",
                        parseErr,
                    );
                }

                // Update agreement status in database
                await updateAgreementOnChain(id, {
                    mintTxHash: txHash,
                    status: "minted",
                    nftTokenId,
                });

                await fetchAgreement();
            } else {
                throw new Error("Transaction reverted on-chain.");
            }
        } catch (err: any) {
            console.error("Minting error:", err);
            setMintStatus("error");

            if (txHash) {
                // If transaction failed/reverted on-chain, update database transaction to 'failed'
                await failTransaction(txHash);
            }

            // User rejected
            if (err.message?.includes("User rejected") || err.code === 4001) {
                setMintErrorMsg("Transaction was rejected in your wallet.");
                return;
            }

            // Parse custom contract errors from RightsMinter.sol
            if (err instanceof BaseError) {
                const revertError = err.walk(
                    (e) => e instanceof ContractFunctionRevertedError,
                );
                if (revertError instanceof ContractFunctionRevertedError) {
                    const errorName = revertError.data?.errorName;
                    switch (errorName) {
                        case "SignatureExpired":
                            setMintErrorMsg(
                                "The signatures have expired. Please resign the agreement.",
                            );
                            break;
                        case "InvalidSignature":
                            setMintErrorMsg(
                                "One or more signatures are invalid or do not match the expected signers.",
                            );
                            break;
                        case "MasterNotConfigured":
                            setMintErrorMsg(
                                "The PlayerRightsMaster NFT contract address is not configured yet.",
                            );
                            break;
                        case "ZeroAddress":
                            setMintErrorMsg(
                                "An invalid address (0x0) was provided.",
                            );
                            break;
                        default:
                            setMintErrorMsg(
                                `Contract reverted: ${errorName || "Unknown reason"}`,
                            );
                    }
                    return;
                }
            }

            setMintErrorMsg(
                err.shortMessage || err.message || "Transaction failed.",
            );
        }
    };

    const handleCreateVault = async () => {
        if (!agreement || !address) return;

        setActionStatus("awaiting_wallet");
        setActionErrorMsg(null);
        setActionTxHash(null);

        try {
            const txHash = await createVaultContract({
                address: VAULT_FACTORY.address,
                args: [
                    agreement.playerWalletAddress as `0x${string}`,
                    agreement.clubWalletAddress as `0x${string}`,
                    agreement.attorneyWalletAddress as `0x${string}`,
                    3000n, // playerBps: 30%
                    6000n, // clubBps: 60%
                    1000n, // attorneyBps: 10%
                    agreement.tokenName,
                    agreement.tokenSymbol,
                ],
            });

            if (!txHash) throw new Error("Transaction hash was not returned.");

            setActionTxHash(txHash);
            setActionStatus("submitting");

            await recordTransaction({
                txHash,
                chainId,
                actionType: "create_vault",
                contractAddress: VAULT_FACTORY.address,
                walletAddress: address,
                agreementId: id,
            });

            setActionStatus("confirming");

            if (!publicClient)
                throw new Error("Public client is not available.");
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
            });

            if (receipt.status === "success") {
                setActionStatus("success");
                await confirmTransaction(txHash, Number(receipt.blockNumber));

                let vaultAddress = "";
                try {
                    const parsedLogs = parseEventLogs({
                        abi: rightsVaultFactoryAbi,
                        eventName: "VaultCreated",
                        logs: receipt.logs,
                    });
                    const eventArgs = parsedLogs[0]?.args as any;
                    if (eventArgs && "vault" in eventArgs) {
                        vaultAddress = eventArgs.vault;
                    }
                } catch (parseErr) {
                    console.error(
                        "Failed to parse event logs for vault address:",
                        parseErr,
                    );
                }

                if (!vaultAddress) {
                    throw new Error(
                        "Could not retrieve vault address from transaction logs.",
                    );
                }

                await updateAgreementOnChain(id, {
                    vaultAddress,
                    status: "vault_created",
                });

                await fetchAgreement();
            } else {
                throw new Error("Transaction reverted on-chain.");
            }
        } catch (err: any) {
            console.error("Create vault error:", err);
            setActionStatus("error");
            if (actionTxHash) {
                await failTransaction(actionTxHash);
            }
            setActionErrorMsg(
                err.shortMessage || err.message || "Transaction failed.",
            );
        }
    };

    const handleAuthorizeVault = async () => {
        if (!agreement || !agreement.vaultAddress || !address) return;

        setActionStatus("awaiting_wallet");
        setActionErrorMsg(null);
        setActionTxHash(null);

        try {
            if (isVaultAuthorized) {
                return;
            }

            const authResponse = await fetch("/api/authorize-vault", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vaultAddress: agreement.vaultAddress }),
            });

            if (!authResponse.ok) {
                const errorData = await authResponse.json().catch(() => ({}));
                throw new Error(
                    errorData.error ||
                        "Failed to automatically authorize vault via Automatic API.",
                );
            }

            const txHash = (await authResponse.json()).hash;
            if (!txHash) throw new Error("Transaction hash was not returned.");

            setActionTxHash(txHash);
            setActionStatus("submitting");

            await recordTransaction({
                txHash,
                chainId,
                actionType: "authorize_vault",
                contractAddress: PLAYER_RIGHTS_MASTER.address,
                walletAddress: address,
                agreementId: id,
            });

            console.log("AUTHORIZE SUCCESSFULLLL");
            setActionStatus("confirming");

            if (!publicClient)
                throw new Error("Public client is not available.");
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
            });

            if (receipt.status === "success") {
                setActionStatus("success");
                await confirmTransaction(txHash, Number(receipt.blockNumber));
                await refetchAuthorized();
            } else {
                throw new Error("Transaction reverted on-chain.");
            }
        } catch (err: any) {
            console.error("Authorize vault operator error:", err);
            setActionStatus("error");
            if (actionTxHash) {
                await failTransaction(actionTxHash);
            }
            setActionErrorMsg(
                err.shortMessage || err.message || "Transaction failed.",
            );
        }
    };

    const handleFractionalize = async () => {
        if (
            !agreement ||
            !agreement.vaultAddress ||
            !agreement.nftTokenId ||
            !address
        )
            return;

        setActionStatus("awaiting_wallet");
        setActionErrorMsg(null);
        setActionTxHash(null);

        try {
            const isApproved =
                approvedAddress?.toLowerCase() ===
                agreement.vaultAddress.toLowerCase();

            if (!isApproved) {
                // Step 1: Approve
                const txHash = await approveNft({
                    address: PLAYER_RIGHTS_MASTER.address,
                    args: [
                        agreement.vaultAddress as `0x${string}`,
                        BigInt(agreement.nftTokenId),
                    ],
                });

                if (!txHash)
                    throw new Error("Transaction hash was not returned.");

                setActionTxHash(txHash);
                setActionStatus("submitting");

                await recordTransaction({
                    txHash,
                    chainId,
                    actionType: "approve_token",
                    contractAddress: PLAYER_RIGHTS_MASTER.address,
                    walletAddress: address,
                    agreementId: id,
                });

                setActionStatus("confirming");

                if (!publicClient)
                    throw new Error("Public client is not available.");
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: txHash,
                });

                if (receipt.status === "success") {
                    setActionStatus("success");
                    await confirmTransaction(
                        txHash,
                        Number(receipt.blockNumber),
                    );
                    await refetchApproved();
                    setActionStatus("idle");
                } else {
                    throw new Error("Approve transaction reverted on-chain.");
                }
            } else {
                // Step 2: Fractionalize
                const supply = 1_000_000n * 10n ** 18n; // 1M tokens with 18 decimals
                const txHash = await fractionalizeNft({
                    address: agreement.vaultAddress as `0x${string}`,
                    args: [BigInt(agreement.nftTokenId), supply],
                });

                if (!txHash)
                    throw new Error("Transaction hash was not returned.");

                setActionTxHash(txHash);
                setActionStatus("submitting");

                await recordTransaction({
                    txHash,
                    chainId,
                    actionType: "fractionalize",
                    contractAddress: agreement.vaultAddress,
                    walletAddress: address,
                    agreementId: id,
                });

                setActionStatus("confirming");

                if (!publicClient)
                    throw new Error("Public client is not available.");
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: txHash,
                });

                if (receipt.status === "success") {
                    setActionStatus("success");
                    await confirmTransaction(
                        txHash,
                        Number(receipt.blockNumber),
                    );

                    // Update database status to pending_deposit
                    await updateAgreementOnChain(id, {
                        status: "pending_deposit",
                    });

                    await fetchAgreement();
                } else {
                    throw new Error(
                        "Fractionalize transaction reverted on-chain.",
                    );
                }
            }
        } catch (err: any) {
            console.error("Fractionalization error:", err);
            setActionStatus("error");
            if (actionTxHash) {
                await failTransaction(actionTxHash);
            }
            setActionErrorMsg(
                err.shortMessage || err.message || "Transaction failed.",
            );
        }
    };

    const handleDepositCaution = async () => {
        if (
            !agreement ||
            !agreement.vaultAddress ||
            !agreement.cautionAmount ||
            !address
        )
            return;

        setActionStatus("awaiting_wallet");
        setActionErrorMsg(null);
        setActionTxHash(null);

        const onChainCautionAmount =
            BigInt(agreement.cautionAmount) * 10n ** 12n; // scale 6 decimals to 18 decimals

        try {
            const hasAllowance =
                usdcAllowance !== undefined &&
                usdcAllowance >= onChainCautionAmount;

            if (!hasAllowance) {
                // Step 1: Approve USDC
                const txHash = await approveUsdc({
                    address: MOCK_USDC.address,
                    args: [
                        agreement.vaultAddress as `0x${string}`,
                        onChainCautionAmount,
                    ],
                });

                if (!txHash)
                    throw new Error("Transaction hash was not returned.");

                setActionTxHash(txHash);
                setActionStatus("submitting");

                await recordTransaction({
                    txHash,
                    chainId,
                    actionType: "approve_usdc_to_vault",
                    contractAddress: MOCK_USDC.address,
                    walletAddress: address,
                    agreementId: id,
                });

                setActionStatus("confirming");

                if (!publicClient)
                    throw new Error("Public client is not available.");
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: txHash,
                });

                if (receipt.status === "success") {
                    setActionStatus("success");
                    await confirmTransaction(
                        txHash,
                        Number(receipt.blockNumber),
                    );
                    await refetchAllowance();
                    setActionStatus("idle");
                } else {
                    throw new Error("Approve transaction reverted on-chain.");
                }
            } else {
                // Step 2: Deposit Caution
                const txHash = await depositCautionContract({
                    address: agreement.vaultAddress as `0x${string}`,
                    args: [onChainCautionAmount],
                });

                if (!txHash)
                    throw new Error("Transaction hash was not returned.");

                setActionTxHash(txHash);
                setActionStatus("submitting");

                await recordTransaction({
                    txHash,
                    chainId,
                    actionType: "deposit_caution",
                    contractAddress: agreement.vaultAddress,
                    walletAddress: address,
                    agreementId: id,
                });

                setActionStatus("confirming");

                if (!publicClient)
                    throw new Error("Public client is not available.");
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: txHash,
                });

                if (receipt.status === "success") {
                    setActionStatus("success");
                    await confirmTransaction(
                        txHash,
                        Number(receipt.blockNumber),
                    );

                    // Update database status to active
                    await updateAgreementOnChain(id, {
                        status: "active",
                    });

                    await fetchAgreement();
                } else {
                    throw new Error("Deposit transaction reverted on-chain.");
                }
            }
        } catch (err: any) {
            console.error("Deposit caution error:", err);
            setActionStatus("error");
            if (actionTxHash) {
                await failTransaction(actionTxHash);
            }
            setActionErrorMsg(
                err.shortMessage || err.message || "Transaction failed.",
            );
        }
    };

    const handleFaucet = async () => {
        if (!address) return;
        setFaucetLoading(true);
        try {
            const txHash = await mintMockUsdc({
                address: MOCK_USDC.address,
                args: [
                    address as `0x${string}`,
                    10_000n * 10n ** 18n, // Mint 10,000 USDC (18 decimals)
                ],
            });

            if (!txHash) throw new Error("Faucet transaction failed.");

            if (!publicClient)
                throw new Error("Public client is not available.");
            await publicClient.waitForTransactionReceipt({ hash: txHash });
            await refetchUsdcBalance();
        } catch (err) {
            console.error("Faucet error:", err);
        } finally {
            setFaucetLoading(false);
        }
    };

    const handleRescindByPlayer = async () => {
        if (!agreement || !agreement.vaultAddress || !address) return;

        setActionStatus("awaiting_wallet");
        setActionErrorMsg(null);
        setActionTxHash(null);

        try {
            const txHash = await rescindByPlayerContract({
                address: agreement.vaultAddress as `0x${string}`,
            });

            if (!txHash) throw new Error("Transaction hash was not returned.");

            setActionTxHash(txHash);
            setActionStatus("submitting");

            await recordTransaction({
                txHash,
                chainId,
                actionType: "rescind_player",
                contractAddress: agreement.vaultAddress,
                walletAddress: address,
                agreementId: id,
            });

            setActionStatus("confirming");

            if (!publicClient)
                throw new Error("Public client is not available.");
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
            });

            if (receipt.status === "success") {
                setActionStatus("success");
                await confirmTransaction(txHash, Number(receipt.blockNumber));

                await updateAgreementOnChain(id, {
                    status: "rescinded",
                });

                await fetchAgreement();
            } else {
                throw new Error("Transaction reverted on-chain.");
            }
        } catch (err: any) {
            console.error("Rescind error:", err);
            setActionStatus("error");
            if (actionTxHash) {
                await failTransaction(actionTxHash);
            }
            setActionErrorMsg(
                err.shortMessage || err.message || "Transaction failed.",
            );
        }
    };

    const handleRescindByClub = async () => {
        if (!agreement || !agreement.vaultAddress || !address) return;

        setActionStatus("awaiting_wallet");
        setActionErrorMsg(null);
        setActionTxHash(null);

        try {
            const txHash = await rescindByClubContract({
                address: agreement.vaultAddress as `0x${string}`,
            });

            if (!txHash) throw new Error("Transaction hash was not returned.");

            setActionTxHash(txHash);
            setActionStatus("submitting");

            await recordTransaction({
                txHash,
                chainId,
                actionType: "rescind_club",
                contractAddress: agreement.vaultAddress,
                walletAddress: address,
                agreementId: id,
            });

            setActionStatus("confirming");

            if (!publicClient)
                throw new Error("Public client is not available.");
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
            });

            if (receipt.status === "success") {
                setActionStatus("success");
                await confirmTransaction(txHash, Number(receipt.blockNumber));

                await updateAgreementOnChain(id, {
                    status: "rescinded",
                });

                await fetchAgreement();
            } else {
                throw new Error("Transaction reverted on-chain.");
            }
        } catch (err: any) {
            console.error("Rescind error:", err);
            setActionStatus("error");
            if (actionTxHash) {
                await failTransaction(actionTxHash);
            }
            setActionErrorMsg(
                err.shortMessage || err.message || "Transaction failed.",
            );
        }
    };

    const handleExpireContract = async () => {
        if (!agreement || !agreement.vaultAddress || !address) return;

        setActionStatus("awaiting_wallet");
        setActionErrorMsg(null);
        setActionTxHash(null);

        try {
            const txHash = await expireContractAction({
                address: agreement.vaultAddress as `0x${string}`,
            });

            if (!txHash) throw new Error("Transaction hash was not returned.");

            setActionTxHash(txHash);
            setActionStatus("submitting");

            await recordTransaction({
                txHash,
                chainId,
                actionType: "expire_contract",
                contractAddress: agreement.vaultAddress,
                walletAddress: address,
                agreementId: id,
            });

            setActionStatus("confirming");

            if (!publicClient)
                throw new Error("Public client is not available.");
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
            });

            if (receipt.status === "success") {
                setActionStatus("success");
                await confirmTransaction(txHash, Number(receipt.blockNumber));

                await updateAgreementOnChain(id, {
                    status: "expired",
                });

                await fetchAgreement();
            } else {
                throw new Error("Transaction reverted on-chain.");
            }
        } catch (err: any) {
            console.error("Expire error:", err);
            setActionStatus("error");
            if (actionTxHash) {
                await failTransaction(actionTxHash);
            }
            setActionErrorMsg(
                err.shortMessage || err.message || "Transaction failed.",
            );
        }
    };

    // Exclude db contract representation
    const handleExclude = async () => {
        if (!confirm(t("contracts.detail.confirmExclude"))) return;
        setIsExcluding(true);
        try {
            const res = await excludeAgreementFromAccount(id);
            if (res.success) {
                router.push("/contracts");
            } else {
                alert(res.error || t("contracts.detail.failedExclude"));
            }
        } catch (err: any) {
            alert(err.message || t("contracts.detail.failedExclude"));
        } finally {
            setIsExcluding(false);
        }
    };

    if (loading)
        return (
            <div className="flex min-h-screen items-center justify-center p-24">
                <Loader className="animate-spin text-primary" />
            </div>
        );
    if (!agreement)
        return (
            <div className="flex min-h-screen items-center justify-center p-24 text-center">
                {t("contracts.detail.notFound")}
            </div>
        );

    // Checks for signature availability (connected wallet)
    const isClub =
        address?.toLowerCase() === agreement.clubWalletAddress.toLowerCase();
    const isPlayer =
        address?.toLowerCase() === agreement.playerWalletAddress.toLowerCase();
    const isAttorney =
        address?.toLowerCase() ===
        agreement.attorneyWalletAddress.toLowerCase();

    // Wallet mismatch validation (session wallet vs contract-assigned wallet)
    const sessionWallet = session?.user?.walletAddress?.toLowerCase();
    const userEmail = session?.user?.email?.toLowerCase();
    const userRole = session?.user?.role;

    const isAssignedClub =
        userRole === "club" && userEmail === agreement.clubEmail.toLowerCase();
    const isAssignedPlayer =
        userRole === "player" &&
        userEmail === agreement.playerEmail.toLowerCase();
    const isAssignedAttorney =
        userEmail === agreement.attorneyEmail.toLowerCase();

    const clubWalletMismatch =
        isAssignedClub &&
        sessionWallet !== agreement.clubWalletAddress.toLowerCase();
    const playerWalletMismatch =
        isAssignedPlayer &&
        sessionWallet !== agreement.playerWalletAddress.toLowerCase();
    const attorneyWalletMismatch =
        isAssignedAttorney &&
        sessionWallet !== agreement.attorneyWalletAddress.toLowerCase();

    const hasAnyWalletMismatch =
        clubWalletMismatch || playerWalletMismatch || attorneyWalletMismatch;

    // Show sign button if connected wallet OR email assignment matches an unsigned role
    const needsMySignature =
        ((isClub || isAssignedClub) && !agreement.clubSignature) ||
        ((isPlayer || isAssignedPlayer) && !agreement.playerSignature) ||
        ((isAttorney || isAssignedAttorney) && !agreement.attorneySignature);

    return (
        <div className="container mx-auto min-h-screen max-w-4xl px-6 py-24">
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="font-light font-serif text-4xl tracking-tight">
                        {t("contracts.detail.contractInspection")}
                    </h1>
                    <p className="mt-2 font-mono text-muted-foreground text-sm">
                        ID: {agreement._id}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge
                        variant="outline"
                        className="glass-badge px-4 py-2 font-medium font-mono text-foreground/80 text-sm tracking-wider"
                    >
                        {agreement.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <button
                        onClick={handleExclude}
                        disabled={isExcluding}
                        className="glass-input flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-destructive/20 p-2.5 text-destructive transition-all hover:scale-105 hover:border-destructive/30 hover:bg-destructive/10 active:scale-95"
                        title={t("contracts.detail.excludeTooltip")}
                    >
                        {isExcluding ? (
                            <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Featured Contract Header Panel */}
            <div className="glass-container-wrap mb-8">
                <div className="glass-container-shadow pointer-events-none rounded-2xl" />
                <div className="glass-container relative z-10 space-y-6 p-8">
                    {/* Header Metadata Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-foreground/5 border-b pb-4">
                        <div className="flex items-center gap-2 text-primary">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-medium font-mono text-xs uppercase tracking-widest">
                                {t("contracts.detail.onChainAgreement")}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-muted-foreground text-xs">
                            <div className="flex items-center gap-1.5 rounded-md border border-foreground/5 bg-foreground/5 px-2.5 py-1">
                                <span className="text-muted-foreground/60">
                                    {t("contracts.detail.nonce")}
                                </span>
                                <span className="font-semibold text-foreground">
                                    {agreement.nonce}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-md border border-foreground/5 bg-foreground/5 px-2.5 py-1">
                                <span className="text-muted-foreground/60">
                                    {t("contracts.detail.created")}
                                </span>
                                <span
                                    className="font-semibold text-foreground"
                                    suppressHydrationWarning
                                >
                                    {new Date(
                                        agreement.createdAt,
                                    ).toLocaleDateString(undefined, {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Title and Description */}
                    <div className="space-y-4">
                        <h2 className="font-light font-serif text-3xl text-foreground tracking-tight md:text-4xl">
                            {agreement.title ||
                                t("contracts.detail.onChainAgreement")}
                        </h2>
                        {agreement.description && (
                            <div className="relative mt-4 pl-5">
                                <div className="absolute top-0 bottom-0 left-0 w-0.5 rounded-full bg-linear-to-b from-primary to-transparent" />
                                <p className="font-light text-base text-muted-foreground italic leading-relaxed md:text-lg">
                                    "{agreement.description}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Wallet Mismatch Warnings */}
            {hasAnyWalletMismatch && (
                <div className="mb-8 space-y-3">
                    {clubWalletMismatch && (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                            <div className="space-y-1">
                                <p className="font-medium text-amber-400 text-sm">
                                    {t("contracts.detail.clubWalletMismatch")}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {t(
                                        "contracts.detail.clubWalletMismatchDesc",
                                    )}
                                </p>
                                <div className="mt-1 space-y-0.5 font-mono text-muted-foreground text-xs">
                                    <p>
                                        {t("contracts.detail.expected")}{" "}
                                        <span className="text-foreground/70">
                                            {agreement.clubWalletAddress}
                                        </span>
                                    </p>
                                    <p>
                                        {t("contracts.detail.yourWallet")}{" "}
                                        <span className="text-amber-400/80">
                                            {sessionWallet ||
                                                t("contracts.detail.notSynced")}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {playerWalletMismatch && (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                            <div className="space-y-1">
                                <p className="font-medium text-amber-400 text-sm">
                                    {t("contracts.detail.playerWalletMismatch")}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {t(
                                        "contracts.detail.playerWalletMismatchDesc",
                                    )}
                                </p>
                                <div className="mt-1 space-y-0.5 font-mono text-muted-foreground text-xs">
                                    <p>
                                        {t("contracts.detail.expected")}{" "}
                                        <span className="text-foreground/70">
                                            {agreement.playerWalletAddress}
                                        </span>
                                    </p>
                                    <p>
                                        {t("contracts.detail.yourWallet")}{" "}
                                        <span className="text-amber-400/80">
                                            {sessionWallet ||
                                                t("contracts.detail.notSynced")}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {attorneyWalletMismatch && (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                            <div className="space-y-1">
                                <p className="font-medium text-amber-400 text-sm">
                                    {t(
                                        "contracts.detail.attorneyWalletMismatch",
                                    )}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {t(
                                        "contracts.detail.attorneyWalletMismatchDesc",
                                    )}
                                </p>
                                <div className="mt-1 space-y-0.5 font-mono text-muted-foreground text-xs">
                                    <p>
                                        {t("contracts.detail.expected")}{" "}
                                        <span className="text-foreground/70">
                                            {agreement.attorneyWalletAddress}
                                        </span>
                                    </p>
                                    <p>
                                        {t("contracts.detail.yourWallet")}{" "}
                                        <span className="text-amber-400/80">
                                            {sessionWallet ||
                                                t("contracts.detail.notSynced")}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-6 md:col-span-2">
                    <div className="glass-panel rounded-xl p-6 transition-all duration-300 hover:border-primary/30">
                        <h3 className="mb-4 font-semibold">
                            {t("contracts.detail.agreementInformation")}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                        {t("contracts.detail.player")}
                                    </p>
                                    {agreement.playerEmail && (
                                        <span className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-0.5 font-mono text-[11px] text-primary/80">
                                            {agreement.playerEmail}
                                        </span>
                                    )}
                                    {isAssignedPlayer && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <KeyRound className="h-3.5 w-3.5 text-primary/60" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {t(
                                                        "contracts.detail.responsiblePlayer",
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <p className="break-all pl-1 font-mono text-foreground text-sm">
                                    {agreement.playerWalletAddress}
                                </p>
                            </div>
                            <div>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                        {t("contracts.detail.club")}
                                    </p>
                                    {agreement.clubEmail && (
                                        <span className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-0.5 font-mono text-[11px] text-primary/80">
                                            {agreement.clubEmail}
                                        </span>
                                    )}
                                    {isAssignedClub && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <KeyRound className="h-3.5 w-3.5 text-primary/60" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {t(
                                                        "contracts.detail.responsibleClub",
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <p className="break-all pl-1 font-mono text-foreground text-sm">
                                    {agreement.clubWalletAddress}
                                </p>
                            </div>
                            <div>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                                        {t("contracts.detail.attorney")}
                                    </p>
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
                                                {t(
                                                    "contracts.detail.attorneySignExplanation",
                                                )}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {agreement.attorneyEmail && (
                                        <span className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-0.5 font-mono text-[11px] text-primary/80">
                                            {agreement.attorneyEmail}
                                        </span>
                                    )}
                                    {isAssignedAttorney && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <KeyRound className="h-3.5 w-3.5 text-primary/60" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {t(
                                                        "contracts.detail.responsibleAttorney",
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <p className="break-all pl-1 font-mono text-foreground text-sm">
                                    {agreement.attorneyWalletAddress}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase">
                                    {t("contracts.detail.tokenUri")}
                                </p>
                                <a
                                    href={agreement.tokenURI}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="break-all font-mono text-primary text-sm hover:underline"
                                >
                                    {agreement.tokenURI}
                                </a>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase">
                                    {t("contracts.cautionAmount")}
                                </p>
                                <p className="font-semibold">
                                    {formatUnits(
                                        BigInt(agreement.cautionAmount),
                                        6,
                                    )}{" "}
                                    USDC
                                </p>
                            </div>
                            <div>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <p className="text-muted-foreground text-xs uppercase">
                                        {t("contracts.detail.deadline")}
                                    </p>
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
                                                {t(
                                                    "contracts.detail.deadlineExplanation",
                                                )}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <p
                                    className="font-semibold text-sm"
                                    suppressHydrationWarning
                                >
                                    {new Date(
                                        agreement.deadline!,
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Decentralized Storage IPFS Inspection Section */}
                    <div className="glass-panel rounded-xl p-6 transition-all duration-300 hover:border-primary/30">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                            <FileText className="h-5 w-5 animate-pulse text-primary" />
                            {t("contracts.detail.decentralizedStorage")}
                        </h3>
                        <div className="space-y-4">
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                {t("contracts.detail.ipfsExplanation")}
                            </p>
                            <div className="glass-input flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left">
                                <span className="flex-1 select-all truncate font-mono text-muted-foreground text-xs">
                                    {agreement.tokenURI}
                                </span>
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(
                                                agreement.tokenURI,
                                            );
                                            setIsCopied(true);
                                            setTimeout(
                                                () => setIsCopied(false),
                                                2000,
                                            );
                                        }}
                                        className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        title={t("contracts.detail.copyIpfs")}
                                    >
                                        {isCopied ? (
                                            <Check className="h-4 w-4 animate-pulse text-lime-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                    <a
                                        href={agreement.tokenURI.replace(
                                            "ipfs://",
                                            "https://gateway.pinata.cloud/ipfs/",
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        title={t("contracts.detail.viewPinata")}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Panels based on status */}
                    {agreement.status === "ready" && isClub && (
                        <ActionCard
                            title="Ready to Mint"
                            description="All signatures collected. Only Clubs can broadcast the transaction."
                            actionName="Execute Mint"
                            onAction={handleMint}
                            status={mintStatus}
                            errorMsg={mintErrorMsg}
                            txHash={mintTxHash}
                        />
                    )}

                    {agreement.status === "minted" && isClub && (
                        <ActionCard
                            title="Deploy Vault Escrow"
                            description="Deploy a secure EIP-1167 proxy vault escrow clone for this agreement."
                            actionName="Deploy Escrow"
                            onAction={handleCreateVault}
                            status={actionStatus}
                            errorMsg={actionErrorMsg}
                            txHash={actionTxHash}
                        />
                    )}

                    {agreement.status === "vault_created" && (
                        <div className="space-y-4">
                            {isClub ? (
                                <>
                                    {isVaultAuthorized ? (
                                        <ActionCard
                                            title="Lock & Fractionalize NFT"
                                            description={
                                                approvedAddress?.toLowerCase() ===
                                                agreement.vaultAddress?.toLowerCase()
                                                    ? !isVaultAuthorized
                                                        ? `Step 2 of 2: Authorize vault automatically and lock the Player Rights NFT into the Vault to fractionalize it into 1,000,000 ${agreement.tokenSymbol} tokens.`
                                                        : `Step 2 of 2: Lock the Player Rights NFT into the Vault and fractionalize it into 1,000,000 ${agreement.tokenSymbol} tokens.`
                                                    : "Step 1 of 2: Approve the Vault Escrow clone to transfer the Player Rights NFT."
                                            }
                                            actionName={
                                                approvedAddress?.toLowerCase() ===
                                                agreement.vaultAddress?.toLowerCase()
                                                    ? "Lock & Fractionalize NFT"
                                                    : "Approve NFT to Vault"
                                            }
                                            onAction={handleFractionalize}
                                            status={actionStatus}
                                            errorMsg={actionErrorMsg}
                                            txHash={actionTxHash}
                                        />
                                    ) : (
                                        <ActionCard
                                            title="Authorize Vault"
                                            description="By submitting this action, the on-chain management master contract will authorize the Vault Escrow contract clone as an operator before it can fractionalize the NFT."
                                            actionName="Authorize Vault Clone"
                                            onAction={handleAuthorizeVault}
                                            status={actionStatus}
                                            errorMsg={actionErrorMsg}
                                            txHash={actionTxHash}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="glass-panel space-y-3 rounded-xl border-primary bg-primary/10 p-6">
                                    <div className="flex items-start gap-3">
                                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                        <div className="space-y-1">
                                            <p className="font-medium text-primary/80 text-sm">
                                                {t(
                                                    "contracts.detail.readyToGo",
                                                )}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {t(
                                                    "contracts.detail.readyToGoDesc",
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {agreement.status === "pending_deposit" && isClub && (
                        <div className="space-y-6">
                            {/* Mock USDC Balance & Faucet Card */}
                            <div className="glass-panel space-y-4 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-foreground">
                                            {t("contracts.detail.faucetTitle")}
                                        </h3>
                                        <p className="mt-0.5 text-muted-foreground text-xs">
                                            {t(
                                                "contracts.detail.faucetSubtitle",
                                            )}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="border-primary/20 bg-primary/5 font-mono text-primary text-xs"
                                    >
                                        {t("contracts.detail.faucetBadge")}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 rounded-xl border border-foreground/5 bg-foreground/5 p-4 font-mono text-sm">
                                    <div className="space-y-0.5">
                                        <p className="text-muted-foreground/80 text-xs">
                                            {t(
                                                "contracts.detail.requiredDeposit",
                                            )}
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {formatUnits(
                                                BigInt(agreement.cautionAmount),
                                                6,
                                            )}{" "}
                                            USDC
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-muted-foreground/80 text-xs">
                                            {t("contracts.detail.yourBalance")}
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {usdcBalance !== undefined
                                                ? formatUnits(usdcBalance, 18)
                                                : "0.0"}{" "}
                                            USDC
                                        </p>
                                    </div>
                                </div>

                                {usdcBalance !== undefined &&
                                    usdcBalance <
                                        BigInt(agreement.cautionAmount) *
                                            10n ** 12n && (
                                        <p className="flex items-center gap-1.5 font-medium text-amber-500 text-xs">
                                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                            {t(
                                                "contracts.detail.insufficientBalance",
                                            )}
                                        </p>
                                    )}

                                <button
                                    onClick={handleFaucet}
                                    disabled={faucetLoading}
                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/20 py-2.5 font-medium text-primary text-sm transition-all hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {faucetLoading && (
                                        <Loader className="h-4 w-4 animate-spin" />
                                    )}
                                    {t("contracts.detail.getFaucet")}
                                </button>
                            </div>

                            {/* Caution Deposit Action Card */}
                            <ActionCard
                                title="Deposit Caution"
                                description={
                                    usdcAllowance !== undefined &&
                                    usdcAllowance >=
                                        BigInt(agreement.cautionAmount) *
                                            10n ** 12n
                                        ? "Step 2 of 2: Deposit the USDC caution money into the vault to activate the image rights agreement."
                                        : "Step 1 of 2: Approve the Vault Escrow clone to spend the caution amount in USDC."
                                }
                                actionName={
                                    usdcAllowance !== undefined &&
                                    usdcAllowance >=
                                        BigInt(agreement.cautionAmount) *
                                            10n ** 12n
                                        ? "Deposit Caution"
                                        : "Approve USDC for Caution"
                                }
                                onAction={handleDepositCaution}
                                status={actionStatus}
                                errorMsg={actionErrorMsg}
                                txHash={actionTxHash}
                            />
                        </div>
                    )}

                    {agreement.status === "active" && (
                        <div className="space-y-6">
                            {/* Active Contract Status Panel */}
                            <div className="glass-panel space-y-6 rounded-xl border-primary/20 bg-primary/5 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-foreground text-lg">
                                            {t("contracts.detail.activeEscrow")}
                                        </h3>
                                        <p className="mt-0.5 text-muted-foreground text-xs">
                                            {t(
                                                "contracts.detail.activeEscrowDesc",
                                            )}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="animate-pulse border-green-500/20 bg-green-500/10 px-3 py-1 font-mono text-lime-400 text-xs"
                                    >
                                        ● {t("contracts.status.active")}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 gap-4 font-mono text-sm md:grid-cols-2">
                                    <div className="space-y-1 rounded-xl border border-foreground/5 bg-foreground/5 p-4">
                                        <p className="text-muted-foreground/80 text-xs">
                                            {t(
                                                "contracts.detail.timeRemaining",
                                            )}
                                        </p>
                                        <p className="font-semibold text-base text-foreground">
                                            {isTimeRemainingError ? (
                                                <span className="font-sans text-destructive text-sm">
                                                    {t(
                                                        "contracts.detail.errorReading",
                                                    )}
                                                </span>
                                            ) : timeRemaining !== undefined ? (
                                                timeRemaining > 0n ? (
                                                    `${(timeRemaining / 86400n).toString()}${t("contracts.detail.days")}${((timeRemaining % 86400n) / 3600n).toString()}${t("contracts.detail.hours")}`
                                                ) : (
                                                    t(
                                                        "contracts.detail.completedDays",
                                                    )
                                                )
                                            ) : (
                                                t("common.loading")
                                            )}
                                        </p>
                                    </div>
                                    <div className="space-y-1 rounded-xl border border-foreground/5 bg-foreground/5 p-4">
                                        <p className="text-muted-foreground/80 text-xs">
                                            {t(
                                                "contracts.detail.contractPhase",
                                            )}
                                        </p>
                                        <p className="font-semibold text-base text-foreground">
                                            {isHalfTimeError ? (
                                                <span className="font-sans text-destructive text-sm">
                                                    {t(
                                                        "contracts.detail.errorReading",
                                                    )}
                                                </span>
                                            ) : isBeforeHalfTime !==
                                              undefined ? (
                                                isBeforeHalfTime ? (
                                                    <span className="text-amber-400">
                                                        {t(
                                                            "contracts.detail.firstHalf",
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-400">
                                                        {t(
                                                            "contracts.detail.secondHalf",
                                                        )}
                                                    </span>
                                                )
                                            ) : (
                                                t("common.loading")
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Rescission Actions */}
                            {isPlayer && (
                                <ActionCard
                                    title="Rescind Agreement (as Player)"
                                    description={
                                        isBeforeHalfTime
                                            ? "Step 1 of 1: Terminate the agreement. Since it is before 6 months, a penalty of 65% of the caution will go to the Club, and you will receive 35%."
                                            : "Step 1 of 1: Terminate the agreement. Since it is after 6 months, the caution is returned to the Club without penalty."
                                    }
                                    actionName="Rescind Agreement"
                                    onAction={handleRescindByPlayer}
                                    status={actionStatus}
                                    errorMsg={actionErrorMsg}
                                    txHash={actionTxHash}
                                />
                            )}

                            {isClub && (
                                <ActionCard
                                    title="Rescind Agreement (as Club)"
                                    description={
                                        isBeforeHalfTime
                                            ? "Step 1 of 1: Terminate the agreement. Since it is before 6 months, a penalty of 65% of the caution will go to the Player, and you will receive 35%."
                                            : "Step 1 of 1: Terminate the agreement. Since it is after 6 months, the caution is returned back to you without penalty."
                                    }
                                    actionName="Rescind Agreement"
                                    onAction={handleRescindByClub}
                                    status={actionStatus}
                                    errorMsg={actionErrorMsg}
                                    txHash={actionTxHash}
                                />
                            )}

                            {/* Expiration Action */}
                            {timeRemaining !== undefined &&
                                timeRemaining === 0n && (
                                    <ActionCard
                                        title="Expire Agreement"
                                        description="The contract period has concluded. Expire the contract on-chain to return 100% of the caution deposit back to the Club."
                                        actionName="Expire Agreement"
                                        onAction={handleExpireContract}
                                        status={actionStatus}
                                        errorMsg={actionErrorMsg}
                                        txHash={actionTxHash}
                                    />
                                )}
                        </div>
                    )}

                    {agreement.status === "rescinded" && (
                        <div className="glass-panel space-y-3 rounded-xl border-destructive/20 bg-destructive/5 p-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                                <div className="space-y-1">
                                    <p className="font-medium text-destructive text-sm">
                                        {t("contracts.detail.rescindedTitle")}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {t("contracts.detail.rescindedDesc")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {agreement.status === "expired" && (
                        <div className="glass-panel space-y-3 rounded-xl border-green-500/20 bg-green-500/5 p-6">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                                <div className="space-y-1">
                                    <p className="font-medium text-green-400 text-sm">
                                        {t("contracts.detail.concludedTitle")}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {t("contracts.detail.concludedDesc")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="glass-panel rounded-xl p-6 transition-all duration-300 hover:border-primary/30">
                        <h3 className="mb-4 font-semibold">
                            {t("contracts.detail.signatures")}
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">
                                    {t("contracts.detail.club")}
                                </span>
                                {agreement.clubSignature ? (
                                    <CheckCircle2 className="h-5 w-5 text-lime-500" />
                                ) : (
                                    <Clock className="h-5 w-5 text-amber-500" />
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">
                                    {t("contracts.detail.player")}
                                </span>
                                {agreement.playerSignature ? (
                                    <CheckCircle2 className="h-5 w-5 text-lime-500" />
                                ) : (
                                    <Clock className="h-5 w-5 text-amber-500" />
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">
                                    {t("contracts.detail.attorney")}
                                </span>
                                {agreement.attorneySignature ? (
                                    <CheckCircle2 className="h-5 w-5 text-lime-500" />
                                ) : (
                                    <Clock className="h-5 w-5 text-amber-500" />
                                )}
                            </div>
                        </div>

                        {needsMySignature &&
                            agreement.status === "pending_signatures" && (
                                <div className="mt-6 border-border border-t pt-6">
                                    <button
                                        onClick={handleSign}
                                        disabled={
                                            signStatus === "awaiting_wallet" ||
                                            hasAnyWalletMismatch
                                        }
                                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {signStatus === "awaiting_wallet" ? (
                                            <Loader className="h-4 w-4 animate-spin" />
                                        ) : null}
                                        {t("contracts.detail.signAction")}
                                    </button>
                                    {signError && (
                                        <p className="mt-2 text-destructive text-xs">
                                            {signError}
                                        </p>
                                    )}
                                    {hasAnyWalletMismatch && (
                                        <p className="mt-2 flex items-center gap-1.5 text-amber-400/80 text-xs">
                                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                            {t(
                                                "contracts.detail.walletMismatchSigning",
                                            )}
                                        </p>
                                    )}
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
}
