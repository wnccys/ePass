"use client";

// Importing class-variance-authority for the built-in button component
import { cva, type VariantProps } from "class-variance-authority";
// Importing animation components from framer-motion
import {
    AnimatePresence,
    motion,
    useInView,
    type Variants,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// --- BUILT-IN BLUR FADE ANIMATION COMPONENT ---
interface BlurFadeProps {
    children: React.ReactNode;
    className?: string;
    variant?: { hidden: { y: number }; visible: { y: number } };
    duration?: number;
    delay?: number;
    yOffset?: number;
    inView?: boolean;
    inViewMargin?: string;
    blur?: string;
}
function BlurFade({
    children,
    className,
    variant,
    duration = 0.4,
    delay = 0,
    yOffset = 6,
    inView = true,
    inViewMargin = "-50px",
    blur = "6px",
}: BlurFadeProps) {
    const ref = useRef(null);
    const inViewResult = useInView(ref, {
        once: true,
        margin: inViewMargin as any,
    });
    const isInView = !inView || inViewResult;
    const defaultVariants: Variants = {
        hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
        visible: { y: -yOffset, opacity: 1, filter: `blur(0px)` },
    };
    const combinedVariants = variant || defaultVariants;
    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            exit="hidden"
            variants={combinedVariants}
            transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// --- BUILT-IN GLASS BUTTON COMPONENT (WITH CLICK FIX) ---
const glassButtonVariants = cva(
    "all-unset relative isolate cursor-pointer rounded-full transition-all",
    {
        variants: {
            size: {
                default: "font-medium text-base",
                sm: "font-medium text-sm",
                lg: "font-medium text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: { size: "default" },
    },
);
const glassButtonTextVariants = cva(
    "glass-button-text relative block select-none tracking-tighter",
    {
        variants: {
            size: {
                default: "px-6 py-3.5",
                sm: "px-4 py-2",
                lg: "px-8 py-4",
                icon: "flex h-10 w-10 items-center justify-center",
            },
        },
        defaultVariants: { size: "default" },
    },
);
export interface GlassButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof glassButtonVariants> {
    contentClassName?: string;
}
const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
    (
        {
            className,
            children,
            size,
            contentClassName,
            onClick,
            disabled,
            ...props
        },
        ref,
    ) => {
        const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
            if (disabled) return;
            const button = e.currentTarget.querySelector("button");
            if (button && e.target !== button) button.click();
        };
        return (
            <div
                className={cn(
                    "glass-button-wrap relative cursor-pointer rounded-full",
                    disabled &&
                        "pointer-events-none cursor-not-allowed opacity-50",
                    className,
                )}
                onClick={handleWrapperClick}
            >
                <button
                    className={cn(
                        "glass-button relative z-10",
                        glassButtonVariants({ size }),
                    )}
                    ref={ref}
                    onClick={onClick}
                    disabled={disabled}
                    {...props}
                >
                    <span
                        className={cn(
                            glassButtonTextVariants({ size }),
                            contentClassName,
                        )}
                    >
                        {children}
                    </span>
                </button>
                <div className="glass-button-shadow pointer-events-none rounded-full"></div>
            </div>
        );
    },
);
GlassButton.displayName = "GlassButton";

// --- THEME-AWARE SVG GRADIENT BACKGROUND WITH SUBTLE ANIMATION ---
const GradientBackground = () => {
    const bgFill = "#ffffff";

    return (
        <>
            <style>
                {` @keyframes float1 { 0% { transform: translate(0, 0); } 50% { transform: translate(-10px, 10px); } 100% { transform: translate(0, 0); } } @keyframes float2 { 0% { transform: translate(0, 0); } 50% { transform: translate(10px, -10px); } 100% { transform: translate(0, 0); } } `}
            </style>
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
                className="absolute top-0 left-0 h-full w-full"
            >
                <defs>
                    <linearGradient
                        id="rev_grad1"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop
                            offset="0%"
                            style={{
                                stopColor: "var(--color-primary)",
                                stopOpacity: 0.4,
                            }}
                        />
                        <stop
                            offset="100%"
                            style={{
                                stopColor: "var(--color-chart-3)",
                                stopOpacity: 0.3,
                            }}
                        />
                    </linearGradient>
                    <linearGradient
                        id="rev_grad2"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop
                            offset="0%"
                            style={{
                                stopColor: "var(--color-chart-4)",
                                stopOpacity: 0.5,
                            }}
                        />
                        <stop
                            offset="50%"
                            style={{
                                stopColor: "var(--color-secondary)",
                                stopOpacity: 0.4,
                            }}
                        />
                        <stop
                            offset="100%"
                            style={{
                                stopColor: "var(--color-chart-1)",
                                stopOpacity: 0.3,
                            }}
                        />
                    </linearGradient>
                    <radialGradient id="rev_grad3" cx="50%" cy="50%" r="50%">
                        <stop
                            offset="0%"
                            style={{
                                stopColor: "var(--color-accent)",
                                stopOpacity: 0.4,
                            }}
                        />
                        <stop
                            offset="100%"
                            style={{
                                stopColor: "var(--color-chart-5)",
                                stopOpacity: 0.2,
                            }}
                        />
                    </radialGradient>
                    <filter
                        id="rev_blur1"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                    >
                        <feGaussianBlur stdDeviation="35" />
                    </filter>
                    <filter
                        id="rev_blur2"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                    >
                        <feGaussianBlur stdDeviation="25" />
                    </filter>
                    <filter
                        id="rev_blur3"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                    >
                        <feGaussianBlur stdDeviation="45" />
                    </filter>
                </defs>
                <rect width="100%" height="100%" fill={bgFill} />
                <g style={{ animation: "float1 20s ease-in-out infinite" }}>
                    <ellipse
                        cx="200"
                        cy="500"
                        rx="250"
                        ry="180"
                        fill="url(#rev_grad1)"
                        filter="url(#rev_blur1)"
                        transform="rotate(-30 200 500)"
                    />
                    <rect
                        x="500"
                        y="100"
                        width="300"
                        height="250"
                        rx="80"
                        fill="url(#rev_grad2)"
                        filter="url(#rev_blur2)"
                        transform="rotate(15 650 225)"
                    />
                </g>
                <g style={{ animation: "float2 25s ease-in-out infinite" }}>
                    <circle
                        cx="650"
                        cy="450"
                        r="150"
                        fill="url(#rev_grad3)"
                        filter="url(#rev_blur3)"
                        opacity="0.7"
                    />
                    <ellipse
                        cx="50"
                        cy="150"
                        rx="180"
                        ry="120"
                        fill="var(--color-muted)"
                        filter="url(#rev_blur2)"
                        opacity="0.5"
                    />
                </g>
            </svg>
        </>
    );
};

// --- CHILD COMPONENTS ---
const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        className="h-6 w-6"
    >
        {" "}
        <path
            fill="currentColor"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
        />{" "}
    </svg>
);

// --- CHILD COMPONENTS ---
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        className="h-6 w-6"
    >
        {" "}
        <g fillRule="evenodd" fill="none">
            {" "}
            <g fillRule="nonzero" transform="translate(3, 2)">
                {" "}
                <path
                    fill="#4285F4"
                    d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"
                ></path>{" "}
                <path
                    fill="#34A853"
                    d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"
                ></path>{" "}
                <path
                    fill="#FBBC05"
                    d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"
                ></path>{" "}
                <path
                    fill="#EB4335"
                    d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"
                ></path>{" "}
            </g>{" "}
        </g>
    </svg>
);

