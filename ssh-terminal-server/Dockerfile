# syntax=docker/dockerfile:1.7

# ==============================================================================
# 1. 基础构建环境 (Base)
# ==============================================================================
FROM --platform=$BUILDPLATFORM rustlang/rust:nightly-bookworm-slim AS base

# 引入 xx 交叉编译辅助工具
COPY --from=tonistiigi/xx:1.4.0 / /

# 基础工具
RUN apt-get update && apt-get install -y \
    clang \
    lld \
    pkg-config \
    git \
    file \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# cargo-chef（缓存神器）
RUN cargo install cargo-chef

WORKDIR /app

# ==============================================================================
# 2. Planner
# ==============================================================================
FROM base AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# ==============================================================================
# 3. Builder - Deps（🔥 关键修复点）
# ==============================================================================
FROM base AS builder-deps

ARG TARGETPLATFORM

# ⭐⭐⭐ 关键：安装目标架构 sysroot
RUN xx-apt-get update && xx-apt-get install -y \
    libc6-dev \
    libssl-dev \
    libgcc-s1 \
    gcc \
    pkg-config

# ⭐⭐⭐ 确保交叉环境变量正确（很重要）
RUN xx-info env

COPY --from=planner /app/recipe.json recipe.json

# 构建依赖缓存
RUN xx-cargo chef cook --release --recipe-path recipe.json

# ==============================================================================
# 4. Builder - Source（🔥 同样要有 sysroot）
# ==============================================================================
FROM base AS builder-src

ARG TARGETPLATFORM
ARG BIN_NAME=ssh-terminal-server

# ⭐⭐⭐ 再装一次目标库（避免 layer 隔离导致链接失败）
RUN xx-apt-get update && xx-apt-get install -y \
    libc6-dev \
    libssl-dev \
    libgcc-s1 \
    gcc \
    pkg-config

RUN xx-info env

# 恢复依赖缓存
COPY --from=builder-deps /app/target target
COPY --from=builder-deps /usr/local/cargo /usr/local/cargo

# 复制源码
COPY . .

# 构建
RUN xx-cargo build --release --locked --bin ${BIN_NAME} && \
    cp target/$(xx-cargo --print-target-triple)/release/${BIN_NAME} /app/server-binary && \
    xx-verify /app/server-binary

# ==============================================================================
# 5. Runtime
# ==============================================================================
FROM debian:bookworm-slim

ARG BIN_NAME=ssh-terminal-server

WORKDIR /app

# 只保留运行时依赖（最小化）
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/bin

COPY --from=builder-src /app/server-binary /app/bin/${BIN_NAME}

ENTRYPOINT ["/app/bin/ssh-terminal-server"]
