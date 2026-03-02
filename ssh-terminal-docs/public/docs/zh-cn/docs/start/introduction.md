# 项目介绍

SSH Terminal 是一个现代化的、功能丰富的跨平台桌面 SSH 终端管理工具，旨在为开发者和运维人员提供高效、安全、易用的远程服务器管理体验。

---



## 设计理念

### 1. 简洁高效
- 界面简洁明了，操作直观
- 快捷键支持，提升工作效率
- 轻量级设计，快速启动和响应

### 2. 安全可靠
- AES-256-GCM 加密存储敏感信息
- JWT Token 认证，保障云同步安全

### 3. 智能化
- 集成 AI 智能助手，提供命令补全和解释
- 自然语言转命令，降低使用门槛

### 4. 跨平台
- 支持 Windows、macOS、Linux
- 统一的用户体验
- 未来支持 Android 移动端



---

## 与其他工具的对比

| 特性 | SSH Terminal | PuTTY | Termius | MobaXterm |
|------|--------------|-------|---------|-----------|
| 多会话管理 | ✅ | ❌ | ✅ | ✅ |
| AI 智能助手 | ✅ | ❌ | ❌ | ❌ |
| SFTP 文件管理 | ✅ | ❌ | ✅ | ✅ |
| 云同步 | ✅ | ❌ | ✅ | ❌ |
| 跨平台 | ✅ | ❌ | ✅ | ✅ |
| 开源 | ✅ | ✅ | ❌ | ❌ |
| 现代化 UI | ✅ | ❌ | ✅ | ✅ |
| 自定义快捷键 | ✅ | ❌ | ✅ | ✅ |
| 录制功能 | ✅ | ❌ | ❌ | ✅ |
| 性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
--- 
## 技术架构

SSH Terminal 采用现代化的技术栈，确保应用的性能、安全性和可维护性。

### 前端架构
- **React 19** - 最新的 UI 框架，提供高效的组件化开发
- **TypeScript** - 类型安全，减少运行时错误
- **Vite 7.0** - 快速的构建工具，提升开发体验
- **Tailwind CSS 4.0** - 实用优先的 CSS 框架
- **shadcn/ui** - 高质量的 UI 组件库
- **Zustand** - 轻量级状态管理
- **xterm.js** - 功能强大的终端模拟器

### 后端架构
- **Tauri 2.4** - 跨平台桌面应用框架
- **Rust 2021** - 系统级编程语言，安全高效
- **russh** - 纯 Rust SSH 实现，支持 Android
- **russh-sftp** - SFTP 协议支持
- **SQLite** - 本地数据存储
- **AES-256-GCM** - 加密算法

### 服务端架构
- **Rust + Axum** - 高性能 Web 框架
- **SeaORM** - ORM 框架
- **Redis** - Token 缓存
- **JWT** - 认证机制

---



---


## 未来规划 (暂时停止开发)

- [ ] 完善 Android 版本
- [ ] 增加 Terraform 支持
- [ ] 支持更多 AI Provider
- [ ] 优化性能和内存占用
- [ ] 集成监控和告警功能
- [ ] 支持团队协作
- [ ] Web 版本
- [ ] 插件系统
- [ ] 自动化工作流

---

## 📈 项目统计

- **首次发布**: 2026年1月
- **当前版本**: 1.2.0
- **支持平台**: Windows, macOS, Linux

---

## 🤝 社区与支持

SSH Terminal 是一个开源项目，欢迎社区贡献和支持。

- **GitHub**: [https://github.com/shenjianZ/ssh-terminal](https://github.com/shenjianZ/ssh-terminal)
- **文档**: [https://st-docs.shenjianl.cn/](https://st-docs.shenjianl.cn/)
- **Discussions**: [参与讨论](https://github.com/shenjianZ/ssh-terminal/discussions)
- **Issues**: [提交问题](https://github.com/shenjianZ/ssh-terminal/issues)

---

## 📄 许可证

SSH Terminal 采用 MIT 许可证，您可以自由使用、修改和分发。

详细内容请查看 [LICENSE](https://github.com/shenjianZ/ssh-terminal/blob/master/LICENSE) 文件。

---

**感谢您选择 SSH Terminal，让远程服务器管理更简单、更智能！** 🎉