// --- MAIN COMPONENT ---
export const AuthComponent = () => {
    const { status } = useSession();
    const router = useRouter();
    const { t } = useTranslation();

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/home");
        }
    }, [status, router]);

    return (
        <div className="flex min-h-screen w-screen flex-col bg-background">
            <style>{`
            @property --angle-1 { syntax: "<angle>"; inherits: false; initial-value: -75deg; } @property --angle-2 { syntax: "<angle>"; inherits: false; initial-value: -45deg; }
            .glass-button-wrap { --anim-time: 400ms; --anim-ease: cubic-bezier(0.25, 1, 0.5, 1); --border-width: clamp(1px, 0.0625em, 4px); position: relative; z-index: 2; transform-style: preserve-3d; transition: transform var(--anim-time) var(--anim-ease); } .glass-button-wrap:has(.glass-button:active) { transform: rotateX(25deg); } .glass-button-shadow { --shadow-cutoff-fix: 2em; position: absolute; width: calc(100% + var(--shadow-cutoff-fix)); height: calc(100% + var(--shadow-cutoff-fix)); top: calc(0% - var(--shadow-cutoff-fix) / 2); left: calc(0% - var(--shadow-cutoff-fix) / 2); filter: blur(clamp(2px, 0.125em, 12px)); transition: filter var(--anim-time) var(--anim-ease); pointer-events: none; z-index: 0; } .glass-button-shadow::after { content: ""; position: absolute; inset: 0; border-radius: 9999px; background: linear-gradient(180deg, oklch(from var(--foreground) l c h / 20%), oklch(from var(--foreground) l c h / 10%)); width: calc(100% - var(--shadow-cutoff-fix) - 0.25em); height: calc(100% - var(--shadow-cutoff-fix) - 0.25em); top: calc(var(--shadow-cutoff-fix) - 0.5em); left: calc(var(--shadow-cutoff-fix) - 0.875em); padding: 0.125em; box-sizing: border-box; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: all var(--anim-time) var(--anim-ease); opacity: 1; }
            .glass-button { -webkit-tap-highlight-color: transparent; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all var(--anim-time) var(--anim-ease); background: linear-gradient(-75deg, oklch(from var(--background) l c h / 5%), oklch(from var(--background) l c h / 20%), oklch(from var(--background) l c h / 5%)); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.25em 0.125em -0.125em oklch(from var(--foreground) l c h / 20%), 0 0 0.1em 0.25em inset oklch(from var(--background) l c h / 20%), 0 0 0 0 oklch(from var(--background) l c h); } .glass-button:hover { transform: scale(0.975); backdrop-filter: blur(0.01em); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.15em 0.05em -0.1em oklch(from var(--foreground) l c h / 25%), 0 0 0.05em 0.1em inset oklch(from var(--background) l c h / 50%), 0 0 0 0 oklch(from var(--background) l c h); } .glass-button-text { color: oklch(from var(--foreground) l c h / 90%); text-shadow: 0em 0.25em 0.05em oklch(from var(--foreground) l c h / 10%); transition: all var(--anim-time) var(--anim-ease); } .glass-button:hover .glass-button-text { text-shadow: 0.025em 0.025em 0.025em oklch(from var(--foreground) l c h / 12%); } .glass-button-text::after { content: ""; display: block; position: absolute; width: calc(100% - var(--border-width)); height: calc(100% - var(--border-width)); top: calc(0% + var(--border-width) / 2); left: calc(0% + var(--border-width) / 2); box-sizing: border-box; border-radius: 9999px; overflow: clip; background: linear-gradient(var(--angle-2), transparent 0%, oklch(from var(--background) l c h / 50%) 40% 50%, transparent 55%); z-index: 3; mix-blend-mode: screen; pointer-events: none; background-size: 200% 200%; background-position: 0% 50%; transition: background-position calc(var(--anim-time) * 1.25) var(--anim-ease), --angle-2 calc(var(--anim-time) * 1.25) var(--anim-ease); } .glass-button:hover .glass-button-text::after { background-position: 25% 50%; } .glass-button:active .glass-button-text::after { background-position: 50% 15%; --angle-2: -15deg; } .glass-button::after { content: ""; position: absolute; z-index: 1; inset: 0; border-radius: 9999px; width: calc(100% + var(--border-width)); height: calc(100% + var(--border-width)); top: calc(0% - var(--border-width) / 2); left: calc(0% - var(--border-width) / 2); padding: var(--border-width); box-sizing: border-box; background: conic-gradient(from var(--angle-1) at 50% 50%, oklch(from var(--foreground) l c h / 50%) 0%, transparent 5% 40%, oklch(from var(--foreground) l c h / 50%) 50%, transparent 60% 95%, oklch(from var(--foreground) l c h / 50%) 100%), linear-gradient(180deg, oklch(from var(--background) l c h / 50%), oklch(from var(--background) l c h / 50%)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: all var(--anim-time) var(--anim-ease), --angle-1 500ms ease; box-shadow: inset 0 0 0 calc(var(--border-width) / 2) oklch(from var(--background) l c h / 50%); pointer-events: none; } .glass-button:hover::after { --angle-1: -125deg; } .glass-button:active::after { --angle-1: -75deg; } .glass-button-wrap:has(.glass-button:hover) .glass-button-shadow { filter: blur(clamp(2px, 0.0625em, 6px)); } .glass-button-wrap:has(.glass-button:hover) .glass-button-shadow::after { top: calc(var(--shadow-cutoff-fix) - 0.875em); opacity: 1; } .glass-button-wrap:has(.glass-button:active) .glass-button-shadow { filter: blur(clamp(2px, 0.125em, 12px)); } .glass-button-wrap:has(.glass-button:active) .glass-button-shadow::after { top: calc(var(--shadow-cutoff-fix) - 0.5em); opacity: 0.75; } .glass-button-wrap:has(.glass-button:active) .glass-button-text { text-shadow: 0.025em 0.25em 0.05em oklch(from var(--foreground) l c h / 12%); } .glass-button-wrap:has(.glass-button:active) .glass-button { box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.125em 0.125em -0.125em oklch(from var(--foreground) l c h / 20%), 0 0 0.1em 0.25em inset oklch(from var(--background) l c h / 20%), 0 0.225em 0.05em 0 oklch(from var(--foreground) l c h / 5%), 0 0.25em 0 0 oklch(from var(--background) l c h / 75%), inset 0 0.25em 0.05em 0 oklch(from var(--foreground) l c h / 15%); } @media (hover: none) and (pointer: coarse) { .glass-button::after, .glass-button:hover::after, .glass-button:active::after { --angle-1: -75deg; } .glass-button .glass-button-text::after, .glass-button:active .glass-button-text::after { --angle-2: -45deg; } }
        `}</style>

            <div
                className={cn(
                    "flex h-full w-full flex-1 items-center justify-center bg-card",
                    "relative overflow-hidden",
                )}
            >
                <div className="absolute inset-0 z-0">
                    <GradientBackground />
                </div>
                <fieldset className="relative z-10 mx-auto flex w-[280px] flex-col items-center gap-8 p-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="email-content"
                            initial={{ y: 6, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="flex w-full flex-col items-center gap-4"
                        >
                            <BlurFade delay={0.25 * 1} className="w-full">
                                <div className="text-center">
                                    <p className="whitespace-nowrap font-light font-serif text-4xl text-foreground tracking-tight sm:text-5xl md:text-6xl">
                                        {t("login.title")}
                                    </p>
                                </div>
                            </BlurFade>
                            <BlurFade delay={0.25 * 2}>
                                <p className="font-medium text-muted-foreground text-sm">
                                    {t("login.subtitle")}
                                </p>
                            </BlurFade>
                            <BlurFade delay={0.25 * 3}>
                                <div className="flex w-full items-center justify-center gap-4">
                                    {/* Google button — active */}
                                    <GlassButton
                                        onClick={() =>
                                            signIn("google", {
                                                callbackUrl: "/home",
                                            })
                                        }
                                        contentClassName="flex items-center justify-center gap-2"
                                        size="sm"
                                    >
                                        <GoogleIcon />
                                        <span className="font-semibold text-foreground">
                                            Google
                                        </span>
                                    </GlassButton>
                                    {/* GitHub button — disabled, tooltip */}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span
                                                    tabIndex={0}
                                                    className="inline-flex"
                                                >
                                                    <GlassButton
                                                        disabled
                                                        onClick={() =>
                                                            signIn("github", {
                                                                callbackUrl:
                                                                    "/home",
                                                            })
                                                        }
                                                        contentClassName="flex items-center justify-center gap-2"
                                                        size="sm"
                                                    >
                                                        <GitHubIcon />
                                                        <span className="font-semibold text-foreground">
                                                            GitHub
                                                        </span>
                                                    </GlassButton>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                                <p>Work in progress</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </BlurFade>
                            <BlurFade delay={0.25 * 4} className="w-[300px]">
                                <div className="flex w-full items-center gap-2 py-2">
                                    <hr className="w-full border-border" />
                                    <span className="font-semibold text-muted-foreground text-xs">
                                        OR
                                    </span>
                                    <hr className="w-full border-border" />
                                </div>
                            </BlurFade>
                            <BlurFade delay={0.25 * 5} className="w-full">
                                <div className="flex w-full items-center justify-center">
                                    {/* MetaMask button — disabled, tooltip */}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span
                                                    tabIndex={0}
                                                    className="inline-flex"
                                                >
                                                    <GlassButton
                                                        disabled
                                                        contentClassName="flex items-center justify-center gap-2"
                                                        size="sm"
                                                    >
                                                        <MetamaskSVG
                                                            size={32}
                                                        />
                                                        <span className="font-semibold text-foreground">
                                                            Enter with MetaMask
                                                        </span>
                                                    </GlassButton>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                                <p>Work in progress</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </BlurFade>
                        </motion.div>
                    </AnimatePresence>
                </fieldset>
            </div>
        </div>
    );
};

export default function MetamaskSVG({
    size = 64,
    color = "currentColor",
    className = "",
    ...props
}) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            aria-hidden="true"
            role="img"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
            {...props}
        >
            <g fill="none">
                <path
                    fill="#ff5c16"
                    d="m19.821 19.918l-3.877-1.131l-2.924 1.712h-2.04l-2.926-1.712l-3.875 1.13L3 16.02l1.179-4.327L3 8.034L4.179 3.5l6.056 3.544h3.53L19.821 3.5L21 8.034l-1.179 3.658L21 16.02z"
                />
                <path
                    fill="#ff5c16"
                    d="m4.18 3.5l6.055 3.547l-.24 2.434zm3.875 12.52l2.665 1.99l-2.665.777zm2.452-3.286l-.512-3.251l-3.278 2.21h-.002v.001l.01 2.275l1.33-1.235zM19.82 3.5l-6.056 3.547l.24 2.434zm-3.875 12.52l-2.665 1.99l2.665.777zm1.339-4.326v-.002zl-3.279-2.21l-.512 3.25h2.451l1.33 1.236z"
                />
                <path
                    fill="#e34807"
                    d="m8.054 18.787l-3.875 1.13L3 16.022h5.054zm2.452-6.054l.74 4.7l-1.026-2.614l-3.497-.85l1.33-1.236zm5.44 6.054l3.875 1.13L21 16.022h-5.055zm-2.452-6.054l-.74 4.7l1.026-2.614l3.497-.85l-1.331-1.236z"
                />
                <path
                    fill="#ff8d5d"
                    d="m3 16.02l1.179-4.328h2.535l.01 2.276l3.496.85l1.026 2.613l-.527.576l-2.665-1.989H3zm18 0l-1.179-4.328h-2.535l-.01 2.276l-3.496.85l-1.026 2.613l.527.576l2.665-1.989H21zm-7.235-8.976h-3.53l-.24 2.435l1.251 7.95h1.508l1.252-7.95z"
                />
                <path
                    fill="#661800"
                    d="M4.179 3.5L3 8.034l1.179 3.658h2.535l3.28-2.211zm5.594 10.177H8.625l-.626.6l2.222.54zM19.821 3.5L21 8.034l-1.179 3.658h-2.535l-3.28-2.211zm-5.593 10.177h1.15l.626.6l-2.224.541zm-1.209 5.271l.262-.94l-.527-.575h-1.509l-.527.575l.262.94"
                />
                <path fill="#c0c4cd" d="M13.02 18.948V20.5h-2.04v-1.552z" />
                <path
                    fill="#e7ebf6"
                    d="m8.055 18.785l2.927 1.714v-1.552l-.262-.94zm7.89 0L13.02 20.5v-1.552l.262-.94z"
                />
            </g>
        </svg>
    );
}
