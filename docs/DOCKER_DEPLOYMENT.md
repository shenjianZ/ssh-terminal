# Docker Compose 部署指南

## 前提条件

- Docker 20.10+
- Docker Compose 2.0+

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/shenjianZ/ssh-terminal.git
cd ssh-terminal
```

### 2. 启动所有服务

```bash
docker-compose up -d
```

### 3. 访问服务

- **Web 应用**: http://localhost:8080
- **文档站点**: http://localhost:8081
- **API 服务**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 4. 停止服务

```bash
docker-compose down
```

### 5. 停止服务并删除数据卷

```bash
docker-compose down -v
```

## 使用阿里云镜像

如果需要从阿里云 ACR 拉取镜像，请修改 `docker-compose.yml`：

```yaml
services:
  ssh-terminal-server:
    image: <your-registry>/<namespace>/ssh-terminal-server:latest

  ssh-terminal-web:
    image: <your-registry>/<namespace>/ssh-terminal-web:latest

  ssh-terminal-docs:
    image: <your-registry>/<namespace>/ssh-terminal-docs:latest
```

## 环境变量配置

可以在 `docker-compose.yml` 中修改以下环境变量：

### Server 配置

```yaml
environment:
  - RUST_LOG=info                    # 日志级别
  - DATABASE_TYPE=postgresql         # 数据库类型
  - DATABASE_HOST=postgres           # 数据库主机
  - DATABASE_PORT=5432               # 数据库端口
  - DATABASE_USER=postgres           # 数据库用户
  - DATABASE_PASSWORD=postgres       # 数据库密码
  - DATABASE_NAME=ssh_terminal_server # 数据库名称
  - REDIS_HOST=redis                 # Redis 主机
  - REDIS_PORT=6379                  # Redis 端口
  - REDIS_PASSWORD=                  # Redis 密码
  - REDIS_DB=0                       # Redis 数据库
```

### PostgreSQL 配置

```yaml
environment:
  - POSTGRES_USER=postgres           # 数据库用户
  - POSTGRES_PASSWORD=postgres       # 数据库密码
  - POSTGRES_DB=ssh_terminal_server  # 数据库名称
```

## 故障排查

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs ssh-terminal-server
docker-compose logs ssh-terminal-web
docker-compose logs ssh-terminal-docs

# 实时查看日志
docker-compose logs -f
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart ssh-terminal-server
```

### 进入容器

```bash
# 进入 server 容器
docker-compose exec ssh-terminal-server sh

# 进入 postgres 容器
docker-compose exec postgres psql -U postgres
```

## 生产环境建议

1. **使用环境变量文件**：创建 `.env` 文件存储敏感信息
2. **配置 SSL/TLS**：使用 Nginx 反向代理配置 HTTPS
3. **数据备份**：定期备份 PostgreSQL 数据卷
4. **监控告警**：配置容器健康检查和监控
5. **资源限制**：在 `docker-compose.yml` 中添加资源限制

## 相关链接

- [阿里云容器镜像服务](https://cr.console.aliyun.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [项目文档](./)