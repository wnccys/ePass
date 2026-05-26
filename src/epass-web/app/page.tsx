import HeroSection from "@/components/ui/trust-hero";
import { GradientBackground } from "@/components/ui/shader-background";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Page() {
    const session = await getServerSession(authOptions);

    // Logged
    if (session) redirect("/home");

    return (
        <main className="relative min-h-screen h-full w-full flex items-center justify-center overflow-hidden">
            <GradientBackground />
            {/* Oppacity Filter */}
            <div className="absolute inset-0 -z-10 bg-foreground/5" />

            <section className="px-6">
                <HeroSection />
            </section>
        </main>
    )
}