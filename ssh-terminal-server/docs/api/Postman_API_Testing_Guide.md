# SSH Terminal 云端同步 - Postman API 测试文档

## 📋 目录

- [环境准备](#环境准备)
- [认证流程](#认证流程)
- [用户资料 API](#用户资料-api)
- [SSH 会话 API](#ssh-会话-api)
- [同步 API](#同步-api)
- [测试场景](#测试场景)
- [Postman 集合导入](#postman-集合导入)

---

## 🚀 环境准备

### 1. 启动服务器

```bash
cd ssh-terminal-server
cargo run
```

服务器默认运行在：`http://localhost:3000`

### 2. 配置 Postman 环境变量

在 Postman 中创建环境变量：

| 变量名 | 值 | 说明 |
|--------|---|------|
| `base_url` | `http://localhost:3000` | API 基础 URL |
| `access_token` | *(登录后自动设置)* | JWT 访问令牌 |
| `refresh_token` | *(登录后自动设置)* | JWT 刷新令牌 |
| `user_id` | *(从响应中获取)* | 用户 ID |

---

## 🔐 认证流程

### 1. 用户注册

**请求**：
```http
POST {{base_url}}/auth/register
Content-Type: application/json
```

**请求体**：
```json
{
  "email": "test@example.com",
  "password": "Password123!"
}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user": {
      "id": "1234567890",
      "email": "test@example.com",
      "created_at": "2025-02-17T10:30:00",
      "updated_at": "2025-02-17T10:30:00"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Postman 测试脚本**（自动保存 token）：
```javascript
// Tests 标签页
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

const jsonData = pm.response.json();
pm.environment.set("access_token", jsonData.data.access_token);
pm.environment.set("refresh_token", jsonData.data.refresh_token);
pm.environment.set("user_id", jsonData.data.user.id);
```

---

### 2. 用户登录

**请求**：
```http
POST {{base_url}}/auth/login
Content-Type: application/json
```

**请求体**：
```json
{
  "email": "test@example.com",
  "password": "Password123!"
}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Postman 测试脚本**：
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

const jsonData = pm.response.json();
pm.environment.set("access_token", jsonData.data.access_token);
pm.environment.set("refresh_token", jsonData.data.refresh_token);
```

---

### 3. 刷新访问令牌

**请求**：
```http
POST {{base_url}}/auth/refresh
Content-Type: application/json
```

**请求体**：
```json
{
  "refresh_token": "{{refresh_token}}"
}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Postman 测试脚本**：
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

const jsonData = pm.response.json();
pm.environment.set("access_token", jsonData.data.access_token);
if (jsonData.data.refresh_token) {
    pm.environment.set("refresh_token", jsonData.data.refresh_token);
}
```

---

## 👤 用户资料 API

### 1. 获取用户资料

**请求**：
```http
GET {{base_url}}/api/user/profile
Authorization: Bearer {{access_token}}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": "1234567890",
    "username": "张三",
    "phone": "13800138000",
    "qq": "123456789",
    "wechat": "wx123456",
    "bio": "这是个人简介",
    "avatar_data": null,
    "avatar_mime_type": null,
    "server_ver": 5,
    "created_at": "2025-02-17T10:30:00",
    "updated_at": "2025-02-17T12:45:30"
  }
}
```

---

### 2. 创建/更新用户资料

**请求**：
```http
PUT {{base_url}}/api/user/profile
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**请求体**：
```json
{
  "username": "张三",
  "phone": "13800138000",
  "qq": "123456789",
  "wechat": "wx123456",
  "bio": "全栈开发工程师",
  "avatar_data": null,
  "avatar_mime_type": null
}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": "1234567890",
    "username": "张三",
    "phone": "13800138000",
    "qq": "123456789",
    "wechat": "wx123456",
    "bio": "全栈开发工程师",
    "server_ver": 2,
    "created_at": "2025-02-17T10:30:00",
    "updated_at": "2025-02-17T12:45:30"
  }
}
```

---

### 3. 删除用户资料

**请求**：
```http
DELETE {{base_url}}/api/user/profile
Authorization: Bearer {{access_token}}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 🖥️ SSH 会话 API

### 1. 获取所有 SSH 会话（分页）

**请求**：
```http
GET {{base_url}}/api/ssh/sessions?page=1&page_size=20
Authorization: Bearer {{access_token}}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "data": [
      {
        "id": "uuid-1234",
        "user_id": "1234567890",
        "name": "生产服务器",
        "host": "192.168.1.100",
        "port": 22,
        "username": "root",
        "group_name": "默认分组",
        "terminal_type": "xterm",
        "columns": 80,
        "rows": 24,
        "auth_method_encrypted": "encrypted_data_here",
        "auth_nonce": "nonce",
        "auth_key_salt": "salt",
        "server_ver": 3,
        "client_ver": 2,
        "last_synced_at": "2025-02-17T12:00:00",
        "created_at": "2025-02-17T10:00:00",
        "updated_at": "2025-02-17T12:45:30",
        "deleted_at": null
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20
  }
}
```

---

### 2. 获取单个 SSH 会话

**请求**：
```http
GET {{base_url}}/api/ssh/sessions/{{session_id}}
Authorization: Bearer {{access_token}}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid-1234",
    "user_id": "1234567890",
    "name": "生产服务器",
    "host": "192.168.1.100",
    "port": 22,
    "username": "root",
    "group_name": "默认分组",
    "terminal_type": "xterm",
    "columns": 80,
    "rows": 24,
    "auth_method_encrypted": "encrypted_data_here",
    "auth_nonce": "nonce",
    "auth_key_salt": "salt",
    "server_ver": 3,
    "client_ver": 2,
    "last_synced_at": "2025-02-17T12:00:00",
    "created_at": "2025-02-17T10:00:00",
    "updated_at": "2025-02-17T12:45:30",
    "deleted_at": null
  }
}
```

---

### 3. 创建 SSH 会话

**请求**：
```http
POST {{base_url}}/api/ssh/sessions
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**请求体**：
```json
{
  "name": "测试服务器",
  "host": "192.168.1.200",
  "port": 22,
  "username": "admin",
  "group_name": "开发环境",
  "terminal_type": "xterm",
  "columns": 120,
  "rows": 30,
  "auth_method_encrypted": "aes256_encrypted_password",
  "auth_nonce": "random_nonce_16bytes",
  "auth_key_salt": "random_salt_32bytes"
}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid-5678",
    "user_id": "1234567890",
    "name": "测试服务器",
    "host": "192.168.1.200",
    "port": 22,
    "username": "admin",
    "group_name": "开发环境",
    "server_ver": 1,
    "client_ver": 0,
    "created_at": "2025-02-17T13:00:00",
    "updated_at": "2025-02-17T13:00:00"
  }
}
```

**Postman 测试脚本**：
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

const jsonData = pm.response.json();
pm.environment.set("session_id", jsonData.data.id);
```

---

### 4. 更新 SSH 会话

**请求**：
```http
PUT {{base_url}}/api/ssh/sessions/{{session_id}}
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**请求体**：
```json
{
  "name": "生产服务器（已更新）",
  "group_name": "生产环境"
}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid-1234",
    "name": "生产服务器（已更新）",
    "host": "192.168.1.100",
    "port": 22,
    "username": "root",
    "group_name": "生产环境",
    "server_ver": 4,
    "client_ver": 0,
    "updated_at": "2025-02-17T13:15:00"
  }
}
```

---

### 5. 删除 SSH 会话

**请求**：
```http
DELETE {{base_url}}/api/ssh/sessions/{{session_id}}
Authorization: Bearer {{access_token}}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 🔄 同步 API

### 1. Pull - 拉取服务器数据

**请求**：
```http
POST {{base_url}}/api/sync/pull
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**请求体**：
```json
{
  "last_sync_at": 1708147200000,
  "device_id": "device-uuid-12345",
  "entity_types": ["user_profiles", "ssh_sessions"]
}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "server_time": 1708153600000,
    "last_sync_at": 1708153600000,
    "user_profile": {
      "id": 1,
      "user_id": "1234567890",
      "username": "张三",
      "server_ver": 5,
      "updated_at": "2025-02-17T12:45:30"
    },
    "ssh_sessions": [
      {
        "id": "uuid-1234",
        "name": "生产服务器",
        "server_ver": 3
      }
    ],
    "deleted_session_ids": ["uuid-old-session"],
    "conflicts": []
  }
}
```

---

### 2. Push - 推送本地更改

**请求**：
```http
POST {{base_url}}/api/sync/push
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**请求体**：
```json
{
  "device_id": "device-uuid-12345",
  "user_profile": {
    "username": "张三",
    "bio": "更新后的简介"
  },
  "ssh_sessions": [
    {
      "id": "uuid-local-1",
      "name": "本地创建的会话",
      "host": "192.168.1.50",
      "port": 22,
      "username": "deploy",
      "group_name": "测试环境",
      "terminal_type": "xterm",
      "columns": 100,
      "rows": 25,
      "auth_method_encrypted": "encrypted_auth",
      "auth_nonce": "nonce",
      "auth_key_salt": "salt",
      "client_ver": 1
    },
    {
      "id": "uuid-1234",
      "name": "生产服务器（已修改）",
      "host": "192.168.1.100",
      "port": 22,
      "username": "root",
      "group_name": "生产环境",
      "terminal_type": "xterm",
      "columns": 80,
      "rows": 24,
      "auth_method_encrypted": "encrypted_auth",
      "auth_nonce": "nonce",
      "auth_key_salt": "salt",
      "client_ver": 2
    }
  ],
  "deleted_session_ids": ["uuid-to-delete"]
}
```

**响应 - 无冲突**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "updated_session_ids": ["uuid-local-1", "uuid-1234"],
    "deleted_session_ids": ["uuid-to-delete"],
    "server_versions": {
      "uuid-local-1": 1,
      "uuid-1234": 4
    },
    "conflicts": [],
    "last_sync_at": 1708153600000
  }
}
```

**响应 - 有冲突**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "updated_session_ids": ["uuid-local-1"],
    "deleted_session_ids": [],
    "server_versions": {
      "uuid-local-1": 1
    },
    "conflicts": [
      {
        "id": "uuid-1234",
        "entity_type": "ssh_session",
        "client_ver": 2,
        "server_ver": 5,
        "client_data": {
          "id": "uuid-1234",
          "name": "生产服务器（已修改）"
        },
        "server_data": {
          "id": "uuid-1234",
          "name": "生产服务器（服务器版本）",
          "serverVer": 5
        },
        "message": "Conflict: client version 2 < server version 5"
      }
    ],
    "last_sync_at": 1708153600000
  }
}
```

---

### 3. Resolve Conflict - 解决冲突

**请求**：
```http
POST {{base_url}}/api/sync/resolve-conflict
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**请求体 - 保留服务器版本**：
```json
{
  "conflict_id": "uuid-1234",
  "strategy": "KeepServer"
}
```

**请求体 - 保留本地版本**：
```json
{
  "conflict_id": "uuid-1234",
  "strategy": "KeepLocal",
  "client_data": {
    "id": "uuid-1234",
    "name": "生产服务器（本地版本）",
    "host": "192.168.1.100",
    "port": 22,
    "username": "root"
  }
}
```

**请求体 - 保留两个版本**：
```json
{
  "conflict_id": "uuid-1234",
  "strategy": "KeepBoth"
}
```

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "conflict_id": "uuid-1234",
    "resolved": true,
    "new_id": "uuid-1234-conflict-abc123",
    "message": "Created a copy with conflict resolution"
  }
}
```

---

## 🎯 测试场景

### 场景 1：完整的同步流程

```bash
# 1. 注册新用户
POST /auth/register

