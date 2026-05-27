"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton() {
    return (
        <>
            <button
                onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
                type="button"
                className={cn(
                    "glass-aspect px-5 py-2.5 rounded-full flex items-center gap-3 text-sm font-semibold text-foreground/70 hover:text-destructive transition-all group cursor-pointer"
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
