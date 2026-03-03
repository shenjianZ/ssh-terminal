import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { getConfig, type SiteConfig } from "@/lib/config"
import { useTheme } from "@/components/theme-provider"

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams<{ lang: string }>()
  const lang = params.lang || (location.pathname.startsWith("/en") ? "en" : "zh-cn")
  const { setTheme } = useTheme()

  const [config, setConfig] = useState<SiteConfig | null>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const cfg = await getConfig(lang)
      if (!cancelled) setConfig(cfg)
    })()
    return () => { cancelled = true }
  }, [lang])

  const navItems = useMemo(() => {
    const items: { title: string; to: string }[] = []
    if (!config) return items
    const sidebar = config.sidebar
    const collections = sidebar?.collections
    const sections = collections?.guide?.sections ?? sidebar?.sections ?? []
    sections.forEach(section => {
      if (section.path) items.push({ title: section.title, to: `/${lang}${section.path}` })
      ;(section.children || []).forEach(child => {
        items.push({ title: child.title, to: `/${lang}${child.path}` })
      })
    })
    return items
  }, [config, lang])

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder={lang === "en" ? "Type a command or search..." : "输入命令或搜索..."} />
        <CommandList>
          <CommandEmpty>{lang === "en" ? "No results found." : "未找到结果"}</CommandEmpty>
          <CommandGroup heading={lang === "en" ? "Navigation" : "导航"}>
            {navItems.map(item => (
              <CommandItem key={item.to} onSelect={() => go(item.to)}>
                {item.title}
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={lang === "en" ? "Theme" : "主题"}>
            <CommandItem onSelect={() => setTheme("light")}>{lang === "en" ? "Light" : "浅色"}</CommandItem>
            <CommandItem onSelect={() => setTheme("dark")}>{lang === "en" ? "Dark" : "深色"}</CommandItem>
            <CommandItem onSelect={() => setTheme("system")}>{lang === "en" ? "System" : "跟随系统"}</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={lang === "en" ? "Actions" : "操作"}>
            <CommandItem onSelect={() => { setOpen(false); window.location.reload() }}>
              {lang === "en" ? "Reload Page" : "刷新页面"}
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigator.clipboard.writeText(window.location.href) }}>
              {lang === "en" ? "Copy URL" : "复制链接"}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}


