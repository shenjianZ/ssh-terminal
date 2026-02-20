# 项目结构详解

本文档详细说明 SSH Terminal Server 的项目结构、DDD 分层架构和各层职责。

## 目录

- [DDD 分层架构](#ddd-分层架构)
- [项目目录结构](#项目目录结构)
- [各层职责说明](#各层职责说明)
- [数据流转](#数据流转)
- [核心组件](#核心组件)

---

## DDD 分层架构

本系统采用**领域驱动设计（DDD）**的分层架构，将代码划分为不同的职责层次。

```
┌─────────────────────────────────────────┐
│      Interface Layer (handlers)        │  HTTP 处理器层
│      路由定义、请求处理、响应封装      │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│     Application Layer (services)     │  业务逻辑层
│     业务逻辑、Token 生成、认证        │
└──────────────┬───────────────────────┘
               │
       ┌───────┴────────┐
       │                 │
┌──────▼──────┐  ┌─────▼──────────┐
│   Domain    │  │  Infrastructure│
│   Layer     │  │  Layer         │
│             │  │                │
│ - DTO       │  │ - Middleware   │
│ - Entities  │  │ - Redis       │
│ - VO        │  │ - Repositories│
└─────────────┘  └────────────────┘
```

### 分层优势

| 优势 | 说明 |
|------|------|
| 职责清晰 | 每层只关注自己的职责，降低耦合 |
| 易于测试 | 每层可独立测试，Mock 依赖 |
| 易于维护 | 修改某层不影响其他层 |
| 易于扩展 | 添加新功能只需扩展相应层 |

---

## 项目目录结构

```
ssh-terminal-server/
├── src/                          # 源代码目录
│   ├── main.rs                   # 应用入口
│   ├── cli.rs                   # 命令行参数解析
│   ├── config.rs                # 配置模块导出
│   ├── db.rs                   # 数据库连接池
│   ├── error.rs                # 错误处理
│   │
│   ├── config/                  # 配置模块
│   │   ├── app.rs             # 主配置结构
│   │   ├── auth.rs            # 认证配置
│   │   ├── database.rs        # 数据库配置
│   │   ├── redis.rs          # Redis 配置
│   │   └── server.rs         # 服务器配置
│   │
│   ├── domain/                  # 领域层（DDD）
│   │   ├── dto/               # 数据传输对象（Data Transfer Object）
│   │   │   └── auth.rs      # 认证相关 DTO
│   │   ├── entities/          # 实体（数据库模型）
│   │   │   └── users.rs     # 用户实体
│   │   └── vo/               # 视图对象（View Object）
│   │       └── auth.rs      # 认证相关 VO
│   │
│   ├── handlers/                # HTTP 处理器层（接口层）
│   │   ├── auth.rs           # 认证接口
│   │   └── health.rs        # 健康检查接口
│   │
│   ├── infra/                   # 基础设施层
│   │   ├── middleware/       # 中间件
│   │   │   ├── auth.rs     # JWT 认证中间件
│   │   │   └── logging.rs  # 日志中间件
│   │   └── redis/           # Redis 客户端封装
│   │       ├── redis_client.rs
│   │       └── redis_key.rs
│   │
│   ├── repositories/            # 数据访问层
│   │   └── user_repository.rs  # 用户数据访问
│   │
│   ├── services/                # 业务逻辑层
│   │   └── auth_service.rs   # 认证业务逻辑
│   │
│   └── utils/                   # 工具函数
│       └── jwt.rs            # JWT 工具类
│
├── config/                      # 配置文件目录
│   ├── default.toml           # 默认配置
│   ├── development.toml       # 开发环境配置（支持 MySQL/PostgreSQL/SQLite）
│   └── production.toml        # 生产环境配置
│
├── sql/                         # SQL 脚本
│   └── init.sql               # 数据库初始化脚本
│
├── tests/                      # 测试目录
│   └── integration_test.rs   # 集成测试
│
├── docs/                       # 文档目录
│   ├── README.md
│   ├── api/
│   ├── development/
│   └── deployment/
│
├── .env.example               # 环境变量参考（仅用于 Docker/Kubernetes 等部署场景)
├── .gitignore               # Git 忽略文件
├── Cargo.toml               # 项目依赖定义
├── README.md                # 项目说明
└── rust-toolchain.toml      # Rust 工具链配置
```

---

## 各层职责说明

### 1. 接口层（handlers/）

**职责**：处理 HTTP 请求和响应

**位置**：`src/handlers/`

**关键文件**：
- `auth.rs`：认证相关接口（注册、登录、刷新 Token、删除账号）
- `health.rs`：健康检查和服务器信息接口

**示例**：
```rust
// src/handlers/auth.rs

pub async fn register(
    Extension(request_id): Extension<RequestId>,
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<ApiResponse<RegisterResult>>, ErrorResponse> {
    // 1. 记录日志
    log_info(&request_id, "注册请求参数", &payload);

    // 2. 调用服务层处理业务逻辑
    let user_repo = UserRepository::new(state.pool.clone());
    let service = AuthService::new(user_repo, state.redis_client.clone(), state.config.auth.clone());

    // 3. 调用业务逻辑
    match service.register(payload).await {
        Ok((user_model, access_token, refresh_token)) => {
            let data = RegisterResult::from((user_model, access_token, refresh_token));
            let response = ApiResponse::success(data);
            log_info(&request_id, "注册成功", &response);
            Ok(Json(response))
        }
        Err(e) => {
            log_info(&request_id, "注册失败", &e.to_string());
            Err(ErrorResponse::new(e.to_string()))
        }
    }
}
```

**职责边界**：
- ✅ 接收 HTTP 请求
- ✅ 提取请求参数
- ✅ 调用服务层处理业务逻辑
- ✅ 封装响应数据
- ❌ 不包含业务逻辑
- ❌ 不直接访问数据库

### 2. 业务逻辑层（services/）

**职责**：实现核心业务逻辑

**位置**：`src/services/`

**关键文件**：
- `auth_service.rs`：认证业务逻辑（注册、登录、Token 刷新、密码哈希）

**示例**：
```rust
// src/services/auth_service.rs

pub struct AuthService {
    user_repo: UserRepository,
    redis_client: RedisClient,
    auth_config: AuthConfig,
}

impl AuthService {
    /// 用户注册
    pub async fn register(&self, payload: RegisterRequest) -> Result<(Model, String, String)> {
        // 1. 验证邮箱格式
        if !payload.email.contains('@') {
            return Err(anyhow!("邮箱格式错误"));
        }

        // 2. 生成唯一用户 ID
        let user_id = self.generate_unique_user_id().await?;

        // 3. 哈希密码
        let password_hash = self.hash_password(&payload.password)?;

        // 4. 创建用户实体
        let user_model = users::Model {
            id: user_id,
            email: payload.email.clone(),
            password_hash,
            created_at: chrono::Utc::now().naive_utc(),
            updated_at: chrono::Utc::now().naive_utc(),
        };

        // 5. 保存到数据库
        let created_user = self.user_repo.create(user_model).await?;

        // 6. 生成 Token
        let (access_token, refresh_token) = TokenService::generate_token_pair(
            &created_user.id,
            self.auth_config.access_token_expiration_minutes,
            self.auth_config.refresh_token_expiration_days,
            &self.auth_config.jwt_secret,
        )?;

        // 7. 保存 Refresh Token 到 Redis
        self.save_refresh_token(&created_user.id, &refresh_token, self.auth_config.refresh_token_expiration_days).await?;

        Ok((created_user, access_token, refresh_token))
    }
}
```

**职责边界**：
- ✅ 实现业务逻辑
- ✅ 协调 Repository 和基础设施
- ✅ 事务管理
- ❌ 不处理 HTTP 请求/响应
- ❌ 不直接访问外部资源（通过 Repository）

### 3. 数据访问层（repositories/）

**职责**：封装数据库访问逻辑

**位置**：`src/repositories/`

**关键文件**：
- `user_repository.rs`：用户数据访问（增删改查）

**示例**：
```rust
// src/repositories/user_repository.rs

pub struct UserRepository {
    pool: DbPool,
}

impl UserRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    /// 创建用户
    pub async fn create(&self, user_model: users::Model) -> Result<users::Model> {
        let result = users::Entity::insert(user_model.into_active_model())
            .exec(&self.pool)
            .await
            .map_err(|e| anyhow!("创建用户失败: {}", e))?;

        Ok(users::Entity::find_by_id(result.last_insert_id))
            .one(&self.pool)
            .await
            .map_err(|e| anyhow!("查询用户失败: {}", e))?
            .ok_or_else(|| anyhow!("用户不存在"))
    }

    /// 根据邮箱查询用户
    pub async fn find_by_email(&self, email: &str) -> Result<Option<users::Model>> {
        Ok(users::Entity::find()
            .filter(users::Column::Email.eq(email))
            .one(&self.pool)
            .await?)
    }

    /// 根据ID查询用户
    pub async fn find_by_id(&self, id: &str) -> Result<Option<users::Model>> {
        Ok(users::Entity::find_by_id(id.to_string())
            .one(&self.pool)
            .await?)
    }

    /// 统计相同ID的用户数量
    pub async fn count_by_id(&self, id: &str) -> Result<u64> {
        Ok(users::Entity::find_by_id(id.to_string())
            .count(&self.pool)
            .await?)
    }
}
```

**职责边界**：
- ✅ 数据库 CRUD 操作
- ✅ 封装 SeaORM 细节
- ❌ 不包含业务逻辑
- ❌ 不处理 HTTP 请求

### 4. 领域层（domain/）

**职责**：定义核心业务模型

**位置**：`src/domain/`

#### DTO（Data Transfer Object）

**职责**：定义 API 请求和响应的数据结构

**位置**：`src/domain/dto/`

**示例**：
```rust
// src/domain/dto/auth.rs

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}
```

#### Entities（实体）

**职责**：定义数据库表模型

**位置**：`src/domain/entities/`

**示例**：
```rust
// src/domain/entities/users.rs

use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,
    #[sea_orm(column_type = "Text", unique)]
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}
```

#### VO（View Object）

**职责**：定义 API 响应的数据结构

**位置**：`src/domain/vo/`

**示例**：
```rust
// src/domain/vo/auth.rs

#[derive(Debug, Serialize)]
pub struct RegisterResult {
    pub email: String,
    pub created_at: String,
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResult {
    pub id: String,
    pub email: String,
    pub created_at: String,
    pub access_token: String,
    pub refresh_token: String,
}
```

### 5. 基础设施层（infra/）

**职责**：提供技术基础设施

**位置**：`src/infra/`

#### 中间件（middleware/）

**职责**：请求拦截和处理

**位置**：`src/infra/middleware/`

**关键文件**：
- `auth.rs`：JWT 认证中间件
- `logging.rs`：日志中间件

**示例**：
```rust
// src/infra/middleware/auth.rs

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, ErrorResponse> {
    // 1. 提取 Authorization header
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| ErrorResponse::new("缺少 Authorization header".to_string()))?;

    // 2. 验证 Bearer 格式
    if !auth_header.starts_with("Bearer ") {
        return Err(ErrorResponse::new("Authorization header 格式错误".to_string()));
    }

    let token = &auth_header[7..];

    // 3. 验证 JWT
    let claims = TokenService::decode_user_id(token, &state.config.auth.jwt_secret)?;

    // 4. 将 user_id 添加到请求扩展
    request.extensions_mut().insert(claims.sub);

    // 5. 继续处理请求
    Ok(next.run(request).await)
}
```

#### Redis 客户端（redis/）

**职责**：封装 Redis 操作

**位置**：`src/infra/redis/`

**关键文件**：
- `redis_client.rs`：Redis 客户端封装
- `redis_key.rs`：Redis Key 命名规范

### 6. 工具层（utils/）

**职责**：提供通用工具函数

**位置**：`src/utils/`

**关键文件**：
- `jwt.rs`：JWT Token 生成和验证

**示例**：
```rust
// src/utils/jwt.rs

pub struct TokenService;

impl TokenService {
    /// 生成 Access Token
    pub fn generate_access_token(
        user_id: &str,
        expiration_minutes: u64,
        jwt_secret: &str,
    ) -> Result<String> {
        // ... 生成 JWT Token
    }

    /// 验证 Token 并提取 user_id
    pub fn decode_user_id(token: &str, jwt_secret: &str) -> Result<String> {
        // ... 验证并解码 JWT Token
    }
}
```

---

## 数据流转

### 用户注册流程

```
1. 客户端发起 POST /auth/register 请求
   ↓
2. handlers/auth.rs::register() 接收请求
   - 提取请求参数（RegisterRequest）
   ↓
3. services/auth_service.rs::register() 处理业务逻辑
   - 验证邮箱格式
   - 生成唯一用户 ID
   - 哈希密码
   - 创建用户实体
   ↓
4. repositories/user_repository.rs::create() 保存到数据库
   - 使用 SeaORM 插入数据
   ↓
5. services/auth_service.rs 生成 Token
   - 生成 Access Token
   - 生成 Refresh Token
   ↓
6. Redis 保存 Refresh Token
   ↓
7. handlers/auth.rs 封装响应（RegisterResult）
   ↓
8. 返回 JSON 响应给客户端
```

### 访问受保护接口流程

```
1. 客户端发起 POST /auth/delete 请求
   - 携带 Authorization: Bearer <access_token>
   ↓
2. infra/middleware/auth.rs::auth_middleware() 拦截
   - 验证 Token 格式
   - 验证 JWT 签名
   - 检查 Token 过期时间
   - 提取 user_id 并添加到请求扩展
   ↓
3. handlers/auth.rs::delete_account() 接收请求
   - 从扩展中提取 user_id
   ↓
4. services/auth_service.rs::delete_account() 处理业务逻辑
   - 验证密码
   - 调用 Repository 删除用户
   ↓
5. repositories/user_repository.rs::delete() 删除数据库记录
   ↓
6. 返回响应
```

---

## 核心组件

### AppState

**职责**：应用全局状态

**位置**：`src/main.rs`

```rust
#[derive(Clone)]
pub struct AppState {
    pub pool: db::DbPool,                        // 数据库连接池
    pub config: config::app::AppConfig,          // 应用配置
    pub redis_client: infra::redis::redis_client::RedisClient,  // Redis 客户端
}
```

**用途**：
- 通过 Axum State 机制注入到所有处理器
- 提供数据库访问
- 提供配置信息
- 提供 Redis 访问

### 路由配置

**位置**：`src/main.rs`

```rust
// 公开路由
let public_routes = Router::new()
    .route("/health", get(handlers::health::health_check))
    .route("/info", get(handlers::health::server_info))
    .route("/auth/register", post(handlers::auth::register))
    .route("/auth/login", post(handlers::auth::login))
    .route("/auth/refresh", post(handlers::auth::refresh));

// 受保护路由
let protected_routes = Router::new()
    .route("/auth/delete", post(handlers::auth::delete_account))
    .route("//auth/delete-refresh-token", post(handlers::auth::delete_refresh_token))
    .route_layer(axum::middleware::from_fn_with_state(
        app_state.clone(),
        infra::middleware::auth::auth_middleware,
    ));

// 合并所有路由
let app = public_routes
    .merge(protected_routes)
    .layer(
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any),
    )
    .layer(axum::middleware::from_fn(
        infra::middleware::logging::logging_middleware,
    ));
```

---

## 相关文档

- [DDD 架构规范](ddd-architecture.md) - DDD 设计原则和最佳实践
- [代码风格规范](code-style.md) - Rust 代码风格和命名规范
- [快速开始指南](getting-started.md) - 安装和运行项目

---

**提示**：遵循 DDD 分层架构可以提高代码质量和可维护性。
