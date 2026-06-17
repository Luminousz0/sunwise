import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Sunwise",
        short_name: "Sunwise",
        description:
          "Use your own solar — the best hours today to run power and make the most of your panels.",
        theme_color: "#f59e0b",
        background_color: "#0c0a09",
        display: "standalone",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // PVGIS typical solar profile — changes rarely, cache long
            urlPattern: /^https:\/\/re\.jrc\.ec\.europa\.eu\/api\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "pvgis",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Open-Meteo today's weather — short cache
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "open-meteo",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 30 },
            },
          },
          {
            // PDOK geocoding — cache a day
            urlPattern: /^https:\/\/api\.pdok\.nl\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "pdok",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
});
