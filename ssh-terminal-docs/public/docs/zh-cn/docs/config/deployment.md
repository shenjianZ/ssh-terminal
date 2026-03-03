# 部署指南

本文档介绍如何部署 SSH Terminal 后端服务器、Web前端、文档网站。

---

## Docker-compose-部署

### 快速部署

使用 Docker Compose 快速部署：

> 这会部署后端服务器（未开启邮箱验证）、Web前端、文档网站 共计三个服务
```bash
# 下载 Docker compose 文件
curl -o docker-compose.yml https://raw.githubusercontent.com/shenjianZ/ssh-terminal/master/docker-compose.yml

# 启动服务
docker-compose up -d
```


### Docker Compose 文件配置解析

> 你可以参考 [环境变量](/docs/config/env) ，了解相关参数

1. 如果不想要部署 “SSH Terminal Docs (React 文档站点)” ，在docker compose文件中去除
    
    ``` yaml
    # SSH Terminal Docs (React 文档站点)
    ssh-terminal-docs:
        image: registry.cn-hangzhou.aliyuncs.com/pull-image/ssh-terminal-docs:latest
        container_name: ssh-terminal-docs
        ports:
            - "7215:80"
        networks:
            - ssh-terminal-network
    ```
2. 如果需要需要使用mysql、PostgreSQL，那么你需要使用`DATABASE__TYPE`、`DATABASE__HOST`、`DATABASE__PORT`、`DATABASE__USER`、`DATABASE__PASSWORD`、`DATABASE__DATABASE`
3. 如果需要启用邮箱验证功能，那么你需要使用`EMAIL__ENABLED`、`EMAIL__SMTP_HOST`、`EMAIL__SMTP_PORT`、`EMAIL__SMTP_USERNAME`、`EMAIL__SMTP_PASSWORD`、`EMAIL__FROM_NAME`、`EMAIL__FROM_EMAIL`


### 相关命令

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 查看服务状态
docker-compose ps

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```


### 健康检查
```bash
# 检查 API
curl http://localhost:8080/health

```

---

**部署成功后，你的 SSH Terminal 服务器、Web前端、文档网站就可以正常运行了！** 🚀
