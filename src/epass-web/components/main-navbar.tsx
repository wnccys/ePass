'use client';

import Image from "next/image";
import Link from "next/link";
import { LiquidGlassNavbar } from "./ui/liquid-glass-navbar";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";

interface MainNavbarProps {
    role?: 'player' | 'club' | null;
}

export function MainNavbar({ role }: MainNavbarProps) {
    // Just renders when logged
    if (!role) return;

    return (
        <div className="fixed top-8 left-0 right-0 flex justify-center z-50">
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
                        <Link href="/home" className='font-light text-xl text-foreground dark:text-white'>ePass</Link>
                    </div>
                    <div className='flex items-center gap-6 text-sm [&_a]:cursor-default [&_a]:select-none text-muted-foreground dark:text-zinc-300'>
                        {role === 'player' && (
                            <>
                                <a href="#" className='transition-colors hover:text-foreground dark:hover:text-white'>My Profile</a>
                                <a href="#" className='transition-colors hover:text-foreground dark:hover:text-white'>Find Clubs</a>
                                <a href="#" className='transition-colors hover:text-foreground dark:hover:text-white'>Contracts</a>
                            </>
                        )}
                        {role === 'club' && (
                            <>
                                <a href="#" className='transition-colors hover:text-foreground dark:hover:text-white'>Dashboard</a>
                                <a href="#" className='transition-colors hover:text-foreground dark:hover:text-white'>Scouting</a>
                                <a href="#" className='transition-colors hover:text-foreground dark:hover:text-white'>Management</a>
                            </>
                        )}
                    </div>
                </div>
                {role && (
                    <div className='flex items-center ml-4 text-foreground dark:text-white'>
                        <AnimatedThemeToggler />
                    </div>
                )}
            </LiquidGlassNavbar>
        </div>
    );
}
