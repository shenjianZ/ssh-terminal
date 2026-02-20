# SSH Terminal Server 文档中心

欢迎使用 SSH Terminal Server 文档！本项目提供了生产级的 SSH 终端服务器基础架构，采用 DDD 分层设计，包含完整的认证、数据库、缓存等功能。

## 快速导航

### 按角色查找文档

#### 前端开发者
- [API 接口概览](api/api-overview.md) - 快速了解所有可用的 API 接口
- [公开接口文档](api/endpoints/public.md) - 注册、登录等公开接口的详细说明
- [前端集成示例](api/examples/frontend-integration.md) - JavaScript/TypeScript/React/Vue 集成代码示例
- [认证机制详解](api/authentication.md) - JWT 认证流程和最佳实践

#### 后端开发者
- [快速开始指南](development/getting-started.md) - 安装、配置和运行项目
- [项目结构详解](development/project-structure.md) - DDD 分层架构说明
- [DDD 架构规范](development/ddd-architecture.md) - 各层设计原则和开发规范
- [代码风格规范](development/code-style.md) - Rust 代码风格和命名规范
- [Git 提交规范](development/git-workflow.md) - 提交信息规范和分支策略
- [测试规范](development/testing.md) - 单元测试和集成测试指南

#### 运维人员
- [环境变量配置](deployment/environment-variables.md) - 完整的环境变量列表和说明
- [配置文件详解](deployment/configuration.md) - 多环境配置文件组织
- [生产环境部署指南](deployment/production-guide.md) - 安全配置和部署最佳实践

## 文档结构

```
docs/
├── README.md                           # 本文档
├── api/                               # API 接口文档
│   ├── api-overview.md                # API 概览和快速参考
│   ├── authentication.md              # 认证机制详解
│   ├── endpoints/
│   │   ├── public.md                  # 公开接口
│   │   └── protected.md               # 需要认证的接口
│   └── examples/
│       └── frontend-integration.md    # 前端集成代码示例
├── development/                       # 开发指南
│   ├── getting-started.md             # 快速开始
│   ├── project-structure.md           # 项目结构详解
│   ├── ddd-architecture.md            # DDD 分层架构规范
│   ├── code-style.md                  # 代码风格和命名规范
│   ├── git-workflow.md                # Git 提交规范
│   └── testing.md                     # 测试规范
└── deployment/                        # 部署文档
    ├── environment-variables.md      # 环境变量配置说明
    ├── configuration.md               # 配置文件详解
    └── production-guide.md            # 生产环境部署指南
```

## 核心概念

### DDD 分层架构

本项目采用领域驱动设计（DDD）分层架构：

```
┌─────────────────────────────────────┐
│      Interface Layer (handlers)     │  HTTP 处理器层
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Application Layer (services)    │  业务逻辑层
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌─────▼──────────┐
│   Domain    │  │  Infrastructure│
│   Layer     │  │  Layer         │
└─────────────┘  └────────────────┘
```

### 双 Token 认证机制

- **Access Token**：15 分钟有效期，用于 API 请求认证
- **Refresh Token**：7 天有效期，存储在 Redis，用于获取新的 Access Token
- **Token 轮换**：每次刷新会生成新的 Refresh Token，旧 Token 自动失效

### 多数据库支持

支持 MySQL、PostgreSQL、SQLite 三种数据库，通过简单的环境变量配置即可切换。

## 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| Web 框架 | Axum | 0.7 |
| 异步运行时 | Tokio | 1.x |
| 数据库 ORM | SeaORM | 1.1 |
| 认证 | JWT | 9.x |
| 密码哈希 | Argon2 | 0.5 |
| 缓存 | Redis | 0.27 |
| 日志 | tracing | 0.1 |

## 快速链接

- [项目 README](../README.md) - 返回项目主页
- [API 接口文档](api/api-overview.md) - 完整的 API 接口说明
- [快速开始指南](development/getting-started.md) - 安装和配置指南
- [开发规范](development/ddd-architecture.md) - DDD 架构和代码规范
- [部署文档](deployment/configuration.md) - 配置和部署指南

## 获取帮助

如果您在阅读文档时有任何疑问，请：
1. 查看相关主题的详细文档
2. 检查 [常见问题](deployment/production-guide.md#常见问题)
3. 提交 Issue 到项目仓库

---

**提示**：建议按照"快速开始指南"→"API 接口文档"→"开发规范"的顺序阅读文档。
