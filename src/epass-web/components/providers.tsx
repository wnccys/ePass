"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <TooltipProvider>
                {children}
            </TooltipProvider>
        </SessionProvider>
    );
}