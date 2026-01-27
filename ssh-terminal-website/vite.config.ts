import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 部署配置
  // 如果仓库名是 'ssh-terminal-website'，使用 '/ssh-terminal-website/'
  // 如果是作为项目主页，使用 '/'
  base: '/ssh-terminal-website/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
