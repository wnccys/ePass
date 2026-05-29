'use client';

import Image from "next/image";
import Link from "next/link";
import { LiquidGlassNavbar } from "./ui/liquid-glass-navbar";
import { useSession } from "next-auth/react";

interface PublicNavbarProps {
    forceLight?: boolean;
}

export function PublicNavbar({ forceLight = false }: PublicNavbarProps) {
    const { status } = useSession();

    if (status === "authenticated") return null;

    const textColor = forceLight ? "text-foreground" : "text-white";
    const hoverColor = forceLight ? "hover:text-foreground" : "hover:text-white";
    const mutedColor = forceLight ? "text-muted-foreground" : "text-zinc-300";

    return (
        <div className="fixed top-4 left-0 right-0 flex justify-center z-50">
            <LiquidGlassNavbar>
                <div className="flex items-center gap-8">
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
                    <div className={`flex items-center gap-6 text-sm [&_a]:cursor-default [&_a]:select-none ${mutedColor}`}>
                        <a href="#" className={`transition-colors ${hoverColor}`}>Clubs</a>
                        <a href="#" className={`transition-colors ${hoverColor}`}>Players</a>
                        <a href="#" className={`transition-colors ${hoverColor}`}>About</a>
                    </div>
                </div>
            </LiquidGlassNavbar>
        </div>
    );
}
