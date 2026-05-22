import * as React from "react";
import { cn } from "@/lib/utils";
import { WEBP_DISPLACEMENT_MAP } from "./liquid-glass-button";

export interface LiquidGlassNavbarProps extends React.HTMLAttributes<HTMLElement> {
  contentClassName?: string;
  glassColor?: string; // e.g. "oklch(from var(--foreground) l c h / 10%)"
}

const LiquidGlassNavbar = React.forwardRef<HTMLElement, LiquidGlassNavbarProps>(
  ({ className, children, contentClassName, glassColor, ...props }, ref) => {
    // Generate a unique ID so multiple filters don't conflict
    const filterId = React.useId().replace(/:/g, "");

    return (
      <>
        {/* INVISIBLE SVG FILTER DEFINITION */}
        <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <filter id={`liquid-glass-nav-${filterId}`} primitiveUnits="objectBoundingBox">
            <feImage
              result="map"
              width="100%"
              height="100%"
              x="0"
              y="0"
              href={WEBP_DISPLACEMENT_MAP}
              preserveAspectRatio="none"
            />
            {/* The pre-blur helps smooth out the underlying image before refraction */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.01" result="blur" />
            <feDisplacementMap
              id="disp"
              in="blur"
              in2="map"
              scale="0.5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>

        <style>{`
          .nav-liquid {
            appearance: none;
            border: none;
            background: transparent;
            color: oklch(from var(--foreground) l c h / 95%);
            --glass-reflex-light: 1;
            --glass-reflex-dark: 1;
            position: relative;
            isolate: auto;
          }

          /*
             THE LENS LAYER (-z-10)
          */
          .nav-liquid-lens {
            /* If no glassColor is provided, default to a subtle, neutral frosted glass */
            background-color: ${glassColor || "oklch(from var(--foreground) l c h / 5%)"};

            /* Chrome/Edge mathematically refracts via the SVG. Safari falls back to blur. */
            backdrop-filter: blur(8px) url(#liquid-glass-nav-${filterId}) saturate(150%);
            -webkit-backdrop-filter: blur(8px) saturate(150%);

            /* The intricate, highly realistic Box Shadow stack from the CodePen */
            box-shadow:
              inset 0 0 0 1px color-mix(in srgb, white calc(var(--glass-reflex-light) * 10%), transparent),
              inset 1.8px 3px 0px -2px color-mix(in srgb, white calc(var(--glass-reflex-light) * 90%), transparent),
              inset -2px -2px 0px -2px color-mix(in srgb, white calc(var(--glass-reflex-light) * 80%), transparent),
              inset -3px -8px 1px -6px color-mix(in srgb, white calc(var(--glass-reflex-light) * 60%), transparent),
              inset -0.3px -1px 4px 0px color-mix(in srgb, black calc(var(--glass-reflex-dark) * 12%), transparent),
              inset -1.5px 2.5px 0px -2px color-mix(in srgb, black calc(var(--glass-reflex-dark) * 20%), transparent),
              inset 0px 3px 4px -2px color-mix(in srgb, black calc(var(--glass-reflex-dark) * 20%), transparent),
              inset 2px -6.5px 1px -4px color-mix(in srgb, black calc(var(--glass-reflex-dark) * 10%), transparent),
              0px 1px 5px 0px color-mix(in srgb, black calc(var(--glass-reflex-dark) * 10%), transparent),
              0px 6px 16px 0px color-mix(in srgb, black calc(var(--glass-reflex-dark) * 8%), transparent);

            transition: background-color 400ms cubic-bezier(1, 0.0, 0.4, 1), box-shadow 400ms cubic-bezier(1, 0.0, 0.4, 1);
          }

          /* Text Layer: Floats cleanly above the glass */
          .nav-liquid-text {
            text-shadow: 0 1px 2px oklch(from var(--background) l c h / 30%);
            transition: color 400ms cubic-bezier(1, 0.0, 0.4, 1);
          }
        `}</style>

        <nav
          className={cn("nav-liquid inline-flex relative isolate rounded-full tracking-tight hover:scale-105 transition-all duration-150", className)}
          ref={ref}
          {...props}
        >
          {/* ISOLATED BACKGROUND LENS */}
          <span className="nav-liquid-lens absolute inset-0 -z-10 rounded-[inherit] pointer-events-none" />

          {/* CONTENT (Composited safely ABOVE the backdrop filter) */}
          <div className={cn("nav-liquid-text relative z-10 w-full flex items-center justify-between gap-4 px-8 py-4 font-medium", contentClassName)}>
            {children}
          </div>
        </nav>
      </>
    );
  }
);
LiquidGlassNavbar.displayName = "LiquidGlassNavbar";

export { LiquidGlassNavbar };