"use client";

import { useForm } from "@tanstack/react-form";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    ArrowRight,
    Building2,
    Camera,
    Loader,
    User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { completeOnboarding } from "@/app/actions/onboarding";
import SiweButton from "@/components/siwe-sign";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { onboardingSchema } from "@/lib/validations";

export function OnBoardingForm({
    user,
}: {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}) {
    const router = useRouter();
    const { data: session, update } = useSession();
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user.image || null,
    );
    const [walletAddress, setWalletAddress] = useState<string | undefined>(
        undefined,
    );

    useEffect(() => {
        if (session?.user?.walletAddress && !walletAddress) {
            setWalletAddress(session.user.walletAddress);
        }
    }, [session?.user?.walletAddress]);

    const form = useForm({
        defaultValues: {
            name: user.name || "",
            role: "player" as "player" | "club",
            avatar: undefined as File | undefined,
        },
        validators: {
            onChange: onboardingSchema as any,
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            setSubmitError(null);

            try {
                const result = await completeOnboarding({ ...value });

                if (result.success) {
                    if (walletAddress) {
                        await update({ walletAddress });
                    } else {
                        await update();
                    }
                    setSubmitError(null);
                    form.reset(value as any);
                    router.push("/home");
                } else {
                    if ((result as any).error)
                        setSubmitError((result as any).error);
                    setIsSubmitting(false);
                }
            } catch (err) {
                setSubmitError(t("onboarding.setupFailed"));
                setIsSubmitting(false);
            }
        },
    });

    return (
        <Card className="relative flex min-h-screen w-full flex-1 items-center justify-center overflow-hidden rounded-none border-none px-4 py-12 shadow-none">
            <FadeIn className="glass-panel z-10 mx-4 flex w-full max-w-md flex-col gap-6 rounded-3xl p-8">
                <div className="space-y-2 text-center">
                    <h1 className="font-light font-serif text-3xl text-foreground">
                        {t("onboarding.title")}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {t("onboarding.subtitle")}
                    </p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="space-y-6"
                >
                    {/* Avatar Upload Field */}
                    <form.Field
                        name="avatar"
                        children={(field) => (
                            <div className="flex flex-col items-center gap-3">
                                <div className="glass-input group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-transparent transition-all hover:border-primary/50">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-foreground" />
                                    )}

                                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Camera className="h-6 w-6 text-foreground" />
                                    </div>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setAvatarPreview(
                                                    URL.createObjectURL(file),
                                                );
                                                field.handleChange(file);
                                            }
                                        }}
                                    />
                                </div>
                                <p className="font-medium text-muted-foreground text-xs">
                                    {t("onboarding.uploadPhoto")}
                                </p>
                            </div>
                        )}
                    />

                    <form.Field
                        name="name"
                        children={(field) => (
                            <div className="space-y-2">
                                <label
                                    htmlFor={field.name}
                                    className="ml-1 font-medium text-foreground text-sm"
                                >
                                    {t("onboarding.legalName")}
                                </label>
                                <div className="glass-input mt-2 flex items-center gap-3 rounded-full px-4 py-3">
                                    <input
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="John Doe"
                                        className="flex-1 bg-transparent text-foreground outline-none placeholder:text-foreground/50"
                                    />
                                </div>
                                <AnimatePresence mode="wait">
                                    {field.state.meta.errors.length > 0 && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                                opacity: 1,
                                                height: "auto",
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="ml-1 text-destructive text-xs"
                                        >
                                            {field.state.meta.errors.join(", ")}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    />

                    <form.Field
                        name="role"
                        children={(field) => (
                            <div className="space-y-3">
                                <label className="ml-1 block font-medium text-foreground text-sm">
                                    {t("common.role")}
                                </label>
                                <div className="glass-input flex items-center justify-between rounded-2xl p-4">
                                    <div
                                        className="group flex cursor-pointer select-none items-center gap-3"
                                        onClick={() =>
                                            field.handleChange("player")
                                        }
                                    >
                                        <div
                                            className={cn(
                                                "rounded-full p-2 transition-colors",
                                                field.state.value === "player"
                                                    ? "bg-primary/20 text-primary"
                                                    : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                                            )}
                                        >
                                            <UserIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground text-sm">
                                                {t("common.player")}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {t("profile.joinAsAthlete")}
                                            </span>
                                        </div>
                                    </div>

                                    <Switch
                                        checked={field.state.value === "club"}
                                        onCheckedChange={(checked) =>
                                            field.handleChange(
                                                checked ? "club" : "player",
                                            )
                                        }
                                        className="data-[state=checked]:bg-secondary"
                                    />

                                    <div
                                        className="group flex cursor-pointer select-none items-center gap-3 text-right"
                                        onClick={() =>
                                            field.handleChange("club")
                                        }
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground text-sm">
                                                {t("common.club")}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {t("profile.joinAsTeam")}
                                            </span>
                                        </div>
                                        <div
                                            className={cn(
                                                "rounded-full p-2 transition-colors",
                                                field.state.value === "club"
                                                    ? "bg-primary/20 text-primary"
                                                    : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                                            )}
                                        >
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    />

                    {/* SIWE Wallet Connection */}
                    <div className="space-y-3">
                        <label className="ml-1 block font-medium text-foreground text-sm">
                            {t("profile.web3Connection")}
                        </label>
                        <div className="glass-input flex items-center justify-between rounded-2xl p-4">
                            <div className="flex flex-col">
                                <span className="font-semibold text-foreground text-sm">
                                    {t("profile.linkWallet")}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {t("profile.signInWithEthereum")}
                                </span>
                            </div>
                            <SiweButton onAddressChange={setWalletAddress} />
                        </div>
                    </div>

                    <AnimatePresence>
                        {submitError && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-destructive"
                            >
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="font-medium text-sm">
                                    {submitError}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form.Subscribe
                        selector={(state) => [
                            state.canSubmit,
                            state.isSubmitting,
                            state.isDirty,
                        ]}
                        children={([canSubmit, isFormSubmitting, isDirty]) => (
                            <button
                                type="submit"
                                disabled={
                                    !canSubmit ||
                                    isSubmitting ||
                                    isFormSubmitting ||
                                    !isDirty
                                }
                                className="group flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting || isFormSubmitting ? (
                                    <>
                                        <Loader className="h-5 w-5 animate-spin" />
                                        {t("common.saving")}
                                    </>
                                ) : (
                                    <>
                                        {t("onboarding.completeSetup")}
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        )}
                    />
                </form>
            </FadeIn>
        </Card>
    );
}
