# SSH Terminal 云端同步 - 数据库自动化初始化

## ✨ 完全自动化

**服务器启动时会自动创建所有数据库对象，无需手动执行任何 SQL 脚本！**

## 📁 SQL 文件说明

项目包含 **3个SQL文件**（每个数据库一个）：

```
docs/sql/
├── mysql.sql      # MySQL: 索引
├── postgres.sql   # PostgreSQL: 索引
└── sqlite.sql     # SQLite: 索引
```

### ⚠️ 重要：统一业务逻辑

为了确保三种数据库的**业务一致性**，所有数据库都采用**统一的实现方式**：

| 功能 | 实现层 | 说明 |
|------|--------|------|
| `server_ver` 递增 | **应用层（Repository）** | 三种数据库统一，避免重复递增 |
| `updated_at` 更新 | **应用层（Repository）** | 三种数据库统一，保证一致性 |

这样保证了：
- ✅ 业务逻辑完全一致（Repository 代码只有一套）
- ✅ 版本控制准确（不会重复递增）
- ✅ 时间戳准确统一（应用层统一管理）

## 🚀 快速开始

### 1. 配置数据库连接

编辑 `config/development.toml` 文件（开发环境）或 `config/production.toml`（生产环境）：

**MySQL 配置**:
```toml
[database]
database_type = "mysql"
host = "localhost"
port = 3306
user = "your_username"
password = "your_password"
database = "ssh_terminal"
max_connections = 10
```

**PostgreSQL 配置**:
```toml
[database]
database_type = "postgresql"
host = "localhost"
port = 5432
user = "your_username"
password = "your_password"
database = "ssh_terminal"
max_connections = 10
```

**SQLite 配置**:
```toml
[database]
database_type = "sqlite"
path = "data/ssh_terminal.db"
max_connections = 1
```

### 2. 启动服务器

```bash
# 使用配置文件启动
cargo run -- --config config/development.toml

# 或直接使用默认配置文件
cargo run
```

### 3. 查看日志

```
✅ 已连接到数据库
检查数据库表结构...
✅ 用户表检查完成
✅ 用户资料表检查完成
✅ SSH会话表检查完成
✅ 数据库表结构检查完成
检查数据库索引、触发器和函数...
✅ 数据库对象（索引、触发器、函数）检查完成
```

**就这么简单！所有数据库对象都已自动创建完成。**

## 📊 自动创建的内容

### MySQL (mysql.sql)
- ✅ 3个表（通过 SeaORM 创建）
- ✅ 6个索引
- ✅ `ON UPDATE CURRENT_TIMESTAMP` 自动更新 `updated_at`（表定义）

### PostgreSQL (postgres.sql)
- ✅ 3个表（通过 SeaORM 创建）
- ✅ 6个索引
- ✅ 2个函数（仅自动更新 `updated_at`）
- ✅ 2个触发器

### SQLite (sqlite.sql)
- ✅ 3个表（通过 SeaORM 创建）
- ✅ 6个索引
- ✅ 2个触发器（仅自动更新 `updated_at`）

### 🎯 关键设计决策

**为什么三种数据库的 SQL 不一样？**

1. **MySQL 的 `server_ver` 递增在应用层**
   - MySQL 有 `ON UPDATE CURRENT_TIMESTAMP` 原生支持
   - 触发器不需要处理任何递增逻辑

2. **PostgreSQL/SQLite 的 `server_ver` 也递增在应用层**
   - **移除了触发器中的递增逻辑**（避免重复递增）
   - 触发器只负责自动更新 `updated_at`
   - **业务层完全一致**：Repository 中统一处理 `server_ver + 1`

3. **统一的好处**
   - ✅ 一套 Repository 代码支持三种数据库
   - ✅ `server_ver` 递增逻辑完全一致
   - ✅ 不会出现重复递增的 Bug
   - ✅ 业务逻辑可预测、可维护

## 🗑️ 清理旧文件（可选）

以下文件可以安全删除，因为功能已集成到自动化初始化中：

