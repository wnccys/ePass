'use client';

import { isAddress } from 'viem';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useConnection } from "wagmi";
import { createAgreement } from "@/app/actions/agreements";
import { parseUnits } from "viem";
import { Loader, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";

export default function NewContractPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { address } = useConnection();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        playerWalletAddress: "",
        attorneyWalletAddress: "",
        tokenURI: "",
        cautionAmountUSDC: "",
    });

    if (session?.user?.role !== 'club') {
        return <div className="p-24 text-center">Only clubs can propose contracts.</div>;
    }

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            // Basic validation
            if (!isAddress(formData.playerWalletAddress)) {
                throw new Error("Invalid Player Wallet Address");
            }

            if (!isAddress(formData.attorneyWalletAddress)) {
                throw new Error("Invalid Attorney Wallet Address");
            }
            if (!formData.tokenURI) {
                throw new Error("Token URI is required");
            }
            if (!formData.cautionAmountUSDC || isNaN(Number(formData.cautionAmountUSDC))) {
                throw new Error("Invalid Caution Amount");
            }

            // Convert USDC to wei (6 decimals)
            const cautionAmount = parseUnits(formData.cautionAmountUSDC, 6).toString();

            // Calculate deadline (24 hours from now)
            const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            if (!address) {
                throw new Error("You must connect your wallet to propose a contract");
            }

            const res = await createAgreement({
                ...formData,
                cautionAmount,
                nonce: 0, // In MVP we use nonce 0, then increment for multiple contracts
                deadline,
                clubWalletAddress: address,
            });

            if (!res.success) {
                throw new Error(res.error || "Failed to create agreement");
            }

            router.push(`/contracts/${res.agreementId}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container max-w-3xl mx-auto py-24 px-6">
            <FadeIn>
                <div className="mb-8">
                    <h1 className="text-4xl font-serif font-light tracking-tight">Propose Contract</h1>
                    <p className="text-muted-foreground mt-2">Draft a new image rights agreement to be signed via EIP-712.</p>
                </div>

                <Card className="glass-panel p-8 md:p-12 rounded-3xl border-none">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground ml-1">Player Wallet Address</label>
                                <div className="glass-input rounded-2xl px-4 py-3 flex items-center">
                                    <input
                                        value={formData.playerWalletAddress}
                                        onChange={(e) => setFormData({ ...formData, playerWalletAddress: e.target.value })}
                                        placeholder="0x..."
                                        className="bg-transparent flex-1 outline-none text-foreground font-mono text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground ml-1">Attorney Wallet Address</label>
                                <div className="glass-input rounded-2xl px-4 py-3 flex items-center">
                                    <input
                                        value={formData.attorneyWalletAddress}
                                        onChange={(e) => setFormData({ ...formData, attorneyWalletAddress: e.target.value })}
                                        placeholder="0x..."
                                        className="bg-transparent flex-1 outline-none text-foreground font-mono text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground ml-1">Token URI (Legal Docs)</label>
                                <div className="glass-input rounded-2xl px-4 py-3 flex items-center">
                                    <input
                                        value={formData.tokenURI}
                                        onChange={(e) => setFormData({ ...formData, tokenURI: e.target.value })}
                                        placeholder="ipfs://..."
                                        className="bg-transparent flex-1 outline-none text-foreground font-mono text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground ml-1">Caution Amount (USDC)</label>
                                <div className="glass-input rounded-2xl px-4 py-3 flex items-center">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.cautionAmountUSDC}
                                        onChange={(e) => setFormData({ ...formData, cautionAmountUSDC: e.target.value })}
                                        placeholder="1000.00"
                                        className="bg-transparent flex-1 outline-none text-foreground"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground ml-1">This amount will be locked in the RightsVault.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-xl">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : null}
                            Create Draft Agreement
                        </button>
                    </form>
                </Card>
            </FadeIn>
        </div>
    );
}
