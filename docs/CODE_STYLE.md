# 代码规范

本文档定义了 SSH Terminal 项目的代码风格和规范，确保代码质量和一致性。

## 目录

- [前端规范（React + TypeScript）](#前端规范react--typescript)
- [后端规范（Rust）](#后端规范rust)
- [Git 提交规范](#git-提交规范)
- [代码审查清单](#代码审查清单)

---

## 前端规范（React + TypeScript）

### 命名规范

**组件命名**：
- 使用 PascalCase
- 示例：`UserProfile.tsx`、`TerminalTab.tsx`

**文件命名**：
- 组件文件：PascalCase
- 工具文件：camelCase
- 常量文件：UPPER_SNAKE_CASE
- 示例：
  - `UserProfile.tsx`（组件）
  - `formatDate.ts`（工具）
  - `API_CONSTANTS.ts`（常量）

**变量命名**：
- 使用 camelCase
- 布尔值：以 `is`、`has`、`should` 开头
- 示例：
  ```typescript
  const userName = 'John';
  const isActive = true;
  const hasPermission = false;
  ```

**函数命名**：
- 使用 camelCase
- 动词开头，描述函数行为
- 示例：
  ```typescript
  function getUserById(id: string) {}
  function handleSave() {}
  function shouldUpdate() {}
  ```

**常量命名**：
- 使用 UPPER_SNAKE_CASE
- 示例：
  ```typescript
  const MAX_RETRY_COUNT = 3;
  const API_BASE_URL = 'https://api.example.com';
  ```

### 类型定义

**使用 `interface` 定义对象类型**：
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

interface UserResponse {
  user: User;
  token: string;
}
```

**使用 `type` 定义联合类型**：
```typescript
type Theme = 'light' | 'dark';
type Status = 'pending' | 'success' | 'error';
type ID = string | number;
```

**类型定义位置**：
- 组件相关的类型：放在组件文件中
- 共享类型：放在 `src/types/` 目录
- API 类型：放在 `src/types/api.ts`

### 导入顺序

按照以下顺序导入：

1. React 相关
2. 第三方库
3. 本地组件（使用 `@/` 别名）
4. 本地工具函数和类型
5. 样式文件

**示例**：
```typescript
// 1. React 相关
import React, { useState, useEffect } from 'react';

// 2. 第三方库
import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

// 3. 本地组件
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 4. 本地工具函数和类型
import { formatDate } from '@/utils/date';
import type { User } from '@/types/user';

// 5. 样式文件
import './UserProfile.css';
```

### 组件结构

**函数组件结构**：
```typescript
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/user';

interface UserProfileProps {
  user: User;
  onUpdate?: (user: User) => void;
}

export default function UserProfile({ user, onUpdate }: UserProfileProps) {
  // 1. Hooks
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);

  // 2. Effects
  useEffect(() => {
    setFormData(user);
  }, [user]);

  // 3. 事件处理函数
  const handleSave = () => {
    onUpdate?.(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  // 4. 渲染辅助函数
  const renderEditForm = () => (
    <form onSubmit={handleSave}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Button type="submit">保存</Button>
      <Button type="button" onClick={handleCancel}>
        取消
      </Button>
    </form>
  );

  const renderViewMode = () => (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <Button onClick={() => setIsEditing(true)}>编辑</Button>
    </div>
  );

  // 5. 返回 JSX
  return (
    <div className="user-profile">
      {isEditing ? renderEditForm() : renderViewMode()}
    </div>
  );
}
```

### 使用 shadcn/ui 组件

**优先使用 shadcn/ui 组件**：
```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Tabs } from '@/components/ui/tabs';
```

**自定义样式**：
```typescript
<Button className="bg-blue-500 hover:bg-blue-600">
  自定义按钮
</Button>
```

### 状态管理

**使用 Zustand 进行全局状态管理**：
```typescript
// src/store/userStore.ts
import { create } from 'zustand';

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

**组件中使用 Store**：
```typescript
import { useUserStore } from '@/store/userStore';

function UserProfile() {
  const { user, setUser } = useUserStore();

  return <div>{user?.name}</div>;
}
```

**遵循单一数据源原则**：
- 避免在多个地方管理相同的状态
- 使用 Zustand Store 作为唯一数据源
- 组件只负责展示和用户交互

### Hooks 使用

**自定义 Hooks**：
```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

**使用自定义 Hooks**：
```typescript
function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  return <div>Current theme: {theme}</div>;
}
```

### 错误处理

**使用 try-catch 处理异步错误**：
```typescript
async function handleSubmit() {
  try {
    const result = await invoke('save_user', { userData });
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
    // 显示错误提示
  }
}
```

**错误边界**：
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

---

## 后端规范（Rust）

### 命名规范

**类型、结构体、枚举**：使用 PascalCase
```rust
struct User {
    id: String,
    name: String,
}

enum Status {
    Active,
    Inactive,
}

type Result<T> = std::result::Result<T, Error>;
```

**函数、变量、模块**：使用 snake_case
```rust
fn get_user_by_id(id: &str) -> Result<User> {
    // ...
}

let user_name = "John";
```

**常量**：使用 SCREAMING_SNAKE_CASE
```rust
const MAX_RETRY_COUNT: u32 = 3;
const API_BASE_URL: &str = "https://api.example.com";
```

### 错误处理

**使用 `Result<T, E>`**：
```rust
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err("Cannot divide by zero".to_string())
    } else {
        Ok(a / b)
    }
}
```

**使用 `?` 操作符传播错误**：
```rust
fn process_data(data: &str) -> Result<ProcessedData, Error> {
    let parsed = parse_data(data)?;
    let validated = validate_data(parsed)?;
    Ok(validated)
}
```

**自定义错误类型**：
```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Parse error: {0}")]
    Parse(String),

    #[error("Network error: {0}")]
    Network(String),
}
```

### 异步编程

**使用 `async/await`**：
```rust
async fn fetch_user(id: &str) -> Result<User, Error> {
    let response = reqwest::get(format!("{}/users/{}", API_URL, id)).await?;
    let user = response.json::<User>().await?;
    Ok(user)
}
```

**使用 `tokio` 运行时**：
```rust
#[tokio::main]
async fn main() -> Result<(), Error> {
    let user = fetch_user("123").await?;
    println!("User: {:?}", user);
    Ok(())
}
```

### Tauri 命令

**使用 `#[tauri::command]` 宏**：
```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

**命令参数和返回值必须实现 Serialize/Deserialize**：
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct UserRequest {
    pub name: String,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: String,
    pub name: String,
    pub email: String,
}

#[tauri::command]
fn create_user(request: UserRequest) -> Result<UserResponse, String> {
    // 创建用户逻辑
    Ok(UserResponse {
        id: generate_id(),
        name: request.name,
        email: request.email,
    })
}
```

