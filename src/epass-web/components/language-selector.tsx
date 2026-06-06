"use client";

import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
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
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-card/30 dark:bg-zinc-900/30 backdrop-blur-md border border-foreground/10 hover:border-foreground/20 hover:bg-card/50 hover:dark:bg-zinc-900/50 transition-all select-none shadow-sm cursor-pointer group outline-none"
          title={t("common.language")}
        >
          <Languages className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32 bg-popover/80 border border-foreground/10 backdrop-blur-md">
        <DropdownMenuItem
          onClick={() => handleLanguageChange("en")}
          className={`cursor-pointer ${i18n.language.startsWith("pt") ? "" : "font-semibold text-primary bg-foreground/5"}`}
        >
          {t("common.english")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange("pt")}
          className={`cursor-pointer ${i18n.language.startsWith("pt") ? "font-semibold text-primary bg-foreground/5" : ""}`}
        >
          {t("common.portuguese")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
