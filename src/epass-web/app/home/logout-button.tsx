"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useDisconnect } from "wagmi";
import { cn } from "@/lib/utils";

export function LogoutButton() {
    const { mutate } = useDisconnect();

    const handleSignOut = async () => {
        try {
            mutate();
        } catch (e) {
            console.error("Failed to disconnect wallet:", e);
        }
        await signOut({ redirect: true, callbackUrl: "/login" });
    };

    return (
        <>
            <button
                onClick={handleSignOut}
                type="button"
                className={cn(
                    "glass-aspect group flex cursor-pointer items-center gap-3 rounded-full px-5 py-2.5 font-semibold text-foreground/70 text-sm transition-all hover:text-destructive",
                )}
            >
                <div className="rounded-full bg-muted/50 p-1.5 transition-colors group-hover:bg-destructive/10">
                    <LogOut className="h-3.5 w-3.5 group-hover:text-destructive" />
                </div>
                <span>Sign Out</span>
            </button>
        </>
    );
}
