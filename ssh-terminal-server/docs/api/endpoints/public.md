# 公开接口文档

本文档详细说明所有无需认证即可访问的 API 接口。

## 目录

- [GET /health - 健康检查](#get-health)
- [GET /info - 服务器信息](#get-info)
- [POST /auth/register - 用户注册](#post-authregister)
- [POST /auth/login - 用户登录](#post-authlogin)
- [POST /auth/refresh - 刷新 Token](#post-authrefresh)

---

## GET /health

健康检查端点，用于检查服务是否正常运行。

### 请求

```http
GET /health
```

**请求参数**：无

**请求头**：无特殊要求

### 响应

**成功响应 (200)**：

```json
{
  "status": "ok"
}
```

或服务不可用时：

```json
{
  "status": "unavailable"
}
```

### 示例

```bash
curl http://localhost:3000/health
```

### 错误码

| 错误码 | 说明 |
|-------|------|
| 500 | 服务器内部错误 |

---

## GET /info

获取服务器基本信息，包括应用名称、版本、状态等。

### 请求

```http
GET /info
```

**请求参数**：无

**请求头**：无特殊要求

### 响应

**成功响应 (200)**：

```json
{
  "name": "ssh-terminal-server",
  "version": "1.0",
  "status": "running",
  "timestamp": 1704112800
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 应用名称 |
| version | string | 应用版本 |
| status | string | 运行状态 |
| timestamp | number | 当前时间戳（Unix 时间戳） |

### 示例

```bash
curl http://localhost:3000/info
```

### 错误码

| 错误码 | 说明 |
|-------|------|
| 500 | 服务器内部错误 |

---

## POST /auth/register

创建新用户账户。注册成功后自动登录，返回 Access Token 和 Refresh Token。

### 请求

```http
POST /auth/register
Content-Type: application/json
```

**请求参数**：

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 用户邮箱，必须是有效的邮箱格式 |
| password | string | 是 | 用户密码，建议长度至少 8 位 |

### 响应

**成功响应 (200)**：

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "email": "user@example.com",
    "created_at": "2026-02-13T12:00:00.000Z",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| email | string | 用户邮箱 |
| created_at | string | 账号创建时间（ISO 8601 格式） |
| access_token | string | Access Token，有效期 15 分钟 |
| refresh_token | string | Refresh Token，有效期 7 天 |

### 示例

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 错误码

| 错误码 | 说明 |
|-------|------|
| 400 | 请求参数错误（邮箱格式错误、密码长度不够） |
| 409 | 邮箱已被注册 |
| 500 | 服务器内部错误 |

### 注意事项

- 邮箱地址将作为用户的唯一标识符
- 密码会使用 Argon2 算法进行哈希存储
- 注册成功后会自动生成 Access Token 和 Refresh Token
- Refresh Token 会存储在 Redis 中，用于后续刷新 Token

---

## POST /auth/login

用户登录。验证成功后返回 Access Token 和 Refresh Token。

### 请求

```http
POST /auth/login
Content-Type: application/json
```

**请求参数**：

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 用户邮箱 |
| password | string | 是 | 用户密码 |

### 响应

**成功响应 (200)**：

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "1234567890",
    "email": "user@example.com",
    "created_at": "2026-02-13T12:00:00.000Z",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 用户 ID（10 位数字） |
| email | string | 用户邮箱 |
| created_at | string | 账号创建时间（ISO 8601 格式） |
| access_token | string | Access Token，有效期 15 分钟 |
| refresh_token | string | Refresh Token，有效期 7 天 |

### 示例

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 错误码

| 错误码 | 说明 |
|-------|------|
| 400 | 请求参数错误 |
| 401 | 邮箱或密码错误 |
| 500 | 服务器内部错误 |

### 注意事项

- 登录失败不会返回具体的错误信息（如"邮箱不存在"或"密码错误"），统一返回"邮箱或密码错误"
- 密码错误次数过多可能会被临时限制（取决于具体实现）
- 登录成功后会生成新的 Token 对，旧的 Token 会失效

---

## POST /auth/refresh

使用 Refresh Token 获取新的 Access Token 和 Refresh Token。

### 请求

```http
POST /auth/refresh
Content-Type: application/json
```

**请求参数**：

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refresh_token | string | 是 | Refresh Token |

### 响应

**成功响应 (200)**：

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| access_token | string | 新的 Access Token，有效期 15 分钟 |
| refresh_token | string | 新的 Refresh Token，有效期 7 天 |

### 示例

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### 错误码

| 错误码 | 说明 |
|-------|------|
| 400 | 请求参数错误 |
| 401 | Refresh Token 无效或已过期 |
| 500 | 服务器内部错误 |

### 注意事项

- 每次刷新会生成新的 Refresh Token，旧的 Refresh Token 会立即失效
- Refresh Token 只能使用一次，重复使用会返回错误
- Refresh Token 有效期为 7 天，过期后需要重新登录
- Refresh Token 存储在 Redis 中，服务器重启不会丢失（如果 Redis 持久化配置正确）

### Token 刷新策略建议

**前端实现建议**：

1. 在每次 API 请求失败（401 错误）时尝试刷新 Token
2. 刷新成功后重试原请求
3. 刷新失败则跳转到登录页
4. 不要在 Token 即将过期时主动刷新，而是在使用时检查有效性

查看 [前端集成示例](../examples/frontend-integration.md) 了解完整的实现代码。

---

## 相关文档

- [受保护接口文档](protected.md) - 需要认证的接口说明
- [认证机制详解](../authentication.md) - 完整的认证流程说明
- [API 概览](../api-overview.md) - 所有接口快速索引
- [前端集成示例](../examples/frontend-integration.md) - 前端集成代码示例

---

**提示**：建议使用 Postman、Insomnia 或类似工具测试 API 接口。
