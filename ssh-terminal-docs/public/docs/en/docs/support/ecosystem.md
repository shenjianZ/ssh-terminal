# Ecosystem

The SSH Terminal ecosystem includes multiple related projects and tools, together providing a complete SSH terminal management solution.

## Table of Contents

- [Ecosystem Overview](#ecosystem-overview)
- [Official Projects](#official-projects)
- [Dependency Projects](#dependency-projects)
- [Third-Party Tools](#third-party-tools)
- [Community Resources](#community-resources)

---

## Ecosystem Overview

The SSH Terminal ecosystem is a complete solution covering desktop client, web version, cloud sync server, official website, and documentation website.

**Important Note**: All official projects are hosted in the same GitHub repository:
- **Repository URL**: https://github.com/shenjianZ/ssh-terminal

```
SSH Terminal Ecosystem (Single Repository)
├── ssh-terminal/          # Desktop client (root directory)
├── ssh-terminal-server/   # Cloud sync server
├── ssh-terminal-web/      # Web version
├── ssh-terminal-website/  # Official website
├── ssh-terminal-docs/     # Online documentation
└── Dependency Projects
    ├── Tauri             # Cross-platform application framework
    ├── React             # UI framework
    ├── xterm.js          # Terminal emulator
    ├── russh             # Rust SSH implementation
    └── Zustand           # State management
```

---

## Official Projects

### 1. ssh-terminal (Desktop Client)

**Location**: Repository root directory

**Description**: The main project of SSH Terminal, providing cross-platform desktop client functionality.

**Core Features**:
- Multi-session SSH terminal management
- AI intelligent assistant
- SFTP file management
- Cloud sync
- Video recording
- Keyboard shortcut system
- Theme system

**Tech Stack**:
- Frontend: React 19 + TypeScript + Tailwind CSS
- Backend: Rust + Tauri 2.0
- Terminal: xterm.js
- SSH: russh

**Supported Platforms**:
- Windows
- macOS
- Linux

---

### 2. ssh-terminal-server (Cloud Sync Server)

**Location**: `ssh-terminal-server/` directory

**Description**: SSH Terminal's cloud sync backend service, providing data sync, user authentication, and other features.

**Core Features**:
- User authentication (JWT)
- Data sync (incremental sync)
- Conflict detection and resolution
- API management

**Tech Stack**:
- Backend: Rust + Axum
- Database: SQLite / MySQL / PostgreSQL
- Cache: Redis
- Authentication: JWT

**Supported Databases**:
- SQLite (default)
- MySQL
- PostgreSQL

---

### 3. ssh-terminal-web (Web Version)

**Location**: `ssh-terminal-web/` directory

**Description**: SSH Terminal's web version, providing web-based SSH session management functionality.

**Core Features**:
- Session management
- User management
- Responsive design

**Tech Stack**:
- Frontend: Vue + TypeScript

---

### 4. ssh-terminal-website (Official Website)

**Location**: `ssh-terminal-website/` directory

**Description**: SSH Terminal's official website, providing product introduction, download links, and other features.

**Core Features**:
- Product introduction
- Download page
- Feature showcase
- News updates
- Community links

**Tech Stack**:
- Frontend: React + TypeScript + Tailwind CSS
- Build: Vite
- Deployment: GitHub Pages

---

### 5. ssh-terminal-docs (Online Documentation)

**Location**: `ssh-terminal-docs/` directory

**Description**: SSH Terminal's online documentation website, providing complete usage guides and development documentation.

**Core Content**:
- Quick start
- User guide
- Quick deployment
- Configuration description
- Contributing guide

**Tech Stack**:
- Frontend: React + TypeScript
- Documentation Framework: React Docs UI
- Deployment: GitHub Pages

---

## Dependency Projects

### Frontend Dependencies

#### Tauri

**Website**: https://tauri.app/

**Description**: Cross-platform desktop application framework for building native applications using web technologies.

**Version**: 2.4.0

**Role**:
- Application packaging and distribution
- Native functionality access (file system, system notifications, etc.)
- Security sandbox
- Auto-update

---

#### React

**Website**: https://react.dev/

**Description**: JavaScript library for building user interfaces.

**Version**: 19.1.0

**Role**:
- Component-based UI development
- State management
- Virtual DOM
- Hooks system

---

#### xterm.js

**Website**: https://xtermjs.org/

**Description**: TypeScript-based terminal emulator that can run in browsers.

**Version**: 5.5.0

**Role**:
- Terminal rendering
- ANSI escape sequence support
- Terminal interaction
- Theme support

---

#### Tailwind CSS

**Website**: https://tailwindcss.com/

**Description**: Utility-first CSS framework for rapidly building modern websites.

**Version**: 4.1.12

**Role**:
- Style development
- Responsive design
- Theme customization
- Utility classes

---

#### Zustand

**Website**: https://zustand-demo.pmnd.rs/

**Description**: Lightweight state management library for React applications.

**Version**: 4.5.0

**Role**:
- Global state management
- Simple API
- TypeScript support
- Performance optimization

---

### Backend Dependencies

#### Rust

**Website**: https://www.rust-lang.org/

**Description**: System programming language focused on safety, concurrency, and performance.

**Version**: 2021 Edition

**Role**:
- Tauri backend
- SSH implementation
- High-performance computing
- Memory safety

---

#### russh

**Website**: https://github.com/warp-tech/russh

**Description**: Pure Rust implementation of SSH library, supporting SSH protocol.

**Version**: 0.55

**Role**:
- SSH client and server
- SSH protocol implementation
- Encryption and authentication
- Cross-platform support (including Android)

---

#### tokio

**Website**: https://tokio.rs/

**Description**: Rust's asynchronous runtime, providing async I/O, timers, thread pools, and other features.

**Version**: 1.35

**Role**:
- Asynchronous programming
- Network communication
- Concurrent processing
- Timers

---

#### russh-sftp

**Website**: https://github.com/warp-tech/russh

**Description**: russh's SFTP sub-protocol implementation.

**Version**: 2.1.1

**Role**:
- SFTP file transfer
- File operations
- Directory management
- Permission management

---

## Third-Party Tools

### Development Tools

#### VS Code

**Website**: https://code.visualstudio.com/

**Description**: Code editor developed by Microsoft, supporting rich extensions.

**Recommended Extensions**:
- ESLint
- Prettier
- Rust Analyzer
- Tauri
- Tailwind CSS IntelliSense

---

#### Git

**Website**: https://git-scm.com/

**Description**: Distributed version control system.

**Role**:
- Code version management
- Collaborative development
- Code review

---

#### Node.js

**Website**: https://nodejs.org/

**Description**: JavaScript runtime for frontend development.

**Version**: 20.x

**Role**:
- Frontend development server
- Package management (npm/pnpm)
- Build tools

---

#### Rust

**Website**: https://www.rust-lang.org/

**Description**: System programming language.

**Version**: stable

**Role**:
- Backend development
- Tauri application packaging
- Performance optimization

---

### Deployment Tools

#### Docker

**Website**: https://www.docker.com/

**Description**: Containerization platform for application deployment.

**Role**:
- Containerized applications
- Consistent deployment environment
- Quick deployment

---

#### GitHub Actions

**Website**: https://github.com/features/actions

**Description**: CI/CD service provided by GitHub.

**Role**:
- Automated testing
- Automated building
- Automated deployment

---

#### Vercel

**Website**: https://vercel.com/

**Description**: Frontend deployment platform supporting auto-deployment.

**Role**:
- Web version deployment
- Official website deployment
- Documentation website deployment

---

## Community Resources

### Official Channels

- **GitHub**: https://github.com/shenjianZ/ssh-terminal
- **Issues**: https://github.com/shenjianZ/ssh-terminal/issues
- **Discussions**: https://github.com/shenjianZ/ssh-terminal/discussions
- **Wiki**: https://github.com/shenjianZ/ssh-terminal/wiki

### Community Forums

- **Stack Overflow**: Search `ssh-terminal` tag
- **Reddit**: /r/ssh-terminal (if exists)
- **Discord**: Official Discord server (if exists)

---
