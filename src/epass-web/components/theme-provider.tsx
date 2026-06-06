"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// next-themes v0.4.x renders a <script> tag for FOUC prevention which triggers
// a React 19 warning. Suppressed here since it's a library limitation, not a bug.
if (typeof window !== "undefined") {
  const _consoleError = console.error.bind(console)
  console.error = (...args: Parameters<typeof console.error>) => {
    if (typeof args[0] === "string" && args[0].includes("script tag")) return
    _consoleError(...args)
  }
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}