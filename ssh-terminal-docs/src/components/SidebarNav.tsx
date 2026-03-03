import { ChevronRight } from "lucide-react"
import * as React from "react"
import { Link, useLocation } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

// Define SiteConfig types locally
interface SiteConfig {
  sidebar: {
    enabled?: boolean
    sections?: {
      title: string
      path?: string
      children?: {
        title: string
        path: string
      }[]
    }[]
    collections?: Record<
      string,
      {
        sections: {
          title: string
          path?: string
          children?: {
            title: string
            path: string
          }[]
        }[]
      }
    >
  }
}

interface SidebarNavProps {
  lang: string
  sidebar: SiteConfig["sidebar"]
}

export function SidebarNav({ lang, sidebar }: SidebarNavProps) {
  const location = useLocation()
  const pathname = location.pathname

  // 解析当前一级分类（如 /en/guide/xxx => guide）
  const firstSegment = React.useMemo(() => {
    const parts = pathname.split("/").filter(Boolean)
    // parts[0] 语言，parts[1] 可能是一级分类
    return parts.length >= 2 ? parts[1] : ""
  }, [pathname])

  // 根据 collections 匹配对应侧边栏；否则回退到全局 sections
  const resolvedSections = React.useMemo(() => {
          if (!sidebar) return null
          const byCollection = sidebar.collections?.[firstSegment]?.sections
          const byGlobal = sidebar.sections
          return byCollection && byCollection.length > 0 ? byCollection : byGlobal
        }, [sidebar, firstSegment])
  const isSidebarEnabled = React.useMemo(() => {
    if (!sidebar) return false
    if (typeof sidebar.enabled === "boolean") return sidebar.enabled
    return Boolean(resolvedSections && resolvedSections.length > 0)
  }, [sidebar, resolvedSections])

  if (!isSidebarEnabled || !resolvedSections) {
    return null
  }

  return (
    <div className="w-full">
      {resolvedSections.map(section => (
        <Collapsible
          key={section.title}
          defaultOpen={section.path ? pathname.startsWith(`/${lang}${section.path}`) : false}
        >
          {section.path ? (
            <CollapsibleTrigger asChild>
              <Link
                to={`/${lang}${section.path}`}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 font-medium text-sm hover:bg-muted"
              >
                <span>{section.title}</span>
                <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
              </Link>
            </CollapsibleTrigger>
          ) : (
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 font-medium text-sm hover:bg-muted">
              {section.title}
              <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
            </CollapsibleTrigger>
          )}
          <CollapsibleContent className="py-1 pl-4">
            <div className="grid grid-flow-row auto-rows-max text-sm">
              {(section.children || []).map(item => {
                const to = `/${lang}${item.path}`
                return (
                  <Link
                    key={item.path}
                    to={to}
                    className={cn(
                      "group flex w-full items-center rounded-md border border-transparent px-3 py-2 hover:underline transition-colors",
                      pathname === to
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.title}
                  </Link>
                )
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}
