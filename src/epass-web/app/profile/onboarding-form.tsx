'use client';

import { completeOnboarding } from "@/app/actions/onboarding";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Loader, ArrowRight, User as UserIcon, Building2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const onboardingSchema = z.object({
  name: z.string().min(5, 'Name must be at least 5 characters long'),
  role: z.enum(['player', 'club']),
});

export function OnBoardingForm(
    { user }: { user: { name?: string | null; email?: string | null } }
) {
    const router = useRouter();
    const { data: session, update } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useForm({
        defaultValues: {
            name: user.name || '',
            role: 'player' as 'player' | 'club',
        },
        validators: {
            onChange: onboardingSchema,
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            setSubmitError(null);

            try {
                const result = await completeOnboarding(value);

                if (result.success) {
                    await update({
                        ...session,
                        user: {
                            ...session?.user,
                            onboardingComplete: true,
                            role: value.role,
                            name: value.name,
                        }
                    });

                    // 1. Refresh the server state
                    router.refresh();

                    // 2. Redirect to home!
                    // This navigates away, unmounting the form and clearing the loading state.
                    router.push('/home');

                } else {
                    // This correctly handles a business-logic failure
                    setIsSubmitting(false);
                }
            } catch (err) {
                // This correctly handles a network/server error
                setSubmitError("Failed to complete onboarding. Please try again.");
                setIsSubmitting(false);
            }
},
    });

    return (
        <div className="flex w-full flex-1 h-screen items-center justify-center bg-background relative overflow-hidden">
            <style>{`
                 .glass-panel {
                    backdrop-filter: blur(12px);
                    background: linear-gradient(135deg, oklch(from var(--background) l c h / 10%), oklch(from var(--background) l c h / 40%));
                    box-shadow: 0 8px 32px 0 oklch(from var(--foreground) l c h / 10%), inset 0 1px 1px 0 oklch(from var(--background) l c h / 50%);
                    border: 1px solid oklch(from var(--foreground) l c h / 10%);
                }
                .glass-input-local {
                    background: linear-gradient(-75deg, oklch(from var(--background) l c h / 5%), oklch(from var(--background) l c h / 20%), oklch(from var(--background) l c h / 5%));
                    box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.1em 0.25em inset oklch(from var(--background) l c h / 20%);
                    border: 1px solid transparent;
                    transition: all 0.3s ease;
                }
                .glass-input-local:focus-within {
                     border-color: oklch(from var(--foreground) l c h / 20%);
                     box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.05em 0.1em inset oklch(from var(--background) l c h / 50%);
                }
            `}</style>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 rounded-3xl w-full max-w-md z-10 mx-4 flex flex-col gap-6"
            >
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-serif font-light text-foreground">You're almost there!</h1>
                    <p className="text-sm text-muted-foreground">Let's finish setting up your account.</p>
                </div>

                <form
                    onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="space-y-6"
                    >
                        <form.Field
                            name="name"
                            children={(field) => (
                                <div className="space-y-2">
                                    <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">
                                        Your Name
                                    </label>
                                    <div className="glass-input-local rounded-full px-4 py-3 flex items-center gap-3">
                                        <input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="John Doe"
                                            className="bg-transparent flex-1 outline-none text-foreground placeholder:text-foreground/50"
                                        />
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {field.state.meta.errors.length > 0 ? (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-xs text-destructive ml-1"
                                            >
                                                {field.state.meta.errors.join(', ')}
                                            </motion.p>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                            )}
                        />

                        <form.Field
                            name="role"
                            children={(field) => (
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-foreground ml-1 block">
                                        Account Type
                                    </label>
                                    <div className="flex items-center justify-between glass-input-local rounded-2xl p-4">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer group select-none"
                                            onClick={() => field.handleChange('player')}
                                        >
                                            <div className={cn("p-2 rounded-full transition-colors", field.state.value === 'player' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-muted/80")}>
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-foreground">Player</span>
                                                <span className="text-xs text-muted-foreground">Join as an athlete</span>
                                            </div>
                                        </div>

                                        <Switch
                                            checked={field.state.value === 'club'}
                                            onCheckedChange={(checked) => field.handleChange(checked ? 'club' : 'player')}
                                            className="data-[state=checked]:bg-secondary"
                                        />

                                        <div
                                            className="flex items-center gap-3 text-right cursor-pointer group select-none"
                                            onClick={() => field.handleChange('club')}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-foreground">Club</span>
                                                <span className="text-xs text-muted-foreground">Join as a team</span>
                                            </div>
                                            <div className={cn("p-2 rounded-full transition-colors", field.state.value === 'club' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-muted/80")}>
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {field.state.meta.errors.length > 0 ? (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-xs text-destructive ml-1"
                                            >
                                                {field.state.meta.errors.join(', ')}
                                            </motion.p>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                            )}
                        />

                        <AnimatePresence>
                            {submitError && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-sm font-medium">{submitError}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isFormSubmitting]) => (
                                <button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting || isFormSubmitting}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-primary/20"
                                >
                                    {isSubmitting || isFormSubmitting ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            Complete Setup
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            )}
                        />
                    </form>
            </motion.div>
        </div>
  );
}