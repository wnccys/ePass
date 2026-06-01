'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAgreement, submitSignature, updateAgreementOnChain } from "@/app/actions/agreements";
import { useConnection, useChainId } from "wagmi";
import { useEip712Signing } from "@/hooks/use-eip712-signing";
import { useContractAction } from "@/hooks/use-contract-action";
import { RIGHTS_MINTER, VAULT_FACTORY, PLAYER_RIGHTS_MASTER, MOCK_USDC, RIGHTS_VAULT_ABI } from "@/lib/web3/contracts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, CheckCircle2, Clock } from "lucide-react";
import { formatUnits } from "viem";
import { ActionCard } from "@/components/web3/action-card";

export default function ContractDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const { address } = useConnection();
    const chainId = useChainId();

    const [agreement, setAgreement] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Signature hook
    const { signAgreement, status: signStatus, errorMsg: signError } = useEip712Signing(chainId);

    // Contracts action hooks
    const { execute: executeMint, status: mintStatus, txHash: mintTxHash, errorMsg: mintErrorMsg } = useContractAction(RIGHTS_MINTER);
    const { execute: executeFactory, status: factoryStatus, txHash: factoryTxHash, errorMsg: factoryErrorMsg } = useContractAction(VAULT_FACTORY);

    // Fetch specific agreement data
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

    /**
     * Submit the signature
     */
    const handleSign = async () => {
        if (!agreement || !address) return;

        try {
            // Keccak-256 string representing the signed transaction
            const sig = await signAgreement(agreement);

            let role: 'player' | 'club' | 'attorney' | null = null;

            // TODO refine role approach
            if (address.toLowerCase() === agreement.clubWalletAddress.toLowerCase()) role = 'club';
            else if (address.toLowerCase() === agreement.playerWalletAddress.toLowerCase()) role = 'player';
            else if (address.toLowerCase() === agreement.attorneyWalletAddress.toLowerCase()) role = 'attorney';

            if (role) {
                await submitSignature(id, role, sig as string, address);
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

    if (loading) return <div className="p-24 flex justify-center"><Loader className="animate-spin" /></div>;
    if (!agreement) return <div className="p-24 text-center">Agreement not found.</div>;

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
                    <h1 className="text-4xl font-serif font-light tracking-tight">Contract Details</h1>
                    <p className="text-muted-foreground mt-2 font-mono text-sm">ID: {agreement._id}</p>
                </div>
                <Badge variant="outline" className="px-4 py-2 text-sm">
                    {agreement.status.replace('_', ' ').toUpperCase()}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="glass-panel p-6">
                        <h3 className="font-semibold mb-4">Agreement Information</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Player</p>
                                <p className="font-mono text-sm break-all">{agreement.playerWalletAddress}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Club</p>
                                <p className="font-mono text-sm break-all">{agreement.clubWalletAddress}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Attorney</p>
                                <p className="font-mono text-sm break-all">{agreement.attorneyWalletAddress}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Token URI</p>
                                <a href={agreement.tokenURI} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                                    {agreement.tokenURI}
                                </a>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Caution Amount</p>
                                <p className="font-semibold">{formatUnits(BigInt(agreement.cautionAmount), 6)} USDC</p>
                            </div>
                        </div>
                    </Card>

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
                    <Card className="glass-panel p-6">
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
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {signStatus === 'awaiting_wallet' ? <Loader className="w-4 h-4 animate-spin" /> : null}
                                    Sign Agreement
                                </button>
                                {signError && <p className="text-xs text-destructive mt-2">{signError}</p>}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
