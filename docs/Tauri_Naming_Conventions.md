# Tauri 命名规范文档

## 概述

本文档定义了 SSH Terminal 项目中 Tauri 应用 Rust 端和前端（TypeScript/JavaScript）之间的数据类型命名规范。通过遵循这些规范，可以确保跨语言的类型安全性和一致性。

## 核心原则

### 1. 各自遵循语言规范
- **Rust 端**: 遵循 Rust 命名规范（snake_case 变量/函数，PascalCase 类型/枚举）
- **前端**: 遵循 TypeScript 命名规范（camelCase 变量/属性，PascalCase 类型）
- **通过 serde 自动转换**: 使用 `serde` 的重命名功能自动处理转换

### 2. 类型名称保持一致
- **Rust 端**: PascalCase（如 `SessionConfig`, `AuthMethod`）
- **前端**: PascalCase（如 `SessionConfig`, `AuthMethod`）
- 类型名称在两端保持一致

## 详细规范

### Struct 字段命名

#### Rust 端规范
- 使用 **snake_case** 命名
- 添加 `#[serde(rename_all = "camelCase")]` 注解自动转换为 camelCase

```rust
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionConfig {
    pub host: String,           // Rust: snake_case
    pub port: u16,
    pub user_name: String,      // Rust: snake_case
    pub private_key_path: String, // Rust: snake_case
    pub auth_method: AuthMethod,
}
```

#### 前端规范
- 使用 **camelCase** 命名
- 与 serde 自动转换后的名称一致

```typescript
export interface SessionConfig {
    host: string;               // TS: camelCase
    port: number;
    userName: string;           // TS: camelCase
    privateKeyPath: string;     // TS: camelCase
    authMethod: AuthMethod;
}
```

### Enum 变体命名

#### Rust 端规范
- 使用 **PascalCase** 命名
- 添加 `#[serde(rename_all = "camelCase")]` 注解自动转换为 camelCase

```rust
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AuthMethod {
    Password { password: String },           // PascalCase
    PublicKey { privateKeyPath: String, passphrase: Option<String> },
}
```

#### 前端规范
- 使用 **PascalCase** 命名（Discriminated Union）
- 与 serde 自动转换后的变体名称一致

```typescript
export type AuthMethod =
    | { Password: { password: string } }      // PascalCase
    | { PublicKey: { privateKeyPath: string; passphrase?: string } };
```

### 字段命名对照表

| Rust 端 (snake_case) | 前端 (camelCase) | 示例用途 |
|---------------------|------------------|---------|
| `user_name` | `userName` | 用户名 |
| `private_key_path` | `privateKeyPath` | 私钥路径 |
| `auth_method` | `authMethod` | 认证方法 |
| `connection_id` | `connectionId` | 连接 ID |
| `terminal_type` | `terminalType` | 终端类型 |
| `keep_alive_interval` | `keepAliveInterval` | 保活间隔 |
| `strict_host_key_checking` | `strictHostKeyChecking` | 主机密钥检查 |
| `video_file` | `videoFile` | 视频文件 |

## 特殊情况处理

### 1. 保留字段原名
如果某些字段需要保持原名（通常是已经是 camelCase 的字段），可以使用 `#[serde(skip_serializing_if = "Option::is_none")]` 或单独注解：

```rust
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionConfig {
    pub name: String,           // name -> name (保持不变)
    #[serde(rename = "id")]      // 显式重命名
    pub session_id: String,
}
```

### 2. 单词分隔符
- **snake_case**: 使用下划线 `_` 分隔
- **camelCase**: 使用首字母大写分隔

```rust
// Rust: strict_host_key_checking
// TS:  strictHostKeyChecking
```

### 3. 缩写处理
- 缩写词保持原始形式（如 `ID`, `URL`, `SSH`）
- 不要将缩写词转换为小写

```rust
pub connection_id: String,      // NOT connection_i_d
// TS: connectionId                // NOT connectionId
```

## 实现示例

### Rust 端完整示例

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SessionConfig {
    pub id: Option<String>,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub authMethod: AuthMethod,
    pub terminalType: Option<String>,
    pub columns: Option<u16>,
    pub rows: Option<u16>,
    #[serde(default = "default_strict_host_key_checking")]
    pub strictHostKeyChecking: bool,
    #[serde(default = "default_group")]
    pub group: String,
    #[serde(default = "default_keep_alive_interval")]
    pub keepAliveInterval: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum AuthMethod {
    Password { password: String },
    PublicKey { privateKeyPath: String, passphrase: Option<String> },
}
```

### 前端完整示例

```typescript
export interface SessionConfig {
    id?: string;
    name: string;
    host: string;
    port: number;
    username: string;
    authMethod: AuthMethod;
    terminalType?: string;
    columns?: number;
    rows?: number;
    strictHostKeyChecking?: boolean;
    group?: string;
    keepAliveInterval?: number;
}

export type AuthMethod =
    | { Password: { password: string } }
    | { PublicKey: { privateKeyPath: string; passphrase?: string } };
```

## 验证和测试

### 1. Rust 端验证
```bash
cd src-tauri
cargo check
cargo clippy
```

### 2. 前端验证
```bash
pnpm tsc --noEmit
```

### 3. 交叉验证
- 测试 Rust 序列化到 JSON
- 验证前端反序列化是否正确
- 检查字段名是否匹配

## 常见错误

### 错误 1: 未添加 serde 注解
```rust
// ❌ 错误
pub struct SessionConfig {
    pub user_name: String,  // 序列化为 user_name (snake_case)
}

// ✅ 正确
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionConfig {
    pub user_name: String,  // 序列化为 userName (camelCase)
}
```

### 错误 2: 前端类型不匹配
```typescript
// ❌ 错误
export interface SessionConfig {
    user_name: string;  // 应该是 userName
}

// ✅ 正确
export interface SessionConfig {
    userName: string;  // 与 Rust 端序列化后的名称一致
}
```

### 错误 3: Enum 变体命名不一致
```rust
// ❌ 错误
pub enum AuthMethod {
    Password,      // 序列化为 "Password" (PascalCase)
    PublicKey,
}

// ✅ 正确
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AuthMethod {
    Password,      // 序列化为 "password" (camelCase)
    PublicKey,    // 序列化为 "publicKey" (camelCase)
}
```

## 工具和辅助

### 自动检查脚本
可以创建一个脚本来检查 Rust 和前端类型定义的一致性：

```bash
# 检查 Rust 端是否缺少 serde 注解
grep -r "pub struct" src-tauri/src | grep -v "#\[serde"

# 检查前端类型定义
grep -r "export interface" src/types
```

## 相关资源

- [serde 文档](https://serde.rs/)
- [Tauri 文档](https://tauri.app/)
- [Rust 命名规范](https://rust-lang.github.io/api-guidelines/naming.html)
- [TypeScript 命名规范](https://typescript-eslint.io/rules/naming-convention/)

## 更新日志

- **2026-01-29**: 初始版本，定义 Tauri 项目命名规范
