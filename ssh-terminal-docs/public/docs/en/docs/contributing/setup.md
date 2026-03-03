# Environment Setup

This document introduces how to set up the development environment for SSH Terminal.

---

## 📚 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone Repository](#clone-repository)
3. [Install Dependencies](#install-dependencies)
4. [Run in Development Mode](#run-in-development-mode)
5. [Build Project](#build-project)
6. [Debugging Tips](#debugging-tips)

---

## Prerequisites

### Required Tools

- **Node.js**: 18.0 or higher
- **pnpm**: 10.14.0 or higher
- **Rust**: 1.70.0 or higher
- **Cargo**: Rust package manager
- **Git**: 2.30 or higher

### Recommended Tools

- **VS Code**: Code editor
- **Tauri CLI**: Tauri command line tool
- **Docker**: For testing and deployment

### Platform-Specific Dependencies

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

## Clone Repository

### Fork Repository

1. Visit [GitHub Repository](https://github.com/shenjianZ/ssh-terminal)
2. Click the "Fork" button in the top right
3. Wait for Fork to complete

### Clone to Local

```bash
# Clone your Fork
git clone https://github.com/YOUR_USERNAME/ssh-terminal.git
cd ssh-terminal

# Add upstream repository
git remote add upstream https://github.com/shenjianZ/ssh-terminal.git

# Verify remote repositories
git remote -v
```

---

## Install Dependencies

### Frontend Dependencies

```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Install frontend dependencies
pnpm install
```

---

## Run in Development Mode

### Frontend Development

```bash
# Run frontend only
pnpm dev
```

### Full Development

```bash
# Run full application (frontend + backend)
pnpm tauri dev

# Application will open automatically
```

---

## Build Project

### Development Build

```bash
# Build frontend
pnpm build

# Build backend
cd src-tauri
cargo build

# Full build
pnpm tauri build
```

### Production Build

```bash
# Build production version
pnpm tauri build

# Build artifact location
# Windows: src-tauri/target/release/bundle/nsis/
# macOS: src-tauri/target/release/bundle/dmg/
# Linux: src-tauri/target/release/bundle/appimage/
```

### Build Options

```bash
# Build specific platform only
pnpm tauri build --target x86_64-pc-windows-msvc

# Build debug version
pnpm tauri build --debug

# Build release version
pnpm tauri build --release
```

---

## Debugging Tips

### Frontend Debugging

#### Using Browser Developer Tools

1. Run application in development mode
2. Press `F12` or `Ctrl+Shift+I` to open developer tools
3. Use console, network, performance tools

#### VS Code Debugging

Create `.vscode/launch.json`:

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

### Tauri Debugging

#### Enable Verbose Logging

```bash
# Set environment variables
export RUST_LOG=debug
export TAURI_DEBUG=true

# Run application
pnpm tauri dev
```

---

## Common Issues

### Dependency Installation Failed

```bash
# Clear cache
pnpm store prune

# Delete node_modules
rm -rf node_modules
rm pnpm-lock.yaml

# Reinstall
pnpm install
```

### Build Failed

```bash
# Clear build cache
pnpm clean

# Clear Rust cache
cd src-tauri
cargo clean

# Rebuild
pnpm tauri build
```

### Tauri Development Mode Won't Start

```bash
# Check WebView2 (Windows)
# Ensure WebView2 is installed

# Check dependencies (macOS)
xcode-select --install

# Check dependencies (Linux)
sudo apt install libwebkit2gtk-4.0-dev
```

---

## 🎯 Next Steps

After environment setup is complete, you can:

- Read [Code Style](/docs/contributing/code-style) to understand coding standards
- Check [Testing Guide](/docs/contributing/testing) to learn how to write tests
- Understand [PR Flow](/docs/contributing/pr-flow) to submit your contributions

---

**Development environment ready, start coding!** 🚀