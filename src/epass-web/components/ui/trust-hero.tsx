"use client";

import {
    Command,
    Cpu,
    Gem,
    Ghost,
    // Brand Icons
    Hexagon,
    Scroll,
    Target,
    Triangle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AnimatedTextRoller from "./animated-text";
import { LoginButton } from "./login-button";

// --- MOCK BRANDS ---
// Replaced PNGs with Lucide icons to simulate tech logos
const CLIENTS = [
    { name: "Acme Corp", icon: Hexagon },
    { name: "Quantum", icon: Triangle },
    { name: "Command+Z", icon: Command },
    { name: "Phantom", icon: Ghost },
    { name: "Ruby", icon: Gem },
    { name: "Chipset", icon: Cpu },
];

// --- SUB-COMPONENTS ---
const StatItem = ({ value, label }: { value: string; label: string }) => (
    <div className="flex cursor-default flex-col items-center justify-center transition-transform hover:-translate-y-1">
        <span className="font-bold text-white text-xl sm:text-2xl">
            {value}
        </span>
        <span className="font-medium text-[10px] text-zinc-500 uppercase tracking-wider sm:text-xs">
            {label}
        </span>
    </div>
);

// --- MAIN COMPONENT ---
export default function HeroSection() {
    const { t, i18n } = useTranslation();
    const isPt = i18n.language.startsWith("pt");

    const greetings = [
        t("hero.smart"),
        t("hero.secure"),
        t("hero.decentralized"),
        t("hero.compliant"),
    ];

    return (
        <div className="relative w-full overflow-hidden bg-transparent font-sans text-white">
            {/*
        SCOPED ANIMATIONS
      */}
            <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-marquee {
          animation: marquee 40s linear infinite; /* Slower for readability */
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

            {/* Background Image with Gradient Mask */}
            <div className="absolute inset-0 z-0" />

            <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-8 sm:px-6 lg:px-8 lg:pt-24 lg:pb-12 xl:pt-32 xl:pb-20">
                <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8">
                    {/* --- LEFT COLUMN --- */}
                    <div className="flex flex-col justify-center space-y-6 pt-4 lg:col-span-7 lg:pt-6 xl:space-y-8 xl:pt-8">
                        {/* Heading */}
                        {isPt ? (
                            <h1 className="animate-fade-in font-medium text-4xl leading-[1.05] tracking-tighter delay-200 sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl 2xl:leading-[1.0]">
                                {t("hero.crafting")}{" "}
                                <span className="bg-gradient-to-br from-white via-white to-[#ffcd75] bg-clip-text text-transparent">
                                    {t("hero.contractsThatWork")}
                                </span>
                                <br />
                                <span className="inline-block pt-1.5 xl:pt-2.5">
                                    <AnimatedTextRoller greetings={greetings} />
                                </span>
                                <br />
                                {t("hero.thatWork")}
                            </h1>
                        ) : (
                            <h1 className="animate-fade-in font-medium text-4xl leading-[0.9] tracking-tighter delay-200 sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl">
                                {t("hero.crafting")}{" "}
                                <AnimatedTextRoller greetings={greetings} />
                                <br />
                                <span className="bg-gradient-to-br from-white via-white to-[#ffcd75] bg-clip-text text-transparent">
                                    {t("hero.contractsThatWork")}
                                </span>
                                <br />
                                <span className="inline-block pt-3 xl:pt-4">
                                    {t("hero.thatWork")}
                                </span>
                            </h1>
                        )}

                        <p className="max-w-xl animate-fade-in text-evergreen-50 text-lg leading-relaxed delay-300">
                            {t("hero.subheading")}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex animate-fade-in flex-col gap-4 delay-400 sm:flex-row">
                            <LoginButton />

                            <a
                                href="https://epass.gitbook.io/epass-docs/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 font-semibold text-sm text-white backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10"
                            >
                                <Scroll className="h-4 w-4 fill-current" />
                                {t("hero.readMore")}
                            </a>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN --- */}
                    <div className="space-y-4 lg:col-span-5 lg:mt-6 lg:space-y-6 xl:mt-12 xl:space-y-8">
                        {/* Stats Card */}
                        <div className="relative animate-fade-in overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl delay-500 lg:p-8">
                            {/* Card Glow Effect */}
                            <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

                            <div className="relative z-10">
                                <div className="mb-8 flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                                        <Target className="h-6 w-6 text-lime-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-3xl text-white tracking-tight">
                                            {t("hero.txsValue")}
                                        </div>
                                        <div className="text-sm text-zinc-300">
                                            {t("hero.txsExecuted")}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar Section */}
                                <div className="mb-6 space-y-3 lg:mb-8">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">
                                            {t("hero.satisfaction")}
                                        </span>
                                        <span className="font-medium text-white">
                                            98%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/50">
                                        <div className="h-full w-[98%] rounded-full bg-gradient-to-r from-white to-zinc-400" />
                                    </div>
                                </div>

                                <div className="mb-5 h-px w-full bg-white/10 lg:mb-6" />

                                {/* Mini Stats Grid */}
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <StatItem
                                        value="15+"
                                        label={t("hero.clubs")}
                                    />
                                    <div className="mx-auto h-full w-px bg-white/10" />
                                    <StatItem
                                        value="24/7"
                                        label={t("hero.support")}
                                    />
                                    <div className="mx-auto h-full w-px bg-white/10" />
                                    <StatItem
                                        value="100%"
                                        label={t("hero.compliance")}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Marquee Card */}
                        <div className="relative animate-fade-in overflow-hidden rounded-3xl border border-white/10 bg-white/5 py-6 backdrop-blur-xl delay-500 lg:py-8">
                            <h3 className="mb-6 px-8 font-medium text-sm text-zinc-400">
                                {t("hero.trustedBy")}
                            </h3>

                            <div
                                className="relative flex overflow-hidden"
                                style={{
                                    maskImage:
                                        "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                                    WebkitMaskImage:
                                        "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                                }}
                            >
                                <div className="flex animate-marquee gap-12 whitespace-nowrap px-4">
                                    {/* Triple list for seamless loop */}
                                    {[...CLIENTS, ...CLIENTS, ...CLIENTS].map(
                                        (client, i) => (
                                            <div
                                                key={i}
                                                className="flex cursor-default items-center gap-2 opacity-50 grayscale transition-all hover:scale-105 hover:opacity-100 hover:grayscale-0"
                                            >
                                                {/* Brand Icon */}
                                                <client.icon className="h-6 w-6 fill-current text-white" />
                                                {/* Brand Name */}
                                                <span className="font-bold text-lg text-white tracking-tight">
                                                    {client.name}
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
