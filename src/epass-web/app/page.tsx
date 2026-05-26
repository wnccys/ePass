import HeroSection from "@/components/ui/trust-hero";
import { GradientBackground } from "@/components/ui/shader-background";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { LiquidGlassNavbar } from "@/components/ui/liquid-glass-navbar";
import Image from "next/image";
import Link from "next/link";

export default async function Page() {
    const session = await getServerSession(authOptions);

    // Logged
    if (session) redirect("/home");

    return (
        <main className="relative min-h-screen h-full w-full flex items-center justify-center overflow-hidden">
            <GradientBackground />
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
                            <Link href="/" className={`font-light text-xl`}>ePass</Link>
                        </div>
                        <div className='flex items-center gap-6 text-sm [&_a]:cursor-default [&_a]:select-none text-zinc-300'>
                            <>
                                <a href="#" className='transition-colors hover:text-white'>Clubs</a>
                                <a href="#" className='transition-colors hover:text-white'>Players</a>
                                <a href="#" className='transition-colors hover:text-white'>About</a>
                            </>
                        </div>
                    </div>
                </LiquidGlassNavbar>
            </div>

            {/* Oppacity Filter */}
            <div className="absolute inset-0 -z-10 bg-foreground/5" />

            <section className="px-6">
                <HeroSection />
            </section>
        </main>
    )
}