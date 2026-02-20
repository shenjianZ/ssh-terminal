# 环境变量配置说明

本文档提供所有可配置的环境变量说明。

## 目录

- [配置优先级](#配置优先级)
- [服务器配置](#服务器配置)
- [数据库配置](#数据库配置)
- [认证配置](#认证配置)
- [Redis 配置](#redis-配置)
- [配置示例](#配置示例)

---

## 配置优先级

配置的加载优先级从高到低为：

1. **环境变量**（最高优先级）
2. **配置文件**（config/ 目录）
3. **默认值**（代码中硬编码）

这意味着：
- 环境变量会覆盖配置文件中的设置
- 配置文件会覆盖代码中的默认值

---

## 服务器配置

### SERVER_HOST

服务器监听地址。

| 属性 | 值 |
|------|-----|
| 类型 | 字符串 |
| 默认值 | `0.0.0.0` |
| 说明 | `0.0.0.0` 表示监听所有网络接口 |

**示例**：
```bash
SERVER_HOST=127.0.0.1  # 仅本地访问
SERVER_HOST=0.0.0.0     # 允许外部访问
```

### SERVER_PORT

服务器监听端口。

| 属性 | 值 |
|------|-----|
| 类型 | 整数 |
| 默认值 | `3000` |
| 说明 | 1-65535 之间的有效端口 |

**示例**：
```bash
SERVER_PORT=3000   # 开发环境
SERVER_PORT=8080   # 生产环境
SERVER_PORT=80     # HTTP 标准端口
```

---

## 数据库配置

### DATABASE_TYPE

数据库类型，支持 MySQL、PostgreSQL、SQLite。

| 属性 | 值 |
|------|-----|
| 类型 | 字符串 |
| 默认值 | `sqlite` |
| 可选值 | `mysql`、`postgresql`、`sqlite` |

**示例**：
```bash
DATABASE_TYPE=sqlite       # SQLite 数据库
DATABASE_TYPE=mysql        # MySQL 数据库
DATABASE_TYPE=postgresql  # PostgreSQL 数据库
```

### MySQL 配置

当 `DATABASE_TYPE=mysql` 时使用。

#### DATABASE_HOST

MySQL 服务器地址。

| 属性 | 值 |
|------|-----|
| 类型 | 字符串 |
| 默认值 | `localhost` |

**示例**：
```bash
DATABASE_HOST=localhost
DATABASE_HOST=192.168.1.100
DATABASE_HOST=mysql.example.com
```

#### DATABASE_PORT

MySQL 服务器端口。

| 属性 | 值 |
|------|-----|
| 类型 | 整数 |
| 默认值 | `3306` |

**示例**：
```bash
DATABASE_PORT=3306
```

#### DATABASE_USER

MySQL 用户名。

| 属性 | 值 |
|------|-----|
| 类型 | 字符串 |
| 默认值 | - |
| 必填 | 是 |

**示例**：
```bash
DATABASE_USER=root
DATABASE_USER=webapp
```

#### DATABASE_PASSWORD

MySQL 密码。

| 属性 | 值 |
|------|-----|
| 类型 | 字符串 |
| 默认值 | - |
| 必填 | 是 |

**示例**：
```bash
DATABASE_PASSWORD=your-password
```

#### DATABASE_DATABASE

MySQL 数据库名称。

| 属性 | 值 |
|------|-----|
| 类型 | 字符串 |
| 默认值 | - |
| 必填 | 是 |

**示例**：
```bash
DATABASE_DATABASE=ssh_terminal_server
```

### PostgreSQL 配置

当 `DATABASE_TYPE=postgresql` 时使用，配置项与 MySQL 相同。

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| DATABASE_HOST | PostgreSQL 服务器地址 | localhost |
| DATABASE_PORT | PostgreSQL 服务器端口 | 5432 |
| DATABASE_USER | PostgreSQL 用户名 | - |
| DATABASE_PASSWORD | PostgreSQL 密码 | - |
| DATABASE_DATABASE | PostgreSQL 数据库名称 | - |

### SQLite 配置

当 `DATABASE_TYPE=sqlite` 时使用。

#### DATABASE_PATH

SQLite 数据库文件路径。

| 属性 | 值 |
|------|-----|
| 类型 | 字符串 |
| 默认值 | - |
| 必填 | 是 |

**示例**：
```bash
DATABASE_PATH=data/app.db
DATABASE_PATH=/var/data/webapp.db
```

**注意**：
- 目录必须存在，程序不会自动创建目录
- 文件不存在时会自动创建

### DATABASE_MAX_CONNECTIONS

数据库连接池最大连接数。

| 属性 | 值 |
|------|-----|
| 类型 | 整数 |
| 默认值 | `10` |

**示例**：
```bash
DATABASE_MAX_CONNECTIONS=10    # 开发环境
DATABASE_MAX_CONNECTIONS=100   # 生产环境
```

**建议**：
- 开发环境：5-10
- 生产环境：根据应用负载调整（通常是 CPU 核心数的 2-4 倍）

---

## 认证配置

### AUTH_JWT_SECRET

JWT 签名密钥。

| 属性 | 值 |
|------|-----|
| 类型 | 字符串 |
| 默认值 | - |
| 必填 | 是 |

**安全建议**：
- 生产环境使用至少 32 位的随机字符串
- 定期更换密钥
- 不要在代码中硬编码

**生成强密钥**：
```bash
# 使用 OpenSSL
openssl rand -base64 32

# 使用 Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**示例**：
```bash
# 开发环境（不安全）
AUTH_JWT_SECRET=dev-secret-key

# 生产环境（安全）
AUTH_JWT_SECRET=Kx7Yn2Zp9qR8wF4tL6mN3vB5xC8zD1sE9aH2jK7
```

### AUTH_ACCESS_TOKEN_EXPIRATION_MINUTES

Access Token 过期时间（分钟）。

| 属性 | 值 |
|------|-----|
| 类型 | 整数 |
| 默认值 | `15` |

**示例**：
```bash
AUTH_ACCESS_TOKEN_EXPIRATION_MINUTES=15   # 15 分钟（推荐）
AUTH_ACCESS_TOKEN_EXPIRATION_MINUTES=30   # 30 分钟
AUTH_ACCESS_TOKEN_EXPIRATION_MINUTES=60   # 1 小时
```

**建议**：
- 安全性要求高：5-15 分钟
- 用户体验优先：30-60 分钟
- 权衡安全性和用户体验

### AUTH_REFRESH_TOKEN_EXPIRATION_DAYS

Refresh Token 过期时间（天）。

| 属性 | 值 |
|------|-----|
| 类型 | 整数 |
| 默认值 | `7` |

**示例**：
```bash
AUTH_REFRESH_TOKEN_EXPIRATION_DAYS=7    # 7 天（推荐）
AUTH_REFRESH_TOKEN_EXPIRATION_DAYS=30   # 30 天
AUTH_REFRESH_TOKEN_EXPIRATION_DAYS=90   # 90 天
```

**建议**：
- Web 应用：7-30 天
- 移动应用：30-90 天
- 安全性要求高的应用：7 天或更短

---

## Redis 配置

### REDIS_HOST

Redis 服务器地址。

| 属性 | 值 |
|------|-----|
| 类型 | 字符串 |
| 默认值 | `localhost` |

**示例**：
```bash
REDIS_HOST=localhost
REDIS_HOST=192.168.1.100
REDIS_HOST=redis.example.com
```

### REDIS_PORT

Redis 服务器端口。

| 属性 | 值 |
|------|-----|
| 类型 | 整数 |
| 默认值 | `6379` |

**示例**：
```bash
REDIS_PORT=6379
```

### REDIS_PASSWORD

Redis 密码（如果设置了密码）。

| 属性 | 值 |
|------|-----|
| 类型 | 字符串 |
| 默认值 | - |
| 必填 | 否 |

**示例**：
```bash
REDIS_PASSWORD=your-redis-password
```

### REDIS_DB

Redis 数据库编号。

| 属性 | 值 |
|------|-----|
| 类型 | 整数 |
| 默认值 | `0` |
| 范围 | 0-15 |

**示例**：
```bash
REDIS_DB=0    # 默认数据库
REDIS_DB=1    # 数据库 1
```

---

## 配置示例

### 开发环境（SQLite）

**重要**：本项目不支持 .env 文件。开发环境请使用 `config/` 目录下的 toml 配置文件。

**方式一：使用默认配置（最简单）**

无需任何配置，直接运行即可：

```bash
cargo run
```

**方式二：修改配置文件**

如果需要修改配置，编辑 `config/default.toml` 或创建 `config/local.toml`：

```bash
# 复制默认配置
cp config/default.toml config/local.toml

# 编辑配置文件
nano config/local.toml  # 或使用其他编辑器

# 运行
cargo run -- -c config/local.toml
```

### 开发环境（MySQL）

**重要**：本项目不支持 .env 文件。开发环境请使用 `config/` 目录下的 toml 配置文件。

编辑 MySQL 配置文件：

```bash
# 编辑开发环境配置文件
nano config/development.toml

# 设置 database.type = "mysql" 并修改连接信息

# 运行
cargo run
```

或使用环境变量（适用于 Docker/Kubernetes）：

```bash
DATABASE_TYPE=mysql \
DATABASE_HOST=localhost \
DATABASE_PORT=3306 \
DATABASE_USER=root \
DATABASE_PASSWORD=root \
DATABASE_DATABASE=ssh_terminal_server_dev \
cargo run
```

### 生产环境

**重要**：本项目不支持 .env 文件。生产环境请使用 `config/` 目录下的 toml 配置文件或环境变量。

**方式一：使用配置文件**

修改 `config/production.toml` 中的配置：

```bash
# 编辑生产环境配置文件
nano config/production.toml

# 运行
cargo run -- -e production -c config/production.toml
```

**方式二：使用环境变量（Docker/Kubernetes 推荐）**

```bash
DATABASE_TYPE=mysql \
DATABASE_HOST=mysql.production.example.com \
DATABASE_PORT=3306 \
DATABASE_USER=webapp \
DATABASE_PASSWORD=strong-password-here \
DATABASE_DATABASE=ssh_terminal_server_prod \
DATABASE_MAX_CONNECTIONS=100 \
AUTH_JWT_SECRET=Kx7Yn2Zp9qR8wF4tL6mN3vB5xC8zD1sE9aH2jK7 \
REDIS_HOST=redis.production.example.com \
REDIS_PORT=6379 \
REDIS_PASSWORD=strong-redis-password \
REDIS_DB=0 \
cargo run -- -e production
```

### Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    image: ssh-terminal-server:latest
    ports:
      - "3000:3000"
    environment:
      - SERVER_HOST=0.0.0.0
      - SERVER_PORT=3000
      - DATABASE_TYPE=postgresql
      - DATABASE_HOST=db
      - DATABASE_PORT=5432
      - DATABASE_USER=webapp
      - DATABASE_PASSWORD=password
      - DATABASE_DATABASE=ssh_terminal_server
      - DATABASE_MAX_CONNECTIONS=10
      - AUTH_JWT_SECRET=${JWT_SECRET}
      - AUTH_ACCESS_TOKEN_EXPIRATION_MINUTES=15
      - AUTH_REFRESH_TOKEN_EXPIRATION_DAYS=7
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_DB=0
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=webapp
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=ssh_terminal_server
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 安全检查清单

生产环境部署前检查：

- [ ] JWT 密钥使用强随机字符串（至少 32 位）
- [ ] 数据库密码使用强密码
- [ ] Redis 设置密码（如果可从外部访问）
- [ ] 服务器监听地址根据需求配置（0.0.0.0 或 127.0.0.1）
- [ ] 数据库连接数根据负载调整
- [ ] Token 过期时间根据安全要求配置
- [ ] 环境变量文件不提交到版本控制

---

## 相关文档

- [配置文件详解](configuration.md) - 配置文件组织说明
- [快速开始指南](../development/getting-started.md) - 安装和配置指南
- [生产环境部署](production-guide.md) - 生产部署最佳实践

---

**提示**：使用 `.env.example` 作为模板，不要提交包含敏感信息的 `.env` 文件到版本控制。
