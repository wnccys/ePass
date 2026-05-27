import Image from "next/image";
import Link from "next/link";
import { LiquidGlassNavbar } from "./ui/liquid-glass-navbar";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import { getCurrentUser } from "@/services/user";

export async function MainNavbar() {
    const role = (await getCurrentUser())?.role;

    // Just renders when logged
    if (!role) return;

    return (
        <div className="fixed top-8 left-0 right-0 flex justify-center z-50">
            <LiquidGlassNavbar>
                <div className="flex items-center gap-8">
                    <Link href="/home" className="flex items-center select-none cursor-pointer gap-1.5">
                        <Image
                            src="/favicon.png"
                            alt="Icon"
                            width={20}
                            height={20}
                            priority
                        />
                        <span className='font-light text-xl text-foreground dark:text-white'>ePass</span>
                    </Link>
                    <div className='flex items-center gap-6 text-sm [&_a]:cursor-default [&_a]:select-none text-muted-foreground dark:text-zinc-300'>
                        {role === 'player' && (
                            <>
                                <Link href="/profile" className='transition-colors hover:text-foreground dark:hover:text-white'>My Profile</Link>
                                <Link href="#" className='transition-colors hover:text-foreground dark:hover:text-white'>Find Clubs</Link>
                                <Link href="#" className='transition-colors hover:text-foreground dark:hover:text-white'>Contracts</Link>
                            </>
                        )}
                        {role === 'club' && (
                            <>
                                <Link href="#" className='transition-colors hover:text-foreground dark:hover:text-white'>Dashboard</Link>
                                <Link href="#" className='transition-colors hover:text-foreground dark:hover:text-white'>Scouting</Link>
                                <Link href="#" className='transition-colors hover:text-foreground dark:hover:text-white'>Management</Link>
                            </>
                        )}
                    </div>
                </div>
                <div className='flex items-center ml-4 text-foreground dark:text-white'>
                    <AnimatedThemeToggler />
                </div>
            </LiquidGlassNavbar>
        </div>
    );
}
