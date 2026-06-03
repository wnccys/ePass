'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAgreement, submitSignature, updateAgreementOnChain, excludeAgreementFromAccount } from "@/app/actions/agreements";
import { useConnection, useChainId, usePublicClient } from "wagmi";
import { useEip712Signing } from "@/hooks/use-eip712-signing";
import { useContractAction } from "@/hooks/use-contract-action";
import { RIGHTS_MINTER, VAULT_FACTORY, PLAYER_RIGHTS_MASTER, MOCK_USDC } from "@/lib/web3/contracts";
import { Badge } from "@/components/ui/badge";
import { Loader, CheckCircle2, Clock, Trash2, Copy, Check, ExternalLink, FileText, AlertTriangle, KeyRound } from "lucide-react";
import { formatUnits, BaseError, ContractFunctionRevertedError, parseEventLogs } from "viem";
import { ActionCard } from "@/components/web3/action-card";
import { useWriteRightsMinterExecuteMint } from "@/src/generated";
import { recordTransaction, confirmTransaction, failTransaction } from "@/app/actions/transactions";
import { useSession } from "next-auth/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SerializedAgreement {
    _id: string;
    clubUserId: string;
    playerWalletAddress: string;
    playerEmail: string;
    clubWalletAddress: string;
    clubEmail: string;
    attorneyWalletAddress: string;
    attorneyEmail: string;
    title: string;
    description: string;
    tokenURI: string;
    cautionAmount: string;
    playerSignature?: string | null;
    clubSignature?: string | null;
    attorneySignature?: string | null;
    status: "draft" | "pending_signatures" | "ready" | "minted" | "vault_created" | "active" | "rescinded" | "expired";
    mintTxHash?: string | null;
    nftTokenId?: number | null;
    vaultAddress?: string | null;
    nonce: number;
    deadline: string;
    createdAt: string;
    updatedAt: string;
}

