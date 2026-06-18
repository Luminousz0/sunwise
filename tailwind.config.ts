import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark green palette — iOS-native feel
        canvas: "#063A2A",      // page background base
        surface: "#0A4830",     // card / raised surface (for skeleton)
        "surface-2": "#0C5538", // elevated fills / hover
        line: "#165c3a",        // borders
        "line-2": "#1a7a4e",    // slightly lighter borders

        // White text — use /opacity variants for hierarchy
        warm: "#ffffff",        // primary: text-warm  secondary: text-warm/60  muted: text-warm/35

        // Emerald accent palette
        gold: "#10B981",        // emerald-500 — solar / best hours
        "gold-soft": "#34D399", // emerald-400 — lighter accent
        go: "#10B981",          // solar active
        caution: "#FBBF24",     // amber — upcoming window
        stop: "#EF4444",        // red — no production
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        glass: "8px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.20), 0 1px 3px rgba(0,0,0,0.25)",
        sheet: "0 -8px 48px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
} satisfies Config;
