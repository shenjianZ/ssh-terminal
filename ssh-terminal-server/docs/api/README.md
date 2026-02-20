# SSH Terminal 云端同步 API 文档

本目录包含 SSH Terminal 云端同步系统的完整 API 文档。

## 📁 文件列表

### 1. OpenAPI 3.0 规范
**文件**：`openapi.yaml`

**描述**：标准 OpenAPI 3.3 规范文件，包含所有API接口的详细定义。

**支持导入工具**：
- ✅ ApiPost
- ✅ Postman
- ✅ Swagger UI
- ✅ Insomnia
- ✅ 其他支持 OpenAPI 的工具

**内容**：
- 认证接口（注册、登录、刷新Token）
- 用户资料接口（获取、更新、删除）
- SSH会话接口（CRUD操作）
- 同步接口（Pull、Push、冲突解决）
- 完整的请求/响应 Schema 定义

---

### 2. ApiPost 测试指南
**文件**：`ApiPost_API_Testing_Guide.md`

**描述**：使用 ApiPost 测试 API 的完整教程。

**内容**：
- ApiPost 安装和配置
- 如何导入 OpenAPI 文档
- 环境变量配置
- 自动 Token 管理脚本
- 每个接口的详细示例
- 测试场景（认证、会话管理、冲突解决）
- 错误处理说明

---

### 3. Postman 测试指南（已废弃）
**文件**：`Postman_API_Testing_Guide.md`
**文件**：`SSH_Terminal_API.postman_collection.json`

**说明**：这些文件已保留用于向后兼容，但推荐使用 OpenAPI 规范文件导入。

---

## 🚀 快速开始

### 方式一：使用 ApiPost（推荐）

1. **下载 ApiPost**：访问 [apipost.cn](https://www.apipost.cn/)

2. **启动服务器**：
   ```bash
   cd ssh-terminal-server
   cargo run
   ```

3. **导入 API 文档**：
   - 打开 ApiPost
   - 点击"导入" → "文件导入"
   - 选择 `openapi.yaml`
   - 设置基础URL：`http://localhost:3000`

4. **开始测试**：
   - 注册：`POST /api/auth/register`
   - 登录：`POST /api/auth/login`
   - 测试其他接口

### 方式二：使用 Postman

1. **导入 OpenAPI 文档**：
   - 打开 Postman
   - Import → 选择 `openapi.yaml`

2. **配置环境**：
   - 创建环境变量：`base_url = http://localhost:3000`
   - 设置自动Token保存脚本

3. **开始测试**（同上）

---

## 📚 API 功能概览

### 认证功能
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新Token

### 用户资料
- `GET /api/user/profile` - 获取用户资料
- `PUT /api/user/profile` - 更新用户资料
- `DELETE /api/user/profile` - 删除用户资料

### SSH会话管理
- `GET /api/ssh/sessions` - 获取会话列表（分页）
- `GET /api/ssh/sessions/:id` - 获取单个会话
- `POST /api/ssh/sessions` - 创建会话
- `PUT /api/ssh/sessions/:id` - 更新会话
- `DELETE /api/ssh/sessions/:id` - 删除会话

### 云端同步
- `POST /api/sync/pull` - 拉取服务器数据
- `POST /api/sync/push` - 推送本地更改
- `POST /api/sync/resolve-conflict` - 解决冲突

---

## 🔐 认证方式

所有接口（除认证接口外）都需要 JWT Bearer Token 认证：

```
Authorization: Bearer <access_token>
```

**获取 Token**：
1. 调用 `POST /api/auth/register` 或 `POST /api/auth/login`
2. 从响应中获取 `access_token`
3. 在请求头中添加 `Authorization: Bearer <access_token>`

**Token 有效期**：
- Access Token：15分钟
- Refresh Token：7天

---

## 🧪 测试场景

### 场景1：完整认证流程
1. 注册新用户 → 获取 Token
2. 使用 Token 访问受保护的接口
3. Token 过期后使用 Refresh Token 刷新

### 场景2：SSH会话管理
1. 创建 SSH 会话
2. 查询会话列表（分页）
3. 更新会话信息
4. 删除会话

### 场景3：冲突检测与解决
1. 设备A 创建会话（server_ver = 1）
2. 设备B 拉取并修改（server_ver = 2）
3. 设备A 修改旧版本并推送 → 冲突
4. 调用冲突解决接口

### 场景4：增量同步
1. 首次同步（`last_sync_at = null`）
2. 记录返回的 `last_sync_at`
3. 5分钟后增量同步

---

## 📖 详细文档

- **OpenAPI 规范**：`openapi.yaml`
- **ApiPost 测试指南**：`ApiPost_API_Testing_Guide.md`
- **数据库初始化**：`../sql/README.md`
- **项目主页**：`../../README.md`

---

## ⚠️ 注意事项

1. **加密数据**：SSH认证信息必须经过客户端加密后上传
2. **版本控制**：每次更新会自动递增 `server_ver`
3. **时间戳格式**：
   - 请求：Unix 时间戳（秒）
   - 响应：ISO 8601 格式
4. **分页参数**：`page` 从 1 开始，`page_size` 最大 100

---

**文档版本**：v1.0.0
**最后更新**：2026-02-17
