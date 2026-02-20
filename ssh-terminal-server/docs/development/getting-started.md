# 快速开始指南

本文档将指导你完成 SSH Terminal Server 项目的安装、配置和运行。

## 目录

- [环境要求](#环境要求)
- [安装步骤](#安装步骤)
- [配置说明](#配置说明)
- [运行项目](#运行项目)
- [验证安装](#验证安装)
- [常见问题](#常见问题)

---

## 环境要求

### 必需环境

- **Rust**：1.70 或更高版本
  - 安装方法：访问 [rustup.rs](https://rustup.rs/) 或使用 `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Git**：用于克隆项目

### 数据库（任选其一）

- **SQLite**：默认选项，无需额外安装
- **MySQL**：5.7 或更高版本
- **PostgreSQL**：12 或更高版本

### 可选环境

- **Redis**：用于存储 Refresh Token（推荐）
  - Windows：下载 [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
  - macOS：`brew install redis`
  - Linux：`sudo apt-get install redis-server`

### 检查环境

```bash
# 检查 Rust 版本
rustc --version

# 检查 Cargo 版本
cargo --version

# 检查 Git 版本
git --version

# 检查 MySQL（如果使用）
mysql --version

# 检查 PostgreSQL（如果使用）
psql --version

# 检查 Redis（如果使用）
redis-cli --version
```

---

## 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd ssh-terminal-server
```

### 2. 安装依赖

使用 Cargo 构建项目（会自动下载依赖）：

```bash
cargo build
```

### 3. 配置项目

#### 方式一：使用默认配置（SQLite，最简单）

**无需任何配置！** 直接运行即可：

```bash
cargo run
```

默认配置：
- 数据库：SQLite（自动创建 `db.sqlite3`）
- 服务器：`127.0.0.1:3000`
- Redis：`localhost:6379`

#### 方式二：使用 MySQL/PostgreSQL

**步骤 1**：修改配置文件

编辑 `config/development.toml`，修改数据库类型和连接信息：

```toml
[database]
# 修改数据库类型：mysql, postgresql 或 sqlite
type = "mysql"  # 或 "postgresql"

# MySQL 配置
host = "localhost"
port = 3306
user = "root"
password = "your-password"
database = "ssh_terminal_server_dev"

# 或 PostgreSQL 配置
# type = "postgresql"
# host = "localhost"
# port = 5432
# user = "postgres"
# password = "your-password"
# database = "ssh_terminal_server_dev"
```

**步骤 2**：运行项目

```bash
cargo run
```

#### 方式三：通过环境变量覆盖（适用于 Docker/Kubernetes）

```bash
# 使用环境变量
DATABASE_TYPE=postgresql \
DATABASE_HOST=localhost \
DATABASE_PORT=5432 \
DATABASE_USER=postgres \
DATABASE_PASSWORD=password \
DATABASE_DATABASE=ssh_terminal_server_dev \
cargo run
```

---

## 配置说明

### 数据库配置

#### SQLite（默认，推荐用于开发）

**优点**：无需额外安装，文件存储，易于测试

**缺点**：不支持高并发写入

**适用场景**：开发环境、小型应用

**使用方法**：无需配置，直接运行

#### MySQL

**优点**：成熟稳定，支持高并发

**缺点**：需要额外安装和配置

**适用场景**：生产环境、大型应用

**配置方法**：

**选项 1**：修改配置文件

编辑 `config/development.toml`，设置数据库类型为 `mysql` 并修改连接信息：

```toml
[database]
type = "mysql"
host = "localhost"
port = 3306
user = "root"
password = "your-password"
database = "ssh_terminal_server_dev"
```

**选项 2**：使用环境变量

```bash
DATABASE_TYPE=mysql \
DATABASE_HOST=localhost \
DATABASE_PORT=3306 \
DATABASE_USER=root \
DATABASE_PASSWORD=your-password \
DATABASE_DATABASE=ssh_terminal_server_dev \
cargo run
```

#### PostgreSQL

**优点**：功能强大，支持高级特性

**缺点**：资源占用较大

**适用场景**：需要高级数据库功能的应用

**配置方法**：

编辑 `config/development.toml`，设置数据库类型为 `postgresql` 并修改连接信息：

```toml
[database]
type = "postgresql"
host = "localhost"
port = 5432
user = "postgres"
password = "your-password"
database = "ssh_terminal_server_dev"
```

或使用环境变量（格式与 MySQL 相同）。

### 认证配置

**开发环境**：使用默认配置即可（JWT 密钥已在配置文件中）

**生产环境**：必须修改配置文件中的 JWT 密钥

```toml
[auth]
# 生产环境必须使用强密钥
jwt_secret = "Kx7Yn2Zp9qR8wF4tL6mN3vB5xC8zD1sE9aH2jK7"
```

生成强密钥：
```bash
openssl rand -base64 32
```

### Redis 配置

**开发环境**：默认连接 `localhost:6379`，无需配置

**生产环境**：修改配置文件或设置环境变量

```bash
REDIS_HOST=your-redis-host \
REDIS_PORT=6379 \
REDIS_PASSWORD=your-password \
cargo run
```

---

## 运行项目

### 开发模式

**使用默认配置（SQLite）**：
```bash
cargo run
```

**使用指定配置文件**：
```bash
# 修改 config/development.toml 后运行
cargo run
```

**使用环境变量**：
```bash
DATABASE_TYPE=mysql DATABASE_HOST=localhost cargo run
```

### 指定环境

```bash
# 开发环境
cargo run -- -e development

# 生产环境
cargo run -- -e production
```

### 后台运行（生产环境）

```bash
# 使用 nohup
nohup cargo run -- -e production > app.log 2>&1 &

# 使用 screen
screen -S ssh-terminal-server
cargo run -- -e production
# 按 Ctrl+A 然后 D 分离会话
```

---

## 验证安装

### 1. 健康检查

```bash
curl http://localhost:3000/health
```

预期响应：
```json
{
  "status": "ok"
}
```

### 2. 服务器信息

```bash
curl http://localhost:3000/info
```

预期响应：
```json
{
  "name": "ssh-terminal-server",
  "version": "1.0",
  "status": "running",
  "timestamp": 1704112800
}
```

### 3. 用户注册

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

预期响应：
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "email": "test@example.com",
    "created_at": "2026-02-13T12:00:00.000Z",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 4. 用户登录

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

预期响应：
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "1234567890",
    "email": "test@example.com",
    "created_at": "2026-02-13T12:00:00.000Z",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 常见问题

### 1. 端口被占用

**错误信息**：`Os { code: 10048, kind: AddrInUse }` 或 `Address already in use`

**解决方案**：

**选项 1**：修改配置文件中的端口

```toml
[server]
port = 3001
```

**选项 2**：通过环境变量覆盖

```bash
SERVER_PORT=3001 cargo run
```

**选项 3**：停止占用端口的进程

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### 2. 数据库连接失败

**错误信息**：`Database connection failed`

**解决方案**：

- 检查数据库服务是否启动
- 检查配置文件中的数据库配置是否正确
- 确认数据库用户权限
- SQLite：检查是否有写入权限

### 3. Redis 连接失败

**错误信息**：`Redis 连接失败`

**解决方案**：

- 检查 Redis 服务是否启动：`redis-cli ping`
- 检查配置文件中的 Redis 配置是否正确
- 如果不需要 Redis 功能，可以暂时禁用（需要修改代码）

### 4. 编译错误

**错误信息**：`error: linking with link.exe failed`

**解决方案**：

- Windows 用户需要安装 [C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- 或使用 `cargo install cargo-vcpkg` 安装依赖

### 5. 权限错误

**错误信息**：`Permission denied`

**解决方案**：

```bash
# Linux/macOS
chmod +x target/debug/ssh-terminal-server

# 或使用 sudo 运行（不推荐生产环境）
sudo cargo run
```

---

## 下一步

安装成功后，你可以：

1. 阅读 [API 接口文档](../api/api-overview.md) 了解所有可用的 API
2. 查看 [项目结构详解](project-structure.md) 了解代码组织
3. 学习 [DDD 架构规范](ddd-architecture.md) 了解设计原则
4. 参考 [前端集成示例](../api/examples/frontend-integration.md) 集成前端应用

---

## 相关文档

- [配置文件详解](../deployment/configuration.md) - 配置文件组织说明
- [环境变量配置](../deployment/environment-variables.md) - 完整的环境变量列表
- [API 接口文档](../api/api-overview.md) - 完整的 API 接口说明

---

**提示**：遇到问题？查看 [常见问题](#常见问题) 或提交 Issue 到项目仓库。
