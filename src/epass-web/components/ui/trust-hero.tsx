'use client';

import {
  Target,
  Scroll,
  // Brand Icons
  Hexagon,
  Triangle,
  Command,
  Ghost,
  Gem,
  Cpu
} from "lucide-react";
import AnimatedTextRoller from "./animated-text";
import { LoginButton } from "./login-button";
import { useTranslation } from "react-i18next";

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
  <div className="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
    <span className="text-xl font-bold text-white sm:text-2xl">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium sm:text-xs">{label}</span>
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
    t("hero.compliant")
  ];

  return (
    <div className="relative w-full bg-transparent text-white overflow-hidden font-sans">
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
      <div
        className="absolute inset-0 z-0"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-8 sm:px-6 lg:px-8 lg:pt-24 lg:pb-12 xl:pt-32 xl:pb-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-start">

          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 pt-4 lg:pt-6 xl:space-y-8 xl:pt-8">

            {/* Heading */}
            {isPt ? (
              <h1
                className="animate-fade-in delay-200 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-medium tracking-tighter leading-[1.05] 2xl:leading-[1.0]"
              >
                {t("hero.crafting")}{" "}
                <span className="bg-gradient-to-br from-white via-white to-[#ffcd75] bg-clip-text text-transparent">
                  {t("hero.contractsThatWork")}
                </span><br />
                <span className="inline-block pt-1.5 xl:pt-2.5">
                  <AnimatedTextRoller greetings={greetings} />
                </span><br />
                {t("hero.thatWork")}
              </h1>
            ) : (
              <h1
                className="animate-fade-in delay-200 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-medium tracking-tighter leading-[0.9]"
              >
                {t("hero.crafting")} <AnimatedTextRoller greetings={greetings}  /><br />
                <span className="bg-gradient-to-br from-white via-white to-[#ffcd75] bg-clip-text text-transparent">
                  {t("hero.contractsThatWork")}
                </span><br />
                <span className="inline-block pt-3 xl:pt-4">
                  {t("hero.thatWork")}
                </span>
              </h1>
            )}

            <p className="animate-fade-in delay-300 max-w-xl text-lg text-evergreen-50 leading-relaxed">
                {t("hero.subheading")}
             </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in delay-400 flex flex-col sm:flex-row gap-4">
                <LoginButton />

              <a 
                href="https://epass.gitbook.io/epass-docs/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/20"
              >
                <Scroll className="w-4 h-4 fill-current" />
                {t("hero.readMore")}
              </a>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-5 space-y-4 lg:space-y-6 lg:mt-6 xl:space-y-8 xl:mt-12">

            {/* Stats Card */}
            <div className="animate-fade-in delay-500 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
              {/* Card Glow Effect */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                    <Target className="h-6 w-6 text-lime-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-white">{t("hero.txsValue")}</div>
                    <div className="text-sm text-zinc-300">{t("hero.txsExecuted")}</div>
                  </div>
                </div>

                {/* Progress Bar Section */}
                <div className="space-y-3 mb-6 lg:mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{t("hero.satisfaction")}</span>
                    <span className="text-white font-medium">98%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/50">
                    <div className="h-full w-[98%] rounded-full bg-gradient-to-r from-white to-zinc-400" />
                  </div>
                </div>

                <div className="h-px w-full bg-white/10 mb-5 lg:mb-6" />

                {/* Mini Stats Grid */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <StatItem value="15+" label={t("hero.clubs")} />
                  <div className="w-px h-full bg-white/10 mx-auto" />
                  <StatItem value="24/7" label={t("hero.support")} />
                  <div className="w-px h-full bg-white/10 mx-auto" />
                  <StatItem value="100%" label={t("hero.compliance")} />
                </div>
              </div>
            </div>


            {/* Marquee Card */}
            <div className="animate-fade-in delay-500 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 py-6 lg:py-8 backdrop-blur-xl">
              <h3 className="mb-6 px-8 text-sm font-medium text-zinc-400">{t("hero.trustedBy")}</h3>

              <div
                className="relative flex overflow-hidden"
                style={{
                  maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                  WebkitMaskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)"
                }}
              >
                <div className="animate-marquee flex gap-12 whitespace-nowrap px-4">
                  {/* Triple list for seamless loop */}
                  {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((client, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 opacity-50 transition-all hover:opacity-100 hover:scale-105 cursor-default grayscale hover:grayscale-0"
                    >
                      {/* Brand Icon */}
                      <client.icon className="h-6 w-6 text-white fill-current" />
                      {/* Brand Name */}
                      <span className="text-lg font-bold text-white tracking-tight">
                        {client.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}