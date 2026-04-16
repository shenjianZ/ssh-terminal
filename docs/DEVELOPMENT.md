# 开发指南

本文档提供 SSH Terminal 的开发环境搭建、开发流程和常用开发任务指南。

## 目录

- [开发环境搭建](#开发环境搭建)
- [项目结构](#项目结构)
- [开发流程](#开发流程)
- [常用开发任务](#常用开发任务)
- [调试技巧](#调试技巧)
- [测试](#测试)
- [构建和发布](#构建和发布)

---

## 开发环境搭建

### 系统要求

**必备软件**：
- Node.js 18+
- Rust 1.70+
- pnpm 10.14.0+
- Git

**推荐软件**：
- VS Code（推荐扩展）
- Tauri CLI
- Docker（用于部署测试）

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/shenjianZ/ssh-terminal.git
cd ssh-terminal
```

#### 2. 安装前端依赖

```bash
pnpm install
```

#### 3. 验证 Rust 环境

```bash
rustc --version
cargo --version
```

#### 4. 安装 Tauri CLI（可选）

```bash
cargo install tauri-cli --version "^2.0.0"
```

#### 5. 验证环境

```bash
# 测试前端开发
pnpm dev

# 测试完整应用
pnpm tauri dev
```

### VS Code 推荐扩展

**必备扩展**：
- Tauri - Tauri 开发支持
- Rust Analyzer - Rust 语言支持
- ESLint - 代码检查
- Prettier - 代码格式化

**推荐扩展**：
- Tailwind CSS IntelliSense - Tailwind CSS 智能提示
- TypeScript Vue Plugin (Volar) - Vue/React 支持
- GitLens - Git 增强
- Error Lens - 错误信息显示

---

## 项目结构

```
ssh-terminal/
├── src/                          # 前端源代码
│   ├── components/               # React 组件
│   │   ├── ai/                   # AI 相关组件
│   │   ├── layout/               # 布局组件
│   │   ├── session/              # 会话管理组件
│   │   ├── settings/             # 设置组件
│   │   ├── ssh/                  # SSH 相关组件
│   │   ├── sftp/                 # SFTP 文件管理器
│   │   ├── terminal/             # 终端组件
│   │   └── ui/                   # UI 组件（shadcn/ui）
│   ├── config/                   # 配置文件
│   │   ├── defaultKeybindings.ts # 默认快捷键
│   │   └── themes.ts             # 主题配置
│   ├── hooks/                    # React Hooks
│   ├── lib/                      # 工具库
│   ├── pages/                    # 页面组件
│   ├── store/                    # Zustand 状态管理
│   ├── types/                    # TypeScript 类型定义
│   ├── utils/                    # 工具函数
│   ├── App.tsx                   # 应用入口
│   └── main.tsx                  # 主入口文件
├── src-tauri/                    # Rust 后端代码
│   ├── src/
│   │   ├── commands/             # Tauri 命令
│   │   ├── ssh/                  # SSH 相关
│   │   ├── storage/              # 存储相关
│   │   └── lib.rs                # 库入口
│   ├── Cargo.toml                # Rust 依赖配置
│   └── tauri.conf.json           # Tauri 配置
├── docs/                         # 文档
├── public/                       # 静态资源
├── package.json                  # 前端依赖配置
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 配置
└── tailwind.config.js            # Tailwind CSS 配置
```

---

## 开发流程

### 1. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

### 2. 开发功能

**前端开发**：
```bash
# 仅启动前端开发服务器
pnpm dev

# 启动完整应用（前端 + 后端）
pnpm tauri dev
```

**后端开发**：
- 在 `src-tauri/src/` 中修改 Rust 代码
- 使用 `pnpm tauri dev` 热重载
- 查看终端输出获取错误信息

### 3. 测试功能

- 手动测试功能是否正常
- 检查控制台是否有错误
- 验证边界情况

### 4. 提交代码

```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. 推送到远程

```bash
git push origin feature/your-feature-name
```

### 6. 创建 Pull Request

- 在 GitHub 上创建 PR
- 填写 PR 描述
- 等待代码审查

---

## 常用开发任务

### 添加新的 shadcn/ui 组件

```bash
# 添加单个组件
npx shadcn@latest add [component-name]

# 示例：添加 Button 组件
npx shadcn@latest add button

# 示例：添加多个组件
npx shadcn@latest add button input dialog
```

**可用组件列表**：
- button
- input
- dialog
- dropdown-menu
- tabs
- toast
- card
- table
- 等等

详细组件列表：https://ui.shadcn.com/docs/components

### 添加新的 Tauri 命令

#### 1. 创建命令文件

在 `src-tauri/src/commands/` 中创建新文件：

```rust
// src-tauri/src/commands/example.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ExampleRequest {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExampleResponse {
    pub message: String,
}

#[tauri::command]
pub fn greet(request: ExampleRequest) -> Result<ExampleResponse, String> {
    Ok(ExampleResponse {
        message: format!("Hello, {}!", request.name),
    })
}
```

#### 2. 注册命令

在 `src-tauri/src/lib.rs` 中注册命令：

```rust
mod commands;
use commands::example::greet;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            // ... 其他命令
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 3. 前端调用

```typescript
import { invoke } from '@tauri-apps/api/core';

interface ExampleRequest {
  name: string;
}

interface ExampleResponse {
  message: string;
}

async function greet(name: string) {
  const request: ExampleRequest = { name };
  const response = await invoke<ExampleResponse>('greet', { request });
  console.log(response.message);
}
```

### 添加新的页面

#### 1. 创建页面组件

在 `src/pages/` 中创建新文件：

```typescript
// src/pages/NewPage.tsx
import React from 'react';

export default function NewPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">New Page</h1>
      <p>This is a new page.</p>
    </div>
  );
}
```

#### 2. 添加路由

在 `src/App.tsx` 中添加路由：

```typescript
import NewPage from '@/pages/NewPage';

// 在路由配置中添加
<Route path="/new-page" element={<NewPage />} />
```

#### 3. 添加导航链接

在侧边栏组件中添加导航：

```typescript
import NewPage from '@/pages/NewPage';

// 在导航菜单中添加
<NavLink to="/new-page">
  New Page
</NavLink>
```

### 添加新的 Zustand Store

#### 1. 创建 Store

在 `src/store/` 中创建新文件：

```typescript
// src/store/newStore.ts
import { create } from 'zustand';

interface NewStore {
  data: string;
  setData: (data: string) => void;
}

export const useNewStore = create<NewStore>((set) => ({
  data: '',
  setData: (data) => set({ data }),
}));
```

#### 2. 使用 Store

```typescript
import { useNewStore } from '@/store/newStore';

function MyComponent() {
  const { data, setData } = useNewStore();

  return (
    <div>
      <p>{data}</p>
      <button onClick={() => setData('Hello')}>
        Set Data
      </button>
    </div>
  );
}
```

### 修改主题

编辑 `src/config/themes.ts` 文件：

```typescript
export const themes: TerminalTheme[] = [
  {
    name: 'custom-theme',
    displayName: '自定义主题',
    type: 'dark',
    colors: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      // ... 其他颜色
    },
  },
  // ... 其他主题
];
```

### 添加新的快捷键

编辑 `src/config/defaultKeybindings.ts` 文件：

```typescript
export const defaultKeybindings: Keybinding[] = [
  {
    id: 'custom-action',
    name: '自定义操作',
    description: '这是一个自定义操作',
    accelerator: 'Ctrl+Shift+X',
    action: () => {
      console.log('Custom action triggered');
    },
    scope: 'global',
  },
  // ... 其他快捷键
];
```

---

## 调试技巧

### 前端调试

**使用浏览器开发者工具**：
```bash
pnpm tauri dev
```

**常用快捷键**：
- `F12` - 打开开发者工具
- `Ctrl+Shift+I` - 打开开发者工具
- `Ctrl+Shift+J` - 打开控制台

**调试 React 组件**：
- 安装 React Developer Tools
- 检查组件状态和 props
- 查看组件树

### 后端调试

**查看终端输出**：
```bash
pnpm tauri dev
```

**使用 Rust 调试器**：
```bash
# 使用 lldb 或 gdb
cargo build
lldb ./target/debug/ssh-terminal
```

**添加日志**：
```rust
use log::{info, warn, error};

#[tauri::command]
pub fn example_command() -> Result<(), String> {
    info!("Command executed");
    Ok(())
}
```

### 调试 Tauri 命令

**前端调用**：
```typescript
try {
  const result = await invoke('command_name', { param });
  console.log('Result:', result);
} catch (error) {
  console.error('Error:', error);
}
```

**后端返回错误**：
```rust
#[tauri::command]
pub fn example_command() -> Result<String, String> {
    Err("Something went wrong".to_string())
}
```

---

## 测试

### 前端测试

**单元测试**：
```bash
pnpm test
```

**组件测试**：
```bash
pnpm test:ui
```

### 后端测试

**单元测试**：
```bash
cd src-tauri
cargo test
```

**集成测试**：
```bash
cargo test --test integration
```

---

## 构建和发布

### 开发构建

```bash
# 前端构建
pnpm build

# Tauri 构建
pnpm tauri build
```

### 生产构建

```bash
# Windows
pnpm tauri:build:win

# macOS
pnpm tauri:build:mac

# Linux
pnpm tauri:build:linux
```

### 构建产物

**Windows**：
- `src-tauri/target/release/bundle/msi/` - MSI 安装包
- `src-tauri/target/release/bundle/nsis/` - NSIS 安装包

**macOS**：
- `src-tauri/target/release/bundle/dmg/` - DMG 安装包
- `src-tauri/target/release/bundle/macos/` - APP 文件

**Linux**：
- `src-tauri/target/release/bundle/deb/` - DEB 包
- `src-tauri/target/release/bundle/appimage/` - AppImage

---

## 常见问题

### Q: 热重载不工作怎么办？

A:
1. 检查 Vite 开发服务器是否正常运行
2. 检查端口 1420 是否被占用
3. 尝试重启开发服务器
4. 清除缓存：`pnpm clean`

### Q: Tauri 命令调用失败怎么办？

A:
1. 检查命令是否在 `lib.rs` 中注册
2. 检查命令名称是否正确
3. 查看终端输出获取错误信息
4. 确保命令参数类型正确

### Q: Rust 编译错误怎么办？

A:
1. 检查 Rust 版本是否符合要求
2. 更新依赖：`cargo update`
3. 清理构建缓存：`cargo clean`
4. 查看错误详情和提示

### Q: 前端样式不生效怎么办？

A:
1. 检查 Tailwind CSS 配置
2. 确保类名正确
3. 检查 CSS 优先级
4. 尝试清除浏览器缓存

---

## 资源链接

**官方文档**：
- [Tauri 文档](https://tauri.app/)
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Vite 文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- [shadcn/ui 文档](https://ui.shadcn.com/)

**社区资源**：
- [Tauri Discord](https://discord.gg/tauri)
- [Tauri GitHub](https://github.com/tauri-apps/tauri)
- [React GitHub](https://github.com/facebook/react)

---

## 总结

SSH Terminal 使用 Tauri + React + Rust 技术栈，提供跨平台的 SSH 终端管理功能。开发环境需要 Node.js、Rust 和 pnpm。项目结构清晰，分为前端和后端两部分。常用开发任务包括添加组件、创建命令、添加页面等。使用开发者工具和日志可以方便地调试代码。