# 2. 登录获取 token
POST /auth/login
# 保存 access_token 和 refresh_token 到环境变量

# 3. 创建 SSH 会话
POST /api/ssh/sessions
# 保存返回的 session_id

# 4. 拉取数据（验证同步）
POST /api/sync/pull
# 检查返回的 ssh_sessions 包含刚创建的会话

# 5. 更新会话
PUT /api/ssh/sessions/{{session_id}}

# 6. 再次拉取（验证 server_ver 递增）
POST /api/sync/pull
# 检查 server_ver 已增加

# 7. 删除会话
DELETE /api/ssh/sessions/{{session_id}}

# 8. 推送删除（同步到服务器）
POST /api/sync/push
# deleted_session_ids 包含删除的会话 ID
```

---

### 场景 2：冲突检测和解决

```bash
# 设备 A
POST /api/ssh/sessions  # 创建会话，server_ver = 1
PUT /api/ssh/sessions/{{session_id}}  # 更新，server_ver = 2

# 设备 B（模拟旧版本客户端）
POST /api/sync/pull  # 拉取 server_ver = 2
# 修改本地但不推送

# 设备 A（再次更新）
PUT /api/ssh/sessions/{{session_id}}  # server_ver = 3

# 设备 B（推送旧版本，触发冲突）
POST /api/sync/push
# client_ver = 2, server_ver = 3
# 返回 conflicts

