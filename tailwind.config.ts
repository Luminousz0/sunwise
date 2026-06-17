import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark premium palette
        canvas: "#0c0c16",
        surface: "#12121e",
        "surface-2": "#1a1a2a",
        line: "#22223a",
        "line-2": "#2e2e4a",
        // Text hierarchy on dark
        "ink-1": "#eaeaf5",
        "ink-2": "#8a8aaa",
        "ink-3": "#484868",
        // Solar accent — amber stays vivid on dark
        sun: "#f59e0b",
        "sun-soft": "#fbbf24",
        "sun-warm": "#fb923c",
        "sun-ink": "#f59e0b",
        // Other accents — brighter for dark backgrounds
        leaf: "#34d399",
        cheap: "#34d399",
        pricey: "#f87171",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.5)",
        glow: "0 0 28px rgba(245,158,11,0.45), 0 0 8px rgba(245,158,11,0.25)",
        "glow-sm": "0 0 12px rgba(245,158,11,0.3)",
        "glow-leaf": "0 0 20px rgba(52,211,153,0.3)",
        sheet: "0 -8px 48px rgba(0,0,0,0.8)",
      },
    },
  },
  plugins: [],
} satisfies Config;
