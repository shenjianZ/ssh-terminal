# Docker Compose 部署指南

本指南详细介绍如何使用 Docker Compose 快速部署 SSH Terminal Server 到生产环境。

## 目录

- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [服务架构](#服务架构)
- [管理命令](#管理命令)
- [环境变量](#环境变量)
- [持久化存储](#持久化存储)
- [监控和日志](#监控和日志)
- [生产环境最佳实践](#生产环境最佳实践)
- [故障排查](#故障排查)

---

## 前置要求

### 系统要求

- **操作系统**：Linux / macOS / Windows（需要 WSL2）
- **Docker**：20.10 或更高版本
- **Docker Compose**：2.0 或更高版本

### 检查环境

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker compose version

# 检查 Docker 运行状态
docker ps
```

---

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd ssh-terminal-server
```

### 2. 创建 docker-compose.yml

在项目根目录创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: ssh-terminal-server
    ports:
      - "3000:3000"
    environment:
      - RUST_LOG=info
      - SERVER_HOST=0.0.0.0
      - SERVER_PORT=3000
      - DATABASE_TYPE=postgresql
      - DATABASE_HOST=db
      - DATABASE_PORT=5432
      - DATABASE_USER=ssh_terminal
      - DATABASE_PASSWORD=${DB_PASSWORD}
      - DATABASE_DATABASE=ssh_terminal_server
      - DATABASE_MAX_CONNECTIONS=20
      - AUTH_JWT_SECRET=${JWT_SECRET}
      - AUTH_ACCESS_TOKEN_EXPIRATION_MINUTES=15
      - AUTH_REFRESH_TOKEN_EXPIRATION_DAYS=7
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - REDIS_DB=0
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - ssh-terminal-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15-alpine
    container_name: ssh-terminal-db
    environment:
      - POSTGRES_USER=ssh_terminal
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=ssh_terminal_server
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - ssh-terminal-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ssh_terminal -d ssh_terminal_server"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ssh-terminal-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - ssh-terminal-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  ssh-terminal-network:
    driver: bridge
```

### 3. 创建环境变量文件（可选）

如果需要在本地测试，可以创建环境变量文件。生产环境建议直接在 docker-compose.yml 中配置或使用 secrets。

**方式一：在 docker-compose.yml 中配置环境变量**（推荐）

直接在 `docker-compose.yml` 文件的 `environment` 部分配置所有变量。

**方式二：使用环境变量文件**

创建 `.env` 文件（不要提交到 Git）：

```bash
# 数据库密码
DB_PASSWORD=your_strong_db_password_here

# JWT 密钥（至少 32 位随机字符串）
JWT_SECRET=your_jwt_secret_at_least_32_chars_long

# Redis 密码
REDIS_PASSWORD=your_redis_password_here
```

然后在 `docker-compose.yml` 中引用：

```yaml
services:
  app:
    environment:
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
```

**注意**：本项目不支持 .env 文件用于配置加载，仅用于 Docker Compose 环境变量传递。

### 4. 创建 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM rust:1.75-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache \
    musl-dev \
    pkgconfig \
    openssl-dev \
    postgresql-dev

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY Cargo.toml Cargo.lock ./

# 创建虚拟源文件以缓存依赖
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# 复制源代码
COPY src ./src

# 构建应用
RUN cargo build --release

# 运行阶段
FROM alpine:3.19

# 安装运行时依赖
RUN apk add --no-cache \
    ca-certificates \
    curl

# 从构建阶段复制二进制文件
COPY --from=builder /app/target/release/ssh-terminal-server /app/ssh-terminal-server

# 复制配置文件
COPY config ./config

# 创建非 root 用户
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

# 切换到非 root 用户
USER appuser

# 设置工作目录
WORKDIR /app

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 运行应用
CMD ["./ssh-terminal-server"]
```

### 5. 启动服务

```bash
# 构建并启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f app
```

### 6. 验证部署

```bash
# 健康检查
curl http://localhost:3000/health

# 服务器信息
curl http://localhost:3000/info

# 用户注册测试
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Password123!"}'
```

---

## 配置说明

### 环境变量详解

#### 数据库配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_TYPE` | 数据库类型 | `postgresql` |
| `DATABASE_HOST` | 数据库主机 | `db` |
| `DATABASE_PORT` | 数据库端口 | `5432` |
| `DATABASE_USER` | 数据库用户 | `ssh_terminal` |
| `DATABASE_PASSWORD` | 数据库密码 | 从 .env 读取 |
| `DATABASE_DATABASE` | 数据库名称 | `ssh_terminal_server` |
| `DATABASE_MAX_CONNECTIONS` | 最大连接数 | `20` |

#### 认证配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `AUTH_JWT_SECRET` | JWT 签名密钥 | 从 .env 读取 |
| `AUTH_ACCESS_TOKEN_EXPIRATION_MINUTES` | Access Token 过期时间（分钟） | `15` |
| `AUTH_REFRESH_TOKEN_EXPIRATION_DAYS` | Refresh Token 过期时间（天） | `7` |

#### Redis 配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `REDIS_HOST` | Redis 主机 | `redis` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `REDIS_PASSWORD` | Redis 密码 | 从 .env 读取 |
| `REDIS_DB` | Redis 数据库编号 | `0` |

#### 服务器配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `SERVER_HOST` | 服务器监听地址 | `0.0.0.0` |
| `SERVER_PORT` | 服务器监听端口 | `3000` |
| `RUST_LOG` | 日志级别 | `info` / `debug` / `trace` |

### 日志级别配置

```yaml
environment:
  - RUST_LOG=info          # 生产环境
  - RUST_LOG=debug         # 调试环境
  - RUST_LOG=trace         # 详细调试
  - RUST_LOG=ssh_terminal_server=info,tower_http=info  # 细粒度控制
```

---

## 服务架构

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Network                        │
│                    (bridge)                             │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌─────▼──────────┐  ┌───▼──────────┐
│     app        │  │       db       │  │    redis     │
│   (Server)     │  │  (PostgreSQL)  │  │   (Redis)    │
│  Port: 3000    │  │   Port: 5432   │  │  Port: 6379  │
└────────────────┘  └────────────────┘  └──────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Volumes    │
                    └─────────────┘
```

### 服务依赖关系

- **app** 依赖 **db** 和 **redis**
- **db** 和 **redis** 独立运行
- 所有服务共享同一网络 `ssh-terminal-network`

---

## 管理命令

### 基本命令

```bash
# 启动所有服务（后台运行）
docker compose up -d

# 启动所有服务（前台运行，查看日志）
docker compose up

# 停止所有服务
docker compose stop

# 停止并删除所有容器
docker compose down

# 停止并删除所有容器、网络、卷
docker compose down -v

# 重启服务
docker compose restart

# 重启特定服务
docker compose restart app
```

### 查看命令

```bash
# 查看服务状态
docker compose ps

# 查看服务日志
docker compose logs

# 查看特定服务日志
docker compose logs app

# 实时查看日志
docker compose logs -f app

# 查看最后 100 行日志
docker compose logs --tail=100 app
```

### 构建命令

```bash
# 重新构建镜像
docker compose build

# 强制重新构建（不使用缓存）
docker compose build --no-cache

# 构建并启动
docker compose up -d --build
```

### 进入容器

```bash
# 进入应用容器
docker compose exec app sh

# 进入数据库容器
docker compose exec db psql -U ssh_terminal -d ssh_terminal_server

# 进入 Redis 容户端
docker compose exec redis redis-cli -a ${REDIS_PASSWORD}
```

### 更新服务

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build

# 清理旧镜像（可选）
docker image prune -f
```

---

## 环境变量

### 生成强密钥

#### JWT Secret

```bash
# 使用 OpenSSL
openssl rand -base64 32

# 使用 Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 数据库密码

```bash
# 使用 OpenSSL
openssl rand -base64 24

# 使用 pwgen
pwgen -s 24 1
```

#### Redis 密码

```bash
# 使用 OpenSSL
openssl rand -base64 16
```

### .env 文件示例

```bash
# ===== 数据库配置 =====
DB_PASSWORD=Kx7Yn2Zp9qR8wF4tL6mN3vB5xC8zD

# ===== 认证配置 =====
JWT_SECRET=E9aH2jK7Nx7Yn2Zp9qR8wF4tL6mN3vB5xC8zD1s

# ===== Redis 配置 =====
REDIS_PASSWORD=F4tL6mN3vB5xC8zD1sE9aH2jK7

# ===== 服务器配置（可选）=====
RUST_LOG=info
SERVER_HOST=0.0.0.0
SERVER_PORT=3000
```

---

## 持久化存储

### 数据卷

| 卷名 | 用途 | 容器路径 |
|------|------|----------|
| `postgres_data` | PostgreSQL 数据 | `/var/lib/postgresql/data` |
| `redis_data` | Redis 数据 | `/data` |

### 备份数据

#### 备份 PostgreSQL

```bash
# 备份数据库到文件
docker compose exec db pg_dump -U ssh_terminal ssh_terminal_server > backup_$(date +%Y%m%d_%H%M%S).sql

# 使用 pg_dump 容器命令
docker run --rm \
  --network ssh-terminal-network \
  postgres:15-alpine \
  pg_dump -h db -U ssh_terminal ssh_terminal_server > backup.sql
```

#### 备份 Redis

```bash
# 备份 Redis 到文件
docker compose exec redis redis-cli -a ${REDIS_PASSWORD} BGSAVE

# 复制 RDB 文件
docker compose cp redis:/data/dump.rdb redis_backup_$(date +%Y%m%d_%H%M%S).rdb
```

### 恢复数据

#### 恢复 PostgreSQL

```bash
# 从备份文件恢复
docker compose exec -T db psql -U ssh_terminal ssh_terminal_server < backup.sql
```

#### 恢复 Redis

```bash
# 停止 Redis 容器
docker compose stop redis

# 复制备份文件到容器
docker compose cp redis_backup.rdb redis:/data/dump.rdb

# 启动 Redis 容器
docker compose start redis
```

---

## 监控和日志

### 查看资源使用

```bash
# 查看容器资源使用情况
docker stats

# 查看特定服务资源使用
docker stats app db redis
```

### 日志管理

#### 日志轮转配置

在 `docker-compose.yml` 中添加日志配置：

```yaml
services:
  app:
    # ... 其他配置
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### 导出日志

```bash
# 导出所有日志
docker compose logs > app.log

# 导出特定服务日志
docker compose logs app > app.log

# 导出最近 1000 行日志
docker compose logs --tail=1000 app > app.log
```

### 健康检查

```bash
# 检查服务健康状态
docker compose ps

# 查看健康检查日志
docker compose inspect app | grep -A 10 Health
```

---

## 生产环境最佳实践

### 1. 安全配置

#### 使用反向代理

**Nginx 配置示例**：

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 限制网络访问

```yaml
# docker-compose.yml
services:
  db:
    ports:
      - "127.0.0.1:5432:5432"  # 仅本地访问

  redis:
    ports:
      - "127.0.0.1:6379:6379"  # 仅本地访问
```

### 2. 性能优化

#### 数据库连接池配置

```yaml
environment:
  - DATABASE_MAX_CONNECTIONS=50  # 根据负载调整
```

#### 资源限制

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  db:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

### 3. 高可用部署

#### 使用负载均衡器

```yaml
# docker-compose.yml
services:
  app:
    # ... 其他配置
    deploy:
      replicas: 3  # 运行 3 个副本

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
```

#### 使用外部数据库

```yaml
services:
  app:
    environment:
      - DATABASE_HOST=your-external-db-host
      # 移除 db 服务
```

### 4. 监控和告警

#### 使用 Prometheus + Grafana

```yaml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 5. 自动重启策略

```yaml
services:
  app:
    restart: unless-stopped  # 除非手动停止，否则自动重启

  db:
    restart: always          # 总是自动重启
```

---

## 故障排查

### 常见问题

#### 1. 容器无法启动

**检查日志**：
```bash
docker compose logs app
```

**常见原因**：
- 端口被占用
- 环境变量配置错误
- 数据库连接失败

#### 2. 数据库连接失败

**检查数据库健康状态**：
```bash
docker compose ps db
docker compose logs db
```

**手动连接测试**：
```bash
docker compose exec db psql -U ssh_terminal -d ssh_terminal_server
```

#### 3. Redis 连接失败

**检查 Redis 健康状态**：
```bash
docker compose ps redis
docker compose logs redis
```

**手动连接测试**：
```bash
docker compose exec redis redis-cli -a ${REDIS_PASSWORD} ping
```

#### 4. 健康检查失败

**检查健康检查配置**：
```bash
docker compose inspect app | grep -A 20 Health
```

**手动测试健康检查**：
```bash
docker compose exec app curl -f http://localhost:3000/health
```

#### 5. 内存不足

**检查内存使用**：
```bash
docker stats
```

**解决方案**：
- 增加系统内存
- 减少数据库连接数
- 启用资源限制

### 调试技巧

#### 进入容器调试

```bash
# 进入应用容器
docker compose exec app sh

# 进入数据库容器
docker compose exec db sh

# 进入 Redis 容器
docker compose exec redis sh
```

#### 查看环境变量

```bash
docker compose exec app env | grep -E "DATABASE|REDIS|AUTH"
```

#### 查看网络连接

```bash
docker compose exec app netstat -tuln
```

---

## 相关文档

- [配置文件详解](configuration.md) - 详细的配置说明
- [环境变量配置](environment-variables.md) - 完整的环境变量列表
- [生产环境部署](production-guide.md) - 生产部署最佳实践
- [快速开始指南](../development/getting-started.md) - 开发环境配置

---

**提示**：生产环境部署前请务必修改 `.env` 文件中的所有密码和密钥！