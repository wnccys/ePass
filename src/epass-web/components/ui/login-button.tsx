'use client'

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function LoginButton() {
    return (
        <div>
            <Link href="/login" className="group inline-flex bg-white text-black items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                Begin
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
        </div>
    )
}