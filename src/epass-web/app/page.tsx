import HeroSection from "@/components/ui/glassmorphism-trust-hero";
import { GradientBackground } from "@/components/ui/shader-background";

export default function Home() {
    return (
    <main className= "relative min-h-screen h-full w-full flex items-center justify-center overflow-hidden">
        <GradientBackground />
        {/* Oppacity Filter */}
        <div className = "absolute inset-0 -z-10 bg-black/15" />

        {/* TODO Nav */}

        <section className="px-6">
            <HeroSection />
        </section>
    </main>
    );
}
