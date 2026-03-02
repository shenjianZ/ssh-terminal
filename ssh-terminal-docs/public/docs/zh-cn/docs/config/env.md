# 环境变量

SSH Terminal 支持通过环境变量配置应用行为，包括开发环境、生产环境、服务器部署等多种场景。

## 目录

- [前端环境变量](#前端环境变量)
- [后端服务器环境变量](#后端服务器环境变量)


---

## 前端环境变量

### 支持的环境变量

前端使用 Vite 的环境变量系统，所有以 `VITE_` 开头的变量都会暴露给前端代码。

`.env`

``` config
# API 基础 URL
VITE_API_BASE_URL=https://api.yourdomain.com
```
---


## 后端服务器环境变量

`ssh-terminal-server` 使用 环境变量注入配置参数

### 环境变量说明

| 变量名                                  | 说明                                            | 默认值         |
| --------------------------------------- | ----------------------------------------------- | -------------- |
| `SERVER__HOST`                          | 服务器监听地址                                  | `0.0.0.0`      |
| `SERVER__PORT`                          | 服务器监听端口                                  | `3000`         |
| `DATABASE__TYPE`                        | 数据库类型                                      | `sqlite`       |
| `DATABASE__PATH`                        | 数据库文件路径 （`sqlite`）                      | `/data/app.db` |
| `DATABASE__HOST`                        | 数据库主机地址（`mysql`、`PostgreSQL`）          | -              |
| `DATABASE__PORT`                        | 数据库端口（`mysql`、`PostgreSQL`）              | -              |
| `DATABASE__USER`                        | 数据库用户（`mysql`、`PostgreSQL`）              | -              |
| `DATABASE__PASSWORD`                    | 数据库密码（`mysql`、`PostgreSQL`）              | -              |
| `DATABASE__DATABASE`                    | 数据库的对应数据库名称,（`mysql`、`PostgreSQL`） | -              |
| `REDIS__HOST`                           | Redis 主机地址                                  | `localhost`    |
| `REDIS__PORT`                           | Redis 端口                                      | `6379`         |
| `REDIS__PASSWORD`                       | Redis 密码                                      | -              |
| `AUTH__JWT_SECRET`                      | JWT 签名密钥                                    | -              |
| `AUTH__ACCESS_TOKEN_EXPIRATION_MINUTES` | 访问令牌过期时间（分钟）                        | `15`           |
| `AUTH__REFRESH_TOKEN_EXPIRATION_DAYS`   | 刷新令牌过期时间（天）                          | `7`            |
| `EMAIL__ENABLED`                        | 是否启用邮件功能                                | `false`        |
| `EMAIL__SMTP_HOST`                      | SMTP 服务器地址                                 | -              |
| `EMAIL__SMTP_PORT`                      | SMTP 服务器端口                                 | -              |
| `EMAIL__SMTP_USERNAME`                  | SMTP 用户名                                     | -              |
| `EMAIL__SMTP_PASSWORD`                  | SMTP 密码/授权码                                | -              |
| `EMAIL__FROM_NAME`                      | 发件人名称                                      | `SSH Terminal` |
| `EMAIL__FROM_EMAIL`                     | 发件人邮箱地址                                  | -              |
| `EMAIL__WORKER_POOL_SIZE`               | Worker 连接池大小                               | `10`           |
| `EMAIL__WORKER_TIMEOUT_SECONDS`         | Worker 超时时间（秒）                           | `10`           |



### Docker 环境变量

使用 Docker 部署时，可以通过 `docker-compose.yml` 或 `docker run` 传入环境变量：

```yaml
# docker-compose.yml
services:
  ssh-terminal-server:
    image: registry.cn-hangzhou.aliyuncs.com/pull-image/ssh-terminal-server:latest
    container_name: ssh-terminal-server
    restart: unless-stopped

    environment:
      # ================= Server =================
      SERVER__HOST: 0.0.0.0
      SERVER__PORT: 3000

      # ================= Database (SQLite) =================
      DATABASE__TYPE: sqlite
      DATABASE__PATH: /data/app.db

      # ================= Redis =================
      REDIS__HOST: redis
      REDIS__PORT: 6379
      REDIS__PASSWORD: ""  # 如有密码请填写

      # ================= Auth =================
      AUTH__JWT_SECRET: "change-me-to-a-long-random-string"
      AUTH__ACCESS_TOKEN_EXPIRATION_MINUTES: 15
      AUTH__REFRESH_TOKEN_EXPIRATION_DAYS: 7

      # ================= Email（可选） =================
      EMAIL__ENABLED: "false"            # ⭐ 默认关闭，需要时改 true
      EMAIL__SMTP_HOST: "smtp.example.com"
      EMAIL__SMTP_PORT: 587
      EMAIL__SMTP_USERNAME: "user@example.com"
      EMAIL__SMTP_PASSWORD: "your-smtp-password"
      EMAIL__FROM_NAME: "SSH Terminal"
      EMAIL__FROM_EMAIL: "noreply@example.com"
      EMAIL__WORKER_POOL_SIZE: 10
      EMAIL__WORKER_TIMEOUT_SECONDS: 10

    ports:
      - "3000:3000"

    volumes:
      - app_data:/data

    depends_on:
      - redis

  # ================= Redis =================
  redis:
    image: redis:7-alpine
    container_name: ssh-terminal-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data

# ================= Volumes =================
volumes:
  app_data:
  redis_data:
```
