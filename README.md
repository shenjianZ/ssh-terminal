# 🚀 Tauri + React + shadcn/ui Template

一个生产就绪的桌面应用模板，集成了现代前端技术栈和最佳实践。

## ✨ 特性

- **🎯 Tauri 2.0** - 使用 Rust 构建跨平台桌面应用
- **⚛️ React 19** - 最新的 React 版本，支持现代特性
- **🎨 shadcn/ui** - 美观、可访问的 UI 组件库
- **🎨 Tailwind CSS 4.0** - 实用优先的 CSS 框架
- **📝 TypeScript** - 完整的类型安全支持
- **🔧 ESLint** - 代码质量检查和格式化
- **📱 响应式设计** - 支持多种屏幕尺寸
- **🌙 深色模式** - 内置主题切换支持

## 🏗️ 项目结构

```
tauri-app/
├── src/                    # React 前端源码
│   ├── components/         # UI 组件
│   │   └── ui/            # shadcn/ui 组件
│   ├── lib/               # 工具函数和配置
│   ├── App.tsx            # 主应用组件
│   └── index.css          # 全局样式
├── src-tauri/             # Rust 后端源码
│   ├── src/               # Rust 源代码
│   └── Cargo.toml         # Rust 依赖配置
├── components.json         # shadcn/ui 配置
├── package.json            # Node.js 依赖
└── README.md              # 项目文档
```

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) (推荐 18+)
- [pnpm](https://pnpm.io/) (包管理器)
- [Rust](https://rustup.rs/) (Tauri 后端)

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm tauri dev
```

### 构建应用

```bash
pnpm tauri build
```

## 🎨 使用 shadcn/ui 组件

### 添加新组件

```bash
npx shadcn@latest add [component-name]
```

### 可用组件

- `button` - 按钮组件
- `card` - 卡片组件
- `input` - 输入框组件
- `dialog` - 对话框组件
- `dropdown-menu` - 下拉菜单
- `form` - 表单组件
- `table` - 表格组件

## 🔧 配置说明

### TypeScript 配置

项目使用 TypeScript 5.8+，支持：
- 路径别名 (`@/*`)
- 严格类型检查
- 现代 ES 特性

### Tailwind CSS 配置

- 使用 Tailwind CSS 4.0
- 支持 CSS 变量和主题
- 响应式设计工具

### ESLint 配置

- React Hooks 规则
- TypeScript 支持
- 代码质量检查

## 📱 桌面应用特性

### Tauri 命令

在 `src-tauri/src/lib.rs` 中定义 Rust 函数：

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

在前端调用：

```typescript
import { invoke } from '@tauri-apps/api/core';

const message = await invoke('greet', { name: 'World' });
```

### 平台支持

- ✅ Windows
- ✅ macOS
- ✅ Linux
- ✅ Android (实验性)

## 🎯 开发指南

### 添加新页面

1. 在 `src/` 目录创建新组件
2. 使用 shadcn/ui 组件构建界面
3. 在路由中添加新页面

### 自定义主题

修改 `src/index.css` 中的 CSS 变量：

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* 更多变量... */
}
```

### 添加新依赖

```bash
pnpm add [package-name]
```

## 🚀 部署

### 构建生产版本

```bash
pnpm tauri build
```

### 发布到应用商店

- Windows: Microsoft Store
- macOS: Mac App Store
- Linux: AppImage, Snap, Flatpak

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [shadcn/ui](https://ui.shadcn.com/) - 美观的 UI 组件
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [React](https://react.dev/) - 用户界面库

---

**🎉 开始构建你的下一个桌面应用吧！**
