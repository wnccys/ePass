'use client';

import Image from "next/image";
import Link from "next/link";
import { LiquidGlassNavbar } from "./ui/liquid-glass-navbar";
import { useSession } from "next-auth/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { FadeInDown } from "./ui/fade-in-down";
import { useTranslation } from "react-i18next";

interface PublicNavbarProps {
    forceLight?: boolean;
}

export function PublicNavbar({ forceLight = false }: PublicNavbarProps) {
    const { status } = useSession();
    const { t } = useTranslation();

    if (status === "authenticated") return null;

    const textColor = forceLight ? "text-foreground" : "text-white";
    const hoverColor = forceLight ? "hover:text-foreground text-muted-foreground" : "hover:text-white text-zinc-300";

    return (
        <FadeInDown className="fixed top-4 left-0 right-0 flex justify-center z-50">
            <LiquidGlassNavbar>
                <div className="flex items-center justify-between w-full gap-8">
                    <div className="flex items-center select-none cursor-pointer gap-1.5">
                        <Image
                            src="/favicon.png"
                            alt="Icon"
                            width={20}
                            height={20}
                            priority
                        />
                        <Link href="/" className={`font-light ${textColor} text-xl`}>ePass</Link>
                    </div>
                    <div className="flex items-center gap-6">
                        <a
                            href="https://epass.gitbook.io/epass-docs/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group inline-flex items-center gap-1 text-sm font-medium ${hoverColor} cursor-pointer transition-all duration-300`}
                        >
                            {t("nav.documentation")}
                            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </a>
                        <Link
                            href="/login"
                            className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer glass-input ${textColor} border border-foreground/10 hover:border-foreground/20`}
                        >
                            {t("nav.enterApp")}
                            <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${textColor}`} />
                        </Link>
                    </div>
                </div>
            </LiquidGlassNavbar>
        </FadeInDown>
    );
}
