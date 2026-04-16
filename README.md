# SSH Terminal

<div align="center">

**🌐 Language**: [English](#) | [中文](./README_ZH.md)

![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=000000)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000000)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=FFFFFF)
![Rust](https://img.shields.io/badge/Rust-1.70+-000000?logo=rust&logoColor=FFFFFF)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=FFFFFF)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss&logoColor=FFFFFF)
![Zustand](https://img.shields.io/badge/Zustand-5.0-FFB84D?logoColor=FFFFFF)
![License](https://img.shields.io/badge/License-MIT-green)

A modern SSH terminal client application built with Tauri + React, providing cross-platform SSH connection management, AI assistance, SFTP file management, and more.

**[Features](#-features)** • **[Quick Start](#-quick-start)** • **[Tech Stack](#-tech-stack)** • **[Documentation](#-documentation)**

</div>

## 📸 Screenshots

![Main Interface](./public/other-aoge.png)

![Settings Page](./public/setting-page.svg)


## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** 10.14.0+
- **Rust** 1.70+
- **System SSH Client** (Git Bash or WSL required on Windows)

### Install Dependencies

```bash
pnpm install
```

### Development Mode

Start development server (both frontend and backend):

```bash
pnpm tauri dev
```

This will:
1. Start Vite development server (port 1420)
2. Launch Tauri application window
3. Enable Hot Module Replacement (HMR)

### Frontend Development Only

```bash
pnpm dev
```

### Production Build

Build production version:

```bash
pnpm tauri build
```

Build artifacts are located in `src-tauri/target/release/bundle/`.

### Docker Deployment

Deploy backend service quickly using Docker:

```bash
docker-compose up -d
```

For detailed deployment guide, see [Docker Deployment Documentation](./docs/DOCKER_DEPLOYMENT.md).

## ✨ Features

- 🖥️ Multi-session SSH terminal management
- 🤖 AI Assistant (supports multiple AI providers)
- 📁 SFTP file management
- ☁️ Cloud sync (multi-device data synchronization)
- 👤 User authentication system
- 📹 Video recording
- 🎬 Screenshot functionality
- ⌨️ Keyboard shortcuts system
- 🎨 8 terminal themes

## 📚 Documentation

### Core Documentation
- **[Architecture Design](./docs/ARCHITECTURE.md)** - System architecture, data flow, core concepts
- **[Development Guide](./docs/DEVELOPMENT.md)** - Development environment setup and workflow
- **[Code Style Guide](./docs/CODE_STYLE.md)** - Frontend and backend code style standards
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Feature Documentation
- **[AI Features](./docs/AI_FEATURES.md)** - Complete AI assistant documentation
- **[Recording Features](./docs/RECORDING.md)** - Video recording and playback features
- **[Theme System](./docs/THEMES.md)** - Terminal theme configuration
- **[Keyboard Shortcuts](./docs/Shortcuts.md)** - All keyboard shortcuts and their scope
- **[Security Features](./docs/SECURITY.md)** - Encryption and security mechanisms

### Deployment Documentation
- **[Docker Deployment Guide](./docs/DOCKER_DEPLOYMENT.md)** - Deploy backend service using Docker

### Other Documentation
- **[More Documentation...](./docs/)**

---

> 🌐 **中文文档**: [README_ZH.md](./README_ZH.md) | [中文文档](./docs/#中文文档)

## 🏗️ Tech Stack

### Frontend
- React 19 + TypeScript 5.8
- Vite 7.0 + Tailwind CSS 4.0
- shadcn/ui + Zustand
- xterm.js 5.5

### Backend (Tauri)
- Rust 2021 + Tauri 2.4
- russh 0.55 + russh-sftp 2.1.1
- SQLite + AES-256-GCM encryption

### Backend Server
- Rust + Axum 0.7 + SeaORM
- JWT authentication + Redis caching

## 🤝 Contributing

1. Fork the project
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Create a Pull Request

## 📄 License

MIT License

## 🔗 Related Resources

- [Tauri Documentation](https://tauri.app/)
- [React Documentation](https://react.dev/)
- [xterm.js Documentation](https://xtermjs.org/)

---

<div align="center">

**Last Updated**: April 16, 2026

Made with ❤️ using Tauri + React

</div>