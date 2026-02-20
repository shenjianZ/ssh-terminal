#!/bin/bash
# 使用 muslrust 构建静态链接的二进制文件
# 适用于 CentOS 7、Debian、Ubuntu 等 Linux 发行版

set -e

IMAGE_NAME="registry.cn-hangzhou.aliyuncs.com/pull-image/muslrust:latest"
CONTAINER_NAME="ssh-terminal-builder"
PROJECT_DIR="$(pwd)"
OUTPUT_DIR="${PROJECT_DIR}/target/x86_64-unknown-linux-musl/release"
BUILD_ENV="${1:-production}"

echo "========================================="
echo "  SSH Terminal Server - Musl Build Script"
echo "========================================="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/engine/install/"
    exit 1
fi

# ==============================================================================
# 安全提示：构建阶段不需要真实密码！
# ==============================================================================
# 编译阶段只检查代码语法和类型，不连接数据库。
# 请在部署时通过环境变量注入真实配置，不要在配置文件中存储敏感信息。
# ==============================================================================

# 使用占位符配置进行构建（编译阶段不需要真实连接）
DATABASE_URL="sqlite:///tmp/build_placeholder.db"
REDIS_URL="redis://localhost:6379"

echo "构建环境: ${BUILD_ENV}"
echo "⚠️  构建阶段使用占位符配置（不连接真实数据库）"
echo "  数据库: ${DATABASE_URL}"
echo "  Redis: ${REDIS_URL}"
echo ""

echo "拉取 ${IMAGE_NAME} 镜像..."
docker pull ${IMAGE_NAME}

echo ""
echo "开始构建..."
echo "项目目录: ${PROJECT_DIR}"
echo ""

# 创建一个临时的容器来构建项目
docker run --rm \
    -v "${PROJECT_DIR}:/volume:z" \
    -w /volume \
    -e CARGO_TARGET_DIR=/volume/target \
    -e DATABASE_URL="${DATABASE_URL}" \
    -e REDIS_URL="${REDIS_URL}" \
    -e APP_ENV="${BUILD_ENV}" \
    --network host \
    ${IMAGE_NAME} \
    cargo build --release

echo ""
echo "========================================="
echo "  构建完成!"
echo "========================================="
echo ""

# 二进制文件名
BINARY_NAME="ssh-terminal-server"
if [ -f "${OUTPUT_DIR}/${BINARY_NAME}" ]; then
    echo "✓ 二进制文件已生成"
    echo ""
    echo "文件信息:"
    ls -lh "${OUTPUT_DIR}/${BINARY_NAME}"
    echo ""
    echo "依赖检查:"
    ldd "${OUTPUT_DIR}/${BINARY_NAME}" 2>&1 | head -1 || echo "✓ 静态链接成功 (not a dynamic executable)"
    echo ""
    echo "文件类型:"
    file "${OUTPUT_DIR}/${BINARY_NAME}"
    echo ""
    echo "可以使用以下命令运行:"
    echo "  ./${OUTPUT_DIR}/${BINARY_NAME} -e ${BUILD_ENV}"
    echo ""
    echo "或使用配置文件运行:"
    echo "  ./${OUTPUT_DIR}/${BINARY_NAME} -c config/${BUILD_ENV}.toml"
    echo ""
    echo "========================================="
    echo "  部署配置指南"
    echo "========================================="
    echo ""
    echo "⚠️  重要：部署时请通过环境变量注入真实配置"
    echo ""
    echo "方式一：使用环境变量（推荐）"
    echo "  export DATABASE_TYPE=postgresql"
    echo "  export DATABASE_HOST=localhost"
    echo "  export DATABASE_PORT=5432"
    echo "  export DATABASE_USER=your_user"
    echo "  export DATABASE_PASSWORD=your_password"
    echo "  export DATABASE_DATABASE=ssh_terminal_server"
    echo "  export REDIS_HOST=localhost"
    echo "  export REDIS_PORT=6379"
    echo "  export REDIS_PASSWORD=your_redis_password"
    echo "  export JWT_SECRET=your_jwt_secret"
    echo "  ./${OUTPUT_DIR}/${BINARY_NAME}"
    echo ""
    echo "方式二：使用配置文件"
    echo "  cp config/production.toml.example config/production.toml"
    echo "  # 编辑 config/production.toml，填入真实配置"
    echo "  ./${OUTPUT_DIR}/${BINARY_NAME} -c config/production.toml"
    echo ""
    echo "🔒 安全提示："
    echo "  - 不要将包含真实密码的配置文件提交到 Git 仓库"
    echo "  - 使用 .gitignore 排除配置文件：config/production.toml"
    echo "  - 生产环境务必修改 JWT_SECRET 为强随机字符串"
else
    echo "✗ 构建失败: 未找到二进制文件"
    exit 1
fi