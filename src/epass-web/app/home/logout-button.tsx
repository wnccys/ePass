"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton() {
    return (
        <>
            <style>{`
                .glass-button-logout {
                    background: linear-gradient(-75deg, oklch(from var(--background) l c h / 5%), oklch(from var(--background) l c h / 20%), oklch(from var(--background) l c h / 5%));
                    box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.1em 0.25em inset oklch(from var(--background) l c h / 20%);
                    border: 1px solid transparent;
                    transition: all 0.3s ease;
                }
                .glass-button-logout:hover {
                    border-color: oklch(from var(--destructive) l c h / 30%);
                    background: oklch(from var(--destructive) l c h / 5%);
                }
            `}</style>
            <button
                onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
                className={cn(
                    "glass-button-logout px-5 py-2.5 rounded-full flex items-center gap-3 text-sm font-semibold text-foreground/70 hover:text-destructive transition-all group cursor-pointer"
                )}
            >
                <div className="p-1.5 bg-muted/50 rounded-full group-hover:bg-destructive/10 transition-colors">
                    <LogOut className="w-3.5 h-3.5 group-hover:text-destructive" />
                </div>
                <span>Sign Out</span>
            </button>
        </>
    );
}
