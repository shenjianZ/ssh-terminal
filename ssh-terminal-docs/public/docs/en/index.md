# SSH Terminal

A powerful, modern **cross-platform desktop SSH terminal management tool** built with Tauri 2.0 + React 19 + Rust.

SSH Terminal is dedicated to providing developers and operations personnel with a one-stop remote server management solution, integrating SSH terminal, AI intelligent assistant, SFTP file management, cloud sync, and other rich features.

---

## 🚀 Quick Start

## 🪟 Windows Installation

1. Visit the [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) page
2. Download the latest Windows installer (`SSH.Terminal_vx.x.x-windows-x86_64-setup.exe` or `SSH.Terminal_vx.x.x-windows-x86_64.msi`)
3. Double-click the installer to run
4. Follow the installation wizard to complete installation
5. Launch SSH Terminal

---

## 🍎 macOS Installation

### Using DMG Installer (Recommended)

1. Visit the [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) page
2. Download the latest macOS installer (`SSH.Terminal_vx.x.x-macos-universal.dmg`)
3. Double-click the DMG file to mount the disk image
4. Drag SSH Terminal to the Applications folder
5. Launch SSH Terminal from Launchpad

### Using ZIP Installer

1. Visit the [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) page
2. Download the latest macOS ZIP package (`SSH.Terminal_vx.x.x-macos-universal.app.zip`)
3. Extract the ZIP file
4. Drag SSH Terminal.app to the Applications folder
5. Launch SSH Terminal from Launchpad

---

## 🐧 Linux Installation

### Using Debian/Ubuntu Package

**System Requirements**: Ubuntu 22.04+ or glibc 2.34+

> **⚠️ Important**: This package requires glibc 2.34 or higher.

1. Visit the [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) page
2. Download the latest Debian/Ubuntu package (`SSH.Terminal_vx.x.x-linux-x86_64.deb`)
3. Install using the following command:

```bash
# Install deb package
sudo dpkg -i SSH.Terminal_vx.x.x-linux-x86_64.deb

# If dependency issues are prompted, run the following command
sudo apt-get install -f
```

**Compatibility Notes**:
- ✅ Ubuntu 24.04+ (glibc 2.39)
- ✅ Ubuntu 22.04 (glibc 2.35)
- ❌ Ubuntu 20.04 (glibc 2.31) - Incompatible

### Using Fedora/RHEL Package

**System Requirements**: glibc 2.35+

> **⚠️ Important**: This package requires glibc 2.35 or higher.

1. Visit the [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) page
2. Download the latest Fedora/RHEL package (`SSH.Terminal_vx.x.x-linux-x86_64.rpm`)
3. Install using the following command:

```bash
# Install rpm package
sudo dnf install SSH.Terminal_vx.x.x-linux-x86_64.rpm

# Or use yum (for older versions)
sudo yum install SSH.Terminal_vx.x.x-linux-x86_64.rpm
```

**Compatibility Notes**:
- ✅ Fedora 40+ (glibc 2.39+)
- ✅ Fedora 36-39 (glibc 2.35-2.38)
- ❌ Other older versions - Incompatible

---

## 📱 Android Installation (Coming Soon)

The Android version is under development, stay tuned!

---

## ✨ Core Features

### 🖥️ Multi-Session SSH Terminal Management
- Modern terminal emulator based on xterm.js
- Support for multiple SSH sessions simultaneously
- Terminal tab management, quick switching
- Support for multiple terminal themes (One Dark, Dracula, Nord, etc. - 8 themes total)

### 🤖 AI Intelligent Assistant
- Support for multiple AI Providers (OpenAI, Claude, Ollama, Qwen, ERNIE Bot, etc.)
- Intelligent command completion and explanation
- AI caching mechanism to improve response speed
- Natural language to command conversion

### 📁 SFTP File Management
- Dual-panel file browser
- File upload, download, delete, rename
- Directory browsing and permission management
- Large file transfer optimization

### ☁️ Cloud Sync
- Multi-device data synchronization
- SSH session configuration cloud backup
- User profile synchronization
- Token authentication mechanism

### 👤 User Authentication System
- Account registration and login
- JWT Token authentication
- Secure password storage (AES-256-GCM encryption)

### 📹 Recording and Screenshots
- Terminal operation recording (video + audio)
- DOM to SVG vector image export
- Convenient sharing and recording of operations

### ⌨️ Keyboard Shortcut System
- Complete keyboard shortcut bindings
- Customizable shortcuts
- Improve work efficiency

### 🎨 Modern UI
- Based on shadcn/ui and Tailwind CSS
- Dark/light theme switching
- Responsive design, mobile support
- Material Design style

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 7.0
- **UI Framework**: shadcn/ui + Tailwind CSS 4.0
- **Desktop Framework**: Tauri 2.4
- **Backend**: Rust 2021 + Axum 0.7
- **SSH Implementation**: russh 0.55 (pure Rust, supports Android)
- **State Management**: Zustand 4.5
- **Terminal Emulation**: xterm.js 5.5

---

## 🌟 Why Choose SSH Terminal?

### 1. Cross-Platform Support
- Windows, macOS, Linux full platform support
- Future support for Android mobile

### 2. Modern Tech Stack
- Based on Tauri 2.0, excellent performance, small size
- React 19 + TypeScript, type safety
- Rust backend, secure and reliable

### 3. Integrated AI Capabilities
- Multiple AI Provider support
- Intelligent command completion and explanation
- Improve development efficiency

### 4. Data Security
- AES-256-GCM encrypted storage
- JWT Token authentication
- Host key verification

### 5. Open Source and Free
- MIT License
- Fully open source
- Community driven

---

## 🤝 Contributing

We welcome contributions in any form! Whether it's code, documentation, issue feedback, or feature suggestions.

How to contribute:
1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

For detailed contribution guidelines, please refer to [Contributing Guide](/docs/contributing/setup).

---

## 📞 Get Help

- **Documentation**: [https://st-docs.shenjianl.cn](https://st-docs.shenjianl.cn)
- **GitHub Issues**: [Submit Issues](https://github.com/shenjianZ/ssh-terminal/issues)
- **GitHub Discussions**: [Join Discussions](https://github.com/shenjianZ/ssh-terminal/discussions)
- **Email**: 15202078626@163.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/shenjianZ/ssh-terminal/blob/master/LICENSE) file for details.

---

## 🙏 Acknowledgments

Thanks to the following open source projects:

- [Tauri](https://tauri.app/) - Cross-platform desktop application framework
- [React](https://react.dev/) - UI framework
- [xterm.js](https://xtermjs.org/) - Terminal emulator
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [russh](https://github.com/warp-tech/russh) - Rust SSH implementation

---

## 📊 Project Status

![GitHub Stars](https://img.shields.io/github/stars/shenjianZ/ssh-terminal?style=social)
![GitHub Forks](https://img.shields.io/github/forks/shenjianZ/ssh-terminal?style=social)
![GitHub Issues](https://img.shields.io/github/issues/shenjianZ/ssh-terminal)
![License](https://img.shields.io/github/license/shenjianZ/ssh-terminal)

---

**Start using SSH Terminal and make remote server management easier!** 🚀