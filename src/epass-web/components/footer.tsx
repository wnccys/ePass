"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Shield } from "lucide-react";
import { TwitterIcon, LinkedinIcon, MailIcon } from "./icons";

export function Footer() {
    const pathname = usePathname();
    const { i18n } = useTranslation();
    const isPt = i18n.language === "pt";

    if (pathname === "/" || pathname === "/login") {
        return null;
    }

    return (
        <footer className="glass-panel w-full border-t border-foreground/10 py-6 px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto z-40 relative select-none">
            {/* Left: Copyright */}
            <div className="text-xs text-muted-foreground text-center sm:text-left">
                &copy; 2026 ePass. {isPt ? "Todos os direitos reservados." : "All rights reserved."}
            </div>

            {/* Center: Links */}
            <div className="flex flex-row items-center gap-6 text-xs text-muted-foreground justify-center">
                <a
                    href="https://epass.gitbook.io/epass-docs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                >
                    {isPt ? "Documentação" : "Documentation"}
                    <ArrowUpRight className="w-3 h-3" />
                </a>
                <Link
                    href="/privacy"
                    className="hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                    <Shield className="w-3 h-3 text-primary" />
                    {isPt ? "Termos & Privacidade" : "Terms & Privacy"}
                </Link>
            </div>

            {/* Right: Social Media */}
            <div className="flex items-center gap-3 justify-center">
                <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="glass-input p-2 rounded-full hover:scale-110 active:scale-95 transition-all text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
                    title="X (Twitter)"
                >
                    <TwitterIcon className="w-4 h-4" />
                </a>
                <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="glass-input p-2 rounded-full hover:scale-110 active:scale-95 transition-all text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
                    title="LinkedIn"
                >
                    <LinkedinIcon className="w-4 h-4" />
                </a>
                <a
                    href="mailto:epassfootball@protonmail.com"
                    className="glass-input p-2 rounded-full hover:scale-110 active:scale-95 transition-all text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
                    title="Email Support"
                >
                    <MailIcon className="w-4 h-4" />
                </a>
            </div>
        </footer>
    );
}
