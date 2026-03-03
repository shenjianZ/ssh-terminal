# Environment Variables

SSH Terminal supports configuring application behavior through environment variables, including development environment, production environment, server deployment, and other scenarios.

## Table of Contents

- [Frontend Environment Variables](#frontend-environment-variables)
- [Backend Server Environment Variables](#backend-server-environment-variables)

---

## Frontend Environment Variables

> Note, this environment variable is only valid for development, cannot be used when deploying with Docker

`.env`

```config
# API Base URL
API_BASE_URL=https://api.yourdomain.com
```

---

## Backend Server Environment Variables

> Note, this environment variable is available for both development and Docker deployment. `ssh-terminal-server` uses environment variable injection for configuration parameters

### Environment Variable Description

| Variable Name | Description | Default Value |
|---------------|-------------|---------------|
| `SERVER__HOST` | Server listening address | `0.0.0.0` |
| `SERVER__PORT` | Server listening port | `3000` |
| `DATABASE__TYPE` | Database type | `sqlite` |
| `DATABASE__PATH` | Database file path (`sqlite`) | `/data/app.db` |
| `DATABASE__HOST` | Database host address (`mysql`, `PostgreSQL`) | - |
| `DATABASE__PORT` | Database port (`mysql`, `PostgreSQL`) | - |
| `DATABASE__USER` | Database user (`mysql`, `PostgreSQL`) | - |
| `DATABASE__PASSWORD` | Database password (`mysql`, `PostgreSQL`) | - |
| `DATABASE__DATABASE` | Database name (`mysql`, `PostgreSQL`) | - |
| `REDIS__HOST` | Redis host address | `localhost` |
| `REDIS__PORT` | Redis port | `6379` |
| `REDIS__PASSWORD` | Redis password | - |
| `AUTH__JWT_SECRET` | JWT signing key | - |
| `AUTH__ACCESS_TOKEN_EXPIRATION_MINUTES` | Access token expiration time (minutes) | `15` |
| `AUTH__REFRESH_TOKEN_EXPIRATION_DAYS` | Refresh token expiration time (days) | `7` |
| `EMAIL__ENABLED` | Whether to enable email functionality | `false` |
| `EMAIL__SMTP_HOST` | SMTP server address | - |
| `EMAIL__SMTP_PORT` | SMTP server port | - |
| `EMAIL__SMTP_USERNAME` | SMTP username | - |
| `EMAIL__SMTP_PASSWORD` | SMTP password/authorization code | - |
| `EMAIL__FROM_NAME` | Sender name | `SSH Terminal` |
| `EMAIL__FROM_EMAIL` | Sender email address | - |
| `EMAIL__WORKER_POOL_SIZE` | Worker connection pool size | `10` |
| `EMAIL__WORKER_TIMEOUT_SECONDS` | Worker timeout time (seconds) | `10` |