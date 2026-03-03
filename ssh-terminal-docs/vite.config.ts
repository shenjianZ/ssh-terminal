import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"

// https://vite.dev/config/
export default defineConfig({
  appType: "spa",
  plugins: [react(), tailwindcss(), nodePolyfills()],
  publicDir: "public",
  build: {
    copyPublicDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer/",
    },
  },
  define: {
    global: "globalThis",
  },
})
