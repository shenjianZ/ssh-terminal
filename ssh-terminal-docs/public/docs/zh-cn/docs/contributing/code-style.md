# 代码规范

SSH Terminal 项目遵循严格的代码规范，确保代码质量和可维护性。本文档详细说明了前端（React + TypeScript）和后端（Rust）的代码规范。

## 目录

- [规范概述](#规范概述)
- [前端代码规范](#前端代码规范)
- [后端代码规范](#后端代码规范)
- [Git 提交规范](#git-提交规范)
- [代码审查清单](#代码审查清单)

---

## 规范概述

### 前端技术栈

- **框架**：React 19
- **语言**：TypeScript 5.8+
- **样式**：Tailwind CSS 4.0
- **状态管理**：Zustand
- **构建工具**：Vite 7.0

### 后端技术栈

- **语言**：Rust 2021
- **框架**：Tauri 2.4
- **异步运行时**：tokio 1.35
- **SSH 实现**：russh 0.55

### 工具配置

- **ESLint**：代码检查
- **Prettier**：代码格式化
- **Clippy**：Rust 代码检查
- **rustfmt**：Rust 代码格式化

---

## 前端代码规范

### 命名规范

#### 组件命名

- 使用 **PascalCase** 命名组件
- 组件文件名与组件名一致

```typescript
// ✅ 正确
export const SessionManager: React.FC = () => {
  return <div>...</div>;
};

// ❌ 错误
export const sessionManager = () => {
  return <div>...</div>;
};
```

#### 文件命名

- 组件文件：**PascalCase**（如 `SessionManager.tsx`）
- 工具文件：**camelCase**（如 `utils.ts`）
- 类型文件：**camelCase**（如 `types.ts`）
- 常量文件：**camelCase**（如 `constants.ts`）

#### 变量命名

- 使用 **camelCase** 命名变量和函数
- 使用 **PascalCase** 命名类和接口
- 使用 **SCREAMING_SNAKE_CASE** 命名常量

```typescript
// ✅ 正确
const userName = "admin";
const isActive = true;
const getUserData = () => {};

interface UserData {
  id: string;
  name: string;
}

const MAX_CONNECTIONS = 100;

// ❌ 错误
const user_name = "admin";
const User_Name = "admin";
const get_user_data = () => {};
const max_connections = 100;
```

### 导入顺序

按照以下顺序导入：

1. React 相关
2. 第三方库
3. 本地组件
4. 本地工具
5. 类型定义

```typescript
// ✅ 正确的导入顺序
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/store/sessionStore';
import type { SessionConfig } from '@/types/ssh';

// ❌ 错误的导入顺序
import { useSessionStore } from '@/store/sessionStore';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
```

### 类型定义

#### 使用 interface 定义对象类型

```typescript
// ✅ 正确
interface SessionConfig {
  id?: string;
  name: string;
  host: string;
}

// ❌ 错误
type SessionConfig = {
  id?: string;
  name: string;
  host: string;
};
```

#### 使用 type 定义联合类型

```typescript
// ✅ 正确
type AuthMethod = Password | PublicKey;

type Password = {
  type: 'password';
  password: string;
};

// ❌ 错误
interface AuthMethod extends Password | PublicKey {}
```

#### 使用类型别名简化复杂类型

```typescript
// ✅ 正确
type SessionId = string;
type ConnectionId = string;

// ❌ 错误
const sessionId: string = "...";
```

### 组件规范

#### 函数组件优先

```typescript
// ✅ 正确：使用函数组件
export const MyComponent: React.FC<Props> = ({ title }) => {
  return <div>{title}</div>;
};

// ❌ 错误：使用类组件
export class MyComponent extends React.Component<Props> {
  render() {
    return <div>{this.props.title}</div>;
  }
}
```

#### 使用 TypeScript 泛型

```typescript
// ✅ 正确
interface Props<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

export const List = <T,>({ items, renderItem }: Props<T>) => {
  return <div>{items.map(renderItem)}</div>;
};

// ❌ 错误：使用 any
interface Props {
  items: any[];
  renderItem: (item: any) => React.ReactNode;
}
```

#### Props 解构

```typescript
// ✅ 正确：解构 Props
export const MyComponent: React.FC<Props> = ({ title, description, children }) => {
  return (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
  );
};

// ❌ 错误：使用 props
export const MyComponent: React.FC<Props> = (props) => {
  return (
    <div>
      <h1>{props.title}</h1>
      <p>{props.description}</p>
      {props.children}
    </div>
  );
};
```

### Hooks 使用规范

#### 自定义 Hooks

```typescript
// ✅ 正确：自定义 Hook 以 use 开头
export const useSession = (sessionId: string) => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // ...
  }, [sessionId]);

  return session;
};

// ❌ 错误：不以 use 开头
export const getSession = (sessionId: string) => {
  // ...
};
```

#### Hooks 依赖

```typescript
// ✅ 正确：包含所有依赖
useEffect(() => {
  fetchData();
}, [userId, token]);  // ✅ 包含所有依赖

// ❌ 错误：遗漏依赖
useEffect(() => {
  fetchData();
}, [userId]);  // ❌ 遗漏 token

// ❌ 错误：空依赖数组
useEffect(() => {
  fetchData();
}, []);  // ❌ 遗漏所有依赖
```

### 状态管理

#### 使用 Zustand

```typescript
// ✅ 正确：使用 Zustand store
import { create } from 'zustand';

interface SessionStore {
  sessions: Session[];
  addSession: (session: Session) => void;
  removeSession: (id: string) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  removeSession: (id) => set((state) => ({ sessions: state.sessions.filter(s => s.id !== id) })),
}));

// 使用
const { sessions, addSession } = useSessionStore();
```

#### 避免 Context API

除非需要跨多个组件共享状态，否则优先使用 Zustand。

### 错误处理

#### 使用 try-catch

```typescript
// ✅ 正确：捕获错误
const handleConnect = async () => {
  try {
    await invoke('ssh_connect', { sessionId });
  } catch (error) {
    console.error('连接失败:', error);
    showError('连接失败，请检查配置');
  }
};

// ❌ 错误：不处理错误
const handleConnect = async () => {
  await invoke('ssh_connect', { sessionId });
};
```

#### 使用类型断言

```typescript
// ✅ 正确：类型守卫
if (error instanceof Error) {
  console.error(error.message);
}

// ❌ 错误：类型断言
console.error((error as Error).message);
```

### 样式规范

#### 使用 Tailwind CSS

```typescript
// ✅ 正确：使用 Tailwind 类名
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h1 className="text-xl font-bold text-gray-900">标题</h1>
  <Button>按钮</Button>
</div>

// ❌ 错误：使用内联样式
<div style={{ display: 'flex', padding: '16px', backgroundColor: 'white' }}>
  <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>标题</h1>
</div>
```

#### 避免魔法数字

```typescript
// ✅ 正确：使用常量
const PADDING = 16;
const FONT_SIZE = 20;

<div style={{ padding: PADDING, fontSize: FONT_SIZE }}>

// ❌ 错误：魔法数字
<div style={{ padding: 16, fontSize: 20 }}>
```

---

## 后端代码规范

### 命名规范

#### 遵循 Rust 规范

- **类型/结构体/枚举**：**PascalCase**
- **函数/变量/模块**：**snake_case**
- **常量**：**SCREAMING_SNAKE_CASE**

```rust
// ✅ 正确
pub struct SessionManager {
    sessions: Vec<Session>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            sessions: Vec::new(),
        }
    }

    pub fn add_session(&mut self, session: Session) {
        self.sessions.push(session);
    }
}

const MAX_SESSIONS: usize = 100;

// ❌ 错误
pub struct session_manager {  // ❌ 应该是 PascalCase
    sessions: Vec<Session>,
}

impl session_manager {
    pub fn New() -> Self {  // ❌ 应该是 snake_case
        Self {
            Sessions: Vec::new(),  // ❌ 应该是 snake_case
        }
    }
}
```

### 错误处理

#### 使用 Result

```rust
// ✅ 正确：使用 Result
pub fn connect_to_ssh(config: &SessionConfig) -> Result<Connection, SshError> {
    let stream = TcpStream::connect(&config.address)?;
    let session = Session::new()?;
    Ok(Connection { stream, session })
}

// ❌ 错误：使用 unwrap
pub fn connect_to_ssh(config: &SessionConfig) -> Connection {
    let stream = TcpStream::connect(&config.address).unwrap();  // ❌ 不要使用 unwrap
    let session = Session::new().unwrap();  // ❌ 不要使用 unwrap
    Connection { stream, session }
}
```

#### 自定义错误类型

```rust
// ✅ 正确：定义错误类型
#[derive(Debug, thiserror::Error)]
pub enum SshError {
    #[error("连接失败: {0}")]
    ConnectionFailed(String),

    #[error("认证失败: {0}")]
    AuthenticationFailed(String),

    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),
}

// 使用
pub fn connect() -> Result<Connection, SshError> {
    // ...
}
```

### 异步编程

#### 使用 async/await

```rust
// ✅ 正确：使用 async/await
pub async fn fetch_sessions() -> Result<Vec<Session>, Error> {
    let sessions = db::get_sessions().await?;
    Ok(sessions)
}

// ❌ 错误：阻塞式
pub fn fetch_sessions() -> Result<Vec<Session>, Error> {
    let sessions = db::get_sessions().wait()?;  // ❌ 不要在异步环境中使用阻塞调用
    Ok(sessions)
}
```

#### 使用 tokio

```rust
// ✅ 正确：使用 tokio 运行时
#[tokio::main]
async fn main() -> Result<(), Error> {
    let sessions = fetch_sessions().await?;
    Ok(())
}

// ✅ 正确：使用 tokio spawn
pub async fn handle_connections() {
    let handle = tokio::spawn(async move {
        // 异步任务
    });
    handle.await?;
}
```

### Tauri 命令

#### 使用 #[tauri::command] 宏

```rust
// ✅ 正确：使用 Tauri 命令宏
#[tauri::command]
pub async fn ssh_connect(session_id: String) -> Result<String, String> {
    let connection_id = manager.connect(&session_id).await
        .map_err(|e| e.to_string())?;
    Ok(connection_id)
}

// ❌ 错误：不使用宏
pub async fn ssh_connect(session_id: String) -> Result<String, String> {
    // ...
}
```

#### 注册命令

```rust
// ✅ 正确：在 lib.rs 中注册
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            ssh_connect,
            ssh_disconnect,
            get_sessions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 所有权和借用

#### 遵循 Rust 所有权规则

```rust
// ✅ 正确：使用引用
pub fn print_session(session: &Session) {
    println!("Session: {}", session.name);
}

// ✅ 正确：使用可变引用
pub fn update_session(session: &mut Session, name: String) {
    session.name = name;
}

// ❌ 错误：不必要的克隆
pub fn print_session(session: Session) {  // ❌ 不需要所有权
    println!("Session: {}", session.name);
}
```

#### 生命周期标注

```rust
// ✅ 正确：标注生命周期
pub fn find_longest<'a>(s1: &'a str, s2: &'a str) -> &'a str {
    if s1.len() > s2.len() {
        s1
    } else {
        s2
    }
}

// ❌ 错误：缺少生命周期
pub fn find_longest(s1: &str, s2: &str) -> &str {  // ❌ 缺少生命周期标注
    if s1.len() > s2.len() {
        s1
    } else {
        s2
    }
}
```

### 模块组织

#### 清晰的模块结构

```
src/
├── main.rs          # 入口点
├── lib.rs           # 库入口
├── commands/        # Tauri 命令
│   ├── mod.rs
│   ├── session.rs
│   └── terminal.rs
├── ssh/             # SSH 模块
│   ├── mod.rs
│   ├── manager.rs
│   └── client.rs
└── services/        # 服务层
    ├── mod.rs
    └── sync.rs
```

```rust
// ✅ 正确：清晰的模块导出
pub mod commands;
pub mod ssh;
pub mod services;

// 使用
use crate::commands::session;
use crate::ssh::manager;
```

---

## Git 提交规范

### Commit 信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能）|
| `refactor` | 重构（不是新功能也不是修复）|
| `test` | 测试相关 |
| `chore` | 构建/工具链相关 |

### 示例

```
feat(ssh): add public key authentication support

添加了 SSH 公钥认证功能，支持 RSA、ECDSA 和 Ed25519 密钥。
用户可以选择本地私钥文件并输入密钥密码（如果有）。

Closes #123
```

```
fix(ai): resolve streaming response buffering issue

修复了 AI 流式响应时的缓冲问题，现在可以实时显示响应内容。
问题是由事件监听器的实现不当引起的。

Fixes #456
```

```
docs: update installation guide

更新了安装指南，添加了 Windows 和 macOS 的详细安装步骤。
同时更新了依赖版本说明。
```

---

## 代码审查清单

提交代码前，请确保：

### 前端

- [ ] 所有导入按正确顺序排列
- [ ] 组件使用 PascalCase 命名
- [ ] 变量使用 camelCase 命名
- [ ] 类型定义完整，避免使用 `any`
- [ ] 所有错误都被正确处理
- [ ] 使用 TypeScript 严格模式
- [ ] 代码通过 ESLint 检查
- [ ] 代码通过 Prettier 格式化
- [ ] 没有使用 `@ts-ignore` 或 `@ts-expect-error`
- [ ] 所有依赖都列在 `package.json` 中

### 后端

- [ ] 代码通过 `cargo check` 检查
- [ ] 代码通过 `cargo clippy` 检查
- [ ] 代码通过 `cargo fmt` 格式化
- [ ] 所有错误都使用 `Result` 类型
- [ ] 没有使用 `unwrap()` 或 `expect()`
- [ ] 异步函数使用 `async/await`
- [ ] 所有 Tauri 命令都注册在 `lib.rs` 中
- [ ] 遵循 Rust 命名规范
- [ ] 模块组织清晰
- [ ] 添加了必要的文档注释

### 通用

- [ ] Git 提交信息符合规范
- [ ] 没有包含敏感信息（API Key、密码等）
- [ ] 添加了必要的注释
- [ ] 代码逻辑清晰，易于理解
- [ ] 没有死代码或注释代码
- [ ] 测试覆盖核心功能

---

## 相关资源

- [测试指南](./testing.md) - 测试规范
- [提交流程](./pr-flow.md) - Pull Request 流程
- [环境搭建](./setup.md) - 开发环境配置
- [ESLint 文档](https://eslint.org/) - ESLint 规则
- [Rust API 指南](https://doc.rust-lang.org/book/) - Rust 编程指南