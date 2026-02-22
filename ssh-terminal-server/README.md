# SSH Terminal Server

基于 Rust + Axum 0.7 的生产级 SSH 终端云端同步服务器，采用 DDD（领域驱动设计）分层架构设计。

## 项目概述

SSH Terminal Server 是一个为 SSH Terminal 客户端提供云端数据同步服务的后端系统，支持多设备间 SSH 会话配置的自动同步、冲突解决和用户认证。

### 核心功能

- **用户认证系统**：注册、登录、JWT Token 管理、双 Token 机制
- **SSH 会话云端同步**：多设备 SSH 连接配置的自动同步
- **冲突解决机制**：智能检测和解决多设备间的数据冲突
- **邮件验证码服务**：支持 SMTP 邮件发送验证码
- **用户资料管理**：用户信息的创建、更新和删除
- **多数据库支持**：MySQL / PostgreSQL / SQLite 无缝切换
- **国际化支持**：中英文双语支持

## 核心特性

### 架构特色
- **DDD 分层架构**：领域层、基础设施层、应用层清晰分离
- **生产就绪**：JWT 双 Token 认证、Argon2 密码哈希、结构化日志
- **多数据库支持**：MySQL / PostgreSQL / SQLite 无缝切换
- **RESTful API**：标准化的 REST API 接口设计
- **数据加密**：SSH 认证信息客户端加密传输和存储

### 技术栈
- **Web 框架**：Axum 0.7 + Tokio
- **数据库 ORM**：SeaORM 1.1（支持多数据库）
- **认证**：JWT (Access Token 15min + Refresh Token 7天)
- **缓存**：Redis 存储 Refresh Token
- **安全**：Argon2 密码哈希、CORS 支持
- **邮件**：Lettre SMTP 客户端
- **日志**：tracing 结构化日志
- **序列化**：serde JSON 序列化

## 快速开始

### 方式一：使用 Docker Compose（推荐）

使用 Docker Compose 可以快速部署完整的开发或生产环境：

```bash
# 1. 克隆项目
git clone https://github.com/shenjianZ/ssh-terminal.git
cd ssh-terminal/ssh-terminal-server

# 2. 启动服务
docker compose up -d

# 3. 查看服务状态
docker compose ps

# 4. 查看日志
docker compose logs -f app
```

服务将在 http://localhost:3000 启动，包含 PostgreSQL 数据库和 Redis 缓存。

> 查看 [Docker Compose 部署指南](docs/deployment/docker-compose.md) 了解详细配置和管理命令

### 方式二：本地开发

#### 1. 克隆并安装依赖

```bash
git clone <repository>
cd ssh-terminal-server
cargo build
```

#### 2. 配置项目

**使用默认配置（SQLite，最简单）**：

无需配置，直接运行即可：
```bash
cargo run
```

**使用 MySQL/PostgreSQL**：

使用环境变量配置或创建本地配置文件：

**方式一：使用环境变量（推荐）**
```bash
# 使用 MySQL
DATABASE_TYPE=mysql DATABASE_HOST=localhost DATABASE_PORT=3306 DATABASE_USER=root DATABASE_PASSWORD=your-password DATABASE_DATABASE=ssh_terminal_server_dev cargo run

# 或使用 PostgreSQL
DATABASE_TYPE=postgresql DATABASE_HOST=localhost DATABASE_PORT=5432 DATABASE_USER=postgres DATABASE_PASSWORD=your-password DATABASE_DATABASE=ssh_terminal_server_dev cargo run
```

**方式二：创建本地配置文件**
```bash
# 复制开发环境配置
cp config/development.toml config/local.toml

# 编辑 config/local.toml，修改数据库连接信息
# 然后运行
cargo run -- -c config/local.toml
```

#### 3. 配置邮件功能（可选）

邮件功能用于发送验证码。如需启用，配置以下环境变量：

