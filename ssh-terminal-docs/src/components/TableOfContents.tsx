"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

interface TocItem {
  title: string
  url: string
  depth: number
}

interface TableOfContentsProps {
  toc: TocItem[]
}

export function TableOfContents({ toc }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: `0% 0% -80% 0%` }
    )

    toc.forEach(item => {
      const element = document.getElementById(item.url.slice(1))
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      toc.forEach(item => {
        const element = document.getElementById(item.url.slice(1))
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [toc])

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string
  ) => {
    e.preventDefault()
    const element = document.getElementById(url.slice(1))
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
      // Update URL hash without reloading
      window.history.pushState(null, "", url)
    }
  }

  if (toc.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <p className="font-medium">On This Page</p>
      <ul className="m-0 list-none">
        {toc.map(item => (
          <li key={item.url} className={cn("mt-0 pt-2")}>
            <a
              href={item.url}
              onClick={e => handleLinkClick(e, item.url)}
              className={cn(
                "inline-block no-underline transition-colors hover:text-foreground",
                item.url.slice(1) === activeId
                  ? "text-foreground font-medium"
                  : "text-muted-foreground",
                item.depth > 2 ? "pl-4" : ""
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
