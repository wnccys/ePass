"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSelector() {
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (newLang: string) => {
        i18n.changeLanguage(newLang);
        localStorage.setItem("i18nextLng", newLang);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="group relative flex h-8 w-8 cursor-pointer select-none items-center justify-center rounded-full border border-foreground/10 bg-card/50 shadow-sm outline-none backdrop-blur-md transition-all hover:border-foreground/20 hover:bg-card/50 dark:bg-zinc-900/30 hover:dark:bg-zinc-900/50"
                    title={t("common.language")}
                >
                    <Languages className="h-4 w-4 text-accent-foreground transition-colors group-hover:text-foreground/70" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="min-w-32 border border-foreground/10 bg-popover/80 backdrop-blur-md"
            >
                <DropdownMenuItem
                    onClick={() => handleLanguageChange("en")}
                    className={`cursor-pointer ${i18n.language.startsWith("pt") ? "" : "bg-foreground/5 font-semibold text-primary"}`}
                >
                    {t("common.english")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleLanguageChange("pt")}
                    className={`cursor-pointer ${i18n.language.startsWith("pt") ? "bg-foreground/5 font-semibold text-primary" : ""}`}
                >
                    {t("common.portuguese")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
