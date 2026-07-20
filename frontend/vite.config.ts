import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: "localhost",
    proxy: {
      // Proxy API calls to FastAPI in development
      "/api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks(id) {
          if (id.includes("node_modules/react-dom")) return "react";
          if (id.includes("node_modules/react/")) return "react";
          if (id.includes("node_modules/react-router-dom")) return "router";
          if (id.includes("node_modules/@tanstack/react-query")) return "query";
          if (id.includes("node_modules/framer-motion")) return "motion";
        },
      },
    },
  },
});
