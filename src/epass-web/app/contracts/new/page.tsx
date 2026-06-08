"use client";

import { useForm } from "@tanstack/react-form";
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Copy,
    ExternalLink,
    HelpCircle,
    Loader,
    Trash2,
    UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseUnits } from "viem";
import { useConnection } from "wagmi";
import { createAgreement } from "@/app/actions/agreements";
import { uploadToIPFS } from "@/app/actions/ipfs";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { cn } from "@/lib/utils";
import { contractSchema } from "@/lib/validations";

export default function NewContractPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { data: session } = useSession();
    const { address } = useConnection();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // IPFS Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(
        null,
    );
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
                const cautionAmount = parseUnits(
                    value.cautionAmountUSDC,
                    6,
                ).toString();

                // Calculate deadline (24 hours from now)
                const deadline = new Date(
                    Date.now() + 24 * 60 * 60 * 1000,
                ).toISOString();

                if (!address) {
                    throw new Error(t("contracts.new.walletError"));
                }

                const res = await createAgreement({
                    ...value,
                    cautionAmount,
                    nonce: Math.floor(Math.random() * 1000000000), // Random salt to prevent hash collisions and sequential blocking
                    deadline,
                    clubWalletAddress: address,
                });

                if (!res.success) {
                    throw new Error(
                        res.error || t("contracts.new.failedCreate"),
                    );
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
                    const decodedJSON = decodeURIComponent(
                        escape(window.atob(prefillStr)),
                    );
                    const decoded = JSON.parse(decodedJSON);

                    if (decoded.title)
                        form.setFieldValue("title", decoded.title);
                    if (decoded.description)
                        form.setFieldValue("description", decoded.description);
                    if (decoded.playerWalletAddress)
                        form.setFieldValue(
                            "playerWalletAddress",
                            decoded.playerWalletAddress,
                        );
                    if (decoded.playerEmail)
                        form.setFieldValue("playerEmail", decoded.playerEmail);
                    if (decoded.attorneyWalletAddress)
                        form.setFieldValue(
                            "attorneyWalletAddress",
                            decoded.attorneyWalletAddress,
                        );
                    if (decoded.attorneyEmail)
                        form.setFieldValue(
                            "attorneyEmail",
                            decoded.attorneyEmail,
                        );
                    if (decoded.tokenURI)
                        form.setFieldValue("tokenURI", decoded.tokenURI);
                    if (decoded.cautionAmountUSDC)
                        form.setFieldValue(
                            "cautionAmountUSDC",
                            decoded.cautionAmountUSDC,
                        );
                    if (decoded.tokenName)
                        form.setFieldValue("tokenName", decoded.tokenName);
                    if (decoded.tokenSymbol)
                        form.setFieldValue("tokenSymbol", decoded.tokenSymbol);
                    prefilledRef.current = true;
                } catch (e) {
                    console.error(
                        "Failed to decode prefill params in useEffect:",
                        e,
                    );
                }
            } else {
                prefilledRef.current = true;
            }
        }
    }, [form]);

    const handleFileUpload = async (
        file: File,
        handleChange: (value: string) => void,
    ) => {
        if (!file) return;

        // Check file type
        if (file.type !== "application/pdf") {
            setUploadError(t("contracts.new.pdfError"));
            return;
        }

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError(t("contracts.new.sizeError"));
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
                setUploadError(res.error || t("contracts.new.ipfsFail"));
            }
        } catch (err: any) {
            setUploadError(err.message || t("contracts.new.ipfsFail"));
        } finally {
            setIsUploading(false);
        }
    };

    const handleResetUpload = (handleChange: (value: string) => void) => {
        handleChange("");
        setUploadedFileName(null);
        setUploadError(null);
    };

    if (session?.user?.role !== "club") {
        return (
            <div className="p-24 text-center">
                {t("contracts.new.onlyClubsCanPropose")}
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-5xl px-6 py-24">
            <FadeIn>
                <div className="mb-8">
                    <h1 className="font-light font-serif text-4xl tracking-tight">
                        {t("contracts.new.title")}
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        {t("contracts.new.subtitle")}
                    </p>
                </div>

                <Card className="glass-panel rounded-3xl border-none p-8 md:p-12">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
                            {/* Left Column: Form Fields */}
                            <div className="space-y-6">
                                <form.Field
                                    name="title"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res =
                                                contractSchema.shape.title.safeParse(
                                                    value,
                                                );
                                            return res.success
                                                ? undefined
                                                : res.error.issues?.[0]
                                                      ?.message ||
                                                      "Invalid input";
                                        },
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={field.name}
                                                className="ml-1 font-medium text-foreground text-sm"
                                            >
                                                {t(
                                                    "contracts.new.contractTitle",
                                                )}
                                            </label>
                                            <div className="glass-input flex items-center rounded-2xl px-4 py-3">
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={
                                                        field.state.value ?? ""
                                                    }
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) =>
                                                        field.handleChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g. Image Rights Agreement 2026"
                                                    className="flex-1 bg-transparent text-foreground text-sm outline-none"
                                                    required
                                                />
                                            </div>
                                            {field.state.meta.errors.length >
                                                0 && (
                                                <p className="ml-1 text-destructive text-xs">
                                                    {field.state.meta.errors.join(
                                                        ", ",
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />

                                <form.Field
                                    name="description"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res =
                                                contractSchema.shape.description.safeParse(
                                                    value,
                                                );
                                            return res.success
                                                ? undefined
                                                : res.error.issues?.[0]
                                                      ?.message ||
                                                      "Invalid input";
                                        },
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={field.name}
                                                className="ml-1 font-medium text-foreground text-sm"
                                            >
                                                {t("contracts.new.description")}
                                            </label>
                                            <div className="glass-input flex items-start rounded-2xl px-4 py-3">
                                                <textarea
                                                    id={field.name}
                                                    name={field.name}
                                                    value={
                                                        field.state.value ?? ""
                                                    }
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) =>
                                                        field.handleChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Describe the terms, duration, and specific parameters of the contract..."
                                                    className="h-24 flex-1 resize-none bg-transparent text-foreground text-sm outline-none"
                                                    required
                                                />
                                            </div>
                                            {field.state.meta.errors.length >
                                                0 && (
                                                <p className="ml-1 text-destructive text-xs">
                                                    {field.state.meta.errors.join(
                                                        ", ",
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />

                                <form.Field
                                    name="playerWalletAddress"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res =
                                                contractSchema.shape.playerWalletAddress.safeParse(
                                                    value,
                                                );
                                            return res.success
                                                ? undefined
                                                : res.error.issues?.[0]
                                                      ?.message ||
                                                      "Invalid input";
                                        },
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={field.name}
                                                className="ml-1 font-medium text-foreground text-sm"
                                            >
                                                {t(
                                                    "contracts.new.playerAddress",
                                                )}
                                            </label>
                                            <div className="glass-input flex items-center rounded-2xl px-4 py-3">
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={
                                                        field.state.value ?? ""
                                                    }
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) =>
                                                        field.handleChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="0x..."
                                                    className="flex-1 bg-transparent font-mono text-foreground text-sm outline-none"
                                                    required
                                                />
                                            </div>
                                            {field.state.meta.errors.length >
                                                0 && (
                                                <p className="ml-1 text-destructive text-xs">
                                                    {field.state.meta.errors.join(
                                                        ", ",
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />

                                <form.Field
                                    name="playerEmail"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res =
                                                contractSchema.shape.playerEmail.safeParse(
                                                    value,
                                                );
                                            return res.success
                                                ? undefined
                                                : res.error.issues?.[0]
                                                      ?.message ||
                                                      "Invalid input";
                                        },
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={field.name}
                                                className="ml-1 font-medium text-foreground text-sm"
                                            >
                                                {t("contracts.new.playerEmail")}
                                            </label>
                                            <div className="glass-input flex items-center rounded-2xl px-4 py-3">
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="email"
                                                    value={
                                                        field.state.value ?? ""
                                                    }
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) =>
                                                        field.handleChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="player@example.com"
                                                    className="flex-1 bg-transparent text-foreground text-sm outline-none"
                                                    required
                                                />
                                            </div>
                                            {field.state.meta.errors.length >
                                                0 && (
                                                <p className="ml-1 text-destructive text-xs">
                                                    {field.state.meta.errors.join(
                                                        ", ",
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />

                                <form.Field
                                    name="attorneyWalletAddress"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res =
                                                contractSchema.shape.attorneyWalletAddress.safeParse(
                                                    value,
                                                );
                                            return res.success
                                                ? undefined
                                                : res.error.issues?.[0]
                                                      ?.message ||
                                                      "Invalid input";
                                        },
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={field.name}
                                                className="ml-1 font-medium text-foreground text-sm"
                                            >
                                                {t(
                                                    "contracts.new.attorneyAddress",
                                                )}
                                            </label>
                                            <div className="glass-input flex items-center rounded-2xl px-4 py-3">
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={
                                                        field.state.value ?? ""
                                                    }
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) =>
                                                        field.handleChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="0x..."
                                                    className="flex-1 bg-transparent font-mono text-foreground text-sm outline-none"
                                                    required
                                                />
                                            </div>
                                            {field.state.meta.errors.length >
                                                0 && (
                                                <p className="ml-1 text-destructive text-xs">
                                                    {field.state.meta.errors.join(
                                                        ", ",
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />

                                <form.Field
                                    name="attorneyEmail"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res =
                                                contractSchema.shape.attorneyEmail.safeParse(
                                                    value,
                                                );
                                            return res.success
                                                ? undefined
                                                : res.error.issues?.[0]
                                                      ?.message ||
                                                      "Invalid input";
                                        },
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={field.name}
                                                className="ml-1 font-medium text-foreground text-sm"
                                            >
                                                {t(
                                                    "contracts.new.attorneyEmail",
                                                )}
                                            </label>
                                            <div className="glass-input flex items-center rounded-2xl px-4 py-3">
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="email"
                                                    value={
                                                        field.state.value ?? ""
                                                    }
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) =>
                                                        field.handleChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="attorney@example.com"
                                                    className="flex-1 bg-transparent text-foreground text-sm outline-none"
                                                    required
                                                />
                                            </div>
                                            {field.state.meta.errors.length >
                                                0 && (
                                                <p className="ml-1 text-destructive text-xs">
                                                    {field.state.meta.errors.join(
                                                        ", ",
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />

                                <form.Field
                                    name="cautionAmountUSDC"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res =
                                                contractSchema.shape.cautionAmountUSDC.safeParse(
                                                    value,
                                                );
                                            return res.success
                                                ? undefined
                                                : res.error.issues?.[0]
                                                      ?.message ||
                                                      "Invalid input";
                                        },
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={field.name}
                                                className="ml-1 font-medium text-foreground text-sm"
                                            >
                                                {t(
                                                    "contracts.new.cautionAmount",
                                                )}
                                            </label>
                                            <div className="glass-input flex items-center rounded-2xl px-4 py-3">
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={
                                                        field.state.value ?? ""
                                                    }
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) =>
                                                        field.handleChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="1000.00"
                                                    className="flex-1 bg-transparent text-foreground text-sm outline-none"
                                                    required
                                                />
                                            </div>
                                            {field.state.meta.errors.length >
                                                0 && (
                                                <p className="ml-1 text-destructive text-xs">
                                                    {field.state.meta.errors.join(
                                                        ", ",
                                                    )}
                                                </p>
                                            )}
                                            <p className="ml-1 text-muted-foreground text-xs">
                                                {t(
                                                    "contracts.new.cautionLockExplanation",
                                                )}
                                            </p>
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Right Column: IPFS Upload Section */}
                            <div className="relative z-30 space-y-6">
                                <form.Field
                                    name="tokenURI"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res =
                                                contractSchema.shape.tokenURI.safeParse(
                                                    value,
                                                );
                                            return res.success
                                                ? undefined
                                                : res.error.issues?.[0]
                                                      ?.message ||
                                                      "Invalid input";
                                        },
                                    }}
                                    children={(field) => (
                                        <div className="flex h-full flex-col justify-between space-y-2">
                                            <div>
                                                <div className="mb-2 flex select-none items-center gap-1.5">
                                                    <label className="ml-1 block font-medium text-foreground text-sm">
                                                        {t(
                                                            "contracts.new.contractDocument",
                                                        )}
                                                    </label>
                                                    <div className="group relative z-40 inline-block">
                                                        <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground transition-colors hover:text-foreground" />
                                                        <div className="pointer-events-none absolute top-full left-1/2 z-[9999] mt-2 w-64 origin-top -translate-x-1/2 scale-95 rounded-2xl border border-foreground/10 bg-card/95 p-3.5 text-center text-[11px] text-muted-foreground leading-relaxed opacity-0 shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-card/95" />
                                                            <span className="mb-1 block font-semibold text-foreground text-xs">
                                                                {t(
                                                                    "contracts.new.ipfsStorage",
                                                                )}
                                                            </span>
                                                            {t(
                                                                "contracts.new.ipfsHelpText",
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={async (e) => {
                                                        const file =
                                                            e.target.files?.[0];
                                                        if (file) {
                                                            await handleFileUpload(
                                                                file,
                                                                field.handleChange,
                                                            );
                                                        }
                                                    }}
                                                    accept="application/pdf"
                                                    className="hidden"
                                                />

                                                {/* Upload Drag & Drop Area */}
                                                {!field.state.value &&
                                                !isUploading ? (
                                                    <div
                                                        className={cn(
                                                            "group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-card/5 p-8 text-center transition-all duration-300",
                                                            isDragging
                                                                ? "scale-[1.02] border-primary bg-primary/5"
                                                                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-card/10",
                                                            field.state.meta
                                                                .errors.length >
                                                                0
                                                                ? "border-destructive/50 bg-destructive/5"
                                                                : "",
                                                        )}
                                                        onClick={() =>
                                                            fileInputRef.current?.click()
                                                        }
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            setIsDragging(true);
                                                        }}
                                                        onDragLeave={() => {
                                                            setIsDragging(
                                                                false,
                                                            );
                                                        }}
                                                        onDrop={async (e) => {
                                                            e.preventDefault();
                                                            setIsDragging(
                                                                false,
                                                            );
                                                            const file =
                                                                e.dataTransfer
                                                                    .files?.[0];
                                                            if (file) {
                                                                await handleFileUpload(
                                                                    file,
                                                                    field.handleChange,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <div className="rounded-full bg-primary/10 p-4 text-primary transition-transform duration-300 group-hover:scale-110">
                                                            <UploadCloud className="h-8 w-8" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-semibold text-foreground text-sm">
                                                                {t(
                                                                    "contracts.new.dragDrop",
                                                                )}
                                                            </p>
                                                            <p className="font-medium text-primary text-xs underline">
                                                                {t(
                                                                    "contracts.new.browse",
                                                                )}
                                                            </p>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {t(
                                                                "contracts.new.pdfOnly",
                                                            )}
                                                        </p>
                                                    </div>
                                                ) : isUploading ? (
                                                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-2xl border border-muted-foreground/10 bg-card/5 p-8 text-center">
                                                        <Loader className="h-8 w-8 animate-spin text-primary" />
                                                        <div className="space-y-1">
                                                            <p className="font-semibold text-foreground text-sm">
                                                                {t(
                                                                    "contracts.new.uploading",
                                                                )}
                                                            </p>
                                                            <p className="text-muted-foreground text-xs">
                                                                {t(
                                                                    "contracts.new.securing",
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="mt-2 h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
                                                            <div className="h-full w-full animate-pulse rounded-full bg-primary" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Success State */
                                                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
                                                        <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-500">
                                                            <CheckCircle2 className="h-8 w-8 animate-bounce" />
                                                        </div>
                                                        <div className="w-full max-w-xs space-y-1">
                                                            <p className="truncate font-semibold text-foreground text-sm">
                                                                {uploadedFileName ||
                                                                    "contract.pdf"}
                                                            </p>
                                                            <p className="font-medium text-emerald-500 text-xs">
                                                                {t(
                                                                    "contracts.new.uploadSuccess",
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div className="w-full space-y-3">
                                                            <div className="glass-input flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left">
                                                                <span className="flex-1 truncate font-mono text-muted-foreground text-xs">
                                                                    {
                                                                        field
                                                                            .state
                                                                            .value
                                                                    }
                                                                </span>
                                                                <div className="flex shrink-0 items-center gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            navigator.clipboard.writeText(
                                                                                field
                                                                                    .state
                                                                                    .value,
                                                                            );
                                                                            setIsCopied(
                                                                                true,
                                                                            );
                                                                            setTimeout(
                                                                                () =>
                                                                                    setIsCopied(
                                                                                        false,
                                                                                    ),
                                                                                2000,
                                                                            );
                                                                        }}
                                                                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                                        title={t(
                                                                            "contracts.detail.copyIpfs",
                                                                        )}
                                                                    >
                                                                        {isCopied ? (
                                                                            <Check className="h-4 w-4 text-emerald-500" />
                                                                        ) : (
                                                                            <Copy className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                    <a
                                                                        href={field.state.value.replace(
                                                                            "ipfs://",
                                                                            "https://gateway.pinata.cloud/ipfs/",
                                                                        )}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(
                                                                            e,
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                                        title={t(
                                                                            "common.view",
                                                                        )}
                                                                    >
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleResetUpload(
                                                                        field.handleChange,
                                                                    );
                                                                }}
                                                                className="mx-auto flex items-center justify-center gap-1.5 rounded-full px-3 py-1 font-medium text-destructive text-xs transition-colors hover:bg-destructive/10 hover:text-destructive/80"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                {t(
                                                                    "contracts.new.replaceDoc",
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {uploadError && (
                                                <div className="mt-2 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-destructive text-xs">
                                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                                    {uploadError}
                                                </div>
                                            )}

                                            {field.state.meta.errors.length >
                                                0 && (
                                                <p className="mt-1 ml-1 text-destructive text-xs">
                                                    {t(
                                                        "contracts.new.uploadRequired",
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />

                                <form.Field
                                    name="tokenName"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res =
                                                contractSchema.shape.tokenName.safeParse(
                                                    value,
                                                );
                                            return res.success
                                                ? undefined
                                                : res.error.issues?.[0]
                                                      ?.message ||
                                                      "Invalid input";
                                        },
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={field.name}
                                                className="ml-1 font-medium text-foreground text-sm"
                                            >
                                                {t(
                                                    "contracts.new.tokenNameLabel",
                                                )}
                                            </label>
                                            <div className="glass-input flex items-center rounded-2xl px-4 py-3">
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={
                                                        field.state.value ?? ""
                                                    }
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) =>
                                                        field.handleChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g. PlayerRights"
                                                    className="flex-1 bg-transparent text-foreground text-sm outline-none"
                                                    required
                                                    maxLength={10}
                                                />
                                            </div>
                                            {field.state.meta.errors.length >
                                                0 && (
                                                <p className="ml-1 text-destructive text-xs">
                                                    {field.state.meta.errors.join(
                                                        ", ",
                                                    )}
                                                </p>
                                            )}
                                            <p className="ml-1 text-muted-foreground text-xs">
                                                {t(
                                                    "contracts.new.tokenNameHelp",
                                                )}
                                            </p>
                                        </div>
                                    )}
                                />

                                <form.Field
                                    name="tokenSymbol"
                                    validators={{
                                        onChange: ({ value }) => {
                                            const res =
                                                contractSchema.shape.tokenSymbol.safeParse(
                                                    value,
                                                );
                                            return res.success
                                                ? undefined
                                                : res.error.issues?.[0]
                                                      ?.message ||
                                                      "Invalid input";
                                        },
                                    }}
                                    children={(field) => (
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={field.name}
                                                className="ml-1 font-medium text-foreground text-sm"
                                            >
                                                {t(
                                                    "contracts.new.tokenSymbolLabel",
                                                )}
                                            </label>
                                            <div className="glass-input flex items-center gap-1.5 rounded-2xl px-4 py-3">
                                                <span className="font-mono font-semibold text-muted-foreground text-sm">
                                                    $
                                                </span>
                                                <input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={(
                                                        field.state.value ?? ""
                                                    ).replace(/^\$/, "")}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => {
                                                        let val =
                                                            e.target.value;
                                                        // Strip spaces and special chars, uppercase
                                                        val = val
                                                            .replace(
                                                                /[^A-Za-z0-9]/g,
                                                                "",
                                                            )
                                                            .toUpperCase();
                                                        if (val.length > 9)
                                                            val = val.slice(
                                                                0,
                                                                9,
                                                            );
                                                        field.handleChange(
                                                            val
                                                                ? "$" + val
                                                                : "",
                                                        );
                                                    }}
                                                    placeholder="TOKEN_E"
                                                    className="flex-1 bg-transparent font-mono text-foreground text-sm uppercase outline-none"
                                                    required
                                                />
                                            </div>
                                            {field.state.meta.errors.length >
                                                0 && (
                                                <p className="ml-1 text-destructive text-xs">
                                                    {field.state.meta.errors.join(
                                                        ", ",
                                                    )}
                                                </p>
                                            )}
                                            <p className="ml-1 text-muted-foreground text-xs">
                                                {t(
                                                    "contracts.new.tokenSymbolHelp",
                                                )}
                                            </p>
                                        </div>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="border-border/20 border-t pt-4">
                            {error && (
                                <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-destructive text-sm">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader className="h-5 w-5 animate-spin" />
                                ) : null}
                                {t("contracts.new.createDraft")}
                            </button>
                        </div>
                    </form>
                </Card>
            </FadeIn>
        </div>
    );
}
