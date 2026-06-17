import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm dark palette — lighter than Farmcast, iOS-premium feel
        canvas: "#1a1610",      // page background
        surface: "#231d14",     // card / raised surface
        "surface-2": "#2c2520", // elevated fills / hover
        line: "#3a3025",        // borders
        "line-2": "#4a3d2e",    // slightly lighter borders

        // Warm off-white text — use /opacity variants for hierarchy
        warm: "#f2ead8",        // primary: text-warm  secondary: text-warm/60  muted: text-warm/35

        // Solar accent palette — natural, not neon
        gold: "#d6a24a",        // wheat-gold — solar / best hours
        "gold-soft": "#e8bf6a", // lighter gold
        go: "#6aa84f",          // field green — solar active
        caution: "#e2902b",     // harvest ochre — upcoming window
        stop: "#cf5a3e",        // terracotta — no production
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter Tight", "Inter", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        glass: "16px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.4)",
        sheet: "0 -8px 48px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
} satisfies Config;