**在 lib.rs 中注册命令**：
```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            create_user,
            // ... 其他命令
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 注释和文档

**使用 `///` 添加文档注释**：
```rust
/// 创建一个新用户
///
/// # 参数
///
/// * `request` - 用户创建请求
///
/// # 返回
///
/// 返回创建的用户信息
///
/// # 错误
///
/// 如果用户已存在，返回错误
#[tauri::command]
fn create_user(request: UserRequest) -> Result<UserResponse, AppError> {
    // ...
}
```

**使用 `//` 添加行内注释**：
```rust
// 检查用户是否已存在
if user_exists(&request.email)? {
    return Err(AppError::UserAlreadyExists);
}

// 创建新用户
let user = User::new(request.name, request.email);
```

### 模块组织

**模块结构**：
```
src-tauri/src/
├── commands/          # Tauri 命令
│   ├── mod.rs
│   ├── user.rs
│   └── session.rs
├── models/            # 数据模型
│   ├── mod.rs
│   └── user.rs
├── services/          # 业务逻辑
│   ├── mod.rs
│   └── auth.rs
├── storage/           # 存储层
│   ├── mod.rs
│   └── database.rs
├── error.rs           # 错误定义
└── lib.rs             # 库入口
```

**模块声明**：
```rust
// lib.rs
mod commands;
mod models;
mod services;
mod storage;
mod error;
```

