# SSH Terminal - AI Agent 文档

这是一个面向 iFlow AI Agent 的项目文档，提供项目概览、技术栈、架构设计、开发规范和常用命令等关键信息。

---

## 📋 项目概览

**项目名称**: SSH Terminal
**版本**: 1.2.0
**类型**: 跨平台桌面应用（支持 Android）
**技术栈**: Tauri 2.0 + React 19 + Rust
**包管理器**: pnpm 10.14.0+

### 核心功能

- 🖥️ **多会话 SSH 终端管理** - 支持 xterm.js 终端模拟
- 🤖 **AI 智能助手** - 支持多个 AI Provider（OpenAI、Ollama、Qwen、文心一言等）
- 📁 **SFTP 文件管理** - 双面板文件浏览器
- ☁️ **云同步** - 支持多设备同步 SSH 会话、用户资料等数据
- 👤 **用户认证系统** - 支持账号注册、登录、Token 认证
- 📹 **视频录制** - 终端操作录制（视频 + 音频）
- 🎬 **截图功能** - DOM to SVG 矢量图导出（开发工具）
- ⌨️ **快捷键系统** - 完整的快捷键绑定和自定义
- 🎨 **主题系统** - 8 种终端主题支持

---

## 🏗️ 技术栈

### 前端技术栈

- **React 19** - UI 框架
- **TypeScript 5.8+** - 类型安全
- **Vite 7.0** - 构建工具
- **Tailwind CSS 4.0** - 样式框架
- **shadcn/ui** - UI 组件库（基于 Radix UI）
- **Zustand 4.5** - 状态管理
- **React Router 7** - 路由管理
- **xterm.js 5.5** - 终端模拟器
- **React Hook Form + Zod** - 表单验证

### 后端技术栈（Tauri）

- **Rust 2021** - 系统编程语言
- **Tauri 2.4** - 跨平台应用框架
- **tokio 1.35** - 异步运行时
- **russh 0.55** - 纯 Rust SSH 实现（支持 Android）
- **russh-sftp 2.1.1** - SFTP 协议支持
- **aes-gcm + argon2** - 加密存储
- **r2d2 + SQLite** - 数据库连接池

### 后端服务器

- **Rust + Axum 0.7** - Web 框架
- **SeaORM 1.1** - ORM 框架
- **Redis 0.27** - Token 缓存
- **JWT 9.x** - 认证机制
- **支持数据库**: SQLite / MySQL / PostgreSQL

---


---

## 🚀 常用命令

### 开发命令

```bash
# 安装依赖
pnpm install

# 前端开发（仅前端，端口 1420）
pnpm dev

# Tauri 开发模式（前端 + 后端）
pnpm tauri dev

# 生产构建
pnpm tauri build

# Windows 构建脚本
pnpm tauri:build:win
```


### Tauri 命令

```bash
# 开发模式
tauri dev

# 构建生产版本
tauri build

# Android 构建
tauri android build
```

---

## 🏛️ 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React 19)                        │
├─────────────────────────────────────────────────────────────────┤
│  Pages: Terminal | SessionManager | Settings | AIChatPage      │
│  Components: layout | terminal | ssh | ai | sftp | sync        │
│  Store (Zustand): session | terminal | ai | auth | sync        │
└────────────────────────┬──────────────────────────────────────────┘
                         │ Tauri IPC Commands
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Rust + Tauri 2.0)                    │
├─────────────────────────────────────────────────────────────────┤
│  Commands Layer: session | terminal | storage                   │
│  SSH Manager Layer: SSHManager (管理 Session 和 Connection)     │
│  SSH Backend Layer: russh (纯 Rust SSH) | portable-pty          │
│  Storage Layer: AES-256-GCM 加密 | SQLite 数据库                │
└─────────────────────────────────────────────────────────────────┘
                         ↑
                         │ External APIs
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│               Backend Server (ssh-terminal-server)               │
├─────────────────────────────────────────────────────────────────┤
│  API: auth | user | ssh | sync                                  │
│  Services: AuthService | SyncService                            │
│  Storage: SQLite/MySQL/PostgreSQL | Redis                       │
└─────────────────────────────────────────────────────────────────┘
```

### 数据流

#### SSH 连接流
```
用户操作 → React 组件 → Zustand Store → Tauri Command → SSH Manager → russh → SSH Server
    ↓                                                                                   ↑
界面更新 ← Tauri Event (ssh-output-{id}) ← SSH Reader ← PTY ← SSH Process ←──────────┘
```

#### AI 交互流
```
用户输入 → AI 组件 → aiStore → API 调用 → AI Provider (OpenAI/Claude/...)
    ↓                                                                              ↑
