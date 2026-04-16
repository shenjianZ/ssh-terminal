// @ts-nocheck
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { mdxComponentsPlugin } from "./vite-plugin-mdx-components"

function publicHmrPlugin() {
  return {
    name: 'public-hmr',
    configureServer(server) {
      const publicDir = path.resolve(__dirname, 'public')
      const configDir = path.resolve(publicDir, 'config')
      const docsDir = path.resolve(publicDir, 'docs')

      server.watcher.add([configDir, docsDir])

      const isTargetFile = (file) => {
        const relativePath = path.relative(publicDir, file)
        return (
          relativePath.startsWith('config' + path.sep) && file.endsWith('.yaml')
        ) || (
          relativePath.startsWith('docs' + path.sep) &&
          (file.endsWith('.md') || file.endsWith('.mdx'))
        )
      }

      const triggerReload = (file) => {
        if (isTargetFile(file)) {
          server.ws.send({ type: 'full-reload', path: '*' })
        }
      }

      server.watcher.on('change', triggerReload)
      server.watcher.on('add', triggerReload)
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    mdxComponentsPlugin({
      componentsPath: './src/components',
      outputPath: './src/generated/mdx-components.ts'
    }),
    publicHmrPlugin()
  ],
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
  build: {
    // 提高 chunk 大小警告的阈值到 2000 kB
    chunkSizeWarningLimit: 2000
  }
})