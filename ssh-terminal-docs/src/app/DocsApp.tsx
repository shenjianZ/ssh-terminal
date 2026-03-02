import React, { useEffect, useMemo, useState } from "react"
import {
  createBrowserRouter,
  RouterProvider,
  useParams,
  Outlet,
} from "react-router-dom"

import { DocsLayout } from "../components/DocsLayout"
import { ThemeProvider } from "../components/theme-provider"
import { GlobalContextMenu } from "../components/GlobalContextMenu"
import { CommandMenu } from "../components/CommandMenu"
import { MdxContent } from "../components/MdxContent"
import { getConfig, type SiteConfig } from "../lib/config"

// 简单的 markdown frontmatter 解析函数，不依赖 Buffer
function parseMarkdownFrontmatter(markdown: string): { data: Record<string, any>; content: string } {
  const lines = markdown.split('\n')
  let frontmatterData: Record<string, any> = {}
  let contentStart = 0
  
  // 检查是否有 frontmatter
  if (lines[0]?.startsWith('---')) {
    let i = 1
    while (i < lines.length && !lines[i]?.startsWith('---')) {
      const line = lines[i]
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()
        // 尝试解析值类型
        if (value === 'true' || value === 'false') {
          frontmatterData[key] = value === 'true'
        } else if (!isNaN(Number(value))) {
          frontmatterData[key] = Number(value)
        } else {
          frontmatterData[key] = value
        }
      }
      i++
    }
    if (i < lines.length && lines[i]?.startsWith('---')) {
      contentStart = i + 1
    }
  }
  
  return {
    data: frontmatterData,
    content: lines.slice(contentStart).join('\n')
  }
}

function RootShell(): React.JSX.Element {
  const [contextMenuConfig, setContextMenuConfig] = useState<SiteConfig["contextMenu"] | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const loadedConfig = await getConfig("zh-cn")
        if (!cancelled) {
          setContextMenuConfig(loadedConfig?.contextMenu)
        }
      } catch (error) {
        console.error("Error loading context menu config:", error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <GlobalContextMenu config={contextMenuConfig}>
        <CommandMenu />
        <Outlet />
      </GlobalContextMenu>
    </ThemeProvider>
  )
}

function DocsPage() {
  const params = useParams<{ lang: string; "*": string }>()
  const langParam = params.lang
  const slug = params["*"]

  const currentLang = useMemo(() => langParam || "zh-cn", [langParam])

  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [content, setContent] = useState("")
  const [frontmatter, setFrontmatter] = useState<any>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setConfigLoading(true)

    ;(async () => {
      try {
        const loadedConfig = await getConfig(currentLang)
        if (!cancelled) {
          setConfig(loadedConfig)
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setConfig(null)
        }
      } finally {
        if (!cancelled) setConfigLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentLang])

  useEffect(() => {
    let cancelled = false
    setContentLoading(true)

    const pageSlug = slug || "index"
    const docPath = `/docs/${currentLang}/${pageSlug}.md`

    ;(async () => {
      try {
        console.log("Fetching document:", docPath)
        const response = await fetch(docPath)
        const contentType = response.headers.get("content-type")

        if (
          !response.ok ||
          !contentType ||
          (!contentType.includes("text/markdown") &&
            !contentType.includes("text/plain"))
        ) {
          throw new Error(
            `File not found or invalid content type for: ${docPath}`
          )
        }

        const markdown = await response.text()
        if (cancelled) return
        
        console.log("Parsing markdown with custom parser...")
        
        // 使用自定义的解析函数，避免 Buffer 依赖
        const { data, content } = parseMarkdownFrontmatter(markdown)
        setFrontmatter(data)
        setContent(content)
        
      } catch (error) {
        console.error("Error loading document:", error)
        if (cancelled) return
        const errorMessage =
          "# 404 - Not Found\n\nThe page you're looking for at `" +
          docPath +
          "` could not be found."
        setContent(errorMessage)
        setFrontmatter({ title: "Not Found" })
      } finally {
        if (!cancelled) setContentLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentLang, slug])

  if (configLoading && !config) {
    return <div>Loading...</div>
  }

  return (
    <DocsLayout lang={currentLang} config={config!} frontmatter={frontmatter}>
      {contentLoading && !content ? (
        <div>Loading...</div>
      ) : (
        <MdxContent source={content} />
      )}
    </DocsLayout>
  )
}

export function DocsApp(): React.JSX.Element {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: <RootShell />,
          children: [
            { index: true, element: <DocsPage /> },
            { path: ":lang", element: <DocsPage /> },
            { path: ":lang/*", element: <DocsPage /> },
          ],
        },
      ]),
    []
  )

  return <RouterProvider router={router} />
}


