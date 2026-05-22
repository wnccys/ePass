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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
