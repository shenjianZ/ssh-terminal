# 代码规范

SSH Terminal 项目遵循以下代码规范，确保代码质量和可维护性。

---

## 技术栈

### 前端
- **框架**：React 19
- **语言**：TypeScript 5.8+
- **样式**：Tailwind CSS 4.0
- **状态管理**：Zustand
- **构建工具**：Vite 7.0

### 后端
- **语言**：Rust 2021
- **框架**：Tauri 2.4
- **异步运行时**：tokio 1.35
- **SSH 实现**：russh 0.55

---

## 前端代码规范

### 命名规范
- **组件**：PascalCase（如 `SessionManager.tsx`）
- **文件**：PascalCase（组件）、camelCase（工具、类型、常量）
- **变量/函数**：camelCase
- **类/接口**：PascalCase
- **常量**：SCREAMING_SNAKE_CASE

```typescript
// ✅ 正确
const userName = "admin";
interface UserData { id: string; name: string; }
const MAX_CONNECTIONS = 100;
export const SessionManager: React.FC = () => <div>...</div>;
```

### 导入顺序
1. React 相关
2. 第三方库
3. 本地组件
4. 本地工具
5. 类型定义

### 类型定义
- **对象类型**：使用 `interface`
- **联合类型**：使用 `type`
- **避免使用 `any`**

```typescript
// ✅ 正确
interface SessionConfig { name: string; host: string; }
type AuthMethod = Password | PublicKey;
```

### 组件规范
- 优先使用**函数组件**
- **解构 Props**
- 自定义 Hooks 以 `use` 开头

### 状态管理
- 使用 **Zustand** 进行全局状态管理
- 优先使用 Zustand 而非 Context API

### 错误处理
- 所有异步操作使用 `try-catch` 捕获错误
- 避免直接暴露错误详情给用户

### 样式规范
- 使用 **Tailwind CSS** 类名
- 避免内联样式和魔法数字

```typescript
// ✅ 正确
<div className="flex items-center justify-between p-4 bg-white rounded-lg">
```

---

## 后端代码规范

### 命名规范（遵循 Rust 规范）
- **类型/结构体/枚举**：PascalCase
- **函数/变量/模块**：snake_case
- **常量**：SCREAMING_SNAKE_CASE

```rust
// ✅ 正确
pub struct SessionManager { sessions: Vec<Session> }
impl SessionManager {
    pub fn new() -> Self { Self { sessions: Vec::new() } }
    pub fn add_session(&mut self, session: Session) { self.sessions.push(session); }
}
const MAX_SESSIONS: usize = 100;
```

### 错误处理
- 使用 `Result<T, E>` 类型
- 使用 `?` 操作符传播错误
- 避免使用 `unwrap()` 或 `expect()`
- 定义自定义错误类型

```rust
// ✅ 正确
pub fn connect_ssh(config: &SessionConfig) -> Result<Connection, SshError> {
    let stream = TcpStream::connect(&config.address)?;
    Ok(Connection { stream })
}

#[derive(Debug, thiserror::Error)]
pub enum SshError {
    #[error("连接失败: {0}")]
    ConnectionFailed(String),
    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),
}
```

### 异步编程
- 使用 `async/await`
- 使用 tokio 运行时
- 避免在异步环境中使用阻塞调用

```rust
// ✅ 正确
pub async fn fetch_sessions() -> Result<Vec<Session>, Error> {
    db::get_sessions().await
}
```

### Tauri 命令
- 使用 `#[tauri::command]` 宏
- 在 `lib.rs` 中注册所有命令

```rust
// ✅ 正确
#[tauri::command]
pub async fn ssh_connect(session_id: String) -> Result<String, String> {
    manager.connect(&session_id).await.map_err(|e| e.to_string())
}

// 在 lib.rs 中注册
.invoke_handler(tauri::generate_handler![
    ssh_connect,
    ssh_disconnect,
])
```

### 模块组织
```
src/
├── main.rs
├── lib.rs
├── commands/       # Tauri 命令
├── ssh/            # SSH 模块
└── services/       # 服务层
```

---

## Git 提交规范

### Commit 信息格式
```
<type>(<scope>): <subject>
```

### Type 类型
| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能）|
| `refactor` | 重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具链相关 |

### 示例
```
feat(ssh): add public key authentication support

添加了 SSH 公钥认证功能，支持 RSA、ECDSA 和 Ed25519 密钥。

Closes #123
```

```
fix(ai): resolve streaming response buffering issue

修复了 AI 流式响应时的缓冲问题。

Fixes #456
```

---

## 代码审查清单

### 前端
- [ ] 代码通过 ESLint 检查
- [ ] 代码通过 Prettier 格式化
- [ ] 避免使用 `any` 类型
- [ ] 所有错误都被正确处理
- [ ] 没有使用 `@ts-ignore`

### 后端
- [ ] 代码通过 `cargo check` 检查
- [ ] 代码通过 `cargo clippy` 检查
- [ ] 代码通过 `cargo fmt` 格式化
- [ ] 所有错误都使用 `Result` 类型
- [ ] 没有使用 `unwrap()` 或 `expect()`

### 通用
- [ ] Git 提交信息符合规范
- [ ] 没有包含敏感信息
- [ ] 代码逻辑清晰，易于理解
- [ ] 没有死代码或注释代码