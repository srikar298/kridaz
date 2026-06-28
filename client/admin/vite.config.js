import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@kridaz/ui/styles": path.resolve(__dirname, "../../packages/ui/styles"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@": path.resolve(__dirname, "./src"),
      "@components/layout": path.resolve(
        __dirname,
        "./src/shared/components/layout"
      ),
      "@components": path.resolve(__dirname, "../user/src/shared/components"),
      "@hooks/useAxiosInstance": path.resolve(
        __dirname,
        "../user/src/infrastructure/axios.js"
      ),
      "@user/hooks/useAxiosInstance": path.resolve(
        __dirname,
        "../user/src/infrastructure/axios.js"
      ),
      "@hooks": path.resolve(__dirname, "../user/src/shared/hooks"),
      "@utils": path.resolve(__dirname, "../user/src/shared/utils"),
      "@layouts": path.resolve(__dirname, "./src/shared/layouts"),
      "@services": path.resolve(__dirname, "../user/src/shared/services"),
      "@infrastructure": path.resolve(__dirname, "../user/src/infrastructure"),
      "@lib": path.resolve(__dirname, "../user/src/shared/lib"),
      "@redux/api": path.resolve(__dirname, "../user/src/redux/api"),
      "@redux": path.resolve(__dirname, "./src/redux"),
      "@pages": path.resolve(__dirname, "../user/src/pages"),
      "@features/admin": path.resolve(__dirname, "./src/features/admin"),
      "@features/auth": path.resolve(__dirname, "./src/features/auth"),
      "@features": path.resolve(__dirname, "../user/src/features"),
      "@context": path.resolve(__dirname, "../user/src/context"),
    },
  },
  server: {
    port: 5175,
    proxy: {
      "/api": {
        target: "http://localhost:6001",
        changeOrigin: true,
      },
    },
  },
});
