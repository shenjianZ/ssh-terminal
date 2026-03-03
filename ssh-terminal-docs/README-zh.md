简体中文 | [English](README.md)

## react-docs-ui

React 文档站 UI 组件库。用一套可组合的组件与即用型应用外壳，快速上线现代文档站。

### 安装
```bash
npm install react-docs-ui
```

### 快速使用
最小布局：
```tsx
import 'react-docs-ui/dist/react-docs-ui.css'
import { DocsLayout, HeaderNav, SidebarNav, TableOfContents, MdxContent } from 'react-docs-ui'

function Page() {
  const source = `# Hello\n\nSome markdown...`
  return (
    <DocsLayout lang="zh-cn" config={{
      site: { logo: '/logo.svg', title: '我的文档', description: '超赞文档' },
      navbar: { items: [] },
      sidebar: { collections: {} },
    }}>
      <MdxContent source={source} />
    </DocsLayout>
  )
}
```

或使用完整应用（运行时读取 `public/config/site(.lang).yaml` 与 `public/docs/<lang>/**/*.md`）：
```tsx
import 'react-docs-ui/dist/react-docs-ui.css'
import { DocsApp } from 'react-docs-ui'

export default function App() {
  return <DocsApp />
}
```

### 导出清单
- 布局：`DocsLayout`
- 应用外壳：`DocsApp`
- 导航：`HeaderNav`、`SidebarNav`、`TableOfContents`
- 主题：`ThemeProvider`、`ModeToggle`、`LanguageSwitcher`
- Markdown：`MdxContent`
- 基础组件：`ScrollArea`、`Tooltip`、`Dialog`、`DropdownMenu`、`Command`、`ContextMenu`、`buttonVariants`
- 工具与类型：`cn`、`getConfig`、类型 `SiteConfig`

### 配置文件（`public/config/site.yaml`）
配置形状参考：
```yaml
site:
  logo: /logo.svg
  title: My Docs
  description: Awesome docs
navbar:
  items:
    - title: GitHub
      link: https://github.com/shenjianZ/react-docs-ui
      external: true
sidebar:
  collections: {}
```

### 文档内容组织
- 将 Markdown 放在 `public/docs/<lang>/**/*.md`
- 语言段之后的文件路径映射为路由
- 支持可选 Frontmatter（由简易解析器处理）

### 环境要求
- React 18+
- 推荐 Vite；需显式引入 CSS 文件

### 许可证
MIT
