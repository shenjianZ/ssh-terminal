import { Link } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  Globe,
  Github,
  Mail,
  Tv,
  MessageCircle,
  MessageSquare,
  Youtube,
  Twitter,
  Send,
  Video,
  BookOpen,
  Flame,
} from "lucide-react"

type FooterLink = { title: string; link: string; external?: boolean; action?: "scrollTop" }
type FooterGroup = { title: string; items: FooterLink[] }

interface FooterConfig {
  enabled?: boolean
  copyright?: string
  repository?: {
    url?: string
    branch?: string
  }
  lastUpdated?: string
  version?: string
  groups?: FooterGroup[]
  links?: FooterLink[]
  social?: {
    name: string
    url: string
    icon?: string
  }[]
}

interface FooterProps {
  footer?: FooterConfig
  lang: string
}

export function Footer({ footer, lang }: FooterProps) {
  if (!footer || footer.enabled === false) return null

  const links = footer.links || []
  const social = footer.social || []
  const groups: FooterGroup[] = footer.groups || []
  const isScrollTop = (item: FooterLink) =>
    item.action === "scrollTop" || item.link === "#" || item.link?.startsWith("#")
  const handleScrollTop = (e: React.MouseEvent) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="mt-8">
      <div className="container max-w-screen-2xl px-4 md:px-8 py-8 rounded-md border">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2 text-sm text-muted-foreground">
          {footer.copyright && (
            <div className="text-foreground/80">{footer.copyright}</div>
          )}
          <div className="flex flex-wrap gap-3 items-center">
            {footer.repository?.url && (
              <a
                className="hover:underline"
                href={footer.repository.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Repo{footer.repository.branch ? ` (${footer.repository.branch})` : ""}
              </a>
            )}
            {footer.lastUpdated && (
              <span className="text-xs">Last updated: {footer.lastUpdated}</span>
            )}
            {footer.version && <Badge variant="warning">{footer.version}</Badge>}
          </div>
        </div>

        {groups.length > 0 && (
          <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group: FooterGroup) => (
              <div key={group.title}>
                <div className="font-medium mb-2">{group.title}</div>
                <ul className="space-y-1 text-sm">
                  {group.items.map((item: FooterLink) => (
                    <li key={`${item.title}-${item.link}`}>
                      {item.external ? (
                        <a
                          className="hover:underline"
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.title}
                        </a>
                      ) : isScrollTop(item) ? (
                        <a href="#" className="hover:underline" onClick={handleScrollTop}>
                          {item.title}
                        </a>
                      ) : (
                        <Link className="hover:underline" to={`/${lang}${item.link}`}>
                          {item.title}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {groups.length === 0 && links.length > 0 && (
          <div>
            <div className="font-medium mb-2">Links</div>
            <ul className="space-y-1 text-sm">
              {links.map((item: FooterLink) => (
                <li key={`${item.title}-${item.link}`}>
                  {item.external ? (
                    <a
                      className="hover:underline"
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.title}
                    </a>
                  ) : isScrollTop(item) ? (
                    <a href="#" className="hover:underline" onClick={handleScrollTop}>
                      {item.title}
                    </a>
                  ) : (
                    <Link className="hover:underline" to={`/${lang}${item.link}`}>
                      {item.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {social.length > 0 && (
          <div>
            <div className="font-medium mb-2">Social</div>
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                {social.map(s => {
                  const kind = (s.icon || s.name || "").toLowerCase()
                  const Icon = (() => {
                    if (kind.includes("github")) return Github
                    if (kind.includes("mail") || kind.includes("email")) return Mail
                    if (kind.includes("bilibili")) return Tv
                    if (kind === "qq") return MessageCircle
                    if (kind.includes("wechat") || kind.includes("weixin")) return MessageSquare
                    if (kind.includes("youtube")) return Youtube
                    if (kind.includes("twitter") || kind === "x") return Twitter
                    if (kind.includes("discord")) return MessageSquare
                    if (kind.includes("telegram")) return Send
                    if (kind.includes("tiktok") || kind.includes("douyin")) return Video
                    if (kind.includes("weibo")) return Flame
                    if (kind.includes("zhihu")) return BookOpen
                    return Globe
                  })()
                  return (
                    <Tooltip key={`${s.name}-${s.url}`}>
                      <TooltipTrigger asChild>
                        <a
                          href={(s as any).url || (s as any).link}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.name}
                          className={cn(buttonVariants({ variant: "ghost" }), "w-9 h-9 p-0")}
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent align="center">{s.name}</TooltipContent>
                    </Tooltip>
                  )
                })}
              </TooltipProvider>
            </div>
          </div>
        )}
        </div>
        <Separator className="my-6" />
        <div className="text-xs text-muted-foreground">Built with React Docs UI</div>
      </div>
    </footer>
  )
}


