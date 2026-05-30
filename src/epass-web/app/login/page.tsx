import { AuthComponent } from "@/components/ui/sign-up";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PublicNavbar } from "@/components/public-navbar";

export default async function LoginPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        const forceLightVars = {
            '--background': 'oklch(1 0 0)',
            '--color-background': 'oklch(1 0 0)',
            '--foreground': 'oklch(0.147 0.004 49.25)',
            '--color-foreground': 'oklch(0.147 0.004 49.25)',
            '--card': 'oklch(1 0 0)',
            '--color-card': 'oklch(1 0 0)',
            '--card-foreground': 'oklch(0.147 0.004 49.25)',
            '--color-card-foreground': 'oklch(0.147 0.004 49.25)',
            '--popover': 'oklch(1 0 0)',
            '--color-popover': 'oklch(1 0 0)',
            '--popover-foreground': 'oklch(0.147 0.004 49.25)',
            '--color-popover-foreground': 'oklch(0.147 0.004 49.25)',
            '--primary': 'oklch(0.841 0.238 128.85)',
            '--color-primary': 'oklch(0.841 0.238 128.85)',
            '--primary-foreground': 'oklch(0.405 0.101 131.063)',
            '--color-primary-foreground': 'oklch(0.405 0.101 131.063)',
            '--secondary': 'oklch(0.967 0.001 286.375)',
            '--color-secondary': 'oklch(0.967 0.001 286.375)',
            '--secondary-foreground': 'oklch(0.21 0.006 285.885)',
            '--color-secondary-foreground': 'oklch(0.21 0.006 285.885)',
            '--border': 'oklch(0.923 0.003 48.717)',
            '--color-border': 'oklch(0.923 0.003 48.717)',
            '--input': 'oklch(0.923 0.003 48.717)',
            '--color-input': 'oklch(0.923 0.003 48.717)',
            '--muted': 'oklch(0.97 0.001 106.424)',
            '--color-muted': 'oklch(0.97 0.001 106.424)',
            '--muted-foreground': 'oklch(0.553 0.013 58.071)',
            '--color-muted-foreground': 'oklch(0.553 0.013 58.071)',
            '--accent': 'oklch(0.97 0.001 106.424)',
            '--color-accent': 'oklch(0.97 0.001 106.424)',
            '--accent-foreground': 'oklch(0.216 0.006 56.043)',
            '--color-accent-foreground': 'oklch(0.216 0.006 56.043)',
        } as React.CSSProperties;

        return (
            <div style={forceLightVars} className="bg-background text-foreground min-h-screen w-full relative">
                <PublicNavbar forceLight />
                <AuthComponent />
            </div>
        );
    }

    redirect("/home");
}