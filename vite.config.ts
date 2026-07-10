import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages отдаёт проект по пути /<имя-репо>/ — назови репозиторий "pospat"
// или поменяй base ниже на "/<имя-репо>/".
export default defineConfig({
  base: "/pospat/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: { importScripts: ["push-sw.js"] },
      manifest: {
        name: "pospat — бодрость на доступном сне",
        short_name: "pospat",
        lang: "ru",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#0e1116",
        theme_color: "#0e1116",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});
