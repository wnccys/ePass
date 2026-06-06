'use client';

import { completeOnboarding } from "@/app/actions/onboarding";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from '@tanstack/react-form';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader, ArrowRight, User as UserIcon, Building2, AlertCircle, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

import SiweButton from "@/components/siwe-sign";

import { onboardingSchema } from "@/lib/validations";
import { FadeIn } from "@/components/ui/fade-in";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";


export function OnBoardingForm({
  user
}: {
  user: { name?: string | null; email?: string | null; image?: string | null }
}) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image || null);
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);


  useEffect(() => {
    if (session?.user?.walletAddress && !walletAddress) {
      setWalletAddress(session.user.walletAddress);
    }
  }, [session?.user?.walletAddress]);

  const form = useForm({
    defaultValues: {
      name: user.name || '',
      role: 'player' as 'player' | 'club',
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
          router.push('/home');
        } else {
          if ((result as any).error) setSubmitError((result as any).error);
          setIsSubmitting(false);
        }
      } catch (err) {
        setSubmitError(t("onboarding.setupFailed"));
        setIsSubmitting(false);
      }
    },
  });


  return (
    <Card className="flex w-full flex-1 min-h-screen items-center justify-center border-none rounded-none shadow-none py-12 relative overflow-hidden px-4">
      <FadeIn className="glass-panel p-8 rounded-3xl w-full max-w-md z-10 mx-4 flex flex-col gap-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-light text-foreground">{t("onboarding.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("onboarding.subtitle")}</p>
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
                <div className="relative w-24 h-24 rounded-full overflow-hidden glass-input flex items-center justify-center group cursor-pointer border-2 border-transparent hover:border-primary/50 transition-all">
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
                <p className="text-xs font-medium text-muted-foreground">{t("onboarding.uploadPhoto")}</p>
              </div>
            )}
          />

          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">
                  {t("onboarding.legalName")}
                </label>
                <div className="glass-input rounded-full px-4 py-3 flex items-center gap-3 mt-2">
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
                  {t("common.role")}
                </label>
                <div className="flex items-center justify-between glass-input rounded-2xl p-4">
                  <div
                    className="flex items-center gap-3 cursor-pointer group select-none"
                    onClick={() => field.handleChange('player')}
                  >
                    <div className={cn("p-2 rounded-full transition-colors", field.state.value === 'player' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-muted/80")}>
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{t("common.player")}</span>
                      <span className="text-xs text-muted-foreground">{t("profile.joinAsAthlete")}</span>
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
                      <span className="text-sm font-semibold text-foreground">{t("common.club")}</span>
                      <span className="text-xs text-muted-foreground">{t("profile.joinAsTeam")}</span>
                    </div>
                    <div className={cn("p-2 rounded-full transition-colors", field.state.value === 'club' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-muted/80")}>
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          />

          {/* SIWE Wallet Connection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground ml-1 block">
              {t("profile.web3Connection")}
            </label>
            <div className="glass-input rounded-2xl p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{t("profile.linkWallet")}</span>
                <span className="text-xs text-muted-foreground">{t("profile.signInWithEthereum")}</span>
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
                className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{submitError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
            children={([canSubmit, isFormSubmitting, isDirty]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting || isFormSubmitting || !isDirty}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-primary/20"
              >
                {isSubmitting || isFormSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  <>
                    {t("onboarding.completeSetup")}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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