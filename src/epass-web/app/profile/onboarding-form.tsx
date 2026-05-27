'use client';

import { completeOnboarding } from "@/app/actions/onboarding";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Loader, ArrowRight, User as UserIcon, Building2, AlertCircle, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

// Assuming you have the Abstract SIWE button available locally
import { SiweButton } from "@/components/siwe-button";

const onboardingSchema = z.object({
  name: z.string().min(5, 'Name must be at least 5 characters long'),
  role: z.enum(['player', 'club']),
  avatar: z.any().optional(), // Using z.any() to handle the client-side File object
});

export function OnBoardingForm({
  user
}: {
  user: { name?: string | null; email?: string | null; image?: string | null }
}) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image || null);

  const form = useForm({
    defaultValues: {
      name: user.name || '',
      role: 'player' as 'player' | 'club',
      avatar: null as File | null,
    },
    validators: {
      onChange: onboardingSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // Because we now have an image file, you will likely need to send FormData
        // to your server action instead of a standard JSON object.
        const formData = new FormData();
        formData.append('name', value.name);
        formData.append('role', value.role);
        if (value.avatar) formData.append('avatar', value.avatar);

        // Replace with await completeOnboarding(formData) if updated
        const result = await completeOnboarding(value);

        if (result.success) {
          await update({
            ...session,
            user: {
              ...session?.user,
              onboardingComplete: true,
              role: value.role,
              name: value.name,
              // If your server action returns the uploaded image URL, apply it here
              // image: result.imageUrl
            }
          });

          router.refresh();
          router.push('/home');
        } else {
          setIsSubmitting(false);
        }
      } catch (err) {
        setSubmitError("Failed to complete onboarding. Please try again.");
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="flex w-full flex-1 min-h-screen items-center justify-center bg-background py-12 relative overflow-hidden">
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
        .glass-input-local:focus-within, .glass-input-local:hover {
          border-color: oklch(from var(--foreground) l c h / 20%);
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-3xl w-full max-w-md z-10 mx-4 flex flex-col gap-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-light text-foreground">You're almost there!</h1>
          <p className="text-sm text-muted-foreground">Let's finish your account setup.</p>
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
                <div className="relative w-24 h-24 rounded-full overflow-hidden glass-input-local flex items-center justify-center group cursor-pointer border-2 border-transparent hover:border-primary/50 transition-all">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}

                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-foreground" />
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatarPreview(URL.createObjectURL(file));
                        field.handleChange(file);
                      }
                    }}
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Upload profile picture</p>
              </div>
            )}
          />

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
                  {field.state.meta.errors.length > 0 && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-destructive ml-1"
                    >
                      {field.state.meta.errors.join(', ')}
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
              </div>
            )}
          />

          {/* Abstract SIWE Wallet Connection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground ml-1 block">
              Web3 Connection (Optional)
            </label>
            <div className="glass-input-local rounded-2xl p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Link Wallet</span>
                <span className="text-xs text-muted-foreground">Sign in with Ethereum</span>
              </div>
              {/* Insert the SIWE button provided by Abstract here */}
              <SiweButton />
            </div>
          </div>

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