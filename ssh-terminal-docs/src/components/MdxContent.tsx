import ReactMarkdown from "react-markdown"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeHighlight from "rehype-highlight"
import { Link, useParams } from "react-router-dom"

interface MdxContentProps {
  source: string
}

export function MdxContent({ source }: MdxContentProps) {
  const params = useParams<{ lang: string }>()
  const lang = params.lang || "zh-cn"
  // 使用同步高亮插件，避免 runSync 异步报错

  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          // 允许在 Markdown 中渲染原生 HTML（需放在 autolink 之前）
          rehypeRaw as any,
          // 代码高亮（同步）
          [rehypeHighlight as any, { ignoreMissing: true }],
          // 避免将整个标题包裹在 <a> 中，防止与标题内部链接产生嵌套 <a>
          [rehypeAutolinkHeadings, { behavior: "append" }],
        ]}
        components={{
          a({ href, children, ...props }) {
            if (!href) return <a {...props}>{children}</a>

            // 站内锚点，保持原生 <a>，避免路由跳转
            if (href.startsWith("#")) {
              return (
                <a href={href} {...props}>
                  {children}
                </a>
              )
            }

            // 外链或协议链接，保持原生 <a>
            const isExternal = /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:")
            if (isExternal) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </a>
              )
            }

            // 处理站内链接：统一加上语言前缀，使用 React Router Link 避免整页刷新
            const normalized = href.startsWith("/") ? href : `/${href}`
            const to = `/${lang}${normalized}`
            return (
              <Link to={to} {...props}>
                {children}
              </Link>
            )
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
