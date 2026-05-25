import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Merriweather, Noto_Serif } from "next/font/google";
import { cn } from "@/lib/utils";

const notoSerifHeading = Noto_Serif({subsets:['latin'],variable:'--font-heading'});

const merriweather = Merriweather({subsets:['latin'],variable:'--font-serif'});


// Our local main font
const rodinProB = localFont({
    src: "./fonts/RodinProB.otf",
    // CSS variable name to use in Tailwind
    variable: "--font-rodin",
    // 'swap' ensures text remains visible while the custom font loads
    display: "swap"
})

export const metadata: Metadata = {
  title: "ePass",
  description: "The on-chain football market",
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    // Custom/Other tags (e.g., Safari pinned tabs or Android web manifests)
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.png',
        color: '#84cc16', // Lime color
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", rodinProB.variable, "font-serif", merriweather.variable, notoSerifHeading.variable)}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col selection:bg-lime-200/80">{children}</body>
    </html>
  );
}
