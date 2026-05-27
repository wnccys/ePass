import { User as UserIcon, Mail, ShieldCheck } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { getCurrentUser } from "@/services/user";
import { Card } from "@/components/ui/card";
import { LogoutButton } from "./logout-button";

export default async function Home() {
    const user = await getCurrentUser();

    if (!user) return <div>Invalid user data</div>

    return (
        <Card className="flex w-full flex-1 min-h-screen items-center justify-center border-none rounded-none shadow-none py-12 relative overflow-hidden px-4">
            <style>{`
                .glass-panel {
                    backdrop-filter: blur(12px);
                    background: linear-gradient(135deg, oklch(from var(--card) l c h / 10%), oklch(from var(--card) l c h / 40%));
                    box-shadow: 0 8px 32px 0 oklch(from var(--foreground) l c h / 10%), inset 0 1px 1px 0 oklch(from var(--card) l c h / 50%);
                    border: 1px solid oklch(from var(--foreground) l c h / 10%);
                }
                .glass-card-local {
                    background: linear-gradient(-75deg, oklch(from var(--card) l c h / 5%), oklch(from var(--card) l c h / 20%), oklch(from var(--card) l c h / 5%));
                    box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--card) l c h / 50%), 0 0.1em 0.25em inset oklch(from var(--card) l c h / 20%);
                    border: 1px solid transparent;
                }
            `}</style>

            <FadeIn className="glass-panel p-8 md:p-12 rounded-3xl w-full max-w-2xl flex flex-col gap-8">
                <div className="flex flex-col md:flex-row items-center gap-8 border-b border-foreground/10 pb-8">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden glass-card-local flex items-center justify-center border-2 border-primary/20">
                        {user?.image ? (
                            <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-10 h-10 text-muted-foreground" />
                        )}
                    </div>
                    <div className="text-center md:text-left space-y-1">
                        <h1 className="text-3xl font-serif font-light text-foreground">Welcome back, {user?.name}!</h1>
                        <p className="text-sm text-muted-foreground">You are logged in as a <span className="font-semibold text-primary uppercase tracking-wider">{user?.role}</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card-local rounded-2xl p-4 flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Email Address</span>
                            <span className="text-sm font-medium text-foreground truncate">{user?.email}</span>
                        </div>
                    </div>

                    <div className="glass-card-local rounded-2xl p-4 flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Mongoose ID</span>
                            <span className="text-xs font-mono text-foreground truncate">{user?._id.toString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground italic">Session active</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter text-green-500/80">Secure Connection</span>
                        </div>
                    </div>
                    <LogoutButton />
                </div>
            </FadeIn>
        </Card>
    )
}