import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/static/",
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
