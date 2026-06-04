'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useConnection } from "wagmi";
import { useForm } from "@tanstack/react-form";
import { createAgreement } from "@/app/actions/agreements";
import { uploadToIPFS } from "@/app/actions/ipfs";
import { parseUnits } from "viem";
import { Loader, AlertCircle, UploadCloud, CheckCircle2, Trash2, Copy, Check, ExternalLink, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { contractSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

export default function NewContractPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { address } = useConnection();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // IPFS Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        defaultValues: {
            title: "",
            description: "",
            playerWalletAddress: "",
            playerEmail: "",
            attorneyWalletAddress: "",
            attorneyEmail: "",
            tokenURI: "",
            cautionAmountUSDC: "",
            tokenName: "",
            tokenSymbol: "",
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
                    nonce: Math.floor(Math.random() * 1000000000), // Random salt to prevent hash collisions and sequential blocking
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

    const prefilledRef = useRef(false);
    useEffect(() => {
        if (prefilledRef.current) return;
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const prefillStr = urlParams.get("prefill");
            if (prefillStr) {
                try {
                    const decodedJSON = decodeURIComponent(escape(window.atob(prefillStr)));
                    const decoded = JSON.parse(decodedJSON);
                    
                    if (decoded.title) form.setFieldValue("title", decoded.title);
                    if (decoded.description) form.setFieldValue("description", decoded.description);
                    if (decoded.playerWalletAddress) form.setFieldValue("playerWalletAddress", decoded.playerWalletAddress);
                    if (decoded.playerEmail) form.setFieldValue("playerEmail", decoded.playerEmail);
                    if (decoded.attorneyWalletAddress) form.setFieldValue("attorneyWalletAddress", decoded.attorneyWalletAddress);
                    if (decoded.attorneyEmail) form.setFieldValue("attorneyEmail", decoded.attorneyEmail);
                    if (decoded.tokenURI) form.setFieldValue("tokenURI", decoded.tokenURI);
                    if (decoded.cautionAmountUSDC) form.setFieldValue("cautionAmountUSDC", decoded.cautionAmountUSDC);
                    if (decoded.tokenName) form.setFieldValue("tokenName", decoded.tokenName);
                    if (decoded.tokenSymbol) form.setFieldValue("tokenSymbol", decoded.tokenSymbol);
                    prefilledRef.current = true;
                } catch (e) {
                    console.error("Failed to decode prefill params in useEffect:", e);
                }
            } else {
                prefilledRef.current = true;
            }
        }
    }, [form]);

    const handleFileUpload = async (file: File, handleChange: (value: string) => void) => {
        if (!file) return;

        // Check file type
        if (file.type !== "application/pdf") {
            setUploadError("Only PDF files are supported.");
            return;
        }

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError("Max file size is 5MB.");
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const res = await uploadToIPFS(file);
            if (res.success && res.ipfsUrl) {
                handleChange(res.ipfsUrl);
                setUploadedFileName(file.name);
            } else {
                setUploadError(res.error || "Failed to upload file to IPFS.");
            }
        } catch (err: any) {
            setUploadError(err.message || "Failed to upload file to IPFS.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleResetUpload = (handleChange: (value: string) => void) => {
        handleChange("");
        setUploadedFileName(null);
        setUploadError(null);
    };

    if (session?.user?.role !== 'club') {
        return <div className="p-24 text-center">Only clubs can propose contracts.</div>;
    }

    return (
        <div className="container max-w-5xl mx-auto py-24 px-6">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            {/* Left Column: Form Fields */}
                            <div className="space-y-6">
                                <form.Field
                                    name="title"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res = contractSchema.shape.title.safeParse(value);
                                            return res.success ? undefined : res.error.issues?.[0]?.message || "Invalid input";
                                        }
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">Contract Title</label>
                                            <div className="glass-input rounded-2xl px-4 py-3 flex items-center">
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value ?? ""}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="e.g. Image Rights Agreement 2026"
                                                    className="bg-transparent flex-1 outline-none text-foreground text-sm"
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
                                    name="description"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res = contractSchema.shape.description.safeParse(value);
                                            return res.success ? undefined : res.error.issues?.[0]?.message || "Invalid input";
                                        }
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">Description</label>
                                            <div className="glass-input rounded-2xl px-4 py-3 flex items-start">
                                                <textarea
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value ?? ""}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="Describe the terms, duration, and specific parameters of the contract..."
                                                    className="bg-transparent flex-1 outline-none text-foreground text-sm resize-none h-24"
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
                                                    value={field.state.value ?? ""}
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
                                    name="playerEmail"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res = contractSchema.shape.playerEmail.safeParse(value);
                                            return res.success ? undefined : res.error.issues?.[0]?.message || "Invalid input";
                                        }
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">Player Email</label>
                                            <div className="glass-input rounded-2xl px-4 py-3 flex items-center">
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="email"
                                                    value={field.state.value ?? ""}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="player@example.com"
                                                    className="bg-transparent flex-1 outline-none text-foreground text-sm"
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
                                                    value={field.state.value ?? ""}
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
                                    name="attorneyEmail"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res = contractSchema.shape.attorneyEmail.safeParse(value);
                                            return res.success ? undefined : res.error.issues?.[0]?.message || "Invalid input";
                                        }
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">Attorney Email</label>
                                            <div className="glass-input rounded-2xl px-4 py-3 flex items-center">
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="email"
                                                    value={field.state.value ?? ""}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="attorney@example.com"
                                                    className="bg-transparent flex-1 outline-none text-foreground text-sm"
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
                                                    value={field.state.value ?? ""}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="1000.00"
                                                    className="bg-transparent flex-1 outline-none text-foreground text-sm"
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

                                <form.Field
                                    name="tokenName"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res = contractSchema.shape.tokenName.safeParse(value);
                                            return res.success ? undefined : res.error.issues?.[0]?.message || "Invalid input";
                                        }
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">Rights Token Name</label>
                                            <div className="glass-input rounded-2xl px-4 py-3 flex items-center">
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value ?? ""}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="e.g. PlayerRights"
                                                    className="bg-transparent flex-1 outline-none text-foreground text-sm"
                                                    required
                                                    maxLength={10}
                                                />
                                            </div>
                                            {field.state.meta.errors.length > 0 && (
                                                <p className="text-xs text-destructive ml-1">
                                                    {field.state.meta.errors.join(', ')}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground ml-1">The name of the rights fractionalized ERC20 token (max 10 chars, no spaces).</p>
                                        </div>
                                    )}
                                />

                                <form.Field
                                    name="tokenSymbol"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res = contractSchema.shape.tokenSymbol.safeParse(value);
                                            return res.success ? undefined : res.error.issues?.[0]?.message || "Invalid input";
                                        }
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">Rights Token Symbol</label>
                                            <div className="glass-input rounded-2xl px-4 py-3 flex items-center gap-1.5">
                                                <span className="text-muted-foreground font-semibold font-mono text-sm">$</span>
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={(field.state.value ?? "").replace(/^\$/, "")}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => {
                                                        let val = e.target.value;
                                                        // Strip spaces and special chars, uppercase
                                                        val = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                                                        if (val.length > 9) val = val.slice(0, 9);
                                                        field.handleChange(val ? '$' + val : '');
                                                    }}
                                                    placeholder="TOKEN_E"
                                                    className="bg-transparent flex-1 outline-none text-foreground text-sm font-mono uppercase"
                                                    required
                                                />
                                            </div>
                                            {field.state.meta.errors.length > 0 && (
                                                <p className="text-xs text-destructive ml-1">
                                                    {field.state.meta.errors.join(', ')}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground ml-1">The symbol for the ERC20 rights token (max 10 chars including $, no spaces).</p>
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Right Column: IPFS Upload Section */}
                            <div className="space-y-6 relative z-30">
                                <form.Field
                                    name="tokenURI"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res = contractSchema.shape.tokenURI.safeParse(value);
                                            return res.success ? undefined : res.error.issues?.[0]?.message || "Invalid input";
                                        }
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2 flex flex-col h-full justify-between">
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-2 select-none">
                                                    <label className="text-sm font-medium text-foreground ml-1 block">
                                                        Contract Document (PDF)
                                                    </label>
                                                    <div className="relative inline-block group z-40">
                                                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3.5 rounded-2xl bg-card/95 backdrop-blur-md border border-foreground/10 text-[11px] text-muted-foreground shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 origin-top z-[9999] leading-relaxed text-center">
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-card/95" />
                                                            <span className="font-semibold text-foreground block mb-1 text-xs">Decentralized IPFS Storage</span>
                                                            Your contract PDF is cryptographically hashed and uploaded to Pinata IPFS, ensuring tamper-proof, permanent, and decentralized hosting.
                                                        </div>
                                                    </div>
                                                </div>

                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            await handleFileUpload(file, field.handleChange);
                                                        }
                                                    }}
                                                    accept="application/pdf"
                                                    className="hidden"
                                                />

                                                {/* Upload Drag & Drop Area */}
                                                {!field.state.value && !isUploading ? (
                                                    <div
                                                        className={cn(
                                                            "relative rounded-2xl border-2 border-dashed p-8 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-center cursor-pointer min-h-[220px] group bg-card/5",
                                                            isDragging
                                                                ? "border-primary bg-primary/5 scale-[1.02]"
                                                                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-card/10",
                                                            field.state.meta.errors.length > 0 ? "border-destructive/50 bg-destructive/5" : ""
                                                        )}
                                                        onClick={() => fileInputRef.current?.click()}
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            setIsDragging(true);
                                                        }}
                                                        onDragLeave={() => {
                                                            setIsDragging(false);
                                                        }}
                                                        onDrop={async (e) => {
                                                            e.preventDefault();
                                                            setIsDragging(false);
                                                            const file = e.dataTransfer.files?.[0];
                                                            if (file) {
                                                                await handleFileUpload(file, field.handleChange);
                                                            }
                                                        }}
                                                    >
                                                        <div className="p-4 bg-primary/10 rounded-full text-primary transition-transform duration-300 group-hover:scale-110">
                                                            <UploadCloud className="w-8 h-8" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-semibold text-foreground">
                                                                Drag & drop contract PDF here
                                                            </p>
                                                            <p className="text-xs text-primary underline font-medium">
                                                                or click to browse files
                                                            </p>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Only PDF format is supported (Max 5MB)
                                                        </p>
                                                    </div>
                                                ) : isUploading ? (
                                                    <div className="rounded-2xl border border-muted-foreground/10 p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[220px] bg-card/5">
                                                        <Loader className="w-8 h-8 animate-spin text-primary" />
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-semibold text-foreground">
                                                                Uploading contract to IPFS...
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Securing your document on Pinata storage
                                                            </p>
                                                        </div>
                                                        <div className="w-full max-w-[200px] h-1 bg-muted rounded-full overflow-hidden mt-2">
                                                            <div className="h-full bg-primary animate-pulse w-full rounded-full" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Success State */
                                                    <div className="rounded-2xl border border-emerald-500/20 p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[220px] bg-emerald-500/5">
                                                        <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500">
                                                            <CheckCircle2 className="w-8 h-8 animate-bounce" />
                                                        </div>
                                                        <div className="space-y-1 w-full max-w-xs">
                                                            <p className="text-sm font-semibold text-foreground truncate">
                                                                {uploadedFileName || "contract.pdf"}
                                                            </p>
                                                            <p className="text-xs text-emerald-500 font-medium">
                                                                Successfully uploaded to IPFS!
                                                            </p>
                                                        </div>

                                                        <div className="w-full space-y-3">
                                                            <div className="glass-input rounded-xl p-3 flex items-center justify-between gap-3 text-left w-full">
                                                                <span className="text-xs font-mono text-muted-foreground truncate flex-1">
                                                                    {field.state.value}
                                                                </span>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigator.clipboard.writeText(field.state.value);
                                                                            setIsCopied(true);
                                                                            setTimeout(() => setIsCopied(false), 2000);
                                                                        }}
                                                                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                                        title="Copy IPFS URI"
                                                                    >
                                                                        {isCopied ? (
                                                                            <Check className="w-4 h-4 text-emerald-500" />
                                                                        ) : (
                                                                            <Copy className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                    <a
                                                                        href={field.state.value.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                                        title="View Document"
                                                                    >
                                                                        <ExternalLink className="w-4 h-4" />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleResetUpload(field.handleChange);
                                                                }}
                                                                className="text-xs text-destructive hover:text-destructive/80 font-medium flex items-center justify-center gap-1.5 mx-auto py-1 px-3 rounded-full hover:bg-destructive/10 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Replace Document
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {uploadError && (
                                                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-3 rounded-xl mt-2">
                                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                                    {uploadError}
                                                </div>
                                            )}

                                            {field.state.meta.errors.length > 0 && (
                                                <p className="text-xs text-destructive ml-1 mt-1">
                                                    Please upload a contract document to IPFS.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border/20">
                            {error && (
                                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-xl mb-4">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : null}
                                Create Draft Agreement
                            </button>
                        </div>
                    </form>
                </Card>
            </FadeIn>
        </div>
    );
}
