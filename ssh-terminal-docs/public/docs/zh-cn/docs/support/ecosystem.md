# 生态系统

SSH Terminal 生态系统包含多个相关项目和工具，共同提供完整的 SSH 终端管理解决方案。

## 目录

- [生态系统概述](#生态系统概述)
- [官方项目](#官方项目)
- [依赖项目](#依赖项目)
- [第三方工具](#第三方工具)
- [社区资源](#社区资源)
- [扩展开发](#扩展开发)

---

## 生态系统概述

SSH Terminal 生态系统是一个完整的解决方案，涵盖桌面客户端、Web 版本、云同步服务器、官方网站和文档网站。

```
SSH Terminal 生态系统
├── ssh-terminal          # 桌面客户端（主仓库）
├── ssh-terminal-server   # 云同步服务器
├── ssh-terminal-web      # Web 版本
├── ssh-terminal-website  # 官方网站
├── ssh-terminal-docs     # 在线文档
└── 依赖项目
    ├── Tauri             # 跨平台应用框架
    ├── React             # UI 框架
    ├── xterm.js          # 终端模拟器
    ├── russh             # Rust SSH 实现
    └── Zustand           # 状态管理
```

---

## 官方项目

### 1. ssh-terminal（桌面客户端）

**仓库地址**：https://github.com/shenjianZ/ssh-terminal

**描述**：SSH Terminal 的主要项目，提供跨平台桌面客户端功能。

**核心功能**：
- 多会话 SSH 终端管理
- AI 智能助手
- SFTP 文件管理
- 云同步
- 视频录制
- 截图功能
- 快捷键系统
- 主题系统

**技术栈**：
- 前端：React 19 + TypeScript + Tailwind CSS
- 后端：Rust + Tauri 2.0
- 终端：xterm.js
- SSH：russh

**支持平台**：
- Windows
- macOS
- Linux
- Android

---

### 2. ssh-terminal-server（云同步服务器）

**仓库地址**：https://github.com/shenjianZ/ssh-terminal-server

**描述**：SSH Terminal 的云同步后端服务，提供数据同步、用户认证等功能。

**核心功能**：
- 用户认证（JWT）
- 数据同步（增量同步）
- 冲突检测与解决
- API 管理

**技术栈**：
- 后端：Rust + Axum
- 数据库：SQLite / MySQL / PostgreSQL
- 缓存：Redis
- 认证：JWT

**支持数据库**：
- SQLite（默认）
- MySQL
- PostgreSQL

---

### 3. ssh-terminal-web（Web 版本）

**仓库地址**：https://github.com/shenjianZ/ssh-terminal-web

**描述**：SSH Terminal 的 Web 版本，提供浏览器端的 SSH 终端功能。

**核心功能**：
- 浏览器端 SSH 终端
- 会话管理
- 基础的文件管理
- 响应式设计

**技术栈**：
- 前端：React 19 + TypeScript + Tailwind CSS
- 后端：Node.js + Express
- WebSocket：实时终端通信
- 终端：xterm.js

---

### 4. ssh-terminal-website（官方网站）

**仓库地址**：https://github.com/shenjianZ/ssh-terminal-website

**描述**：SSH Terminal 的官方网站，提供产品介绍、下载链接等功能。

**核心功能**：
- 产品介绍
- 下载页面
- 功能展示
- 新闻动态
- 社区链接

**技术栈**：
- 前端：React + TypeScript + Tailwind CSS
- 构建：Vite
- 部署：Vercel / Netlify

---

### 5. ssh-terminal-docs（在线文档）

**仓库地址**：https://github.com/shenjianZ/ssh-terminal-docs

**描述**：SSH Terminal 的在线文档网站，提供完整的使用指南和开发文档。

**核心内容**：
- 快速开始
- 用户指南
- API 文档
- 配置说明
- 贡献指南

**技术栈**：
- 前端：React + TypeScript
- 文档框架：VitePress / Docusaurus
- 部署：GitHub Pages / Vercel

---

## 依赖项目

### 前端依赖

#### Tauri

**官网**：https://tauri.app/

**描述**：跨平台桌面应用框架，使用 Web 技术构建原生应用。

**版本**：2.4.0

**作用**：
- 应用打包和分发
- 原生功能访问（文件系统、系统通知等）
- 安全沙箱
- 自动更新

---

#### React

**官网**：https://react.dev/

**描述**：用于构建用户界面的 JavaScript 库。

**版本**：19.1.0

**作用**：
- 组件化 UI 开发
- 状态管理
- 虚拟 DOM
- Hooks 系统

---

#### xterm.js

**官网**：https://xtermjs.org/

**描述**：基于 TypeScript 的终端模拟器，可在浏览器中运行。

**版本**：5.5.0

**作用**：
- 终端渲染
- ANSI 转义序列支持
- 终端交互
- 主题支持

---

#### Tailwind CSS

**官网**：https://tailwindcss.com/

**描述**：实用优先的 CSS 框架，用于快速构建现代网站。

**版本**：4.1.12

**作用**：
- 样式开发
- 响应式设计
- 主题定制
- 工具类

---

#### Zustand

**官网**：https://zustand-demo.pmnd.rs/

**描述**：轻量级状态管理库，用于 React 应用。

**版本**：4.5.0

**作用**：
- 全局状态管理
- 简单的 API
- TypeScript 支持
- 性能优化

---

### 后端依赖

#### Rust

**官网**：https://www.rust-lang.org/

**描述**：系统编程语言，注重安全、并发和性能。

**版本**：2021 Edition

**作用**：
- Tauri 后端
- SSH 实现
- 高性能计算
- 内存安全

---

#### russh

**官网**：https://github.com/warp-tech/russh

**描述**：纯 Rust 实现的 SSH 库，支持 SSH 协议。

**版本**：0.55

**作用**：
- SSH 客户端和服务器
- SSH 协议实现
- 加密和认证
- 跨平台支持（包括 Android）

---

#### tokio

**官网**：https://tokio.rs/

**描述**：Rust 的异步运行时，提供异步 I/O、定时器、线程池等功能。

**版本**：1.35

**作用**：
- 异步编程
- 网络通信
- 并发处理
- 定时器

---

#### russh-sftp

**官网**：https://github.com/warp-tech/russh

**描述**：russh 的 SFTP 子协议实现。

**版本**：2.1.1

**作用**：
- SFTP 文件传输
- 文件操作
- 目录管理
- 权限管理

---

## 第三方工具

### 开发工具

#### VS Code

**官网**：https://code.visualstudio.com/

**描述**：微软开发的代码编辑器，支持丰富的扩展。

**推荐扩展**：
- ESLint
- Prettier
- Rust Analyzer
- Tauri
- Tailwind CSS IntelliSense

---

#### Git

**官网**：https://git-scm.com/

**描述**：分布式版本控制系统。

**作用**：
- 代码版本管理
- 协作开发
- 代码审查

---

#### Node.js

**官网**：https://nodejs.org/

**描述**：JavaScript 运行时，用于前端开发。

**版本**：20.x

**作用**：
- 前端开发服务器
- 包管理（npm/pnpm）
- 构建工具

---

#### Rust

**官网**：https://www.rust-lang.org/

**描述**：系统编程语言。

**版本**：stable

**作用**：
- 后端开发
- Tauri 应用打包
- 性能优化

---

### 部署工具

#### Docker

**官网**：https://www.docker.com/

**描述**：容器化平台，用于应用部署。

**作用**：
- 容器化应用
- 一致的部署环境
- 快速部署

---

#### GitHub Actions

**官网**：https://github.com/features/actions

**描述**：GitHub 提供的 CI/CD 服务。

**作用**：
- 自动化测试
- 自动化构建
- 自动化部署

---

#### Vercel

**官网**：https://vercel.com/

**描述**：前端部署平台，支持自动部署。

**作用**：
- Web 版本部署
- 官方网站部署
- 文档网站部署

---

## 社区资源

### 官方渠道

- **GitHub**：https://github.com/shenjianZ/ssh-terminal
- **Issues**：https://github.com/shenjianZ/ssh-terminal/issues
- **Discussions**：https://github.com/shenjianZ/ssh-terminal/discussions
- **Wiki**：https://github.com/shenjianZ/ssh-terminal/wiki

### 社区论坛

- **Stack Overflow**：搜索 `ssh-terminal` 标签
- **Reddit**：/r/ssh-terminal（如果存在）
- **Discord**：官方 Discord 服务器（如果存在）

### 社交媒体

- **Twitter**：@ssh_terminal（如果存在）
- **Blog**：官方博客（如果存在）

---

## 扩展开发

### 插件系统

SSH Terminal 支持插件扩展，可以添加自定义功能。

**插件类型**：
- SSH 插件：扩展 SSH 功能
- AI 插件：添加新的 AI Provider
- 主题插件：自定义主题
- 快捷键插件：自定义快捷键

**开发文档**：
详见 [插件开发指南](../contributing/plugin-development.md)（如果存在）

### API 集成

SSH Terminal 提供 API 接口，可以与其他工具集成。

**API 类型**：
- Tauri Commands：原生功能调用
- REST API：Web 版本 API
- WebSocket API：实时通信

**API 文档**：
详见 [API 文档](https://github.com/shenjianZ/ssh-terminal-server)

### 贡献代码

欢迎贡献代码到 SSH Terminal 项目。

**贡献方式**：
- 提交 Bug 报告
- 提交功能请求
- 提交代码改进
- 改进文档

**贡献指南**：
详见 [贡献者指南](../contributing/setup.md)

---

## 路线图

### 即将发布

- 更多 AI Provider 支持
- 插件系统完善
- 性能优化
- 更多主题

### 未来计划

- 协作功能（多人同时编辑）
- 云端终端
- 移动端完善
- 更多平台支持（iOS）

---

## 相关资源

- [快速开始](../introduction.md) - 快速上手
- [用户指南](../guide/basics.md) - 使用指南
- [API 文档](https://github.com/shenjianZ/ssh-terminal-server) - API 参考
- [贡献指南](../contributing/setup.md) - 参与开发
- [故障排除](./troubleshooting.md) - 常见问题解决