---

## Git 提交规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型（type）

- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更新
- `style` - 代码格式（不影响功能）
- `refactor` - 重构
- `perf` - 性能优化
- `test` - 测试相关
- `chore` - 构建/工具相关

### 示例

**feat（新功能）**：
```
feat(terminal): add support for multiple terminal tabs

Implement tab management for SSH sessions, allowing users to
switch between multiple active connections.

- Add TabBar component
- Implement tab switching logic
- Add keyboard shortcuts for tab navigation

Closes #123
```

**fix（Bug 修复）**：
```
fix(ssh): resolve connection timeout issue

Fix the issue where SSH connections would timeout after
30 seconds even with active data transfer.

The problem was caused by incorrect keepalive configuration.
Updated keepalive interval to 60 seconds.

Fixes #456
```

**docs（文档更新）**：
```
docs(readme): update installation instructions

Update the installation instructions to include the new
dependency requirements for Rust 1.70+.
```

**style（代码格式）**：
```
style(terminal): format code with prettier

Apply prettier formatting to all terminal-related files
to ensure consistent code style.
```

**refactor（重构）**：
```
refactor(store): simplify state management

Refactor the session store to use a simpler state structure.
This improves performance and reduces complexity.

Changes:
- Migrate to Zustand v5
- Simplify state transitions
- Remove redundant selectors
```

### 提交建议

**使用清晰的提交信息**：
- 描述你做了什么，而不是怎么做的
- 使用现在时态（"add" 而不是 "added"）
- 首字母小写
- 不要超过 72 个字符（subject）

**提供详细的 body**：
- 解释为什么做这个改动
- 列出主要的变更点
- 关联相关的 issue

**添加 footer**：
- 关闭的 issue：`Closes #123`、`Fixes #456`
- 破坏性变更：`BREAKING CHANGE: ...`

---

## 代码审查清单

### 前端

**代码质量**：
- [ ] 代码符合 TypeScript 规范
- [ ] 没有使用 `any` 类型
- [ ] 使用了正确的类型定义
- [ ] 错误处理完善
- [ ] 没有调试代码（console.log）

**代码风格**：
- [ ] 命名符合规范
- [ ] 导入顺序正确
- [ ] 组件结构清晰
- [ ] 使用了 shadcn/ui 组件
- [ ] 样式使用 Tailwind CSS

**功能正确性**：
- [ ] 功能实现完整
- [ ] 边界情况处理
- [ ] 用户输入验证
- [ ] 性能考虑（避免不必要的重渲染）

**可维护性**：
- [ ] 代码可读性好
- [ ] 适当的注释
- [ ] 模块化设计
- [ ] 复用性考虑

### 后端

**代码质量**：
- [ ] 代码符合 Rust 规范
- [ ] 错误处理完善
- [ ] 使用 `Result<T, E>`
- [ ] 没有 unwrap() 或 expect()
- [ ] 线程安全

**代码风格**：
- [ ] 命名符合规范
- [ ] 模块组织清晰
- [ ] 注释充分
- [ ] 使用了合适的 Rust 特性

**功能正确性**：
- [ ] 功能实现完整
- [ ] 边界情况处理
- [ ] 安全考虑（加密、验证）
- [ ] 性能考虑

**可维护性**：
- [ ] 代码可读性好
- [ ] 文档注释充分
- [ ] 模块化设计
- [ ] 测试覆盖

### 测试

**测试覆盖**：
- [ ] 单元测试
- [ ] 集成测试
- [ ] 边界情况测试
- [ ] 错误情况测试

---

## 总结

遵循代码规范可以提高代码质量、可读性和可维护性。前端使用 React + TypeScript，后端使用 Rust，都需要遵循各自的命名规范、代码结构和最佳实践。Git 提交信息使用清晰的格式，方便代码审查和版本管理。