```bash
# 启用邮件功能
EMAIL_ENABLED=true

# SMTP 服务器配置
EMAIL_SMTP_HOST=smtp.163.com
EMAIL_SMTP_PORT=465
EMAIL_SMTP_USERNAME=your-email@163.com
EMAIL_SMTP_PASSWORD=your-app-password

# 发件人信息
EMAIL_FROM_NAME="SSH Terminal"
EMAIL_FROM_EMAIL=your-email@163.com

# Worker 配置（仅异步模式使用）
EMAIL_WORKER_POOL_SIZE=10
EMAIL_WORKER_TIMEOUT_SECONDS=10
```

> ⚠️ **重要提示**：对于 QQ/163 等邮箱，需要使用"授权码"而不是登录密码。获取方式：邮箱设置 → 账户 → POP3/SMTP 服务 → 生成授权码

### 3. 运行服务

```bash
# 使用默认配置（SQLite）
cargo run

# 或使用指定配置文件
cargo run -- -c config/local.toml
```

服务将在 http://localhost:3000 启动

## 快速测试

### 用户注册

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "email": "user@example.com",
    "created_at": "2026-02-13T12:00:00.000Z",
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

> 查看 [完整 API 文档](docs/api/api-overview.md) 了解所有接口

## 核心配置

### 配置方式

**开发环境**：

使用 `config/` 目录下的配置文件：

```bash
# SQLite（默认，修改 config/development.toml 中的 database.type 为 "sqlite"）
cargo run

# MySQL（修改 config/development.toml 中的 database.type 为 "mysql"）
cargo run

# PostgreSQL（修改 config/development.toml 中的 database.type 为 "postgresql"）
cargo run
```

**生产环境**：

使用环境变量或配置文件：

```bash
# 使用环境变量
DATABASE_TYPE=postgresql DATABASE_HOST=localhost cargo run -- -e production

# 或使用配置文件
cargo run -- -e production -c config/production.toml
```

### 命令行参数

```bash
# 指定配置文件
cargo run -- -c config/production.toml

# 指定环境
cargo run -- -e production

# 指定端口
cargo run -- -p 8080

# 启用调试日志
cargo run -- -v

# 详细日志
cargo run -- -vvv
```

### 配置优先级

```
CLI 参数 > 环境变量 > 配置文件 > 默认值
```

### 数据库配置

**SQLite（开发环境默认）**：
```toml
[database]
database_type = "sqlite"
path = "data/app.db"
max_connections = 10
```

**MySQL**：
```toml
[database]
database_type = "mysql"
host = "localhost"
port = 3306
user = "root"
password = "your-password"
database = "ssh_terminal_server"
max_connections = 10
```

**PostgreSQL**：
```toml
[database]
database_type = "postgresql"
host = "localhost"
port = 5432
user = "postgres"
password = "your-password"
database = "ssh_terminal_server"
max_connections = 10
```

> 查看 [完整配置文档](docs/deployment/configuration.md) 或 [环境变量配置](docs/deployment/environment-variables.md)

## API 接口概览

### 公开接口（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/info` | 服务器信息 |
| POST | `/auth/register` | 用户注册 |
| POST | `/auth/login` | 用户登录 |
| POST | `/auth/refresh` | 刷新 Token |
| POST | `/api/email/send-verify-code-sync` | 发送验证码（同步） |
| POST | `/api/email/send-verify-code-async` | 发送验证码（异步，已弃用） |

### 需要认证的接口

**认证相关**：
- `POST /auth/delete` - 删除账号
- `POST /auth/delete-refresh-token` - 删除 Refresh Token

**用户资料**：
- `GET /api/user/profile` - 获取用户资料
- `PUT /api/user/profile` - 更新用户资料
- `DELETE /api/user/profile` - 删除用户资料

**SSH 会话管理**：
- `GET /api/ssh/sessions` - 获取 SSH 会话列表（分页）
- `POST /api/ssh/sessions` - 创建 SSH 会话
- `GET /api/ssh/sessions/:id` - 获取单个 SSH 会话
- `PUT /api/ssh/sessions/:id` - 更新 SSH 会话
- `DELETE /api/ssh/sessions/:id` - 删除 SSH 会话

