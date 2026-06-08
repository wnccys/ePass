"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./language-selector";
import { FadeInDown } from "./ui/fade-in-down";
import { LiquidGlassNavbar } from "./ui/liquid-glass-navbar";

interface PublicNavbarProps {
    forceLight?: boolean;
}

export function PublicNavbar({ forceLight = false }: PublicNavbarProps) {
    const { status } = useSession();
    const { t } = useTranslation();

    if (status === "authenticated") return null;

    const textColor = forceLight ? "text-foreground" : "text-white";
    const hoverColor = forceLight
        ? "hover:text-foreground text-muted-foreground"
        : "hover:text-white text-zinc-300";

    return (
        <FadeInDown className="fixed top-4 right-0 left-0 z-50 flex justify-center">
            <LiquidGlassNavbar>
                <div className="flex w-full items-center justify-between gap-8">
                    <div className="flex cursor-pointer select-none items-center gap-1.5">
                        <Image
                            src="/favicon.png"
                            alt="Icon"
                            width={20}
                            height={20}
                            priority
                        />
                        <Link
                            href="/"
                            className={`font-light ${textColor} text-xl`}
                        >
                            ePass
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <a
                            href="https://epass.gitbook.io/epass-docs/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group inline-flex items-center gap-1 font-medium text-sm ${hoverColor} cursor-pointer transition-all duration-300`}
                        >
                            {t("nav.documentation")}
                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </a>
                        <Link
                            href="/login"
                            className={`group bg-foreground/5 hover:bg-foreground/10 backdrop-blur-md inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2 font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${textColor} border border-card/10 hover:border-card/50`}
                        >
                            {t("nav.enterApp")}
                            <ArrowRight
                                className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${textColor}`}
                            />
                        </Link>
                        <LanguageSelector />
                    </div>
                </div>
            </LiquidGlassNavbar>
        </FadeInDown>
    );
}
