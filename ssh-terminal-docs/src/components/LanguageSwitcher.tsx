"use client"

import { Globe } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageSwitcher() {
  const navigate = useNavigate()
  const location = useLocation()

  const locales = [
    { code: "en", name: "English" },
    { code: "zh-cn", name: "简体中文" },
  ]

  const handleLanguageChange = (newLocale: string) => {
    const pathParts = location.pathname.split("/").filter(part => part)
    if (pathParts.length > 0 && (pathParts[0] === 'en' || pathParts[0] === 'zh-cn')) {
      pathParts[0] = newLocale
    } else {
      pathParts.unshift(newLocale)
    }
    const newPath = `/${pathParts.join("/")}`
    navigate(newPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map(locale => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLanguageChange(locale.code)}
          >
            {locale.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
