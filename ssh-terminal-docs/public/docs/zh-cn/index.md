# SSH Terminal


<Callout variant="secondary">
一个功能强大、现代化的跨平台桌面 SSH 终端管理工具，基于 Tauri 2.0 + React 19 + Rust 构建。
SSH Terminal 致力于为开发者和运维人员提供一站式的远程服务器管理解决方案，集成了 SSH 终端、AI 智能助手、SFTP 文件管理、云同步等丰富功能。

</Callout>

---

## 🚀 快速开始
## 🪟 Windows 安装

1. 访问 [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) 页面
2. 下载最新的 Windows 安装包（`SSH.Terminal_vx.x.x-windows-x86_64-setup.exe` `SSH.Terminal_vx.x.x-windows-x86_64.msi`）
3. 双击运行安装程序
4. 按照安装向导完成安装
5. 启动 SSH Terminal

---

## 🍎 macOS 安装

### 使用 DMG 安装包（推荐）

1. 访问 [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) 页面
2. 下载最新的 macOS 安装包（`SSH.Terminal_vx.x.x-macos-universal.dmg`）
3. 双击 DMG 文件挂载磁盘映像
4. 将 SSH Terminal 拖拽到 Applications 文件夹
5. 在 Launchpad 中启动 SSH Terminal

### 使用 ZIP 安装包

1. 访问 [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) 页面
2. 下载最新的 macOS ZIP 包（`SSH.Terminal_vx.x.x-macos-universal.app.zip`）
3. 解压 ZIP 文件
4. 将 SSH Terminal.app 拖拽到 Applications 文件夹
5. 在 Launchpad 中启动 SSH Terminal

---

## 🐧 Linux 安装

### 使用 Debian/Ubuntu 包

**系统要求**：Ubuntu 22.04+ 或 glibc 2.34+

<Warning>
    重要：此包需要 glibc 2.34 或更高版本。
</Warning>


1. 访问 [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) 页面
2. 下载最新的 Debian/Ubuntu 包（`SSH.Terminal_vx.x.x-linux-x86_64.deb`）
3. 使用以下命令安装：

```bash
# 安装 deb 包
sudo dpkg -i SSH.Terminal_vx.x.x-linux-x86_64.deb

# 如果提示依赖问题，运行以下命令
sudo apt-get install -f
```

**兼容性说明**：
- ✅ Ubuntu 24.04+ (glibc 2.39)
- ✅ Ubuntu 22.04 (glibc 2.35) 
- ❌ Ubuntu 20.04 (glibc 2.31) - 不兼容

### 方法三：使用 Fedora/RHEL 包

**系统要求**：glibc 2.35+

<Warning>
    重要：此包需要 glibc 2.35 或更高版本
</Warning>


1. 访问 [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) 页面
2. 下载最新的 Fedora/RHEL 包（`SSH.Terminal_vx.x.x-linux-x86_64.rpm`）
3. 使用以下命令安装：

```bash
# 安装 rpm 包
sudo dnf install SSH.Terminal_vx.x.x-linux-x86_64.rpm

# 或使用 yum（适用于旧版本）
sudo yum install SSH.Terminal_vx.x.x-linux-x86_64.rpm
```

**兼容性说明**：
- ✅ Fedora 40+ (glibc 2.39+)
- ✅ Fedora 36-39 (glibc 2.35-2.38)
- ❌ 其他旧版本 - 不兼容

---

## 📱 Android 安装（即将推出）

Android 版本正在开发中，敬请期待！

---



## ✨ 核心特性

### 🖥️ 多会话 SSH 终端管理
- 基于 xterm.js 的现代化终端模拟器
- 支持多个 SSH 会话同时连接
- 终端标签页管理，快速切换
- 支持多种终端主题（One Dark、Dracula、Nord 等 8 种主题）

### 🤖 AI 智能助手
- 支持多个 AI Provider（OpenAI、Claude、Ollama、Qwen、文心一言等）
- 智能命令补全和解释
- AI 缓存机制，提升响应速度
- 自然语言转命令功能

### 📁 SFTP 文件管理
- 双面板文件浏览器
- 文件上传、下载、删除、重命名
- 目录浏览和权限管理
- 大文件传输优化

### ☁️ 云同步
- 多设备数据同步
- SSH 会话配置云端备份
- 用户资料同步
- Token 认证机制

### 👤 用户认证系统
- 账号注册、登录
- JWT Token 认证
- 安全的密码存储（AES-256-GCM 加密）

### 📹 录制与截图
- 终端操作录制（视频 + 音频）
- DOM to SVG 矢量图导出
- 方便分享和记录操作过程

### ⌨️ 快捷键系统
- 完整的快捷键绑定
- 自定义快捷键
- 提升工作效率

### 🎨 现代化 UI
- 基于 shadcn/ui 和 Tailwind CSS
- 深色/浅色主题切换
- 响应式设计，支持移动端
- Material Design 风格


---

## 🛠️ 技术栈

- **前端**: React 19 + TypeScript + Vite 7.0
- **UI 框架**: shadcn/ui + Tailwind CSS 4.0
- **桌面框架**: Tauri 2.4
- **后端**: Rust 2021 + Axum 0.7
- **SSH 实现**: russh 0.55（纯 Rust，支持 Android）
- **状态管理**: Zustand 4.5
- **终端模拟**: xterm.js 5.5

---

## 🌟 为什么选择 SSH Terminal？

### 1. 跨平台支持
- Windows、macOS、Linux 全平台支持
- 未来将支持 Android 移动端

### 2. 现代化技术栈
- 基于 Tauri 2.0，性能优异，体积小巧
- React 19 + TypeScript，类型安全
- Rust 后端，安全可靠

### 3. 集成 AI 能力
- 多个 AI Provider 支持
- 智能命令补全和解释
- 提升开发效率

### 4. 数据安全
- AES-256-GCM 加密存储
- JWT Token 认证
- 主机密钥验证

### 5. 开源免费
- MIT 许可证
- 完全开源
- 社区驱动

---

## 🤝 贡献

我们欢迎任何形式的贡献！无论是代码、文档、问题反馈还是功能建议。

如何贡献：
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

详细贡献指南请参考 [贡献者指南](/docs/contributing/setup)。

---

## 📞 获取帮助

- **文档**: [https://st-docs.shenjianl.cn](https://st-docs.shenjianl.cn)
- **GitHub Issues**: [提交问题](https://github.com/shenjianZ/ssh-terminal/issues)
- **GitHub Discussions**: [参与讨论](https://github.com/shenjianZ/ssh-terminal/discussions)
- **邮件**: 15202078626@163.com

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](https://github.com/shenjianZ/ssh-terminal/blob/master/LICENSE) 文件。

---

## 🙏 致谢

感谢以下开源项目：

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [React](https://react.dev/) - UI 框架
- [xterm.js](https://xtermjs.org/) - 终端模拟器
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [russh](https://github.com/warp-tech/russh) - Rust SSH 实现

---

## 📊 项目状态

![GitHub Stars](https://img.shields.io/github/stars/shenjianZ/ssh-terminal?style=social)
![GitHub Forks](https://img.shields.io/github/forks/shenjianZ/ssh-terminal?style=social)
![GitHub Issues](https://img.shields.io/github/issues/shenjianZ/ssh-terminal)
![License](https://img.shields.io/github/license/shenjianZ/ssh-terminal)

---

**开始使用 SSH Terminal，让远程服务器管理更简单！** 🚀
