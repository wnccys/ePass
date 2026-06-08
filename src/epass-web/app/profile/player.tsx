"use client";

import { useForm } from "@tanstack/react-form";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    Building2,
    Camera,
    CheckCircle2,
    Loader,
    Mail,
    Save,
    User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { type ProfilePayload, updateProfile } from "@/app/actions/profile";
import SiweButton from "@/components/siwe-sign";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { profileSchema } from "@/lib/validations";
import { LogoutButton } from "../home/logout-button";

export function PlayerProfile({
    user,
}: {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        bio?: string | null;
        role?: "player" | "club";
    };
}) {
    const router = useRouter();
    const { data: session, update } = useSession();
    const { t } = useTranslation();
    const [walletAddress, setWalletAddress] = useState<string | undefined>(
        undefined,
    );

    // Set wallet address if present on session and not in react state yet
    useEffect(() => {
        if (session?.user?.walletAddress && !walletAddress) {
            setWalletAddress(session.user.walletAddress as string);
        }
    }, [session?.user?.walletAddress]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{
        type: "error" | "success";
        text: string;
    } | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user?.image || null,
    );

    const form = useForm({
        defaultValues: {
            name: user?.name || "",
            bio: user?.bio || "",
            avatar: undefined as File | undefined,
        },
        validators: {
            onChange: ({ value }) => {
                const res = profileSchema.safeParse(value);
                if (res.success) return undefined;

                const errors: Record<string, string> = {};
                for (const issue of res.error.issues) {
                    const path = issue.path.join(".");
                    errors[path] = issue.message;
                }
                return errors;
            },
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            setSubmitMessage(null);

            try {
                const payload: ProfilePayload = {
                    ...(value as any),
                };
                const result = await updateProfile(payload);

                if (result.success) {
                    if (walletAddress) {
                        await update({ walletAddress });
                    } else {
                        await update();
                    }
                    setSubmitMessage({
                        type: "success",
                        text: t("profile.successMsg"),
                    });
                    form.reset(value as any);
                    router.refresh();
                } else {
                    setSubmitMessage({
                        type: "error",
                        text: result.error || t("profile.errorMsg"),
                    });
                }
            } catch (err) {
                setSubmitMessage({
                    type: "error",
                    text: t("profile.networkError"),
                });
            } finally {
                setIsSubmitting(false);
                // Clear success message after 3 seconds
                setTimeout(() => setSubmitMessage(null), 3000);
            }
        },
    });

    return (
        <Card className="relative flex min-h-screen w-full flex-1 items-center justify-center overflow-hidden rounded-none border-none px-[8em] py-12 shadow-none">
            <FadeIn className="glass-panel flex w-full flex-col gap-12 rounded-3xl p-8 md:flex-row md:p-12">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="flex w-full flex-col gap-12 md:flex-row"
                >
                    {/* LEFT COLUMN: Identity & Connections */}
                    <div className="flex w-full shrink-0 flex-col gap-8 border-foreground/10 border-b pb-8 md:w-1/3 md:border-r md:border-b-0 md:pr-12 md:pb-0">
                        <form.Field name="avatar">
                            {(field) => (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="glass-input group relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-transparent transition-all hover:border-primary/50">
                                        {avatarPreview ? (
                                            <img
                                                src={avatarPreview}
                                                alt="Avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <UserIcon className="h-12 w-12 text-muted-foreground transition-colors group-hover:text-foreground" />
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Camera className="h-8 w-8 text-foreground" />
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                            onChange={(e) => {
                                                const file =
                                                    e.target.files?.[0];
                                                if (file) {
                                                    setAvatarPreview(
                                                        URL.createObjectURL(
                                                            file,
                                                        ),
                                                    );
                                                    field.handleChange(file);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-semibold text-foreground">
                                            {user?.name || t("common.name")}
                                        </h3>
                                        <p className="text-muted-foreground text-xs">
                                            {t("profile.clickToUpload")}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </form.Field>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                                {t("profile.connectedAccounts")}
                            </h4>

                            <div className="glass-input flex items-center gap-3 rounded-xl p-3 opacity-60">
                                <div className="rounded-lg bg-muted p-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-medium text-foreground text-xs">
                                        {t("common.email")}
                                    </span>
                                    <span className="truncate text-muted-foreground text-xs">
                                        {user?.email}
                                    </span>
                                </div>
                            </div>

                            <div className="glass-input flex flex-col gap-3 rounded-xl p-3">
                                <div className="flex flex-col">
                                    <span className="font-medium text-foreground text-xs">
                                        {t("profile.web3Wallet")}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {t("profile.requiredForActions")}
                                    </span>
                                </div>
                                <SiweButton
                                    onAddressChange={setWalletAddress}
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Form Fields */}
                    <div className="flex w-full flex-col gap-8 md:w-2/3">
                        <div className="space-y-2">
                            <h2 className="font-light font-serif text-2xl text-foreground">
                                {t("profile.settingsTitle")}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {t("profile.settingsSubtitle")}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <form.Field name="name">
                                {(field) => (
                                    <div className="space-y-2">
                                        <label
                                            htmlFor={field.name}
                                            className="ml-1 font-medium text-foreground text-sm"
                                        >
                                            {t("common.name")}
                                        </label>
                                        <div className="glass-input flex items-center gap-3 rounded-2xl px-4 py-3">
                                            <input
                                                id={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex-1 bg-transparent text-foreground outline-none placeholder:text-foreground/50"
                                            />
                                        </div>
                                        {field.state.meta.errors.length > 0 && (
                                            <p className="ml-1 text-destructive text-xs">
                                                {field.state.meta.errors.join(
                                                    ", ",
                                                )}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="bio">
                                {(field) => (
                                    <div className="space-y-2">
                                        <label
                                            htmlFor={field.name}
                                            className="ml-1 font-medium text-foreground text-sm"
                                        >
                                            {t("common.bio")}
                                        </label>
                                        <div className="glass-input flex items-center gap-3 rounded-2xl px-4 py-3">
                                            <textarea
                                                id={field.name}
                                                rows={3}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={t(
                                                    "profile.bioPlaceholder",
                                                )}
                                                className="flex-1 resize-none bg-transparent text-foreground outline-none placeholder:text-foreground/50"
                                            />
                                        </div>
                                    </div>
                                )}
                            </form.Field>

                            <div className="space-y-3">
                                <span className="ml-1 block font-medium text-foreground text-sm">
                                    {t("common.role")}
                                </span>
                                <div className="glass-input flex max-w-sm select-none items-center justify-between rounded-2xl p-4 opacity-80">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "rounded-full p-2",
                                                user?.role === "player"
                                                    ? "bg-primary/20 text-primary"
                                                    : "bg-muted text-muted-foreground",
                                            )}
                                        >
                                            <UserIcon className="h-5 w-5" />
                                        </div>
                                        <span className="font-semibold text-sm">
                                            {t("common.player")}
                                        </span>
                                    </div>
                                    <Switch
                                        disabled={true}
                                        checked={user?.role === "club"}
                                    />
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-sm">
                                            {t("common.club")}
                                        </span>
                                        <div
                                            className={cn(
                                                "rounded-full p-2",
                                                user?.role === "club"
                                                    ? "bg-primary/20 text-primary"
                                                    : "bg-muted text-muted-foreground",
                                            )}
                                        >
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto flex w-full flex-col items-start gap-4 border-foreground/10 border-t pt-8">
                            <div className="flex w-full flex-col items-center justify-start gap-5 px-2 sm:flex-row">
                                <form.Subscribe
                                    selector={(state) => [
                                        state.canSubmit,
                                        state.isSubmitting,
                                        state.isDirty,
                                    ]}
                                    children={([
                                        canSubmit,
                                        isFormSubmitting,
                                        isDirty,
                                    ]) => (
                                        <button
                                            type="submit"
                                            disabled={
                                                !canSubmit ||
                                                isSubmitting ||
                                                isFormSubmitting ||
                                                !isDirty
                                            }
                                            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
                                        >
                                            {isSubmitting ||
                                            isFormSubmitting ? (
                                                <Loader className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Save className="h-5 w-5" />
                                            )}
                                            {t("common.saveChanges")}
                                        </button>
                                    )}
                                />

                                <LogoutButton />

                                <AnimatePresence mode="wait">
                                    {submitMessage && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className={cn(
                                                "flex items-center gap-2 px-2 font-medium text-sm",
                                                submitMessage.type === "success"
                                                    ? "text-green-500"
                                                    : "text-destructive",
                                            )}
                                        >
                                            {submitMessage.type ===
                                            "success" ? (
                                                <CheckCircle2 className="h-5 w-5" />
                                            ) : (
                                                <AlertCircle className="h-5 w-5" />
                                            )}
                                            {submitMessage.text}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </form>
            </FadeIn>
        </Card>
    );
}