界面更新 ← AI 响应 ← AI Provider ← HTTP 请求 ←─────────────────────────────────────┘
```

### 核心概念

1. **Session（会话配置）** - 保存的 SSH 连接配置
2. **Connection（连接实例）** - 基于 Session 创建的实际连接
3. **TerminalTab（终端标签页）** - 前端展示的终端标签
4. **AI Conversation（AI 对话）** - AI 聊天会话
5. **AI Provider（AI 服务商）** - 支持多个 AI 服务提供商

---

## 💾 数据库架构

### 客户端本地数据库（SQLite）

位置：`src-tauri/data/app.db`

| 表名 | 说明 |
|------|------|
| `user_auth` | 用户认证（邮箱、密码哈希） |
| `ssh_sessions` | SSH 会话配置 |
| `user_profiles` | 用户资料 |
| `app_settings` | 应用设置 |
| `sync_state` | 同步状态 |

### 服务器数据库（SQLite/MySQL/PostgreSQL）

| 表名 | 说明 |
|------|------|
| `users` | 用户表 |
| `user_profiles` | 用户资料表 |
| `ssh_sessions` | SSH 会话表 |

---

## 🔐 安全特性

- **AES-256-GCM 加密** - 密码和密钥加密存储
- **Argon2 密码派生** - 生成加密密钥
- **主机密钥验证** - 自动检测 SSH 主机密钥变化
- **JWT 认证** - Access Token + Refresh Token 机制
- **软删除** - 使用 `deleted_at` 字段标记删除

---

## 🎨 主题系统

支持 8 种终端主题：
- One Dark
- Dracula
- Nord
- Tokyo Night
- Monokai
- GitHub Light
- Solarized Light
- Solarized Dark

配置文件：`src/config/themes.ts`

---

## ⌨️ 快捷键系统

完整快捷键列表：`docs/Shortcuts.md`

默认快捷键：
- `Ctrl+N` / `Cmd+N` - 新建连接
- `Ctrl+W` / `Cmd+W` - 关闭标签
- `Ctrl+Shift+K` / `Cmd+Shift+K` - 快速连接
- `Ctrl+Shift+A` / `Cmd+Shift+A` - NL 转命令

---

## 📝 开发规范

### 前端（React + TypeScript）

- **组件命名**：PascalCase（如 `MainLayout.tsx`）
- **文件命名**：PascalCase（组件）、camelCase（工具）
- **类型定义**：`interface` 定义对象类型，`type` 定义联合类型
- **导入顺序**：React → 第三方库 → 本地组件 → 本地工具
- **优先使用 shadcn/ui 组件**：`src/components/ui/`
- **状态管理**：Zustand，遵循单一数据源原则

### 后端（Rust）

- **命名风格**：遵循 Rust 规范
  - 类型/结构体/枚举：PascalCase
  - 函数/变量/模块：snake_case
  - 常量：SCREAMING_SNAKE_CASE
- **错误处理**：`Result<T, E>` 和自定义错误类型
- **异步编程**：`async/await` + `tokio`
- **Tauri 命令**：`#[tauri::command]` 宏，在 `lib.rs` 中注册

### Git 提交规范

```
<type>(<scope>): <subject>

类型：feat | fix | docs | style | refactor | test | chore
```

---

## 🛠️ 开发指南

### 添加新的 shadcn/ui 组件

```bash
npx shadcn@latest add [component-name]
```

### 添加新的 Tauri 命令

1. 在 `src-tauri/src/commands/` 创建命令文件
2. 使用 `#[tauri::command]` 宏标记函数
3. 在 `src-tauri/src/lib.rs` 中注册命令
4. 前端使用 `invoke('command_name', { params })` 调用

### 添加新的页面

1. 在 `src/pages/` 创建页面组件
2. 在 `src/App.tsx` 添加路由
3. 在侧边栏添加导航链接（如需要）

---

## 📚 重要文档

- **[README.md](./README.md)** - 项目完整文档
- **[docs/Shortcuts.md](./docs/Shortcuts.md)** - 快捷键列表
- **[docs/DOM_TO_SVG.md](./docs/DOM_TO_SVG.md)** - DOM to SVG 使用指南
- **[docs/ai-cache-integration.md](./docs/ai-cache-integration.md)** - AI 缓存集成文档
- **[docs/HOW_TO_ADD_KEYBINDING.md](./docs/HOW_TO_ADD_KEYBINDING.md)** - 添加快捷键指南
- **[docs/SHADCN_TAILWIND_SETUP.md](./docs/SHADCN_TAILWIND_SETUP.md)** - shadcn/ui + Tailwind 设置

---

## 🔗 相关资源

### 官方文档
- [Tauri 文档](https://tauri.app/)
- [React 文档](https://react.dev/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [xterm.js 文档](https://xtermjs.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)

### AI 服务
- [OpenAI API](https://platform.openai.com/)
- [Anthropic Claude API](https://www.anthropic.com/)
- [DeepSeek API](https://platform.deepseek.com/)

---

## 📦 重要依赖版本

### 前端

| 依赖 | 版本 |
|------|------|
| React | 19.1.0 |
| TypeScript | 5.8.3 |
| Vite | 7.0.4 |
| Tailwind CSS | 4.1.12 |
| Zustand | 4.5.0 |
| React Router | 7.8.2 |
| xterm.js | 5.5.0 |
| @tauri-apps/api | 2.9.1 |

### 后端（Rust）

| 依赖 | 版本 |
|------|------|
| Tauri | 2.4.0 |
| tokio | 1.35 |
| russh | 0.55 |
| russh-sftp | 2.1.1 |
| aes-gcm | 0.10 |
| argon2 | 0.5 |

---

## 📅 最后更新

2026年2月23日

---

## 💡 给 AI Agent 的提示

1. **优先使用项目工具**：优先使用 `read_file`、`glob`、`search_file_content` 等工具进行文件操作，避免使用 shell 命令
2. **遵循项目规范**：严格遵循项目的代码风格和命名规范
3. **使用现有组件**：优先使用 `src/components/ui/` 中的 shadcn/ui 组件
4. **状态管理**：使用 Zustand 进行全局状态管理
5. **类型安全**：充分利用 TypeScript 类型系统
6. **测试前端修改**：任何前端文件修改（.html/.css/.js/.jsx/.ts/.tsx/.vue）后，必须使用 frontend-tester 进行验证
7. **不创建冗余文档**：除非用户明确要求，否则不要主动创建 .md 文档或 README 文件