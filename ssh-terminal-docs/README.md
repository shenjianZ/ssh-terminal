English | [简体中文](README-zh.md)

## react-docs-ui

React documentation site UI components. Ship a modern docs site with a small set of composable primitives and a ready-to-use app shell.

### Install
```bash
npm install react-docs-ui
```

### Quick usage
Minimal layout:
```tsx
import 'react-docs-ui/dist/react-docs-ui.css'
import { DocsLayout, HeaderNav, SidebarNav, TableOfContents, MdxContent } from 'react-docs-ui'

function Page() {
  const source = `# Hello\n\nSome markdown...`
  return (
    <DocsLayout lang="en" config={{
      site: { logo: '/logo.svg', title: 'My Docs', description: 'Awesome docs' },
      navbar: { items: [] },
      sidebar: { collections: {} },
    }}>
      <MdxContent source={source} />
    </DocsLayout>
  )
}
```

Or use the full app router (reads `public/config/site(.lang).yaml` and `public/docs/<lang>/**/*.md` at runtime):
```tsx
import 'react-docs-ui/dist/react-docs-ui.css'
import { DocsApp } from 'react-docs-ui'

export default function App() {
  return <DocsApp />
}
```

### Exports
- Layout: `DocsLayout`
- App shell: `DocsApp`
- Navigation: `HeaderNav`, `SidebarNav`, `TableOfContents`
- Theming: `ThemeProvider`, `ModeToggle`, `LanguageSwitcher`
- Markdown: `MdxContent`
- Primitives: `ScrollArea`, `Tooltip`, `Dialog`, `DropdownMenu`, `Command`, `ContextMenu`, `buttonVariants`
- Utils: `cn`, `getConfig`, types `SiteConfig`

### Configuration file (`public/config/site.yaml`)
See the `create-react-docs-ui` README for a full example. Basic shape:
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

### Documentation content
- Place markdown under `public/docs/<lang>/**/*.md`
- Route path maps to file path after the language segment
- Optional frontmatter is supported by a simple parser

### Requirements
- React 18+
- Works with Vite; CSS file must be imported

### License
MIT
