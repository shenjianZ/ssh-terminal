# 安装指南

本文档将指导你在不同平台上安装 SSH Terminal。

---

## 📋 系统要求

### 最低要求
- **操作系统**: Windows 10+, macOS 11+, Linux (Ubuntu 20.04+)
- **内存**: 4GB RAM
- **存储**: 500MB 可用空间
- **网络**: 互联网连接（用于云同步和 AI 功能）

### 推荐配置
- **操作系统**: Windows 11, macOS 12+, Linux (Ubuntu 22.04+)
- **内存**: 8GB RAM
- **存储**: 1GB 可用空间
- **网络**: 稳定的互联网连接

---

## 🪟 Windows 安装

### 方法一：使用安装包（推荐）

1. 访问 [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) 页面
2. 下载最新的 Windows 安装包（`SSH.Terminal_vx.x.x-windows-x86_64-setup.exe`）
3. 双击运行安装程序
4. 按照安装向导完成安装
5. 启动 SSH Terminal

### 方法二：使用 MSI 安装包

1. 访问 [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) 页面
2. 下载最新的 Windows MSI 安装包（`SSH.Terminal_vx.x.x-windows-x86_64.msi`）
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


### 方法一：使用 Debian/Ubuntu 包

**系统要求**：Ubuntu 22.04+ 或 glibc 2.34+

> **⚠️ 重要**：此包需要 glibc 2.34 或更高版本。

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

### 方法二：使用 Fedora/RHEL 包

**系统要求**：Fedora 36+ 或 glibc 2.34+

> **⚠️ 重要**：此包需要 glibc 2.34 或更高版本。

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



## 🔧 验证安装

安装完成后，你可以通过以下方式验证安装是否成功：

1. **启动应用**
   - Windows: 从开始菜单或桌面快捷方式启动
   - macOS: 从 Applications 文件夹或 Launchpad 启动
   - Linux: 从应用菜单或命令行启动

3. **测试功能**
   - 尝试创建一个新的 SSH 连接
   - 测试 AI 助手功能
   - 检查 SFTP 文件管理

---

## 🔄 更新


### 手动更新

1. 访问 [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases)
2. 下载最新版本
3. 覆盖安装

---

## 🗑️ 卸载

### Windows

**使用安装包：**
1. 打开 "控制面板" → "程序和功能"
2. 找到 SSH Terminal
3. 点击 "卸载"


### macOS


**手动卸载：**
1. 删除 Applications 文件夹中的 SSH Terminal
2. 清理配置文件：
   ```bash
   rm -rf ~/Library/Application\ Support/ssh-terminal
   rm -rf ~/Library/Caches/ssh-terminal
   ```

### Linux

**Debian/Ubuntu:**
```bash
sudo apt remove ssh-terminal
```

**Fedora:**
```bash
sudo dnf remove ssh-terminal
```


**通用清理：**
```bash
rm -rf ~/.config/ssh-terminal
rm -rf ~/.cache/ssh-terminal
```

---

## ❓ 常见问题

### Windows

**Q: 安装时提示 "缺少 WebView2"**
A: 安装 [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

**Q: 杀毒软件报毒**
A: SSH Terminal 是安全的开源软件，可以添加到白名单

### macOS

**Q: 提示 "无法打开，因为无法验证开发者"**
A: 右键点击应用 → "打开" → "打开"

**Q: M1/M2 芯片安装问题**
A: 确保下载 ARM64 版本的安装包

### Linux

**Q: AppImage 无法运行**
A: 添加执行权限：`chmod +x SSH-Terminal-x.x.x.AppImage`

**Q: 缺少依赖库**
A: 根据错误信息安装相应的依赖包

---

## 📞 获取帮助

如果安装过程中遇到问题：

1. 查看 [故障排除](/docs/support/troubleshooting) 文档
2. 搜索 [GitHub Issues](https://github.com/shenjianZ/ssh-terminal/issues)
3. 提交新的 [Issue](https://github.com/shenjianZ/ssh-terminal/issues/new)
4. 参与 [GitHub Discussions](https://github.com/shenjianZ/ssh-terminal/discussions)

---

**安装成功后，请继续阅读 [快速开始](/docs/start/quick-start) 文档！** 🚀