export default function ContractDetailPage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { address } = useConnection();
    const chainId = useChainId();

    const [agreement, setAgreement] = useState<SerializedAgreement | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [isExcluding, setIsExcluding] = useState(false);

    // Signature hook
    const { signAgreement, status: signStatus, errorMsg: signError } = useEip712Signing(chainId);

    // Contracts action hooks
    const { mutateAsync: executeMintContract } = useWriteRightsMinterExecuteMint();
    const publicClient = usePublicClient();

    const [mintStatus, setMintStatus] = useState<'idle' | 'simulating' | 'awaiting_wallet' | 'submitting' | 'confirming' | 'success' | 'error'>('idle');
    const [mintErrorMsg, setMintErrorMsg] = useState<string | null>(null);
    const [mintTxHash, setMintTxHash] = useState<string | null>(null);

    // Fetch specific [id] based agreement data and set its state
    useEffect(() => {
        fetchAgreement();
    }, [id]);
    const fetchAgreement = async () => {
        const res = await getAgreement(id);
        if (res.success) {
            setAgreement(res.agreement);
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
        if (!agreement || !agreement.playerSignature || !agreement.clubSignature || !agreement.attorneySignature || !address) return;

        setMintStatus('awaiting_wallet');
        setMintErrorMsg(null);
        setMintTxHash(null);

        const req = {
            player: agreement.playerWalletAddress as `0x${string}`,
            club: agreement.clubWalletAddress as `0x${string}`,
            attorney: agreement.attorneyWalletAddress as `0x${string}`,
            tokenURI: agreement.tokenURI,
            nonce: BigInt(agreement.nonce),
            deadline: BigInt(new Date(agreement.deadline).getTime() / 1000)
        };

        let txHash: `0x${string}` | undefined;

        try {
            txHash = await executeMintContract({
                address: RIGHTS_MINTER.address,
                args: [
                    req,
                    agreement.playerSignature as `0x${string}`,
                    agreement.clubSignature as `0x${string}`,
                    agreement.attorneySignature as `0x${string}`
                ]
            });

            if (!txHash) throw new Error("Transaction hash was not returned.");

            setMintTxHash(txHash);
            setMintStatus('submitting');

            // Record transaction to database as 'submitted'
            await recordTransaction({
                txHash,
                chainId,
                actionType: 'execute_mint',
                contractAddress: RIGHTS_MINTER.address,
                walletAddress: address,
                agreementId: id
            });

            setMintStatus('confirming');

            if (!publicClient) throw new Error("Public client is not available.");

            // Wait for transaction receipt
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

            if (receipt.status === 'success') {
                setMintStatus('success');

                // Update database transaction status to 'confirmed'
                await confirmTransaction(txHash, Number(receipt.blockNumber));

                // Parse logs to decode the exact tokenId of the minted agreement
                let nftTokenId = 1;
                try {
                    const parsedLogs = parseEventLogs({
                        abi: RIGHTS_MINTER.abi,
                        eventName: 'AgreementAuthorized',
                        logs: receipt.logs
                    });
                    const eventArgs = parsedLogs[0]?.args as any;
                    if (eventArgs && 'tokenId' in eventArgs) {
                        nftTokenId = Number(eventArgs.tokenId);
                    }
                } catch (parseErr) {
                    console.error("Failed to parse event logs for tokenId:", parseErr);
                }

                // Update agreement status in database
                await updateAgreementOnChain(id, {
                    mintTxHash: txHash,
                    status: 'minted',
                    nftTokenId
                });

                await fetchAgreement();
            } else {
                throw new Error("Transaction reverted on-chain.");
            }
        } catch (err: any) {
            console.error("Minting error:", err);
            setMintStatus('error');

            if (txHash) {
                // If transaction failed/reverted on-chain, update database transaction to 'failed'
                await failTransaction(txHash);
            }

            // User rejected
            if (err.message?.includes('User rejected') || err.code === 4001) {
                setMintErrorMsg('Transaction was rejected in your wallet.');
                return;
            }

            // Parse custom contract errors from RightsMinter.sol
            if (err instanceof BaseError) {
                const revertError = err.walk(e => e instanceof ContractFunctionRevertedError);
                if (revertError instanceof ContractFunctionRevertedError) {
                    const errorName = revertError.data?.errorName;
                    switch (errorName) {
                        case 'SignatureExpired':
                            setMintErrorMsg('The signatures have expired. Please resign the agreement.');
                            break;
                        case 'InvalidSignature':
                            setMintErrorMsg('One or more signatures are invalid or do not match the expected signers.');
                            break;
                        case 'MasterNotConfigured':
                            setMintErrorMsg('The PlayerRightsMaster NFT contract address is not configured yet.');
                            break;
                        case 'ZeroAddress':
                            setMintErrorMsg('An invalid address (0x0) was provided.');
                            break;
                        default:
                            setMintErrorMsg(`Contract reverted: ${errorName || 'Unknown reason'}`);
                    }
                    return;
                }
            }

            setMintErrorMsg(err.shortMessage || err.message || 'Transaction failed.');
        }
    };

    // Exclude db contract representation
    const handleExclude = async () => {
        if (!confirm("Are you sure you want to exclude this contract from your account? This won't delete the contract on-chain or for other signers, but it will hide it from your dashboard.")) return;
        setIsExcluding(true);
        try {
            const res = await excludeAgreementFromAccount(id);
            if (res.success) {
                router.push("/contracts");
            } else {
                alert(res.error || "Failed to exclude agreement.");
            }
        } catch (err: any) {
            alert(err.message || "Failed to exclude agreement.");
        } finally {
            setIsExcluding(false);
        }
    };

    if (loading) return <div className="p-24 flex justify-center"><Loader className="animate-spin" /></div>;
    if (!agreement) return <div className="p-24 text-center">Agreement not found.</div>;

    // Checks for signature availability (connected wallet)
    const isClub = address?.toLowerCase() === agreement.clubWalletAddress.toLowerCase();
    const isPlayer = address?.toLowerCase() === agreement.playerWalletAddress.toLowerCase();
    const isAttorney = address?.toLowerCase() === agreement.attorneyWalletAddress.toLowerCase();

    // Wallet mismatch validation (session wallet vs contract-assigned wallet)
    const sessionWallet = session?.user?.walletAddress?.toLowerCase();
    const userEmail = session?.user?.email?.toLowerCase();
    const userRole = session?.user?.role;

    const isAssignedClub = userRole === 'club' && userEmail === agreement.clubEmail.toLowerCase();
    const isAssignedPlayer = userRole === 'player' && userEmail === agreement.playerEmail.toLowerCase();
    const isAssignedAttorney = userEmail === agreement.attorneyEmail.toLowerCase();

    const clubWalletMismatch = isAssignedClub && sessionWallet !== agreement.clubWalletAddress.toLowerCase();
    const playerWalletMismatch = isAssignedPlayer && sessionWallet !== agreement.playerWalletAddress.toLowerCase();
    const attorneyWalletMismatch = isAssignedAttorney && sessionWallet !== agreement.attorneyWalletAddress.toLowerCase();

    const hasAnyWalletMismatch = clubWalletMismatch || playerWalletMismatch || attorneyWalletMismatch;

    // Show sign button if connected wallet OR email assignment matches an unsigned role
    const needsMySignature =
    ((isClub || isAssignedClub) && !agreement.clubSignature) ||
    ((isPlayer || isAssignedPlayer) && !agreement.playerSignature) ||
    ((isAttorney || isAssignedAttorney) && !agreement.attorneySignature);

    return (
        <div className="container max-w-4xl mx-auto py-24 px-6">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-serif font-light tracking-tight">Contract Inspection</h1>
                    <p className="text-muted-foreground mt-2 font-mono text-sm">ID: {agreement._id}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="glass-badge px-4 py-2 text-sm text-foreground/80 font-mono tracking-wider font-medium">
                        {agreement.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <button
                        onClick={handleExclude}
                        disabled={isExcluding}
                        className="p-2.5 rounded-xl glass-input border border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
                        title="Exclude Contract from My Account"
                    >
                        {isExcluding ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Featured Contract Header Panel */}
            <div className="glass-container-wrap mb-8">
                <div className="glass-container-shadow rounded-2xl pointer-events-none" />
                <div className="glass-container relative z-10 p-8 space-y-6">
                    {/* Header Metadata Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/5 pb-4">
                        <div className="flex items-center gap-2 text-primary">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-xs uppercase font-mono tracking-widest font-medium">
                                On-Chain Image Rights Agreement
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                            <div className="flex items-center gap-1.5 bg-foreground/5 px-2.5 py-1 rounded-md border border-foreground/5">
                                <span className="text-muted-foreground/60">Nonce:</span>
                                <span className="font-semibold text-foreground">{agreement.nonce}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-foreground/5 px-2.5 py-1 rounded-md border border-foreground/5">
                                <span className="text-muted-foreground/60">Created:</span>
                                <span className="font-semibold text-foreground">
                                    {new Date(agreement.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Title and Description */}
                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-4xl font-serif font-light tracking-tight text-foreground">
                            {agreement.title || "Image Rights Agreement"}
                        </h2>
                        {agreement.description && (
                            <div className="relative pl-5 mt-4">
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary to-transparent rounded-full" />
                                <p className="text-muted-foreground text-base md:text-lg leading-relaxed font-light italic">
                                    "{agreement.description}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Wallet Mismatch Warnings */}
            {hasAnyWalletMismatch && (
                <div className="space-y-3 mb-8">
                    {clubWalletMismatch && (
                        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-amber-400">Club wallet mismatch</p>
                                <p className="text-xs text-muted-foreground">
                                    Your synced wallet does not match the club wallet registered on this contract.
                                </p>
                                <div className="text-xs font-mono text-muted-foreground space-y-0.5 mt-1">
                                    <p>Expected: <span className="text-foreground/70">{agreement.clubWalletAddress}</span></p>
                                    <p>Your wallet: <span className="text-amber-400/80">{sessionWallet || 'Not synced'}</span></p>
                                </div>
                            </div>
                        </div>
                    )}
                    {playerWalletMismatch && (
                        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-amber-400">Player wallet mismatch</p>
                                <p className="text-xs text-muted-foreground">
                                    Your synced wallet does not match the player wallet registered on this contract.
                                </p>
                                <div className="text-xs font-mono text-muted-foreground space-y-0.5 mt-1">
                                    <p>Expected: <span className="text-foreground/70">{agreement.playerWalletAddress}</span></p>
                                    <p>Your wallet: <span className="text-amber-400/80">{sessionWallet || 'Not synced'}</span></p>
                                </div>
                            </div>
                        </div>
                    )}
                    {attorneyWalletMismatch && (
                        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-amber-400">Attorney wallet mismatch</p>
                                <p className="text-xs text-muted-foreground">
                                    Your synced wallet does not match the attorney wallet registered on this contract.
                                </p>
                                <div className="text-xs font-mono text-muted-foreground space-y-0.5 mt-1">
                                    <p>Expected: <span className="text-foreground/70">{agreement.attorneyWalletAddress}</span></p>
                                    <p>Your wallet: <span className="text-amber-400/80">{sessionWallet || 'Not synced'}</span></p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="glass-panel p-6 rounded-xl hover:border-primary/30 transition-all duration-300">
                        <h3 className="font-semibold mb-4">Agreement Information</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Player</p>
                                    {agreement.playerEmail && (
                                        <span className="text-[11px] font-mono text-primary/80 bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10">
                                            {agreement.playerEmail}
                                        </span>
                                    )}
                                    {isAssignedPlayer && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <KeyRound className="w-3.5 h-3.5 text-primary/60" />
                                                </TooltipTrigger>
                                                <TooltipContent>Your account is responsible for signing as Player</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <p className="font-mono text-sm break-all text-foreground pl-1">{agreement.playerWalletAddress}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Club</p>
                                    {agreement.clubEmail && (
                                        <span className="text-[11px] font-mono text-primary/80 bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10">
                                            {agreement.clubEmail}
                                        </span>
                                    )}
                                    {isAssignedClub && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <KeyRound className="w-3.5 h-3.5 text-primary/60" />
                                                </TooltipTrigger>
                                                <TooltipContent>Your account is responsible for signing as Club</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <p className="font-mono text-sm break-all text-foreground pl-1">{agreement.clubWalletAddress}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Attorney</p>
                                    {agreement.attorneyEmail && (
                                        <span className="text-[11px] font-mono text-primary/80 bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10">
                                            {agreement.attorneyEmail}
                                        </span>
                                    )}
                                    {isAssignedAttorney && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <KeyRound className="w-3.5 h-3.5 text-primary/60" />
                                                </TooltipTrigger>
                                                <TooltipContent>Your account is responsible for signing as Attorney</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <p className="font-mono text-sm break-all text-foreground pl-1">{agreement.attorneyWalletAddress}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Token URI</p>
                                <a href={agreement.tokenURI} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all text-sm font-mono">
                                    {agreement.tokenURI}
                                </a>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Caution Amount</p>
                                <p className="font-semibold">{formatUnits(BigInt(agreement.cautionAmount), 6)} USDC</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Deadline</p>
                                <p className="font-semibold text-sm">{new Date(agreement.deadline).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Decentralized Storage IPFS Inspection Section */}
                    <div className="glass-panel p-6 rounded-xl hover:border-primary/30 transition-all duration-300">
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                            <FileText className="w-5 h-5 text-primary animate-pulse" />
                            Decentralized Storage (IPFS)
                        </h3>
                        <div className="space-y-4">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                This legally binding contract document is cryptographically secured on the decentralized IPFS network via Pinata storage.
                            </p>
                            <div className="glass-input rounded-xl p-3 flex items-center justify-between gap-3 text-left w-full">
                                <span className="text-xs font-mono text-muted-foreground truncate flex-1 select-all">
                                    {agreement.tokenURI}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(agreement.tokenURI);
                                            setIsCopied(true);
                                            setTimeout(() => setIsCopied(false), 2000);
                                        }}
                                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
                                        title="Copy IPFS URI"
                                    >
                                        {isCopied ? (
                                            <Check className="w-4 h-4 text-green-500 animate-pulse" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                    <a
                                        href={agreement.tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
                                        title="View on Pinata Gateway"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Panels based on status */}
                    {agreement.status === 'ready' && isClub && (
                        <ActionCard
                            title="Ready to Mint"
                            description="All signatures collected. Only Clubs can broadcast the transaction."
                            actionName="Execute Mint"
                            onAction={handleMint}
                            status={mintStatus}
                            errorMsg={mintErrorMsg}
                            txHash={mintTxHash}
                            expectedChainId={31337}
                        />
                    )}
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-xl hover:border-primary/30 transition-all duration-300">
                        <h3 className="font-semibold mb-4">Signatures</h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Club</span>
                                {agreement.clubSignature ? <CheckCircle2 className="text-green-500 w-5 h-5" /> : <Clock className="text-amber-500 w-5 h-5" />}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Player</span>
                                {agreement.playerSignature ? <CheckCircle2 className="text-green-500 w-5 h-5" /> : <Clock className="text-amber-500 w-5 h-5" />}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Attorney</span>
                                {agreement.attorneySignature ? <CheckCircle2 className="text-green-500 w-5 h-5" /> : <Clock className="text-amber-500 w-5 h-5" />}
                            </div>
                        </div>

                        {needsMySignature && agreement.status === 'pending_signatures' && (
                            <div className="mt-6 pt-6 border-t border-border">
                                <button
                                    onClick={handleSign}
                                    disabled={signStatus === 'awaiting_wallet' || hasAnyWalletMismatch}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {signStatus === 'awaiting_wallet' ? <Loader className="w-4 h-4 animate-spin" /> : null}
                                    Sign Agreement
                                </button>
                                {signError && <p className="text-xs text-destructive mt-2">{signError}</p>}
                                {hasAnyWalletMismatch && (
                                    <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                        Signing is disabled due to wallet mismatch. Sync the correct wallet on your profile.
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
