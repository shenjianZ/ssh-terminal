# Introduction

SSH Terminal is a modern, feature-rich cross-platform desktop SSH terminal management tool designed to provide developers and operations personnel with an efficient, secure, and easy-to-use remote server management experience.

---

## Design Philosophy

### 1. Simple and Efficient
- Clean and intuitive interface
- Keyboard shortcuts for improved efficiency
- Lightweight design, fast startup and response

### 2. Secure and Reliable
- AES-256-GCM encryption for sensitive information storage
- JWT Token authentication for secure cloud sync

### 3. Intelligent
- Integrated AI intelligent assistant for command completion and explanation
- Natural language to command conversion, lowering the barrier to use

### 4. Cross-Platform
- Supports Windows, macOS, Linux
- Unified user experience
- Future support for Android mobile

---

## Comparison with Other Tools

| Feature | SSH Terminal | PuTTY | Termius | MobaXterm |
|---------|--------------|-------|---------|-----------|
| Multi-Session Management | ✅ | ❌ | ✅ | ✅ |
| AI Intelligent Assistant | ✅ | ❌ | ❌ | ❌ |
| SFTP File Management | ✅ | ❌ | ✅ | ✅ |
| Cloud Sync | ✅ | ❌ | ✅ | ❌ |
| Cross-Platform | ✅ | ❌ | ✅ | ✅ |
| Open Source | ✅ | ✅ | ❌ | ❌ |
| Modern UI | ✅ | ❌ | ✅ | ✅ |
| Custom Shortcuts | ✅ | ❌ | ✅ | ✅ |
| Recording | ✅ | ❌ | ❌ | ✅ |
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## Technical Architecture

SSH Terminal uses a modern tech stack to ensure application performance, security, and maintainability.

### Frontend Architecture
- **React 19** - Latest UI framework for efficient component-based development
- **TypeScript** - Type safety to reduce runtime errors
- **Vite 7.0** - Fast build tool to improve development experience
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI component library
- **Zustand** - Lightweight state management
- **xterm.js** - Powerful terminal emulator

### Backend Architecture
- **Tauri 2.4** - Cross-platform desktop application framework
- **Rust 2021** - System-level programming language, secure and efficient
- **russh** - Pure Rust SSH implementation, supports Android
- **russh-sftp** - SFTP protocol support
- **SQLite** - Local data storage
- **AES-256-GCM** - Encryption algorithm

### Server Architecture
- **Rust + Axum** - High-performance web framework
- **SeaORM** - ORM framework
- **Redis** - Token caching
- **JWT** - Authentication mechanism

---

## Future Plans (Development Temporarily Paused)

- [ ] Complete Android version
- [ ] Add Terraform support
- [ ] Support more AI Providers
- [ ] Optimize performance and memory usage
- [ ] Integrate monitoring and alerting
- [ ] Support team collaboration
- [ ] Web version
- [ ] Plugin system
- [ ] Automated workflows

---

## 📈 Project Statistics

- **First Release**: January 2026
- **Current Version**: 1.2.0
- **Supported Platforms**: Windows, macOS, Linux

---

## 🤝 Community and Support

SSH Terminal is an open source project, welcome community contributions and support.

- **GitHub**: [https://github.com/shenjianZ/ssh-terminal](https://github.com/shenjianZ/ssh-terminal)
- **Documentation**: [https://st-docs.shenjianl.cn/](https://st-docs.shenjianl.cn/)
- **Discussions**: [Join Discussions](https://github.com/shenjianZ/ssh-terminal/discussions)
- **Issues**: [Submit Issues](https://github.com/shenjianZ/ssh-terminal/issues)

---

## 📄 License

SSH Terminal is licensed under the MIT License, you are free to use, modify, and distribute.

For details, please see the [LICENSE](https://github.com/shenjianZ/ssh-terminal/blob/master/LICENSE) file.

---

**Thank you for choosing SSH Terminal, making remote server management simpler and smarter!** 🎉
