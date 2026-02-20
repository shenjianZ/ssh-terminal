# API 接口概览

本文档提供所有 API 接口的快速参考。

## 基础信息

### Base URL

```
开发环境: http://localhost:3000
生产环境: https://api.yourdomain.com
```

### 认证方式

本 API 使用 JWT（JSON Web Token）进行认证：

- **Access Token**：有效期 15 分钟，用于 API 请求认证
- **Refresh Token**：有效期 7 天，用于获取新的 Access Token

### 认证 Header 格式

```http
Authorization: Bearer <access_token>
```

### 响应格式

所有接口返回统一的 JSON 格式：

**成功响应**：
```json
{
  "code": 200,
  "message": "Success",
  "data": { }
}
```

**错误响应**：
```json
{
  "code": 400,
  "message": "错误信息",
  "data": null
}
```

### 通用错误码

| 错误码 | 说明 |
|-------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token 无效或过期） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 接口列表

### 公开接口（无需认证）

| 方法 | 路径 | 说明 | 详细文档 |
|------|------|------|----------|
| GET | `/health` | 健康检查 | [查看详情](endpoints/public.md#get-health) |
| GET | `/info` | 服务器信息 | [查看详情](endpoints/public.md#get-info) |
| POST | `/auth/register` | 用户注册 | [查看详情](endpoints/public.md#post-authregister) |
| POST | `/auth/login` | 用户登录 | [查看详情](endpoints/public.md#post-authlogin) |
| POST | `/auth/refresh` | 刷新 Token | [查看详情](endpoints/public.md#post-authrefresh) |

### 需要认证的接口

| 方法 | 路径 | 说明 | 详细文档 |
|------|------|------|----------|
| POST | `/auth/delete` | 删除账号 | [查看详情](endpoints/protected.md#post-authdelete) |
| POST | `/auth/delete-refresh-token` | 删除 Refresh Token | [查看详情](endpoints/protected.md#post-authdelete-refresh-token) |

## 认证流程简述

### 1. 注册/登录

用户注册或登录成功后，会返回 Access Token 和 Refresh Token：

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2. 使用 Access Token

将 Access Token 添加到请求头：

```http
GET /auth/delete
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 3. 刷新 Token

当 Access Token 过期时，使用 Refresh Token 获取新的 Token：

```bash
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

> 查看 [认证机制详解](authentication.md) 了解完整流程

## 快速示例

### 注册用户

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 用户登录

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 访问受保护接口

```bash
curl -X POST http://localhost:3000/auth/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "user_id": "1234567890",
    "password": "password123"
  }'
```

### 健康检查

```bash
curl http://localhost:3000/health
```

## 详细文档

- [公开接口详细文档](endpoints/public.md) - 所有公开接口的详细说明
- [受保护接口详细文档](endpoints/protected.md) - 需要认证的接口详细说明
- [认证机制详解](authentication.md) - JWT 认证流程和安全最佳实践
- [前端集成示例](examples/frontend-integration.md) - JavaScript/TypeScript/React/Vue 集成代码示例

## 相关文档

- [快速开始指南](../development/getting-started.md) - 安装和运行项目
- [环境变量配置](../deployment/environment-variables.md) - 配置 API 服务器
- [前端集成指南](examples/frontend-integration.md) - 前端开发集成示例

## 获取帮助

如果您在使用 API 时遇到问题：

1. 检查请求格式是否正确
2. 确认 Token 是否有效（未过期）
3. 查看日志输出获取详细错误信息
4. 参考 [认证机制详解](authentication.md) 了解认证流程

---

**提示**：建议使用 Postman、Insomnia 或类似工具测试 API 接口。
