# 环境变量

SSH Terminal 支持通过环境变量配置应用行为，包括开发环境、生产环境、服务器部署等多种场景。

## 目录

- [前端环境变量](#前端环境变量)
- [后端服务器环境变量](#后端服务器环境变量)


---

## 前端环境变量

> 注意，此环境变量仅仅开发有效，docker 部署时无法使用

`.env`

``` config
# API 基础 URL
API_BASE_URL=https://api.yourdomain.com
```
---


## 后端服务器环境变量

> 注意，此环境变量仅仅开发，docker 部署均可以使用，`ssh-terminal-server` 使用 环境变量注入配置参数

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
| `DATABASE__DATABASE`                    | 数据库的对应数据库名称（`mysql`、`PostgreSQL`） | -              |
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
