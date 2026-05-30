import HeroSection from "@/components/ui/trust-hero";
import { GradientBackground } from "@/components/ui/shader-background";
import { PublicNavbar } from "@/components/public-navbar";

export default async function Page() {
    return (
        <main className="relative min-h-screen h-full w-full flex items-center justify-center overflow-hidden">
            <GradientBackground />
            <PublicNavbar />

            {/* Oppacity Filter */}
            <div className="absolute inset-0 -z-10 bg-foreground/5" />

            <section className="px-6">
                <HeroSection />
            </section>
        </main>
    )
}