**数据同步**：
- `POST /api/sync` - 统一同步（Push + Pull）
- `POST /api/sync/resolve-conflict` - 解决冲突

**邮件服务**：
- `POST /api/email/latest-log` - 获取最新邮件日志
- `GET /api/email/queue-status` - 获取队列状态

### 认证方式

所有需要认证的接口都需要在请求头中携带 Access Token：

```http
Authorization: Bearer <access_token>
```

> 查看 [完整 API 文档](docs/api/api-overview.md)

## 项目结构

```
ssh-terminal-server/
├── src/                           # 源代码
│   ├── main.rs                    # 应用入口
│   ├── cli.rs                     # 命令行参数解析
│   ├── db.rs                      # 数据库连接池
│   ├── error.rs                   # 错误处理
│   │
│   ├── config/                    # 配置模块
│   │   ├── app.rs                 # 主配置
│   │   ├── auth.rs                # 认证配置
│   │   ├── database.rs            # 数据库配置
│   │   ├── redis.rs               # Redis 配置
│   │   ├── server.rs              # 服务器配置
│   │   └── email.rs               # 邮件配置
│   │
│   ├── domain/                    # 领域层（DDD）
│   │   ├── dto/                   # 数据传输对象
│   │   │   ├── auth.rs
│   │   │   ├── mail.rs
│   │   │   ├── ssh.rs
│   │   │   ├── sync.rs
│   │   │   └── user.rs
│   │   ├── entities/              # 数据库实体
│   │   │   ├── users.rs
│   │   │   ├── user_profiles.rs
│   │   │   ├── ssh_sessions.rs
│   │   │   └── email_logs.rs
│   │   └── vo/                    # 视图对象
│   │       ├── auth.rs
│   │       ├── mail.rs
│   │       ├── ssh.rs
│   │       ├── sync.rs
│   │       └── user.rs
│   │
│   ├── handlers/                  # HTTP 处理器层
│   │   ├── auth.rs                # 认证接口
│   │   ├── email.rs               # 邮件接口
│   │   ├── health.rs              # 健康检查
│   │   ├── ssh_session.rs         # SSH 会话接口
│   │   ├── sync.rs                # 同步接口
│   │   └── user_profile.rs        # 用户资料接口
│   │
│   ├── services/                  # 业务逻辑层
│   │   ├── auth_service.rs        # 认证服务
│   │   ├── mail_service.rs        # 邮件服务
│   │   └── sync_service.rs        # 同步服务
│   │
│   ├── repositories/              # 数据访问层
│   │   ├── user_repository.rs
│   │   ├── user_profile_repository.rs
│   │   ├── ssh_session_repository.rs
│   │   └── email_log_repository.rs
│   │
│   ├── infra/                     # 基础设施层
│   │   ├── middleware/            # 中间件
│   │   │   ├── auth.rs            # JWT 认证中间件
│   │   │   ├── language.rs        # 语言中间件
│   │   │   └── logging.rs         # 日志中间件
│   │   ├── redis/                 # Redis 客户端
│   │   │   └── redis_client.rs
│   │   └── mail/                  # 邮件发送
│   │       ├── mailer.rs
│   │       ├── queue.rs
│   │       ├── rate_limit.rs
│   │       └── worker.rs
│   │
│   └── utils/                     # 工具函数
│       ├── jwt.rs                 # JWT 工具
│       ├── mail_template.rs       # 邮件模板
│       └── i18n.rs                # 国际化
│
├── config/                        # 配置文件
│   ├── development.toml           # 开发环境配置
│   ├── development.toml.example   # 开发环境配置示例
│   ├── production.toml            # 生产环境配置
│   └── production.toml.example    # 生产环境配置示例
│
├── docs/                          # 文档
│   ├── api/                       # API 文档
│   │   ├── api-overview.md
│   │   ├── authentication.md
│   │   ├── endpoints/
│   │   └── examples/
│   ├── deployment/                # 部署文档
│   │   ├── docker-compose.md
│   │   └── environment-variables.md
│   ├── development/               # 开发文档
│   │   ├── getting-started.md
│   │   └── project-structure.md
│   └── sql/                       # SQL 脚本
│       ├── mysql.sql
│       ├── postgres.sql
│       └── sqlite.sql
│
├── Cargo.toml                     # Rust 依赖配置
├── Cargo.lock                     # 依赖锁定文件
├── build-musl.sh                  # 静态编译脚本
├── .env.example                   # 环境变量示例
└── README.md                      # 项目说明
```

