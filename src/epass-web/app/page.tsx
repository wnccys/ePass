import { PublicNavbar } from "@/components/public-navbar";
import { GradientBackground } from "@/components/ui/shader-background";
import HeroSection from "@/components/ui/trust-hero";

export default async function Page() {
    return (
        <main className="relative flex h-full min-h-screen w-full items-center justify-center overflow-hidden">
            <GradientBackground />
            <PublicNavbar />

            {/* Oppacity Filter */}
            <div className="absolute inset-0 -z-10 bg-foreground/5" />

            <section className="px-6">
                <HeroSection />
            </section>
        </main>
    );
}
