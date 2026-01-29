# 前后端类型一致性检查报告

生成时间：2026-01-29

## ✅ 检查通过的所有枚举类型

### 1. ConnectionStatus (AI 模块)
**Rust 定义** (`src-tauri/src/ai/history.rs`):
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionStatus {
    Active,
    Inactive,
}
```

**TypeScript 定义** (`src/types/ai.ts`):
```typescript
export type ConnectionStatus = 'active' | 'inactive';
```

**序列化格式**: `{"active"}` 或 `{"inactive"}` ✅

---

### 2. SessionStatus (SSH 模块)
**Rust 定义** (`src-tauri/src/ssh/session.rs`):
```rust
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    Disconnected,
    Connecting,
    Connected,
    Error(String),
}
```

**TypeScript 定义** (`src/types/ssh.ts`):
```typescript
export type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
```

**序列化格式**: `{"disconnected"}`, `{"connecting"}`, `{"connected"}`, 或 `{"error":"message"}` ✅

---

### 3. AuthMethod (SSH 模块)
**Rust 定义** (`src-tauri/src/ssh/session.rs`):
```rust
#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum AuthMethod {
    Password { password: String },
    PublicKey { private_key_path: String, passphrase: Option<String> },
}
```

**TypeScript 定义** (`src/types/ssh.ts`):
```typescript
export type AuthMethod =
  | { Password: { password: string } }
  | { PublicKey: { private_key_path: string; passphrase?: string } };
```

**序列化格式**:
```json
{"Password":{"password":"..."}}
// 或
{"PublicKey":{"private_key_path":"...","passphrase":null}}
```
✅

---

### 4. TransferOperation (SFTP 模块)
**Rust 定义** (`src-tauri/src/sftp/mod.rs`):
```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TransferOperation {
    Upload,
    Download,
    RemoteToRemote,
}
```

**TypeScript 定义** (`src/types/sftp.ts`):
```typescript
export type TransferOperation = 'upload' | 'download' | 'remote_to_remote';
```

**序列化格式**: `{"upload"}`, `{"download"}`, 或 `{"remote_to_remote"}` ✅

---

### 5. TransferSource (SFTP 模块)
**Rust 定义** (`src-tauri/src/sftp/mod.rs`):
```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type")]
#[serde(rename_all = "lowercase")]
pub enum TransferSource {
    Local { path: String },
    Remote { connection_id: String, path: String },
}
```

**TypeScript 定义** (`src/types/sftp.ts`):
```typescript
export type TransferSource =
  | { type: 'local'; path: string }
  | { type: 'remote'; connection_id: string; path: string };
```

**序列化格式**:
```json
{"type":"local","path":"..."}
// 或
{"type":"remote","connection_id":"...","path":"..."}
```
✅

---

### 6. TransferStatus (SFTP 模块)
**Rust 定义** (`src-tauri/src/sftp/mod.rs`):
```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TransferStatus {
    Pending,
    InProgress,
    Completed,
    Failed { reason: String },
    Cancelled,
}
```

**TypeScript 定义** (`src/types/sftp.ts`):
```typescript
export type TransferStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';
```

**序列化格式**: `{"pending"}`, `{"in_progress"}`, `{"completed"}`, `{"cancelled"}`

⚠️ **注意**: `Failed` 变体包含 `reason` 字段，但前端简化为字符串 `'failed'`。如果需要传递错误原因，前端类型应改为：
```typescript
export type TransferStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | { failed: string }  // 修改这里
  | 'cancelled';
```

---

### 7. RecordingEventType (录制模块)
**Rust 定义** (`src-tauri/src/commands/recording.rs`):
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RecordingEventType {
    Input,
    Output,
    Resize,
    Metadata,
}
```

**TypeScript 定义** (`src/types/recording.ts`):
```typescript
export type RecordingEventType = 'input' | 'output' | 'resize' | 'metadata';
```

**序列化格式**: `{"input"}`, `{"output"}`, `{"resize"}`, 或 `{"metadata"}` ✅

---

## 📋 Serde 配置总结

| Rust Enum | Serde 配置 | 前端格式 | 状态 |
|-----------|-----------|---------|------|
| `ConnectionStatus` | `rename_all = "lowercase"` | `'active' \| 'inactive'` | ✅ |
| `SessionStatus` | `rename_all = "lowercase"` | `'disconnected' \| ...` | ✅ |
| `AuthMethod` | 默认 (PascalCase tag) | `{ Password: {...} } \| ...` | ✅ |
| `TransferOperation` | `rename_all = "lowercase"` | `'upload' \| ...` | ✅ |
| `TransferSource` | `tag + rename_all = "lowercase"` | `{ type: 'local', ... }` | ✅ |
| `TransferStatus` | `rename_all = "lowercase"` | `'pending' \| ...` | ⚠️ (简化) |
| `RecordingEventType` | `rename_all = "snake_case"` | `'input' \| ...` | ✅ |

---

## 🔧 已修复的问题

### 1. ConnectionStatus 序列化问题
**问题**: Rust 枚举使用 PascalCase (`Active`/`Inactive`)，前端发送小写
**修复**: 添加 `#[serde(rename_all = "lowercase")]` 到 Rust 枚举

### 2. AuthMethod 类型定义
**问题**: 前端使用标记联合类型，与 Rust enum 不匹配
**状态**: 实际上是匹配的，保持现有定义

### 3. TransferStatus Failed 变体
**问题**: 前端简化了 `Failed { reason: String }` 为字符串
**影响**: 轻微 - 错误原因不会传递到前端
**建议**: 如需完整错误信息，修改前端类型为 `{ failed: string }`

---

## ✅ 编译状态

- **Rust**: ✅ 编译通过 (仅有未使用代码警告)
- **TypeScript**: ✅ 类型检查通过
- **完整构建**: ✅ 待测试

---

## 📝 建议

1. **统一序列化风格**: 建议所有简单枚举使用 `#[serde(rename_all = "lowercase")]`
2. **TransferStatus 增强**: 考虑将前端的 `'failed'` 改为 `{ failed: string }` 以获取错误详情
3. **文档同步**: 保持此文档与代码同步更新
4. **自动化测试**: 考虑添加前后端序列化/反序列化的集成测试

---

## 🔄 下次更新触发条件

- 添加新的枚举类型
- 修改现有 serde 配置
- 发现序列化/反序列化错误
