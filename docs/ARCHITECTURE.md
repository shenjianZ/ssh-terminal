# 架构设计

本文档详细描述 SSH Terminal 的系统架构、数据流、核心概念和数据库设计。

## 目录

- [整体架构](#整体架构)
- [认证流程](#认证流程)
- [同步流程](#同步流程)
- [数据流](#数据流)
- [核心概念](#核心概念)
- [数据库架构](#数据库架构)
- [数据同步策略](#数据同步策略)

---

## 整体架构

SSH Terminal 采用分层架构设计，分为前端、后端和服务器三个主要部分：

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React 19)                        │
├─────────────────────────────────────────────────────────────────┤
│  Pages:                                                          │
│    Terminal | SessionManager | Settings | AIChatPage | SftpManager│
│       ↓             ↓              ↓           ↓            ↓     │
│  Components:                                                        │
│    Layout      Session        Settings      AI           SFTP      │
│   (Sidebar,    -QuickConnect  -AI           -Chat        -DualPane │
│    TopBar)     -SessionCard   -Terminal     -Command     -FileList │
│                 -EditDialog    -Keybindings  -History              │
│    Terminal    SSH            Recording    Mobile                  │
│   -TabBar      -HostKey       -Controls    -MobileLayout          │
│   -XTerm       -Confirm       -Export       -SessionList           │
│                -Status        -Manager                             │
│       ↓                                                            │
│  Store (Zustand):                                                 │
│    - sessionStore (会话管理)                                      │
│    - terminalStore (终端实例管理)                                 │
│    - terminalConfigStore (配置管理)                               │
│    - aiStore (AI 状态管理)                                       │
│       ↓                                                            │
│  Lib & Utils:                                                     │
│    - historyManager (AI 历史管理)                                 │
│    - AudioCaptureManager (音频录制)                               │
│    - sounds (音效系统)                                            │
└────────────────────────┬──────────────────────────────────────────┘
                         │ Tauri IPC Commands
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Rust + Tauri 2.0)                    │
├─────────────────────────────────────────────────────────────────┤
│  Commands Layer:                                                │
│    - session.rs (会话管理命令)                                   │
│    - terminal.rs (终端操作命令)                                  │
│    - storage.rs (持久化命令)                                     │
│       ↓                                                         │
│  SSH Manager Layer:                                             │
│    - SSHManager (管理 Session 和 Connection)                    │
│       ↓                                                         │
│  SSH Backend Layer:                                             │
│    - SSHBackend (抽象 trait)                                    │
│    - SystemSSHBackend (系统 SSH 实现)                           │
│    - portable-pty (跨平台 PTY 支持)                             │
│       ↓                                                         │
│  Storage Layer:                                                 │
│    - Storage (加密存储管理)                                      │
│    - AES-256-GCM 加密                                           │
└─────────────────────────────────────────────────────────────────┘
                         ↑
                         │ External APIs
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│               Backend Server (ssh-terminal-server)               │
├─────────────────────────────────────────────────────────────────┤
│  API Endpoints:                                                  │
│    - POST /auth/register      - 用户注册                         │
│    - POST /auth/login         - 用户登录                         │
│    - POST /auth/refresh       - 刷新 Token                       │
│    - GET  /api/user/profile   - 获取用户资料                     │
│    - PUT  /api/user/profile   - 更新用户资料                     │
│    - GET  /api/ssh/sessions   - 获取 SSH 会话列表                │
│    - POST /api/ssh/sessions   - 创建 SSH 会话                    │
│    - POST /api/sync           - 数据同步                         │
│    - POST /api/sync/resolve-conflict  - 解决冲突                 │
│       ↓                                                         │
│  Services:                                                       │
│    - AuthService (认证服务)                                      │
│    - SyncService (同步服务)                                      │
│       ↓                                                         │
│  Repositories:                                                   │
│    - UserRepository (用户数据访问)                               │
│    - UserProfileRepository (用户资料数据访问)                    │
│    - SshSessionRepository (SSH 会话数据访问)                     │
│       ↓                                                         │
│  Storage:                                                        │
│    - SQLite/MySQL/PostgreSQL (数据库)                            │
│    - Redis (Refresh Token 缓存)                                 │
└─────────────────────────────────────────────────────────────────┘
                         ↑
                         │ External APIs
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
├─────────────────────────────────────────────────────────────────┤
│  - OpenAI API    - Ollama API    - Qwen API    - Wenxin API      │
│  - SSH Servers   - SFTP Servers                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 前端层

**页面组件 (Pages)**
- `Terminal` - 终端主界面，支持多标签页
- `SessionManager` - 会话管理界面
- `Settings` - 应用设置界面
- `AIChatPage` - AI 聊天界面
- `SftpManager` - SFTP 文件管理器

**核心组件 (Components)**
- **Layout** - 布局组件（侧边栏、顶部栏）
- **Session** - 会话相关组件（快速连接、会话卡片、编辑对话框）
- **Terminal** - 终端组件（标签栏、xterm.js）
- **SSH** - SSH 相关组件（主机密钥确认、状态显示）
- **AI** - AI 相关组件（命令、历史记录）
- **Recording** - 录制相关组件（控制、导出、管理器）
- **SFTP** - SFTP 文件管理器（双面板、文件列表）
- **Mobile** - 移动端适配组件（布局、会话列表）

**状态管理 (Store - Zustand)**
- `sessionStore` - SSH 会话配置管理
- `terminalStore` - 终端实例和标签页管理
- `terminalConfigStore` - 终端配置（主题、字体等）
- `aiStore` - AI 状态和对话历史管理
- `authStore` - 用户认证状态管理
- `syncStore` - 数据同步状态管理

### 后端层 (Tauri)

**命令层 (Commands)**
- `session.rs` - 会话管理命令（创建、更新、删除、查询）
- `terminal.rs` - 终端操作命令（连接、断开、输入、输出）
- `storage.rs` - 持久化命令（加密存储、读取）

**SSH 管理层**
- `SSHManager` - 管理 Session 配置和 Connection 实例
  - 从数据库加载 Session 配置
  - 创建和管理 Connection 实例
  - 处理连接状态和错误

**SSH 后端层**
- `SSHBackend` - 抽象 trait，定义 SSH 操作接口
- `SystemSSHBackend` - 使用系统 SSH 客户端实现
- `RusshBackend` - 使用 russh 纯 Rust 实现（支持 Android）
- `portable-pty` - 跨平台 PTY 支持

**存储层**
- `Storage` - 加密存储管理
  - AES-256-GCM 加密
  - Argon2 密码派生
  - SQLite 数据库访问

### 服务器层 (ssh-terminal-server)

**API 端点**
- `/auth/*` - 认证相关 API
- `/api/user/*` - 用户资料 API
- `/api/ssh/*` - SSH 会话 API
- `/api/sync/*` - 数据同步 API

**服务层**
- `AuthService` - 用户认证和 Token 管理
- `SyncService` - 数据同步和冲突解决

**数据访问层**
- `UserRepository` - 用户数据访问
- `UserProfileRepository` - 用户资料数据访问
- `SshSessionRepository` - SSH 会话数据访问

---

## 认证流程

SSH Terminal 使用基于 JWT 的认证机制，支持 Access Token 和 Refresh Token 双令牌模式：

```
┌──────────────┐
│   用户登录    │
└──────┬───────┘
       ↓
┌─────────────────────┐
│ POST /auth/login    │
│ (邮箱 + 密码)       │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 验证密码 (Argon2)   │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 生成 Access Token   │
│ (15分钟过期)        │
│ 生成 Refresh Token  │
│ (7天过期)           │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ Refresh Token 存入  │
│ Redis Set           │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 返回 Token 对       │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 后续请求携带        │
│ Access Token        │
└─────────────────────┘
```

### 认证流程详解

1. **用户登录**
   - 用户在客户端输入邮箱和密码
   - 客户端发送 POST 请求到 `/auth/login`

2. **服务器验证**
   - 服务器查询用户信息
   - 使用 Argon2 算法验证密码哈希
   - 验证失败返回 401 Unauthorized

3. **生成令牌**
   - 生成 Access Token（15 分钟过期）
   - 生成 Refresh Token（7 天过期）
   - 使用 HS256 算法签名

4. **存储 Refresh Token**
   - 将 Refresh Token 存储到 Redis Set
   - Key: `refresh_tokens:{user_id}`
   - 支持多设备同时登录

5. **返回令牌**
   - 返回 Access Token 和 Refresh Token
   - 客户端存储令牌（LocalStorage 或 SecureStorage）

6. **后续请求**
   - 客户端在请求头携带 Access Token
   - 服务器验证令牌有效性
   - Access Token 过期时使用 Refresh Token 刷新

### 令牌刷新流程

```
┌─────────────────────┐
│ Access Token 过期   │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ POST /auth/refresh  │
│ (Refresh Token)     │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 验证 Refresh Token  │
│ (Redis 查询)        │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 生成新的 Token 对   │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 更新 Redis 中的     │
│ Refresh Token       │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 返回新的 Token 对   │
└─────────────────────┘
```

---

## 同步流程

SSH Terminal 支持多设备数据同步，使用增量同步和冲突检测机制：

```
┌──────────────┐
│  手动/自动同步  │
└──────┬───────┘
       ↓
┌─────────────────────┐
│ POST /api/sync      │
│ (携带 Access Token) │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 1. 检查用户状态     │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 2. 冲突检测         │
│ (对比 last_sync_at) │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 3. Push 阶段        │
│ - 上传用户资料      │
│ - 上传 SSH 会话     │
│ - 处理删除操作      │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 4. Pull 阶段        │
│ - 拉取更新的数据    │
│ - 增量同步          │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 5. 返回同步结果     │
│ - 更新的数据        │
│ - 冲突信息          │
└─────────────────────┘
```

### 同步流程详解

1. **触发同步**
   - 用户手动点击同步按钮
   - 或自动同步（根据配置的间隔）

2. **准备同步数据**
   - 收集本地变更的数据
   - 标记变更类型（新增、更新、删除）

3. **Push 阶段（上传本地变更）**
   - 上传用户资料变更
   - 上传 SSH 会话变更
   - 处理本地删除操作

4. **Pull 阶段（拉取服务器变更）**
   - 拉取服务器上的更新数据
   - 增量同步（只拉取 `last_sync_at` 之后的数据）
   - 合并到本地数据库

5. **冲突检测与解决**
   - 比较记录的 `updated_at` 和版本号
   - 检测冲突（同一记录在两端都有修改）
   - 提供冲突解决策略：
     - 保留服务器版本
     - 保留本地版本
     - 保留两个版本（创建副本）

6. **更新同步状态**
   - 更新 `last_sync_at` 时间戳
   - 更新 `server_ver` 和 `client_ver` 版本号

---

## 数据流

### SSH 连接流

```
用户操作 → React 组件 → Zustand Store → Tauri Command → SSH Manager → SSH Backend → SSH Server
    ↓                                                                                   ↑
界面更新 ← Tauri Event (ssh-output-{id}) ← SSH Reader ← PTY ← SSH Process ←──────────┘
```

### SSH 连接流程详解

1. **用户操作**
   - 用户在 SessionManager 中选择一个 Session
   - 或在 QuickConnect 中输入连接信息

2. **前端处理**
   - React 组件接收用户操作
   - 更新 Zustand Store 状态
   - 调用 Tauri Command

3. **后端处理**
   - Tauri Command 接收请求
   - SSH Manager 创建 Connection
   - SSH Backend 建立实际 SSH 连接

4. **建立 PTY**
   - 创建伪终端（PTY）
   - 启动 SSH 进程
   - 连接 PTY 的输入输出流

5. **数据传输**
   - SSH Reader 读取远程输出
   - 通过 Tauri Event 发送到前端
   - 前端更新 xterm.js 显示
   - 用户输入通过 PTY 写入远程

### AI 交互流

```
用户输入 → AI 组件 → aiStore → API 调用 → AI Provider (OpenAI/Claude/...)
    ↓                                                                              ↑
界面更新 ← AI 响应 ← AI Provider ← HTTP 请求 ←─────────────────────────────────────┘
```

### AI 交互流程详解

1. **用户输入**
   - 用户在 AI 聊天界面输入问题
   - 或选中终端中的命令/错误信息

2. **前端处理**
   - AI 组件接收用户输入
   - 更新 aiStore 状态
   - 添加用户消息到对话历史

3. **API 调用**
   - 从 aiStore 获取当前 AI Provider 配置
   - 构建 API 请求
   - 发送到 AI 服务商

4. **流式响应**
   - AI Provider 返回流式响应
   - 前端实时接收和显示
   - 更新 aiStore 状态

5. **历史管理**
   - 将 AI 响应保存到对话历史
   - 按服务器分组管理历史
   - 支持历史记录持久化

---

## 核心概念

### 1. Session（会话配置）

**定义**：保存的 SSH 连接配置，包含连接所需的所有信息。

**字段**：
- `id` - 唯一标识符
- `name` - 会话名称
- `host` - 主机地址
- `port` - 端口号
- `username` - 用户名
- `auth_method` - 认证方式（password/key）
- `password_encrypted` - 加密密码
- `private_key_encrypted` - 加密私钥
- `passphrase_encrypted` - 加密私钥密码
- `group_name` - 分组名称

**特点**：
- 保存在本地数据库
- 可以被多次使用创建连接
- 支持加密存储

### 2. Connection（连接实例）

**定义**：基于 Session 创建的实际 SSH 连接。

**特点**：
- 一个 Session 可以创建多个 Connection
- 每个 Connection 有独立的生命周期
- 可以同时存在多个 Connection

**生命周期**：
1. 从 Session 创建
2. 建立连接
3. 传输数据
4. 断开连接
5. 销毁

### 3. TerminalTab（终端标签页）

**定义**：前端展示的终端标签，每个标签对应一个 Connection。

**特点**：
- 展示在主界面的标签栏
- 支持切换、关闭
- 显示连接状态
- 关联到 xterm.js 实例

### 4. AI Conversation（AI 对话）

**定义**：AI 聊天会话，包含多轮对话和历史记录。

**特点**：
- 支持多轮对话
- 保持上下文理解
- 按服务器分组管理
- 支持历史记录持久化

**数据结构**：
- `messages` - 消息列表（用户消息 + AI 响应）
- `server_id` - 关联的服务器 ID
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 5. AI Provider（AI 服务商）

**定义**：AI 服务提供商，提供 AI 能力。

**支持的 Provider**：
- OpenAI（GPT-4、GPT-3.5）
- Ollama（本地模型）
- Qwen（通义千问）
- Wenxin（文心一言）
- 其他兼容 OpenAI API 的服务

**配置**：
- `provider_type` - Provider 类型
- `api_key` - API 密钥
- `model` - 模型名称
- `base_url` - API 基础 URL
- `parameters` - 模型参数（温度、最大 tokens 等）

---

## 数据库架构

### 客户端本地数据库 (SQLite)

数据库位置：`src-tauri/data/app.db`

#### 表结构

**user_auth（用户认证表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 主键 |
| `email` | TEXT | 邮箱 |
| `password_hash` | TEXT | Argon2 密码哈希 |
| `device_id` | TEXT | 设备 ID（用于加密） |
| `created_at` | TEXT | 创建时间 |
| `deleted_at` | TEXT | 删除时间（软删除） |

**ssh_sessions（SSH 会话表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 主键 |
| `user_id` | INTEGER | 用户 ID（关联 user_auth） |
| `name` | TEXT | 会话名称 |
| `host` | TEXT | 主机地址 |
| `port` | INTEGER | 端口 |
| `username` | TEXT | 用户名 |
| `auth_method` | TEXT | 认证方式（password/key） |
| `password_encrypted` | TEXT | AES-256-GCM 加密密码 |
| `private_key_encrypted` | TEXT | AES-256-GCM 加密私钥 |
| `passphrase_encrypted` | TEXT | AES-256-GCM 加密私钥密码 |
| `group_name` | TEXT | 分组名称 |
| `server_ver` | INTEGER | 服务器版本号 |
| `client_ver` | INTEGER | 客户端版本号 |
| `last_sync_at` | TEXT | 最后同步时间 |
| `created_at` | TEXT | 创建时间 |
| `deleted_at` | TEXT | 删除时间（软删除） |

**user_profiles（用户资料表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 主键 |
| `user_id` | INTEGER | 用户 ID（关联 user_auth） |
| `username` | TEXT | 用户名 |
| `bio` | TEXT | 简介 |
| `avatar_base64` | TEXT | 头像（Base64） |
| `phone` | TEXT | 电话 |
| `qq` | TEXT | QQ 号 |
| `wechat` | TEXT | 微信号 |
| `server_ver` | INTEGER | 服务器版本号 |
| `client_ver` | INTEGER | 客户端版本号 |
| `last_sync_at` | TEXT | 最后同步时间 |
| `created_at` | TEXT | 创建时间 |
| `deleted_at` | TEXT | 删除时间（软删除） |

**app_settings（应用设置表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 主键 |
| `server_url` | TEXT | 服务器地址 |
| `auto_sync_enabled` | INTEGER | 自动同步开关（0/1） |
| `sync_interval_minutes` | INTEGER | 同步间隔（分钟） |
| `language` | TEXT | 语言设置 |
| `updated_at` | TEXT | 更新时间 |

**sync_state（同步状态表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 主键 |
| `last_sync_at` | TEXT | 最后同步时间 |
| `pending_count` | INTEGER | 待同步数量 |
| `conflict_count` | INTEGER | 冲突数量 |

### 服务器数据库 (SQLite/MySQL/PostgreSQL)

#### 表结构

**users（用户表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER(10) | 主键 |
| `email` | TEXT | 邮箱（唯一） |
| `password_hash` | TEXT | Argon2 密码哈希 |
| `created_at` | TEXT | 创建时间 |
| `deleted_at` | TEXT | 删除时间（软删除） |

**user_profiles（用户资料表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 主键 |
| `user_id` | INTEGER | 用户 ID（外键 → users.id） |
| `username` | TEXT | 用户名 |
| `bio` | TEXT | 简介 |
| `avatar_base64` | TEXT | 头像（Base64） |
| `phone` | TEXT | 电话 |
| `qq` | TEXT | QQ 号 |
| `wechat` | TEXT | 微信号 |
| `server_ver` | INTEGER | 服务器版本号 |
| `client_ver` | INTEGER | 客户端版本号 |
| `last_sync_at` | TEXT | 最后同步时间 |
| `created_at` | TEXT | 创建时间 |
| `deleted_at` | TEXT | 删除时间（软删除） |

**ssh_sessions（SSH 会话表）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 主键 |
| `user_id` | INTEGER | 用户 ID（外键 → users.id） |
| `name` | TEXT | 会话名称 |
| `host` | TEXT | 主机地址 |
| `port` | INTEGER | 端口 |
| `username` | TEXT | 用户名 |
| `auth_method` | TEXT | 认证方式（password/key） |
| `password_encrypted` | TEXT | AES-256-GCM 加密密码 |
| `private_key_encrypted` | TEXT | AES-256-GCM 加密私钥 |
| `passphrase_encrypted` | TEXT | AES-256-GCM 加密私钥密码 |
| `group_name` | TEXT | 分组名称 |
| `server_ver` | INTEGER | 服务器版本号 |
| `client_ver` | INTEGER | 客户端版本号 |
| `last_sync_at` | TEXT | 最后同步时间 |
| `created_at` | TEXT | 创建时间 |
| `deleted_at` | TEXT | 删除时间（软删除） |

---

## 数据同步策略

### 1. 版本控制

每条记录维护两个版本号：
- `server_ver` - 服务器版本号
- `client_ver` - 客户端版本号

每次更新记录时，相应的版本号递增。

### 2. 冲突检测

冲突检测基于以下条件：
- 比较记录的 `updated_at` 时间戳
- 比较记录的版本号
- 检查同一记录在两端都有修改

**冲突场景**：
- 用户在两个设备上同时修改同一个会话
- 同步期间，一端删除了记录，另一端修改了记录

### 3. 增量同步

只同步 `last_sync_at` 之后变更的数据：
- 查询条件：`updated_at > last_sync_at`
- 减少传输数据量
- 提高同步效率

### 4. 软删除

使用 `deleted_at` 字段标记删除：
- 删除操作不物理删除记录
- 只设置 `deleted_at` 为当前时间
- 查询时过滤已删除记录
- 支持数据恢复

### 5. 同步策略

**Push 阶段**：
1. 收集本地变更的数据
2. 上传到服务器
3. 服务器更新数据库

**Pull 阶段**：
1. 从服务器拉取更新的数据
2. 合并到本地数据库
3. 处理冲突

**冲突解决策略**：
- **保留服务器版本** - 使用服务器上的数据覆盖本地
- **保留本地版本** - 使用本地数据覆盖服务器
- **保留两者** - 创建副本，保留两个版本

### 6. 自动同步

可配置的自动同步：
- 设置同步间隔（分钟）
- 启用/禁用自动同步
- 手动触发同步

---

## 总结

SSH Terminal 采用分层架构设计，前端使用 React + Zustand，后端使用 Rust + Tauri，服务器使用 Rust + Axum。系统支持多设备数据同步，使用 JWT 认证，AES-256-GCM 加密存储，提供安全、高效的 SSH 终端管理体验。

核心概念包括 Session（会话配置）、Connection（连接实例）、TerminalTab（终端标签）、AI Conversation（AI 对话）和 AI Provider（AI 服务商）。系统使用版本控制和软删除机制实现数据同步和冲突解决。