"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./language-selector";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import { FadeInDown } from "./ui/fade-in-down";
import { LiquidGlassNavbar } from "./ui/liquid-glass-navbar";

export function MainNavbar() {
    const { data: session, status } = useSession();
    const { t } = useTranslation();
    const role = session?.user?.role;

    // Just renders when logged
    if (!session?.user) return null;

    return (
        <FadeInDown className="fixed top-4 right-0 left-0 z-50 flex justify-center">
            <LiquidGlassNavbar>
                <div className="flex items-center gap-8">
                    <Link
                        href="/home"
                        className="flex cursor-pointer select-none items-center gap-1.5"
                    >
                        <Image
                            src="/favicon.png"
                            alt="Icon"
                            width={20}
                            height={20}
                            priority
                        />
                        <span className="font-light text-foreground text-xl dark:text-white">
                            ePass
                        </span>
                    </Link>
                    <div className="flex items-center gap-6 text-muted-foreground text-sm dark:text-zinc-300 [&_a]:cursor-default [&_a]:select-none">
                        {role === "player" && (
                            <>
                                <Link
                                    href="/home"
                                    className="transition-colors hover:text-foreground dark:hover:text-white"
                                >
                                    {t("nav.home")}
                                </Link>
                                <Link
                                    href="/contracts"
                                    className="transition-colors hover:text-foreground dark:hover:text-white"
                                >
                                    {t("nav.contracts")}
                                </Link>
                                <Link
                                    href="#"
                                    className="transition-colors hover:text-foreground dark:hover:text-white"
                                >
                                    {t("nav.findClubs")}
                                </Link>
                                <Link
                                    href="/profile"
                                    className="transition-colors hover:text-foreground dark:hover:text-white"
                                >
                                    {t("nav.myProfile")}
                                </Link>
                            </>
                        )}
                        {role === "club" && (
                            <>
                                <Link
                                    href="/home"
                                    className="transition-colors hover:text-foreground dark:hover:text-white"
                                >
                                    {t("nav.home")}
                                </Link>
                                <Link
                                    href="/contracts"
                                    className="transition-colors hover:text-foreground dark:hover:text-white"
                                >
                                    {t("nav.contracts")}
                                </Link>
                                <Link
                                    href="/contracts/new"
                                    className="transition-colors hover:text-foreground dark:hover:text-white"
                                >
                                    {t("nav.proposeContract")}
                                </Link>
                                <Link
                                    href="/profile"
                                    className="transition-colors hover:text-foreground dark:hover:text-white"
                                >
                                    {t("nav.clubProfile")}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
                <div className="ml-4 flex items-center gap-3 text-foreground dark:text-white">
                    <LanguageSelector />
                    <AnimatedThemeToggler />
                </div>
            </LiquidGlassNavbar>
        </FadeInDown>
    );
}
