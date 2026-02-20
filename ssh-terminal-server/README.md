# SSH Terminal Server

基于 Rust + Axum 0.7 的生产级 SSH 终端服务器，采用 DDD 分层架构设计。

## 核心特性

### 架构特色
- **DDD 分层架构**：领域层、基础设施层、应用层清晰分离
- **生产就绪**：JWT 双 Token 认证、Argon2 密码哈希、结构化日志
- **多数据库支持**：MySQL / PostgreSQL / SQLite 无缝切换

### 技术栈
- **Web 框架**：Axum 0.7 + Tokio
- **数据库 ORM**：SeaORM 1.1（支持多数据库）
- **认证**：JWT (Access Token 15min + Refresh Token 7天)
- **缓存**：Redis 存储 Refresh Token
- **安全**：Argon2 密码哈希、CORS 支持

## 快速开始

### 方式一：使用 Docker Compose（推荐）

使用 Docker Compose 可以快速部署完整的开发或生产环境：

```bash
# 1. 克隆项目
git clone <repository>
cd ssh-terminal-server

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

> 查看 [完整配置文档](docs/deployment/configuration.md) 或 [环境变量配置](docs/deployment/environment-variables.md)

## API 接口概览

### 公开接口

- `GET /health` - 健康检查
- `GET /info` - 服务器信息
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `POST /auth/refresh` - 刷新 Token

### 需要认证的接口

- `POST /auth/delete` - 删除账号
- `POST /auth/delete-refresh-token` - 删除 Refresh Token

> 查看 [完整 API 文档](docs/api/api-overview.md)

## 项目结构

```
src/
├── main.rs              # 入口文件
├── config/              # 配置模块
│   ├── app.rs
│   ├── auth.rs
│   ├── database.rs
│   └── redis.rs
├── domain/              # 领域层（DDD）
│   ├── dto/            # 数据传输对象
│   ├── entities/       # 实体
│   └── vo/             # 视图对象
├── handlers/           # HTTP 处理器层
├── services/           # 业务逻辑层
├── repositories/       # 数据访问层
└── infra/              # 基础设施层
    ├── middleware/     # 中间件
    └── redis/          # Redis 客户端
```

> 查看 [完整项目结构文档](docs/development/project-structure.md)

## 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| Web 框架 | Axum | 0.7 |
| 异步运行时 | Tokio | 1.x |
| 数据库 ORM | SeaORM | 1.1 |
| 认证 | JWT | 9.x |
| 密码哈希 | Argon2 | 0.5 |
| 缓存 | Redis | 0.27 |
| 日志 | tracing | 0.1 |

## 文档导航

- [API 接口文档](docs/api/api-overview.md) - 完整的 API 接口说明和示例
- [快速开始指南](docs/development/getting-started.md) - 详细的安装和配置指南
- [开发规范](docs/development/ddd-architecture.md) - DDD 架构和代码规范
- [Docker Compose 部署](docs/deployment/docker-compose.md) - 使用 Docker 快速部署
- [部署文档](docs/deployment/configuration.md) - 配置和部署指南

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

- ✅ 密码使用 Argon2 哈希
- ✅ JWT Token 认证
- ✅ Refresh Token 轮换机制
- ✅ Token 过期时间可配置
- ✅ 密码验证后才删除账号


## 许可证

MIT
