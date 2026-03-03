# Deployment Guide

This document introduces how to deploy SSH Terminal backend server, Web frontend, and documentation website.

---

## Docker Compose Deployment

### Quick Deployment

Quick deployment using Docker Compose:

> This will deploy backend server (email verification not enabled), Web frontend, and documentation website - three services total

```bash
# Download Docker compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/shenjianZ/ssh-terminal/master/docker-compose.yml

# Start services
docker-compose up -d
```

### Docker Compose File Configuration Parsing

> You can refer to [Environment Variables](/docs/config/env) to understand related parameters

1. If you don't want to deploy "SSH Terminal Docs (React documentation site)", remove it from the docker compose file:

    ```yaml
    # SSH Terminal Docs (React documentation site)
    ssh-terminal-docs:
        image: registry.cn-hangzhou.aliyuncs.com/pull-image/ssh-terminal-docs:latest
        container_name: ssh-terminal-docs
        ports:
            - "7215:80"
        networks:
            - ssh-terminal-network
    ```

2. If you need to use MySQL or PostgreSQL, you need to use `DATABASE__TYPE`, `DATABASE__HOST`, `DATABASE__PORT`, `DATABASE__USER`, `DATABASE__PASSWORD`, `DATABASE__DATABASE`

3. If you need to enable email verification functionality, you need to use `EMAIL__ENABLED`, `EMAIL__SMTP_HOST`, `EMAIL__SMTP_PORT`, `EMAIL__SMTP_USERNAME`, `EMAIL__SMTP_PASSWORD`, `EMAIL__FROM_NAME`, `EMAIL__FROM_EMAIL`

### Related Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# View service status
docker-compose ps

# Stop services
docker-compose down

# Restart services
docker-compose restart
```

### Health Check

```bash
# Check API
curl http://localhost:8080/health
```

---

**After successful deployment, your SSH Terminal server, Web frontend, and documentation website can run normally!** 🚀