"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export function LoginButton() {
    const { t } = useTranslation();
    return (
        <div>
            <Link
                href="/login"
                className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                {t("common.begin")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
        </div>
    );
}