> 查看 [完整项目结构文档](docs/development/project-structure.md)

## 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **Web 框架** | Axum | 0.7 | HTTP 服务器和路由 |
| **异步运行时** | Tokio | 1.x | 异步任务调度 |
| **数据库 ORM** | SeaORM | 1.1 | 数据库抽象层 |
| **认证** | JWT (jsonwebtoken) | 9.x | Token 生成和验证 |
| **密码哈希** | Argon2 | 0.5 | 密码安全存储 |
| **缓存** | Redis | 0.27 | Refresh Token 存储 |
| **序列化** | Serde | 1.x | JSON 序列化 |
| **日志** | Tracing | 0.1 | 结构化日志 |
| **配置管理** | Config | 0.13 | TOML 配置解析 |
| **邮件发送** | Lettre | 0.11 | SMTP 邮件发送 |
| **验证** | Validator | 0.16 | 请求参数验证 |

## 文档导航

- [API 接口文档](docs/api/api-overview.md) - 完整的 API 接口说明和示例
- [快速开始指南](docs/development/getting-started.md) - 详细的安装和配置指南
- [开发规范](docs/development/ddd-architecture.md) - DDD 架构和代码规范
- [Docker Compose 部署](docs/deployment/docker-compose.md) - 使用 Docker 快速部署
- [部署文档](docs/deployment/configuration.md) - 配置和部署指南

## 构建和部署

### 本地开发

```bash
# 安装依赖
cargo build

# 运行（开发环境，默认 SQLite）
cargo run

# 运行（指定配置文件）
cargo run -- -c config/development.toml

# 运行（生产环境）
cargo run -- -e production
```

### Docker Compose 部署

```bash
# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f app

# 停止服务
docker compose down
```

Docker Compose 架构：
```
app (Axum Server) → db (PostgreSQL) → redis (Redis)
```

> 查看 [Docker Compose 部署指南](docs/deployment/docker-compose.md) 了解详细配置

### 静态编译（musl）

使用 musl 编译静态链接二进制，适用于生产环境部署：

```bash
# 使用 musl 编译脚本
./build-musl.sh

# 产物位置
target/x86_64-unknown-linux-musl/release/ssh-terminal-server
```

**特性**：
- 静态链接，无外部依赖
- 适用于 CentOS 7、Debian、Ubuntu 等发行版
- 可直接运行，无需安装 Rust

**部署示例**：
```bash
# 上传到服务器
scp target/x86_64-unknown-linux-musl/release/ssh-terminal-server user@server:/opt/

# 创建配置文件
cp config/production.toml.example /opt/production.toml

# 编辑配置
vim /opt/production.toml

# 运行服务
./ssh-terminal-server -c /opt/production.toml
```

## 日志格式

日志采用三段式结构：

1. 📥 **请求开始**：显示请求方法和路径
2. 🔧 **请求处理**：显示请求参数和响应内容
3. ✅ **请求完成**：显示状态码和耗时

示例：

```
================================================================================
GET /health
================================================================================
[uuid-...] 📥 查询参数: 无 | 时间: 2026-02-12 13:30:45.123
[uuid-...] ✅ 状态码: 200 | 耗时: 5ms
================================================================================
```

