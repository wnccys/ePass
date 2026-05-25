import HeroSection from "@/components/ui/trust-hero";
import { GradientBackground } from "@/components/ui/shader-background";
import { LiquidGlassNavbar } from "@/components/ui/liquid-glass-navbar";

export default function Home() {
    return (
    <main className="relative min-h-screen h-full w-full flex items-center justify-center overflow-hidden">
        <GradientBackground />
        {/* Oppacity Filter */}
        <div className="absolute inset-0 -z-10 bg-black/15" />

        <div className="fixed top-8 left-0 right-0 flex justify-center z-50">
            <LiquidGlassNavbar className="">
                <div className="font-light text-white text-xl pointer-events-none select-none">ePass</div>
                <div className="flex items-center gap-6 text-sm text-zinc-300 [&_a]:cursor-default [&_a]:select-none">
                    <a href="#" className="hover:text-white transition-colors">Clubs</a>
                    <a href="#" className="hover:text-white transition-colors">Players</a>
                    <a href="#" className="hover:text-white transition-colors">About</a>
                </div>
            </LiquidGlassNavbar>
        </div>

        <section className="px-6">
            <HeroSection />
        </section>
    </main>
    );
}
