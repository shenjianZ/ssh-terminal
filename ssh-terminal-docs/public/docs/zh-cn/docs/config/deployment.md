# 部署指南

本文档介绍如何部署 SSH Terminal 后端服务器。

---

## 📚 目录

1. [服务器要求](#服务器要求)
2. [Docker 部署](#docker-部署)
3. [手动部署](#手动部署)
4. [反向代理配置](#反向代理配置)
5. [监控和日志](#监控和日志)
6. [备份和恢复](#备份和恢复)

---

## 服务器要求

### 最低要求

- **CPU**: 2 核
- **内存**: 2GB RAM
- **存储**: 20GB SSD
- **操作系统**: Ubuntu 20.04+, CentOS 8+, Debian 11+

### 推荐配置

- **CPU**: 4 核
- **内存**: 4GB RAM
- **存储**: 50GB SSD
- **操作系统**: Ubuntu 22.04 LTS

### 软件要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Nginx**: 1.18+（可选）
- **Redis**: 6.0+

---

## Docker 部署

### 快速部署

使用 Docker Compose 快速部署：

```bash
# 克隆仓库
git clone https://github.com/shenjianZ/ssh-terminal-server.git
cd ssh-terminal-server

# 复制环境配置
cp .env.example .env

# 编辑配置
nano .env

# 启动服务
docker-compose up -d
```


### Docker Compose 配置

`docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    image: shenjianz/ssh-terminal-server:latest
    container_name: ssh-terminal-server
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/data
      - ./logs:/logs
    depends_on:
      - redis
      - db
    networks:
      - ssh-terminal

  redis:
    image: redis:7-alpine
    container_name: ssh-terminal-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - ssh-terminal

  db:
    image: postgres:15-alpine
    container_name: ssh-terminal-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - ssh-terminal

  nginx:
    image: nginx:alpine
    container_name: ssh-terminal-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - ssh-terminal

volumes:
  redis-data:
  db-data:

networks:
  ssh-terminal:
    driver: bridge
```

### 启动服务

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

---

## 手动部署

### 安装依赖

#### Ubuntu/Debian

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 安装 Redis
sudo apt install redis-server -y

# 安装 Nginx
sudo apt install nginx -y
```

#### CentOS/RHEL

```bash
# 更新系统
sudo yum update -y

# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 安装 PostgreSQL
sudo yum install postgresql-server postgresql-contrib -y

# 安装 Redis
sudo yum install redis -y

# 安装 Nginx
sudo yum install nginx -y
```

### 构建应用

```bash
# 克隆仓库
git clone https://github.com/shenjianZ/ssh-terminal-server.git
cd ssh-terminal-server

# 复制配置
cp .env.example .env

# 编辑配置
nano .env

# 构建应用
cargo build --release

# 运行应用
./target/release/ssh-terminal-server
```

### 配置 systemd 服务

创建 systemd 服务文件：

```bash
sudo nano /etc/systemd/system/ssh-terminal.service
```

内容：

```ini
[Unit]
Description=SSH Terminal Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=ssh-terminal
WorkingDirectory=/opt/ssh-terminal
Environment="RUST_LOG=info"
ExecStart=/opt/ssh-terminal/ssh-terminal-server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
# 创建用户
sudo useradd -r -s /bin/false ssh-terminal

# 创建目录
sudo mkdir -p /opt/ssh-terminal
sudo chown ssh-terminal:ssh-terminal /opt/ssh-terminal

# 复制文件
sudo cp target/release/ssh-terminal-server /opt/ssh-terminal/
sudo cp .env /opt/ssh-terminal/

# 设置权限
sudo chown -R ssh-terminal:ssh-terminal /opt/ssh-terminal

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable ssh-terminal
sudo systemctl start ssh-terminal

# 查看状态
sudo systemctl status ssh-terminal
```

---

## 反向代理配置

### Nginx 配置

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/ssh-terminal
```

内容：

```nginx
upstream ssh-terminal {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    server_name ssh-terminal.example.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ssh-terminal.example.com;

    # SSL 证书
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 日志
    access_log /var/log/nginx/ssh-terminal-access.log;
    error_log /var/log/nginx/ssh-terminal-error.log;

    # 代理配置
    location / {
        proxy_pass http://ssh-terminal;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://ssh-terminal;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/ssh-terminal /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### SSL 证书

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d ssh-terminal.example.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 监控和日志

### 日志管理

查看应用日志：

```bash
# Docker 部署
docker-compose logs -f app

# Systemd 部署
sudo journalctl -u ssh-terminal -f

# 日志文件
tail -f /opt/ssh-terminal/logs/app.log
```

### 监控指标

使用 Prometheus + Grafana 监控：

```yaml
# docker-compose.yml 添加
prometheus:
  image: prom/prometheus:latest
  container_name: ssh-terminal-prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
  networks:
    - ssh-terminal

grafana:
  image: grafana/grafana:latest
  container_name: ssh-terminal-grafana
  ports:
    - "3000:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
  volumes:
    - grafana-data:/var/lib/grafana
  networks:
    - ssh-terminal
```

Prometheus 配置：

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ssh-terminal'
    static_configs:
      - targets: ['app:8080']
```

### 健康检查

配置健康检查：

```bash
# 检查 API
curl http://localhost:8080/health

# 检查数据库
curl http://localhost:8080/health/db

# 检查 Redis
curl http://localhost:8080/health/redis
```

---

## 备份和恢复

### 数据库备份

```bash
# 备份 SQLite
cp /opt/ssh-terminal/data/app.db /backup/app.db.$(date +%Y%m%d)

# 备份 PostgreSQL
pg_dump -U user ssh_terminal > backup.sql

# 自动备份脚本
#!/bin/bash
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U user ssh_terminal > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### Redis 备份

```bash
# 手动备份
redis-cli BGSAVE

# 备份 RDB 文件
cp /var/lib/redis/dump.rdb /backup/dump.rdb.$(date +%Y%m%d)
```

### 恢复数据

```bash
# 恢复 SQLite
cp /backup/app.db.20240228 /opt/ssh-terminal/data/app.db

# 恢复 PostgreSQL
psql -U user ssh_terminal < backup.sql

# 恢复 Redis
cp /backup/dump.rdb.20240228 /var/lib/redis/dump.rdb
systemctl restart redis
```

---

## 🎯 总结

通过本指南，你已经学会了：

- ✅ 使用 Docker 部署
- ✅ 手动部署应用
- ✅ 配置反向代理
- ✅ 设置监控和日志
- ✅ 备份和恢复数据

### 生产环境检查清单

- [ ] 使用强密码和 JWT Secret
- [ ] 启用 HTTPS
- [ ] 配置防火墙
- [ ] 设置自动备份
- [ ] 配置监控告警
- [ ] 定期更新依赖
- [ ] 测试灾难恢复

### 安全建议

- 使用防火墙限制访问
- 定期更新系统和依赖
- 使用强密码和密钥
- 启用日志审计
- 配置入侵检测

---

**部署成功后，你的 SSH Terminal 服务器就可以正常运行了！** 🚀
