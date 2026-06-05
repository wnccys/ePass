'use client';

import { ProfilePayload, updateProfile } from "@/app/actions/profile";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from '@tanstack/react-form';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader, User as UserIcon, Building2, AlertCircle, Camera, CheckCircle2, Save, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import SiweButton from "@/components/siwe-sign";

import { profileSchema } from "@/lib/validations";
import { LogoutButton } from "../home/logout-button";
import { FadeIn } from "@/components/ui/fade-in";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";


export function ClubProfile({
  user
}: {
  user: { name?: string | null; email?: string | null; image?: string | null; bio?: string | null; role?: 'player' | 'club' }
}) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { t } = useTranslation();
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);


  useEffect(() => {
    if (session?.user?.walletAddress && !walletAddress) {
      setWalletAddress(session.user.walletAddress as string);
    }
  }, [session?.user?.walletAddress]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.image || null);

  const form = useForm({
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      role: user?.role || 'club',
      avatar: undefined as File | undefined,
    },
    validators: { onChange: profileSchema as any },
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
          setSubmitMessage({ type: 'success', text: t("profile.successMsg") });
          form.reset(value as any);
          router.refresh();
        } else {
          setSubmitMessage({ type: 'error', text: result.error || t("profile.errorMsg") });
        }
      } catch (err) {
        setSubmitMessage({ type: 'error', text: t("profile.networkError") });
      } finally {

        setIsSubmitting(false);
        // Clear success message after 3 seconds
        setTimeout(() => setSubmitMessage(null), 3000);
      }
    },
  });

  return (
    <Card className="flex w-full flex-1 min-h-screen items-center justify-center border-none rounded-none shadow-none py-12 relative overflow-hidden px-[8em]">
      <FadeIn className="glass-panel p-8 md:p-12 rounded-3xl w-full flex flex-col md:flex-row gap-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="w-full flex flex-col md:flex-row gap-12"
        >
          {/* LEFT COLUMN: Identity & Connections */}
          <div className="flex flex-col gap-8 w-full md:w-1/3 shrink-0 border-b md:border-b-0 md:border-r border-foreground/10 pb-8 md:pb-0 md:pr-12">

            <form.Field name="avatar">
              {(field) => (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden glass-input flex items-center justify-center group cursor-pointer border-2 border-transparent hover:border-primary/50 transition-all">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-12 h-12 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-foreground" />
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
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground">{user?.name || t("common.name")}</h3>
                    <p className="text-xs text-muted-foreground">{t("profile.clickToUpload")}</p>
                  </div>
                </div>
              )}
            </form.Field>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t("profile.connectedAccounts")}</h4>

              <div className="glass-input rounded-xl p-3 flex items-center gap-3 opacity-60">
                <div className="p-2 bg-muted rounded-lg">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-medium text-foreground">{t("profile.enterpriseEmail")}</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </div>
              </div>

              <div className="glass-input rounded-xl p-3 flex flex-col gap-3">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">{t("profile.web3Wallet")}</span>
                  <span className="text-[10px] text-muted-foreground">{t("profile.requiredForActions")}</span>
                </div>
                <SiweButton onAddressChange={setWalletAddress} />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Form Fields */}
          <div className="flex flex-col gap-8 w-full md:w-2/3">
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-light text-foreground">{t("profile.settingsTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("profile.settingsSubtitle")}</p>
            </div>

            <div className="space-y-6">
              <form.Field name="name">
                {(field) => (
                  <div className="space-y-2">
                    <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">{t("profile.clubName")}</label>
                    <div className="glass-input rounded-2xl px-4 py-3 flex items-center gap-3">
                      <input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="bg-transparent flex-1 outline-none text-foreground placeholder:text-foreground/50"
                      />
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive ml-1">{field.state.meta.errors.join(', ')}</p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field name="bio">
                {(field) => (
                  <div className="space-y-2">
                    <label htmlFor={field.name} className="text-sm font-medium text-foreground ml-1">{t("common.bio")}</label>
                    <div className="glass-input rounded-2xl px-4 py-3 flex items-center gap-3">
                      <textarea
                        id={field.name}
                        rows={3}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t("profile.clubBioPlaceholder")}
                        className="bg-transparent flex-1 outline-none text-foreground placeholder:text-foreground/50 resize-none"
                      />
                    </div>
                  </div>
                )}
              </form.Field>

              <form.Field name="role">
                {(field) => (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground ml-1 block">{t("common.role")}</label>
                    <div className="flex items-center justify-between glass-input rounded-2xl p-4 max-w-sm">
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => field.handleChange('player')}>
                        <div className={cn("p-2 rounded-full", field.state.value === 'player' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                           <UserIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold">{t("common.player")}</span>
                      </div>
                      <Switch disabled={true} checked={field.state.value === 'club'} onCheckedChange={(checked) => field.handleChange(checked ? 'club' : 'player')} />
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => field.handleChange('club')}>
                        <span className="text-sm font-semibold">{t("common.club")}</span>
                        <div className={cn("p-2 rounded-full", field.state.value === 'club' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                           <Building2 className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form.Field>
            </div>

            <div className="mt-auto pt-8 border-t border-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <AnimatePresence mode="wait">
                {submitMessage && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium",
                      submitMessage.type === 'success' ? "text-green-500" : "text-destructive"
                    )}
                  >
                    {submitMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {submitMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>

                <div className="flex items-center gap-5 px-2">
                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
                        children={([canSubmit, isFormSubmitting, isDirty]) => (
                        <button
                            type="submit"
                            disabled={!canSubmit || isSubmitting || isFormSubmitting || !isDirty}
                            className="w-full sm:w-auto ml-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting || isFormSubmitting ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {t("common.saveChanges")}
                        </button>
                        )}
                    />

                    <LogoutButton />
                </div>
            </div>
          </div>
        </form>
      </FadeIn>
    </Card>
  );
}
