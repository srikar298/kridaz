// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(
        isProduction ? "https://api.kridaz.com" : "http://localhost:6001"
      ),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        includeAssets: ["favicon.png", "logo.png"],
        manifest: {
          name: "Kridaz - Play Beyond Limits",
          short_name: "Kridaz",
          description:
            "Kridaz is the ultimate sports community platform for players and venue owners.",
          display: "standalone",
          background_color: "#000000",
          theme_color: "#ff5722",
          orientation: "portrait",
          icons: [
            {
              src: "/favicon.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/logo.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
          categories: ["sports", "social", "lifestyle"],
          shortcuts: [
            {
              name: "Book Turf",
              url: "/book-turf",
              icons: [{ src: "/favicon.png", sizes: "192x192" }],
            },
            {
              name: "Live Map",
              url: "/find-players",
              icons: [{ src: "/favicon.png", sizes: "192x192" }],
            },
          ],
        },
      }),
    ],
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@app": path.resolve(__dirname, "./src/app"),
        "@components": path.resolve(__dirname, "./src/shared/components"),
        "@hooks/useAxiosInstance": path.resolve(
          __dirname,
          "./src/infrastructure/axios.js"
        ),
        "@user/hooks/useAxiosInstance": path.resolve(
          __dirname,
          "./src/infrastructure/axios.js"
        ),
        "@hooks": path.resolve(__dirname, "./src/shared/hooks"),
        "@utils": path.resolve(__dirname, "./src/shared/utils"),
        "@layouts": path.resolve(__dirname, "./src/shared/layouts"),
        "@services": path.resolve(__dirname, "./src/shared/services"),
        "@infrastructure": path.resolve(__dirname, "./src/infrastructure"),
        "@lib": path.resolve(__dirname, "./src/shared/lib"),
        "@redux": path.resolve(__dirname, "./src/redux"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@features": path.resolve(__dirname, "./src/features"),
        "@context": path.resolve(__dirname, "./src/context"),
        "@user/components": path.resolve(__dirname, "./src/shared/components"),
        "@user/pages": path.resolve(__dirname, "./src/pages"),
        "@user/layouts": path.resolve(__dirname, "./src/shared/layouts"),
        "@user/hooks": path.resolve(__dirname, "./src/shared/hooks"),
        "@user/utils": path.resolve(__dirname, "./src/shared/utils"),
        "@user/services": path.resolve(__dirname, "./src/shared/services"),
        "@user": path.resolve(__dirname, "./src"),
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:6001",
          changeOrigin: true,
        },
        "/r2-reels": {
          target: "https://pub-cc243bd179ab45ee94097baeca380dd4.r2.dev",
          changeOrigin: true,
          secure: false, // Avoid SSL issues in dev proxy
          ws: true, // Support websockets if needed
          rewrite: (path) => path.replace(/^\/r2-reels/, ""),
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("proxy error", err);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              // console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              // console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
  };
});
