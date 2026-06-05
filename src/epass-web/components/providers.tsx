"use client";

import React, { useEffect } from "react";
import { ThemeProvider } from "./theme-provider";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
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
        <SessionProvider>
            <TooltipProvider>
                {children}
            </TooltipProvider>
        </SessionProvider>
    );
}