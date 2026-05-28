"use client";

import React from "react";
import { ThemeProvider } from "./theme-provider";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <SessionProvider>
                <TooltipProvider>
                    {children}
                </TooltipProvider>
            </SessionProvider>
        </ThemeProvider>
    );
}