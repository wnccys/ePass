# Design System & Visual Identity: ePass Web App

This document outlines the visual identity, color tokens, typography, and components defining the user interface of the **ePass** application.

---

## 1. Visual Theme & Aesthetics

ePass uses a **"Neon-Forest Web3"** aesthetic. The design combines deep, organic greens with vibrant neon lime accents, creating a high-contrast, premium, dark-mode-first environment tailored to on-chain sports assets.

### Key Visual Elements:
* **Interactive Grain Shaders**: The home screen uses `@paper-design/shaders-react` to render a dynamic canvas `GrainGradient` mixing deep pine green (`hsl(167, 59%, 14%)`) with bright neon lime (`hsl(67, 87%, 59%)`).
* **Glassmorphism & Overlays**: Clean overlay filters (`bg-foreground/5`) and modern borders provide hierarchy over the animated shader background.

---

## 2. Color Palette (OKLCH Tokens)

The application colors are defined as custom Tailwind CSS v4 variables in `app/globals.css`.

| Color Family | OKLCH/Hex Reference | Usage |
| :--- | :--- | :--- |
| **Lemon Lime** | `oklch(89.95% 0.206 117.22)` (~`#ddf23c`) | Primary accents, highlights, button highlights, and interactive states. |
| **Evergreen** | `oklch(75.73% 0.132 174.13)` (~`#0f3a31`) | Main dark backgrounds, cards, and deep structural surfaces. |
| **Pacific Blue** | `oklch(80.90% 0.136 205.59)` (~`#0fa3b1`) | Secondary call-to-actions, status tags, and highlight accents. |
| **Taupe Grey** | `oklch(58.85% 0.034 35.52)` (~`#65524d`) | Muted typography, inactive tab indicators, and borders. |
| **Alabaster Grey**| `oklch(58.86% 0.011 286.07)` (~`#dedee0`) | Secondary text, slate grey borders, and neutral overlays. |

---

## 3. Typography

Fonts are initialized in the root layout using Next.js local and Google Font loaders:

* **Primary Font (`--font-rodin`)**: Loaded locally via `RodinProB.otf`. Used as the structural display and branding font for headers, navigation, and core telemetry.
* **Serif Font (`--font-serif`)**: Loaded via Google `Merriweather`. Applied to body text and descriptors to provide a classic editorial feel.
* **Heading Font (`--font-heading`)**: Loaded via Google `Noto Serif`. Exclusively reserved for titles, dashboard blocks, and page headings.

---

## 4. UI Registries & Layouts

The frontend builds on top of Shadcn UI primitives, customized via custom OKLCH mapping definitions, alongside styled elements from web3 registries:

* **Primitives**: [Shadcn UI](https://ui.shadcn.com) and [Shadcn Space](https://shadcnspace.com/).
* **Layout Blocks & Cards**: [21st.dev](https://21st.dev/) (integrating specialized layouts like pricing grids, glass cards, and immersive video heroes).
* **Theme Preset Configuration**: Shared configuration details are mapped to the custom [Shadcn Preset](https://ui.shadcn.com/create?preset=b5D92K6mXo).

---

## 5. Design Inspirations & References

The application's structural grids and dark-mode styling are influenced by:
* **[Anticapture](https://anticapture.com/)**: Clean typographic layouts, thin borders, and structured information hierarchy.
* **[Swaplace](https://swaplace-frontend.vercel.app/)**: Immersive Web3 wallet interactions and swap flow overlays.
