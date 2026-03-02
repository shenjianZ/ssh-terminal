// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error types provided via ambient declaration
import yaml from "js-yaml"

export interface SiteConfig {
  site: {
    logo: string | { light: string; dark: string }
    title: string
    description: string
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
  sidebar: {
    // 全局开关，未设置时按数据存在与否自动判断
    enabled?: boolean
    // 旧版：单一侧边栏结构（向后兼容）
    sections?: {
      title: string
      path?: string
      children?: {
        title: string
        path: string
      }[]
    }[]
    // 新版：按一级路由段（如 guide、components）选择不同侧边栏
    collections?: Record<
      string,
      {
        sections: {
          title: string
          path: string
          children?: {
            title: string
            path: string
          }[]
        }[]
      }
    >
  }
  theme?: {
    allowToggle?: boolean
  }
  footer?: {
    enabled?: boolean
    copyright?: string
    repository?: {
      url?: string
      branch?: string
    }
    lastUpdated?: string
    version?: string
    groups?: {
      title: string
      items: {
        title: string
        link: string
        external?: boolean
      }[]
    }[]
    links?: {
      title: string
      link: string
      external?: boolean
    }[]
    social?: {
      name: string
      url?: string
      link?: string
      icon?: string
    }[]
    builtWith?: { name: string; url?: string }[]
  }
  pwa?: {
    enabled?: boolean
    name?: string
    shortName?: string
    description?: string
    themeColor?: string
    backgroundColor?: string
  }
  contextMenu?: {
    enabled?: boolean
    page?: {
      copyUrl?: boolean
      copyTitle?: boolean
      copyMarkdownLink?: boolean
      openInNewTab?: boolean
      reload?: boolean
      printPage?: boolean
      scrollToTop?: boolean
      scrollToBottom?: boolean
    }
    site?: {
      goHome?: boolean
      quickNav?: boolean
      language?: boolean
    }
    appearance?: {
      theme?: boolean
      resetThemePref?: boolean
    }
  }
}

export async function getConfig(
  lang: string = "zh-cn"
): Promise<SiteConfig | null> {
  if (!lang || lang.startsWith("_next") || lang.includes(".")) {
    return null
  }

  const defaultLang = "zh-cn"
  const configLang = lang === defaultLang ? "" : `.${lang}`
  const filePath = `/config/site${configLang}.yaml`

  try {
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}`)
    }
    const fileContents = await response.text()
    const config = yaml.load(fileContents) as SiteConfig
    return config
  } catch (error) {
    console.error(`Error loading config for lang "${lang}":`, error)
    if (lang !== defaultLang) {
      return await getConfig(defaultLang)
    }
    return null
  }
}
