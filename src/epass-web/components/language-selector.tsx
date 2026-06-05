"use client";

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem("i18nextLng", newLang);
  };

  return (
    <div className="flex items-center gap-2 bg-card/30 dark:bg-zinc-900/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-foreground/10 text-sm hover:border-foreground/20 transition-all select-none shadow-sm">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground font-medium">{t("common.language")}:</span>
      <select
        value={i18n.language.startsWith("pt") ? "pt" : "en"}
        onChange={handleLanguageChange}
        className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer pr-1 border-none outline-none appearance-none"
      >
        <option value="en" className="bg-popover text-popover-foreground">
          {t("common.english")}
        </option>
        <option value="pt" className="bg-popover text-popover-foreground">
          {t("common.portuguese")}
        </option>
      </select>
    </div>
  );
}
