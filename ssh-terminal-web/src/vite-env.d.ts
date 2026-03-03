/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API 基础 URL
  // 如果留空则使用相对路径，由 Nginx/Vite 代理到本地开发服务器
  // 如果指定了值，则直接访问该地址，禁用代理
  readonly VITE_API_BASE_URL: string

  // 开发服务器配置（仅在 Vite 配置中可用）
  readonly DEV_HOST?: string
  readonly DEV_PORT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}