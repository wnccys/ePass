'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAgreement, submitSignature, updateAgreementOnChain, excludeAgreementFromAccount } from "@/app/actions/agreements";
import { useConnection, useChainId } from "wagmi";
import { useEip712Signing } from "@/hooks/use-eip712-signing";
import { useContractAction } from "@/hooks/use-contract-action";
import { RIGHTS_MINTER, VAULT_FACTORY, PLAYER_RIGHTS_MASTER, MOCK_USDC } from "@/lib/web3/contracts";
import { Badge } from "@/components/ui/badge";
import { Loader, CheckCircle2, Clock, Trash2, Copy, Check, ExternalLink, FileText } from "lucide-react";
import { formatUnits } from "viem";
import { ActionCard } from "@/components/web3/action-card";
import { useSession } from "next-auth/react";

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
    const { execute: executeMint, status: mintStatus, txHash: mintTxHash, errorMsg: mintErrorMsg } = useContractAction(RIGHTS_MINTER);
    const { execute: executeFactory, status: factoryStatus, txHash: factoryTxHash, errorMsg: factoryErrorMsg } = useContractAction(VAULT_FACTORY);

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
        if (!agreement || !agreement.playerSignature || !agreement.clubSignature || !agreement.attorneySignature) return;

        try {
            const args = [
                {
                    player: agreement.playerWalletAddress,
                    club: agreement.clubWalletAddress,
                    attorney: agreement.attorneyWalletAddress,
                    tokenURI: agreement.tokenURI,
                    nonce: BigInt(agreement.nonce),
                    deadline: BigInt(new Date(agreement.deadline).getTime() / 1000)
                },
                agreement.playerSignature,
                agreement.clubSignature,
                agreement.attorneySignature
            ];

            const txHash = await executeMint(
                RIGHTS_MINTER.address,
                RIGHTS_MINTER.abi,
                "executeMint",
                args,
                "execute_mint",
                chainId,
                address!,
                id
            );

            // In a real app we'd parse the event to get the tokenId. For MVP we'll just mock 1 or fetch from graph
            await updateAgreementOnChain(id, { mintTxHash: txHash, status: 'minted', nftTokenId: 1 });
            await fetchAgreement();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateVault = async () => {
        if (!agreement) return;

        try {
            const args = [
                PLAYER_RIGHTS_MASTER.address,
                MOCK_USDC.address,
                agreement.playerWalletAddress,
                agreement.clubWalletAddress
            ];

            const txHash = await executeFactory(
                VAULT_FACTORY.address,
                VAULT_FACTORY.abi,
                "createVault",
                args,
                "create_vault",
                chainId,
                address!,
                id
            );

            // Wait a bit, in real app parse VaultCreated event.
            // We will set status to vault_created and prompt to deposit caution.
            await updateAgreementOnChain(id, { status: 'vault_created' });
            await fetchAgreement();
        } catch (err) {
            console.error(err);
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

    // Checks for signature availability
    const isClub = address?.toLowerCase() === agreement.clubWalletAddress.toLowerCase();
    const isPlayer = address?.toLowerCase() === agreement.playerWalletAddress.toLowerCase();
    const isAttorney = address?.toLowerCase() === agreement.attorneyWalletAddress.toLowerCase();

    const needsMySignature =
    (isClub && !agreement.clubSignature) ||
    (isPlayer && !agreement.playerSignature) ||
    (isAttorney && !agreement.attorneySignature);

    return (
        <div className="container max-w-4xl mx-auto py-24 px-6">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-serif font-light tracking-tight">Contract Inspection</h1>
                    <p className="text-muted-foreground mt-2 font-mono text-sm">ID: {agreement._id}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-4 py-2 text-sm bg-primary/5 text-primary border-primary/20">
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
            <div className="glass-panel p-8 rounded-2xl mb-8 border border-primary/20 relative overflow-hidden bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                <div className="space-y-4">
                    <div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                            On-Chain Image Rights Agreement
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif font-light tracking-tight text-foreground mt-2">
                            {agreement.title || "Image Rights Agreement"}
                        </h2>
                    </div>
                    {agreement.description && (
                        <p className="text-muted-foreground text-base md:text-lg leading-relaxed font-light italic pl-4 border-l border-foreground/10 max-w-3xl">
                            "{agreement.description}"
                        </p>
                    )}
                </div>
            </div>

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
                    {agreement.status === 'ready' && (
                        <ActionCard
                            title="Ready to Mint"
                            description="All signatures collected. Anyone can broadcast the transaction."
                            actionName="Execute Mint"
                            onAction={handleMint}
                            status={mintStatus}
                            errorMsg={mintErrorMsg}
                            txHash={mintTxHash}
                            expectedChainId={31337}
                        />
                    )}

                    {agreement.status === 'minted' && isClub && (
                        <ActionCard
                            title="Create Vault"
                            description="Deploy the RightsVault to secure the asset."
                            actionName="Create Vault"
                            onAction={handleCreateVault}
                            status={factoryStatus}
                            errorMsg={factoryErrorMsg}
                            txHash={factoryTxHash}
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
                                    disabled={signStatus === 'awaiting_wallet'}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {signStatus === 'awaiting_wallet' ? <Loader className="w-4 h-4 animate-spin" /> : null}
                                    Sign Agreement
                                </button>
                                {signError && <p className="text-xs text-destructive mt-2">{signError}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
