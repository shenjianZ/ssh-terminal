import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import envCompatible from 'vite-plugin-env-compatible'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const API_BASE_URL = env.API_BASE_URL || ''

  // 如果 API_BASE_URL 有值，则禁用代理（直接访问远程服务器）
  const useProxy = !API_BASE_URL

  return {
    plugins: [
      vue(),
      envCompatible({
        enabled: true,
        prefix: ''
      }),
      AutoImport({
        imports: [
          'vue',
          'vue-router',
          'pinia',
          {
            'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar']
          }
        ],
        dts: 'src/auto-imports.d.ts',
        eslintrc: {
          enabled: true
        }
      }),
      Components({
        resolvers: [NaiveUiResolver()],
        dts: 'src/components.d.ts'
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      }
    },
    define: {
      'import.meta.env.API_BASE_URL': JSON.stringify(API_BASE_URL)
    },
    server: {
      host: process.env.DEV_HOST || '0.0.0.0',
      port: parseInt(process.env.DEV_PORT || '5173'),
      proxy: useProxy ? {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        '/auth': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      } : undefined
    }
  }
})