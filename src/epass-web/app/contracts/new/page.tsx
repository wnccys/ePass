'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useConnection } from "wagmi";
import { useForm } from "@tanstack/react-form";
import { createAgreement } from "@/app/actions/agreements";
import { parseUnits } from "viem";
import { Loader, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { contractSchema } from "@/lib/validations";

export default function NewContractPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { address } = useConnection();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const form = useForm({
        defaultValues: {
            playerWalletAddress: "",
            attorneyWalletAddress: "",
            tokenURI: "",
            cautionAmountUSDC: "",
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            setError("");

            try {
                // Convert USDC to wei (6 decimals)
                const cautionAmount = parseUnits(value.cautionAmountUSDC, 6).toString();

                // Calculate deadline (24 hours from now)
                const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

                if (!address) {
                    throw new Error("You must connect your wallet to propose a contract");
                }

                const res = await createAgreement({
                    ...value,
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
        },
    });

    if (session?.user?.role !== 'club') {
        return <div className="p-24 text-center">Only clubs can propose contracts.</div>;
    }

    return (
        <div className="container max-w-3xl mx-auto py-24 px-6">
            <FadeIn>
                <div className="mb-8">
                    <h1 className="text-4xl font-serif font-light tracking-tight">Propose Contract</h1>
                    <p className="text-muted-foreground mt-2">Draft a new image rights agreement to be signed via EIP-712.</p>
                </div>

                <Card className="glass-panel p-8 md:p-12 rounded-3xl border-none">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="space-y-8"
                    >
                        <div className="space-y-6">
                            <form.Field
                                name="playerWalletAddress"
                                validators={{
                                    onChange: ({ value }) => {
                                        const res = contractSchema.shape.playerWalletAddress.safeParse(value);
                                        return res.success ? undefined : res.error.issues?.[0]?.message || "Invalid input";
                                    }
                                }}
                                children={(field) => (
                                    <div className="space-y-2">
                                        <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">Player Wallet Address</label>
                                        <div className="glass-input rounded-2xl px-4 py-3 flex items-center">
                                            <input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="0x..."
                                                className="bg-transparent flex-1 outline-none text-foreground font-mono text-sm"
                                                required
                                            />
                                        </div>
                                        {field.state.meta.errors.length > 0 && (
                                            <p className="text-xs text-destructive ml-1">
                                                {field.state.meta.errors.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />

                            <form.Field
                                name="attorneyWalletAddress"
                                validators={{
                                    onChange: ({ value }) => {
                                        const res = contractSchema.shape.attorneyWalletAddress.safeParse(value);
                                        return res.success ? undefined : res.error.issues?.[0]?.message || "Invalid input";
                                    }
                                }}
                                children={(field) => (
                                    <div className="space-y-2">
                                        <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">Attorney Wallet Address</label>
                                        <div className="glass-input rounded-2xl px-4 py-3 flex items-center">
                                            <input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="0x..."
                                                className="bg-transparent flex-1 outline-none text-foreground font-mono text-sm"
                                                required
                                            />
                                        </div>
                                        {field.state.meta.errors.length > 0 && (
                                            <p className="text-xs text-destructive ml-1">
                                                {field.state.meta.errors.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />

                            <form.Field
                                name="tokenURI"
                                validators={{
                                    onChange: ({ value }) => {
                                        const res = contractSchema.shape.tokenURI.safeParse(value);
                                        return res.success ? undefined : res.error.issues?.[0]?.message || "Invalid input";
                                    }
                                }}
                                children={(field) => (
                                    <div className="space-y-2">
                                        <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">Token URI (Legal Docs)</label>
                                        <div className="glass-input rounded-2xl px-4 py-3 flex items-center">
                                            <input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="ipfs://..."
                                                className="bg-transparent flex-1 outline-none text-foreground font-mono text-sm"
                                                required
                                            />
                                        </div>
                                        {field.state.meta.errors.length > 0 && (
                                            <p className="text-xs text-destructive ml-1">
                                                {field.state.meta.errors.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />

                            <form.Field
                                name="cautionAmountUSDC"
                                validators={{
                                    onChange: ({ value }) => {
                                        const res = contractSchema.shape.cautionAmountUSDC.safeParse(value);
                                        return res.success ? undefined : res.error.issues?.[0]?.message || "Invalid input";
                                    }
                                }}
                                children={(field) => (
                                    <div className="space-y-2">
                                        <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">Caution Amount (USDC)</label>
                                        <div className="glass-input rounded-2xl px-4 py-3 flex items-center">
                                            <input
                                                id={field.name}
                                                name={field.name}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="1000.00"
                                                className="bg-transparent flex-1 outline-none text-foreground"
                                                required
                                            />
                                        </div>
                                        {field.state.meta.errors.length > 0 && (
                                            <p className="text-xs text-destructive ml-1">
                                                {field.state.meta.errors.join(', ')}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground ml-1">This amount will be locked in the RightsVault.</p>
                                    </div>
                                )}
                            />
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
