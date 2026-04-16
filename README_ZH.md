# SSH Terminal

<div align="center">

**🌐 语言**: [中文](#) | [English](./README.md)

![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=000000)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000000)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=FFFFFF)
![Rust](https://img.shields.io/badge/Rust-1.70+-000000?logo=rust&logoColor=FFFFFF)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=FFFFFF)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss&logoColor=FFFFFF)
![Zustand](https://img.shields.io/badge/Zustand-5.0-FFB84D?logoColor=FFFFFF)
![License](https://img.shields.io/badge/License-MIT-green)

一个基于 Tauri + React 的现代化 SSH 终端客户端应用，提供跨平台的 SSH 连接管理、AI 辅助、SFTP 文件管理等功能。

**[功能特性](#-特性)** • **[快速开始](#-快速开始)** • **[技术栈](#-技术栈)** • **[详细文档](#-详细文档)**

</div>

## 📸 应用截图

![主界面](./public/other-aoge.png)

![设置页面](./public/setting-page.svg)


## 🚀 快速开始

### 环境要求

- **Node.js** 18+
- **pnpm** 10.14.0+
- **Rust** 1.70+
- **系统 SSH 客户端**（Windows 需要 Git Bash 或 WSL）

### 安装依赖

```bash
pnpm install
```

### 开发模式

启动开发服务器（同时运行前端和后端）：

```bash
pnpm tauri dev
```

这将：
1. 启动 Vite 开发服务器（端口 1420）
2. 启动 Tauri 应用窗口
3. 启用热模块替换（HMR）

### 前端开发（仅开发前端）

```bash
pnpm dev
```

### 生产构建

构建生产版本：

```bash
pnpm tauri build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录。

### Docker 部署

使用 Docker 快速部署后端服务：

```bash
docker-compose up -d
```

详细部署指南请查看 [Docker 部署文档](./docs/DOCKER_DEPLOYMENT.md)。

## ✨ 特性

- 🖥️ 多会话 SSH 终端管理
- 🤖 AI 智能助手（支持多个 AI Provider）
- 📁 SFTP 文件管理
- ☁️ 云同步（多设备数据同步）
- 👤 用户认证系统
- 📹 视频录制
- 🎬 截图功能
- ⌨️ 快捷键系统
- 🎨 8 种终端主题

## 📚 详细文档

### 核心文档
- **[架构设计](./docs/ARCHITECTURE.md)** - 系统架构、数据流、核心概念
- **[开发指南](./docs/DEVELOPMENT.md)** - 开发环境搭建和开发流程
- **[代码规范](./docs/CODE_STYLE.md)** - 前后端代码风格规范
- **[故障排查](./docs/TROUBLESHOOTING.md)** - 常见问题和解决方案

### 功能文档
- **[AI 功能详解](./docs/AI_FEATURES.md)** - AI 智能助手完整说明
- **[录制功能](./docs/RECORDING.md)** - 视频录制和回放功能
- **[主题系统](./docs/THEMES.md)** - 终端主题配置
- **[快捷键列表](./docs/Shortcuts.md)** - 所有快捷键及其生效范围
- **[安全特性](./docs/SECURITY.md)** - 加密和安全机制

### 部署文档
- **[Docker 部署指南](./docs/DOCKER_DEPLOYMENT.md)** - 使用 Docker 部署后端服务

### 其他文档
- **[更多文档...](./docs/)**

## 🏗️ 技术栈

### 前端
- React 19 + TypeScript 5.8
- Vite 7.0 + Tailwind CSS 4.0
- shadcn/ui + Zustand
- xterm.js 5.5

### 后端（Tauri）
- Rust 2021 + Tauri 2.4
- russh 0.55 + russh-sftp 2.1.1
- SQLite + AES-256-GCM 加密

### 后端服务器
- Rust + Axum 0.7 + SeaORM
- JWT 认证 + Redis 缓存

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/my-feature`
3. 提交更改：`git commit -m 'feat: add my feature'`
4. 推送到分支：`git push origin feature/my-feature`
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🔗 相关资源

- [Tauri 文档](https://tauri.app/)
- [React 文档](https://react.dev/)
- [xterm.js 文档](https://xtermjs.org/)

---

<div align="center">

**最后更新**：2026年4月16日

Made with ❤️ using Tauri + React

</div>