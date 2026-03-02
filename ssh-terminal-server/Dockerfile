# ========================================
# 构建阶段 - 使用 muslrust 静态链接
# ========================================
# 参考 build-musl.sh 脚本，使用 muslrust 镜像构建静态链接的二进制文件
# 支持 linux/amd64 和 linux/arm64 多架构
FROM registry.cn-hangzhou.aliyuncs.com/pull-image/muslrust:latest AS builder

# 设置工作目录
WORKDIR /volume

# 复制 Cargo 文件
COPY Cargo.toml Cargo.lock ./

# 创建一个虚拟的 main.rs 来预编译依赖
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# 复制源代码
COPY src ./src

# 构建静态链接的二进制文件
# muslrust 镜像已经配置好静态链接环境
RUN cargo build --release

# ========================================
# 运行阶段 - 使用 scratch 最小化镜像
# ========================================
FROM scratch

# 复制静态链接的二进制文件
COPY --from=builder /volume/target/x86_64-unknown-linux-musl/release/ssh-terminal-server /ssh-terminal-server

# 暴露端口
EXPOSE 3000

# 设置环境变量（默认值，可被 docker run -e 覆盖）
ENV DATABASE_TYPE=postgresql \
    DATABASE_HOST=localhost \
    DATABASE_PORT=5432 \
    DATABASE_USER=postgres \
    DATABASE_PASSWORD=changeme \
    DATABASE_DATABASE=ssh_terminal_server \
    REDIS_HOST=localhost \
    REDIS_PORT=6379 \
    REDIS_PASSWORD=changeme \
    JWT_SECRET=changeme_please_modify_in_production \
    APP_ENV=production \
    RUST_LOG=info \
    TZ=Asia/Shanghai

# 运行二进制文件
ENTRYPOINT ["/ssh-terminal-server"]
CMD ["-e", "production"]