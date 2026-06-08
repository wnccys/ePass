"use client";

import { SessionProvider } from "next-auth/react";
import type React from "react";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./theme-provider";
import "@/lib/i18n";
import i18n from "@/lib/i18n";

export function AppProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const savedLng = localStorage.getItem("i18nextLng");
        if (savedLng && savedLng !== i18n.language) {
            i18n.changeLanguage(savedLng);
        }
    }, []);

    return (
        <ThemeProvider>
            <SessionProvider>
                <TooltipProvider>{children}</TooltipProvider>
            </SessionProvider>
        </ThemeProvider>
    );
}
