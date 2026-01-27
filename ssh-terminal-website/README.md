# SSH Terminal Website

这是 SSH Terminal 项目的主页网站，使用 React + shadcn/ui + pnpm 构建。

## 🌐 在线访问

- GitHub Pages: https://yourusername.github.io/ssh-terminal-website

## 🛠️ 技术栈

- **React 19** - 用户界面框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **Lucide React** - 图标库

## 📦 安装依赖

```bash
pnpm install
```

## 🚀 开发

启动开发服务器：

```bash
pnpm dev
```

访问 http://localhost:5173 查看网站

## 🏗️ 构建

构建生产版本：

```bash
pnpm build
```

构建产物将在 `dist` 目录中

## 📄 部署

网站通过 GitHub Actions 自动部署到 GitHub Pages。

### 手动部署

1. 构建项目：`pnpm build`
2. 将 `dist` 目录的内容推送到 `gh-pages` 分支

### 自动部署

每次推送到 `main` 分支时，GitHub Actions 会自动：
1. 构建项目
2. 部署到 GitHub Pages

## 🎨 自定义

### 修改内容

所有主要内容都在 `src/App.tsx` 中。

### 添加新组件

1. 在 `src/components/ui/` 创建新组件
2. 在 `src/App.tsx` 中导入使用

### 修改样式

1. 编辑 `tailwind.config.js` 自定义主题
2. 编辑 `src/style.css` 添加全局样式

## 📝 项目结构

```
ssh-terminal-website/
├── .github/                # GitHub Actions 工作流
│   └── workflows/
│       └── deploy.yml   # 自动部署配置
├── src/                    # 源代码
│   ├── components/         # React 组件
│   │   └── ui/           # shadcn/ui 组件
│   ├── lib/               # 工具函数
│   ├── App.tsx            # 主应用组件
│   ├── main.tsx           # 应用入口
│   └── style.css          # 全局样式
├── public/                 # 静态资源
├── index.html              # HTML 模板
├── tailwind.config.js      # Tailwind 配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
└── package.json           # 项目配置
```

## 📄 许可证

MIT License

## 🔗 相关链接

- [SSH Terminal 项目](https://github.com/yourusername/ssh-terminal)
- [Tauri 文档](https://tauri.app/)
- [React 文档](https://react.dev/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
