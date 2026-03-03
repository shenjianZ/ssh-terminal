import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import App from "./App.tsx"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error types provided via ambient declaration
import yaml from "js-yaml"
import "./index.css"

async function bootstrap() {
  try {
    const stored = localStorage.getItem("vite-ui-theme")
    if (!stored) {
      // 基于当前 URL 的语言段加载对应配置（/config/site.[lang].yaml），否则回退到默认
      const parts = window.location.pathname.split("/").filter(Boolean)
      const lang = parts[0] === "en" || parts[0] === "zh-cn" ? parts[0] : "zh-cn"
      const filePath = `/config/site${lang === "zh-cn" ? "" : "." + lang}.yaml`

      const tryFetch = async (path: string) => {
        const r = await fetch(path)
        return r.ok ? r : null
      }

      const res = (await tryFetch(filePath)) || (await tryFetch(`/config/site.yaml`))
      if (res) {
        const text = await res.text()
        const cfg = yaml.load(text) as any
        const mode = cfg?.theme?.defaultMode
        const normalized = mode === "auto" ? "system" : mode
        if (normalized === "light" || normalized === "dark" || normalized === "system") {
          localStorage.setItem("vite-ui-theme", normalized)
        }
      }
    }
  } catch (e) {
    // 忽略错误，使用 ThemeProvider 默认值
    console.error("Failed to initialize theme from config:", e)
  }

  createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
  )
}

bootstrap()