# 解决冲突
POST /api/sync/resolve-conflict
# 选择策略：KeepServer / KeepLocal / KeepBoth
```

---

### 场景 3：Token 过期和刷新

```bash
# 1. 使用过期的 access_token
GET /api/user/profile
Authorization: Bearer <expired_token>
# 返回 401 Unauthorized

# 2. 刷新 token
POST /auth/refresh
{
  "refresh_token": "{{refresh_token}}"
}
# 获取新的 access_token

# 3. 重新请求
GET /api/user/profile
Authorization: Bearer {{new_access_token}}
# 返回 200 OK
```

---

## 📦 Postman 集合

### 导入集合

创建以下 Postman 集合并导入：

**集合结构**：
```
SSH Terminal Sync API
├── 📁 Auth（认证）
│   ├── Register
│   ├── Login
│   └── Refresh Token
├── 📁 User Profile（用户资料）
│   ├── Get Profile
│   ├── Update Profile
│   └── Delete Profile
├── 📁 SSH Sessions（SSH 会话）
│   ├── Get All Sessions
│   ├── Get Session
│   ├── Create Session
│   ├── Update Session
│   └── Delete Session
└── 📁 Sync（同步）
    ├── Pull
    ├── Push
    └── Resolve Conflict
```

### Collection JSON

将以下 JSON 保存为 `SSH_Terminal_API.postman_collection.json` 并导入 Postman：

```json
{
  "info": {
    "name": "SSH Terminal Sync API",
    "description": "SSH Terminal 云端同步 API 测试集合",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "access_token",
      "value": "",
      "type": "string"
    },
    {
      "key": "refresh_token",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [],
            "url": {
              "raw": "{{base_url}}/auth/register",
              "host": ["{{base_url}}"],
              "path": ["auth", "register"]
            },
            "description": "注册新用户"
          },
          "response": []
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            },
            "description": "用户登录"
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "const jsonData = pm.response.json();",
                  "pm.environment.set(\"access_token\", jsonData.data.access_token);",
                  "pm.environment.set(\"refresh_token\", jsonData.data.refresh_token);"
                ],
                "type": "text/javascript"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## ⚠️ 注意事项

