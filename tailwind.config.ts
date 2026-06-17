import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Solar / warm palette — single source of truth, mirrored in src/lib/theme.ts
        night: "#0c0a09",
        dusk: "#1c1917",
        sun: "#f59e0b",
        "sun-bright": "#fbbf24",
        leaf: "#22c55e",
        cheap: "#22c55e",
        pricey: "#ef4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
