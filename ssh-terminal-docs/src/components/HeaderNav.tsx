import { Github } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { useTheme } from "@/components/theme-provider"

import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ModeToggle } from "@/components/mode-toggle"
import { buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Define SiteConfig types locally as they are not available in the Vite project
interface SiteConfig {
  site: {
    title: string
    logo: string | { light: string; dark: string }
  }
  navbar: {
    showLogo?: boolean
    showTitle?: boolean
    showLanguageSwitcher?: boolean
    items: {
      title: string
      link: string
      external?: boolean
      visible?: boolean
    }[]
    actions?: {
      type?: "github" | "custom"
      title?: string
      link: string
      icon?: string
      enabled?: boolean
    }[]
  }
  theme?: {
    allowToggle?: boolean
  }
}

interface HeaderNavProps {
  lang: string
  site: SiteConfig["site"]
  navbar: SiteConfig["navbar"]
  themeConfig?: { allowToggle?: boolean }
}

export function HeaderNav({ lang, site, navbar, themeConfig }: HeaderNavProps) {
  const location = useLocation()
  const pathname = location.pathname
  const { theme } = useTheme()
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setResolvedTheme(isDark ? "dark" : "light")
    } else {
      setResolvedTheme(theme)
    }
  }, [theme])
  const normalizeLogoPath = (p: string) => (p.startsWith("http") ? p : `/${p.replace(/^\//, "")}`)
  const { light: logoLight, dark: logoDark } =
    typeof site.logo === "string"
      ? {
          light: normalizeLogoPath(site.logo),
          dark: normalizeLogoPath(site.logo),
        }
      : {
          light: normalizeLogoPath(site.logo.light),
          dark: normalizeLogoPath(site.logo.dark),
        }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-8">
        {(((navbar.showLogo ?? true) as boolean) || ((navbar.showTitle ?? true) as boolean)) && (
          <Link to={`/${lang}`} className="mr-6 flex items-center space-x-2">
            {(navbar.showLogo ?? true) && (
              <img
                src={resolvedTheme === "dark" ? logoDark : logoLight}
                alt={site.title}
                width={24}
                height={24}
              />
            )}
            {(navbar.showTitle ?? true) && (
              <span className="font-bold sm:inline-block">{site.title}</span>
            )}
          </Link>
        )}
        <nav className="ml-6 flex items-center space-x-6 text-sm font-medium">
          {navbar.items.filter(i => i.visible !== false).map(
            item =>
              !item.external && (
                <Link
                  key={item.link}
                  to={`/${lang}${item.link}`}
                  className={cn(
                    "transition-colors hover:text-foreground/80",
                    pathname === `/${lang}${item.link}`
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                >
                  {item.title}
                </Link>
              )
          )}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            {(navbar.actions || [])
              .filter(action => action.enabled !== false)
              .map((action, idx) => {
                const title = action.title || (action.type === "github" ? "GitHub" : "Action")
                return (
                  <TooltipProvider key={action.link || `${action.type || 'action'}-${idx}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={action.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={title}
                        >
                          <div
                            className={cn(
                              buttonVariants({ variant: "ghost" }),
                              "w-9 px-0"
                            )}
                          >
                            {action.type === "github" ? (
                              <Github className="h-4 w-4" />
                            ) : (
                              <span className="text-sm">{title}</span>
                            )}
                          </div>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent align="center">{title}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            {navbar.showLanguageSwitcher !== false && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <LanguageSwitcher />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent align="center">切换语言</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {(themeConfig?.allowToggle ?? true) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ModeToggle />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent align="center">切换主题</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