### 1. 认证要求

所有 `/api/*` 路由都需要 JWT 认证，在 Headers 中添加：
```
Authorization: Bearer {{access_token}}
```

### 2. Token 有效期

- **Access Token**: 15 分钟
- **Refresh Token**: 7 天

Token 过期后返回 `401 Unauthorized`，需要刷新 token。

### 3. 数据格式

- 请求格式：`application/json`
- 响应格式：`application/json`

### 4. 错误处理

错误响应格式：
```json
{
  "code": 400,
  "message": "error message",
  "data": null
}
```

常见错误码：
- `400` - 请求参数错误
- `401` - 未授权或 token 过期
- `404` - 资源不存在
- `500` - 服务器内部错误

### 5. 时间戳格式

所有时间戳使用 ISO 8601 格式（UTC 时区）：
```
2025-02-17T12:45:30
```

---

## 📝 测试检查清单

### 基础功能测试
- [ ] 用户注册成功
- [ ] 用户登录成功，token 保存到环境变量
- [ ] Access Token 过期能够成功刷新
- [ ] 用户资料 CRUD 操作正常
- [ ] SSH 会话 CRUD 操作正常

### 同步功能测试
- [ ] Pull 能获取最新的 server_ver 和 updated_at
- [ ] Push 能正确递增 server_ver
- [ ] 冲突检测能识别 client_ver < server_ver
- [ ] 冲突解决的三种策略都能正常工作
- [ ] 软删除的会话 ID 能正确同步

### 边界条件测试
- [ ] 空数据 Pull（首次同步）
- [ ] 批量创建会话 Push
- [ ] 删除不存在的资源（返回 404）
- [ ] 重复刷新 token（返回旧的 refresh_token）
- [ ] 无效的冲突 ID

---

## 🔗 相关文档

- [API 路由设计](../api/README.md)
- [数据库结构](../sql/README.md)
- [同步协议说明](../sync-protocol.md)
