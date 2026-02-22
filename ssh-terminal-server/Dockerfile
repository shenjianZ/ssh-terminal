# 构建阶段
FROM rust:1.83-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache \
    musl-dev \
    pkgconf \
    openssl-dev \
    postgresql-dev

# 设置工作目录
WORKDIR /app

# 复制 Cargo 文件
COPY Cargo.toml Cargo.lock ./

# 创建一个虚拟的 main.rs 来预编译依赖
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# 复制源代码
COPY src ./src

# 构建应用
RUN cargo build --release

# 运行阶段
FROM alpine:3.20

# 安装运行时依赖
RUN apk add --no-cache \
    ca-certificates \
    tzdata

# 设置时区为上海
ENV TZ=Asia/Shanghai

# 创建非 root 用户
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

# 设置工作目录
WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/target/release/ssh-terminal-server /app/ssh-terminal-server

# 复制配置文件
COPY config ./config

# 创建数据目录
RUN mkdir -p /app/data && \
    chown -R appuser:appuser /app

# 切换到非 root 用户
USER appuser

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 运行应用
CMD ["./ssh-terminal-server", "-e", "production"]