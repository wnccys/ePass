"use client";

import { ArrowUpRight, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LinkedinIcon, MailIcon, TwitterIcon } from "./icons";

export function Footer() {
    const pathname = usePathname();
    const { i18n } = useTranslation();
    const isPt = i18n.language === "pt";

    if (pathname === "/" || pathname === "/login") {
        return null;
    }

    return (
        <footer className="glass-panel relative z-40 mt-auto flex w-full select-none flex-col items-center justify-between gap-4 border-foreground/10 border-t px-6 py-6 sm:flex-row md:px-12">
            {/* Left: Copyright */}
            <div className="text-center text-muted-foreground text-xs sm:text-left">
                &copy; 2026 ePass.{" "}
                {isPt
                    ? "Todos os direitos reservados."
                    : "All rights reserved."}
            </div>

            {/* Center: Links */}
            <div className="flex flex-row items-center justify-center gap-6 text-muted-foreground text-xs">
                <a
                    href="https://epass.gitbook.io/epass-docs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex cursor-pointer items-center gap-0.5 transition-colors hover:text-foreground"
                >
                    {isPt ? "Documentação" : "Documentation"}
                    <ArrowUpRight className="h-3 w-3" />
                </a>
                <Link
                    href="/privacy"
                    className="inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-foreground"
                >
                    <Shield className="h-3 w-3 text-primary" />
                    {isPt ? "Termos & Privacidade" : "Terms & Privacy"}
                </Link>
            </div>

            {/* Right: Social Media */}
            <div className="flex items-center justify-center gap-3">
                <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="glass-input flex cursor-pointer items-center justify-center rounded-full p-2 text-muted-foreground transition-all hover:scale-110 hover:text-foreground active:scale-95"
                    title="X (Twitter)"
                >
                    <TwitterIcon className="h-4 w-4" />
                </a>
                <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="glass-input flex cursor-pointer items-center justify-center rounded-full p-2 text-muted-foreground transition-all hover:scale-110 hover:text-foreground active:scale-95"
                    title="LinkedIn"
                >
                    <LinkedinIcon className="h-4 w-4" />
                </a>
                <a
                    href="mailto:epassfootball@protonmail.com"
                    className="glass-input flex cursor-pointer items-center justify-center rounded-full p-2 text-muted-foreground transition-all hover:scale-110 hover:text-foreground active:scale-95"
                    title="Email Support"
                >
                    <MailIcon className="h-4 w-4" />
                </a>
            </div>
        </footer>
    );
}
