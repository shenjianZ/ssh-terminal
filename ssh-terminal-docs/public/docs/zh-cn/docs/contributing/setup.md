# 环境搭建

本文档介绍如何设置 SSH Terminal 的开发环境。

---

## 📚 目录

1. [前置要求](#前置要求)
2. [克隆仓库](#克隆仓库)
3. [安装依赖](#安装依赖)
4. [开发模式运行](#开发模式运行)
5. [构建项目](#构建项目)
6. [调试技巧](#调试技巧)

---

## 前置要求

### 必需工具

- **Node.js**: 18.0 或更高版本
- **pnpm**: 10.14.0 或更高版本
- **Rust**: 1.70.0 或更高版本
- **Cargo**: Rust 包管理器
- **Git**: 2.30 或更高版本

### 推荐工具

- **VS Code**: 代码编辑器
- **Tauri CLI**: Tauri 命令行工具
- **Docker**: 用于测试和部署

### 平台特定依赖

#### Windows

- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

#### macOS

```bash
xcode-select --install
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

---

## 克隆仓库

### Fork 仓库

1. 访问 [GitHub 仓库](https://github.com/shenjianZ/ssh-terminal)
2. 点击右上角的 "Fork" 按钮
3. 等待 Fork 完成

### 克隆到本地

```bash
# 克隆你的 Fork
git clone https://github.com/YOUR_USERNAME/ssh-terminal.git
cd ssh-terminal

# 添加上游仓库
git remote add upstream https://github.com/shenjianZ/ssh-terminal.git

# 验证远程仓库
git remote -v
```

---

## 安装依赖

### 前端依赖

```bash
# 安装 pnpm（如果还没有）
npm install -g pnpm

# 安装前端依赖
pnpm install
```

### 后端依赖

```bash
# 安装 Tauri CLI
cargo install tauri-cli --version "^2.0.0"

# 验证安装
tauri --version
```

### 开发工具

```bash
# 安装 ESLint
pnpm add -D eslint

# 安装 Prettier
pnpm add -D prettier

# 安装 TypeScript
pnpm add -D typescript
```

---

## 开发模式运行

### 前端开发

```bash
# 仅运行前端
pnpm dev

# 前端将在 http://localhost:1420 运行
```

### 完整开发

```bash
# 运行完整应用（前端 + 后端）
pnpm tauri dev

# 应用将自动打开
```

### 开发服务器选项

```bash
# 指定端口
pnpm dev --port 3000

# 启用热重载
pnpm dev --hmr

# 禁用源码映射
pnpm dev --no-sourcemaps
```

---

## 构建项目

### 开发构建

```bash
# 构建前端
pnpm build

# 构建后端
cd src-tauri
cargo build

# 完整构建
pnpm tauri build
```

### 生产构建

```bash
# 构建生产版本
pnpm tauri build

# 构建产物位置
# Windows: src-tauri/target/release/bundle/nsis/
# macOS: src-tauri/target/release/bundle/dmg/
# Linux: src-tauri/target/release/bundle/appimage/
```

### 构建选项

```bash
# 仅构建特定平台
pnpm tauri build --target x86_64-pc-windows-msvc

# 构建调试版本
pnpm tauri build --debug

# 构建发布版本
pnpm tauri build --release
```

---

## 调试技巧

### 前端调试

#### 使用浏览器开发者工具

1. 在开发模式下运行应用
2. 按 `F12` 或 `Ctrl+Shift+I` 打开开发者工具
3. 使用控制台、网络、性能等工具

#### VS Code 调试

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug in Chrome",
      "url": "http://localhost:1420",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### 后端调试

#### 日志调试

```rust
// 在 Rust 代码中添加日志
use log::{info, debug, error};

fn main() {
    env_logger::init();
    info!("Application started");
    debug!("Debug information");
    error!("Error occurred");
}
```

#### GDB 调试

```bash
# 使用 GDB 调试
gdb target/debug/ssh-terminal

# 在 GDB 中
(gdb) break main
(gdb) run
(gdb) next
(gdb) print variable_name
```

### Tauri 调试

#### 启用详细日志

```bash
# 设置环境变量
export RUST_LOG=debug
export TAURI_DEBUG=true

# 运行应用
pnpm tauri dev
```

#### 查看日志

```bash
# 查看应用日志
tail -f src-tauri/logs/app.log

# 查看系统日志
journalctl -u ssh-terminal -f
```

---

## IDE 配置

### VS Code

推荐安装的扩展：

- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **TypeScript**: TypeScript 支持
- **Rust Analyzer**: Rust 支持
- **Tauri**: Tauri 支持

配置 `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "rust-analyzer.checkOnSave.command": "clippy"
}
```

### IntelliJ IDEA

推荐插件：

- **Rust Plugin**: Rust 支持
- **TypeScript**: TypeScript 支持
- **ESLint**: 代码检查

---

## 常见问题

### 依赖安装失败

```bash
# 清除缓存
pnpm store prune

# 删除 node_modules
rm -rf node_modules
rm pnpm-lock.yaml

# 重新安装
pnpm install
```

### 构建失败

```bash
# 清除构建缓存
pnpm clean

# 清除 Rust 缓存
cd src-tauri
cargo clean

# 重新构建
pnpm tauri build
```

### Tauri 开发模式无法启动

```bash
# 检查 WebView2（Windows）
# 确保 WebView2 已安装

# 检查依赖（macOS）
xcode-select --install

# 检查依赖（Linux）
sudo apt install libwebkit2gtk-4.0-dev
```

---

## 🎯 下一步

环境搭建完成后，你可以：

- 阅读 [代码规范](/contributing/code-style) 了解编码标准
- 查看 [测试指南](/contributing/testing) 学习如何编写测试
- 了解 [提交流程](/contributing/pr-flow) 提交你的贡献

---

**开发环境准备就绪，开始编码吧！** 🚀