## 安全特性

| 特性 | 实现 |
|------|------|
| 密码哈希 | Argon2 算法 |
| 认证 | JWT (Access Token + Refresh Token) |
| Token 存储 | Redis Set（支持多设备） |
| Token 轮换 | 刷新时生成新 Token |
| 软删除 | `deleted_at` 字段 |
| CORS 支持 | `tower-http::cors` |
| 请求日志 | 三段式日志（请求→处理→完成） |
| 数据加密 | SSH 认证信息客户端加密传输和存储 |

### Token 机制

- **Access Token**：15 分钟过期，用于 API 请求
- **Refresh Token**：7 天过期，用于刷新 Access Token
- **Refresh Token** 存储在 Redis Set 中，支持多设备登录
- 刷新 Token 时会生成新的 Access Token 和 Refresh Token

### 密码哈希

使用 Argon2 算法对用户密码进行哈希存储，提供最佳的安全性能平衡。

### 数据加密

SSH 会话的认证信息（密码、私钥等）在客户端加密后上传到服务器，服务器仅存储加密后的数据。

## 国际化支持

**支持语言**：
- 简体中文 (`zh-CN`)
- 英文 (`en`)

**实现方式**：
- 使用 `MessageKey` 枚举定义所有消息
- 通过 `Language` 中间件从请求头获取语言
- 支持变量替换

**请求头示例**：
```http
Accept-Language: zh-CN
```

## 数据库架构

### 支持的数据库

- **MySQL**：生产环境推荐
- **PostgreSQL**：生产环境推荐
- **SQLite**：开发环境默认，零配置

### 数据库表结构

**users 表**（用户表）：
- `id`：String（主键，10 位数字）
- `email`：String（唯一索引）
- `password_hash`：String（Argon2 哈希）
- `device_id`：String（可选，设备追踪）
- `last_sync_at`：i64（可选，最后同步时间）
- `created_at`：i64
- `updated_at`：i64
- `deleted_at`：i64（软删除）

**user_profiles 表**（用户资料表）：
- `id`：i64（主键）
- `user_id`：String（外键）
- `username`、`phone`、`qq`、`wechat`、`bio`：用户信息
- `avatar_data`：String（可选，Base64）
- `avatar_mime_type`：String（可选）
- `server_ver`：i32（版本号）

**ssh_sessions 表**（SSH 会话表）：
- `id`：String（主键，UUID）
- `user_id`：String（外键）
- `name`、`host`、`port`、`username`：SSH 连接信息
- `auth_method_encrypted`：String（加密存储）
- `auth_nonce`：String（加密随机数）
- `auth_key_salt`：String（加密盐值）
- `server_ver`、`client_ver`：i32（版本控制）
- `last_synced_at`：i64（最后同步时间）

**email_logs 表**（邮件日志表）：
- `id`：i64（主键）
- `user_id`、`email`：邮件信息
- `template`、`status`：模板和状态
- `error_message`：String（可选，错误信息）

### 自动化初始化

服务器启动时自动：
1. 创建数据库（MySQL/PostgreSQL）
2. 创建所有表结构
3. 创建索引、触发器、函数

## 故障排查

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否运行
   - 验证配置文件中的连接信息
   - 确认数据库用户权限

2. **Redis 连接失败**
   - 检查 Redis 服务是否运行
   - 验证 Redis 配置信息
   - 确认 Redis 端口是否被占用

3. **邮件发送失败**
   - 验证 SMTP 配置信息
   - 确认使用的是授权码而非密码（QQ/163 邮箱）
   - 检查防火墙设置

4. **Token 验证失败**
   - 确认 Token 未过期
   - 检查 JWT Secret 配置是否正确
   - 验证请求头格式：`Authorization: Bearer <token>`

5. **端口被占用**
   - 使用 `-p` 参数指定其他端口
   - 检查是否有其他服务占用了默认端口 3000

## 许可证

MIT
