import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Merriweather, Noto_Serif } from "next/font/google";
import { AppProviders } from "@/components/providers";
import { MainNavbar } from "@/components/main-navbar";
import { Web3Providers } from "@/components/web3-providers";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";
import { getChainConfig } from "./actions/chain";
import { ChainProvider } from "./context/ChainContext";

const notoSerifHeading = Noto_Serif({
    subsets: ["latin"],
    variable: "--font-heading",
});

const merriweather = Merriweather({
    subsets: ["latin"],
    variable: "--font-serif",
});

// Our local main font
const rodinProB = localFont({
    src: "./fonts/RodinProB.otf",
    // CSS variable name to use in Tailwind
    variable: "--font-rodin",
    // 'swap' ensures text remains visible while the custom font loads
    display: "swap",
});

export const metadata: Metadata = {
    title: "ePass",
    description: "The on-chain football market",
    icons: {
        icon: "/favicon.png",
        shortcut: "/favicon.png",
        // Custom/Other tags (e.g., Safari pinned tabs or Android web manifests)
        other: [
            {
                rel: "mask-icon",
                url: "/favicon.png",
                color: "#84cc16", // Lime color
            },
        ],
    },
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const chainConfig = getChainConfig();
    return (
        <html
            lang="en"
            className={cn(
                "h-full",
                "antialiased",
                rodinProB.variable,
                "font-serif",
                merriweather.variable,
                notoSerifHeading.variable,
            )}
            suppressHydrationWarning
        >
            <head>
                {/* React Scan -- DevTool */}
                {/* <script
                    crossOrigin="anonymous"
                    src="//unpkg.com/react-scan/dist/auto.global.js"
                ></script> */}
            </head>
                <body className="min-h-full flex flex-col selection:bg-lime-200/80">
                    <AppProviders>
                        <ChainProvider value={{ networkId: chainConfig.network.id, rpcUrl: chainConfig.rpcUrl }}>
                            <Web3Providers>
                                <MainNavbar />
                                {children}
                                <Footer />
                                <Toaster />
                            </Web3Providers>
                        </ChainProvider>
                    </AppProviders>
            </body>
        </html>
    );
}
