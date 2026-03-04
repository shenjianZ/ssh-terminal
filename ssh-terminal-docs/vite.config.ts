// @ts-nocheck
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "src",
      buffer: "buffer/",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
})


