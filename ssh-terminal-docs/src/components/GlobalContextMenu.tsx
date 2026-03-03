import { useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useTheme } from "@/components/theme-provider"
import type { SiteConfig } from "@/lib/config"

// 默认配置
const defaultContextMenuConfig: Required<SiteConfig>["contextMenu"] = {
  enabled: true,
  page: {
    copyUrl: true,
    copyTitle: true,
    copyMarkdownLink: true,
    openInNewTab: true,
    reload: true,
    printPage: true,
    scrollToTop: true,
    scrollToBottom: true,
  },
  site: {
    goHome: true,
    quickNav: true,
    language: true,
  },
  appearance: {
    theme: true,
    resetThemePref: true,
  },
}

export function GlobalContextMenu({
  children,
  config,
}: {
  children: React.ReactNode
  config?: SiteConfig["contextMenu"]
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // ignore
    }
  }, [])

  const copyTitle = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(document.title || "")
    } catch {
      // ignore
    }
  }, [])

  const copyMarkdownLink = useCallback(async () => {
    try {
      const title = document.title || "Docs"
      const url = window.location.href
      await navigator.clipboard.writeText(`[${title}](${url})`)
    } catch {
      // ignore
    }
  }, [])

  const openInNewTab = useCallback(() => {
    window.open(window.location.href, "_blank")
  }, [])

  const reload = useCallback(() => {
    window.location.reload()
  }, [])

  const goHome = useCallback(() => navigate("/"), [navigate])

  const currentLang = (location.pathname.startsWith("/en") ? "en" : "zh-cn")

  const goLang = useCallback(
    (code: string) => {
      const parts = location.pathname.split("/").filter(Boolean)
      if (parts.length > 0 && (parts[0] === "en" || parts[0] === "zh-cn")) {
        parts[0] = code
      } else {
        parts.unshift(code)
      }
      navigate("/" + parts.join("/"))
    },
    [location.pathname, navigate]
  )

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), [])
  const scrollToBottom = useCallback(
    () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }),
    []
  )

  const printPage = useCallback(() => window.print(), [])

  const quickNav = useCallback((slug: string) => navigate(`/${currentLang}/${slug}`), [navigate, currentLang])

  const resetThemePref = useCallback(() => {
    try {
      localStorage.removeItem("vite-ui-theme")
    } catch {
      // ignore
    }
  }, [])

  // 合并配置
  const menuConfig = config?.enabled === false ? null : { ...defaultContextMenuConfig, ...config }

  // 如果菜单被禁用，直接返回 children
  if (!menuConfig) {
    return <div className="min-h-screen">{children}</div>
  }

  const pageConfig = { ...defaultContextMenuConfig.page, ...menuConfig.page }
  const siteConfig = { ...defaultContextMenuConfig.site, ...menuConfig.site }
  const appearanceConfig = { ...defaultContextMenuConfig.appearance, ...menuConfig.appearance }

  // 检查页面组是否有任何启用的项
  const hasPageItems = Object.values(pageConfig).some(Boolean)
  // 检查站点组是否有任何启用的项
  const hasSiteItems = Object.values(siteConfig).some(Boolean)
  // 检查外观组是否有任何启用的项
  const hasAppearanceItems = Object.values(appearanceConfig).some(Boolean)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="min-h-screen">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {/* 页面组 */}
        {hasPageItems && (
          <>
            <ContextMenuLabel>页面</ContextMenuLabel>
            <ContextMenuGroup>
              {pageConfig.copyUrl && <ContextMenuItem onClick={copyUrl}>复制当前链接</ContextMenuItem>}
              {pageConfig.copyTitle && <ContextMenuItem onClick={copyTitle}>复制页面标题</ContextMenuItem>}
              {pageConfig.copyMarkdownLink && <ContextMenuItem onClick={copyMarkdownLink}>复制 Markdown 链接</ContextMenuItem>}
              {pageConfig.openInNewTab && <ContextMenuItem onClick={openInNewTab}>在新标签页打开</ContextMenuItem>}
              {pageConfig.reload && <ContextMenuItem onClick={reload}>刷新</ContextMenuItem>}
              {pageConfig.printPage && <ContextMenuItem onClick={printPage}>打印页面</ContextMenuItem>}
              {(pageConfig.scrollToTop || pageConfig.scrollToBottom) && (
                <>
                  <ContextMenuSeparator />
                  {pageConfig.scrollToTop && <ContextMenuItem onClick={scrollToTop}>回到顶部</ContextMenuItem>}
                  {pageConfig.scrollToBottom && <ContextMenuItem onClick={scrollToBottom}>滚动到底部</ContextMenuItem>}
                </>
              )}
            </ContextMenuGroup>
          </>
        )}

        {/* 站点组 */}
        {hasSiteItems && (
          <>
            {hasPageItems && <ContextMenuSeparator />}
            <ContextMenuLabel>站点</ContextMenuLabel>
            <ContextMenuGroup>
              {siteConfig.goHome && <ContextMenuItem onClick={goHome}>返回首页</ContextMenuItem>}
              {siteConfig.quickNav && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>快速跳转</ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuItem onClick={() => quickNav("index")}>文档首页</ContextMenuItem>
                    <ContextMenuItem onClick={() => quickNav("guide")}>指南</ContextMenuItem>
                    <ContextMenuItem onClick={() => quickNav("guide/introduction")}>简介</ContextMenuItem>
                    <ContextMenuItem onClick={() => quickNav("guide/installation")}>安装</ContextMenuItem>
                    <ContextMenuItem onClick={() => quickNav("guide/quick-start")}>快速开始</ContextMenuItem>
                    <ContextMenuItem onClick={() => quickNav("guide/configuration")}>配置</ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )}
              {siteConfig.language && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>语言</ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuRadioGroup value={currentLang}>
                      <ContextMenuRadioItem value="en" onClick={() => goLang("en")}>English</ContextMenuRadioItem>
                      <ContextMenuRadioItem value="zh-cn" onClick={() => goLang("zh-cn")}>简体中文</ContextMenuRadioItem>
                    </ContextMenuRadioGroup>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )}
            </ContextMenuGroup>
          </>
        )}

        {/* 外观组 */}
        {hasAppearanceItems && (
          <>
            {(hasPageItems || hasSiteItems) && <ContextMenuSeparator />}
            <ContextMenuLabel>外观</ContextMenuLabel>
            <ContextMenuGroup>
              {appearanceConfig.theme && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>主题</ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuRadioGroup value={theme}>
                      <ContextMenuRadioItem value="light" onClick={() => setTheme("light")}>浅色</ContextMenuRadioItem>
                      <ContextMenuRadioItem value="dark" onClick={() => setTheme("dark")}>深色</ContextMenuRadioItem>
                      <ContextMenuRadioItem value="system" onClick={() => setTheme("system")}>跟随系统</ContextMenuRadioItem>
                    </ContextMenuRadioGroup>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )}
              {appearanceConfig.resetThemePref && <ContextMenuItem onClick={resetThemePref}>重置主题偏好</ContextMenuItem>}
            </ContextMenuGroup>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}


