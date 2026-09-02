import { fileURLToPath, URL } from "node:url";
import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";

const ZERO_BAP_API_ORIGIN = "https://zerobap.bap.net.pe";

const apiProxy: Record<string, string | ProxyOptions> = {
  "/api": {
    target: ZERO_BAP_API_ORIGIN,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: "",
    timeout: 30_000,
    proxyTimeout: 30_000,
  },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
});