```bash
# 不再需要这些文件
rm docs/sql/init.sql
rm docs/sql/init_postgres.sql
rm docs/sql/init_sqlite.sql
rm docs/sql/migration_v2.sql
```

## ⚙️ 配置文件说明

项目使用 **TOML 配置文件**（不是 `.env`）：

- `config/development.toml` - 开发环境配置
- `config/production.toml` - 生产环境配置

### 配置文件结构

```toml
[server]
host = "0.0.0.0"
port = 3000

[database]
database_type = "sqlite"  # mysql, postgresql, sqlite
path = "data/app.db"      # SQLite 路径
max_connections = 10

[auth]
jwt_secret = "your-secret-key"
access_token_expiration_minutes = 15
refresh_token_expiration_days = 7

[redis]
host = "localhost"
port = 6379
password = ""
db = 0
```

### 命令行参数

```bash
# 指定配置文件
cargo run -- --config config/development.toml

# 指定环境（development/production）
cargo run -- --env development

# 查看所有选项
cargo run -- --help
```

## 🔧 手动执行 SQL（可选）

如果想手动执行 SQL 脚本：

```bash
# MySQL
mysql -u root -p < docs/sql/mysql.sql

# PostgreSQL
psql -U postgres -d ssh_terminal -f docs/sql/postgres.sql

# SQLite
sqlite3 data/ssh_terminal.db < docs/sql/sqlite.sql
```

## 📝 表结构

### users (用户表)
- id, email, password_hash
- last_device_id, last_sync_at
- created_at, updated_at

### user_profiles (用户资料表)
- id, user_id, username, phone, qq, wechat, bio
- avatar_data, avatar_mime_type
- server_ver, created_at, updated_at, deleted_at

### ssh_sessions (SSH会话表)
- id, user_id, name, host, port, username
- group_name, terminal_type, columns, rows
- auth_method_encrypted, auth_nonce, auth_key_salt
- server_ver, client_ver, last_synced_at
- created_at, updated_at, deleted_at

## ✅ 验证安装

启动服务器后，使用数据库客户端验证：

```sql
-- MySQL/PostgreSQL
SHOW TABLES;
\d user_profiles  -- PostgreSQL
DESC user_profiles;  -- MySQL

-- SQLite
.tables
.schema user_profiles
```

## 🎯 总结

**只需要3步：**
1. 配置 `config/development.toml` 中的 `[database]` 部分
2. 运行 `cargo run`
3. 完成！

所有数据库对象自动创建，零手动操作。

## 📝 注意事项

1. **首次启动**：服务器会自动创建数据库（如果需要）和所有表结构
2. **配置文件**：使用 TOML 格式，不支持 `.env` 文件
3. **SQLite 路径**：相对路径相对于项目根目录
4. **连接池**：SQLite 建议设置为 `max_connections = 1`
5. **数据持久化**：数据库文件保存在配置的路径中（SQLite）

## 🧪 API 测试

服务器启动后，可以使用 ApiPost 测试 API 接口：

### 快速开始

1. **导入 API 文档**：
   - 打开 ApiPost
   - 导入 → 文件导入 → 选择 `docs/api/openapi.yaml`
   - 设置基础URL：`http://localhost:3000`

2. **配置环境变量**：
   - 环境管理 → 新建环境
   - 添加变量：`base_url = http://localhost:3000`

3. **开始测试**：
   - 注册：`POST /api/auth/register`
   - 登录：`POST /api/auth/login`（获取Token）
   - 其他接口需要Bearer Token认证

### 详细文档

- **ApiPost 测试指南**：`docs/api/ApiPost_API_Testing_Guide.md`
- **OpenAPI 规范**：`docs/api/openapi.yaml`

### API 功能

- ✅ JWT认证（注册/登录/刷新Token）
- ✅ 用户资料管理（获取/更新/删除）
- ✅ SSH会话管理（CRUD操作）
- ✅ 云端同步（Pull/Push/冲突解决）
