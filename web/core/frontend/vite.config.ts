import tailwindcss from '@tailwindcss/vite';
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/static/",
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    css: false,
  },
  build: {
    manifest: "manifest.json",
    outDir: "../static/core/js/dist",
    rollupOptions: {
      input: {
        main: "./src/main.tsx",
      },
    },
  },
});
