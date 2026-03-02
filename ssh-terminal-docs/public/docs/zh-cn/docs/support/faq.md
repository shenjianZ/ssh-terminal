# 常见问题（FAQ）

本文档汇总了 SSH Terminal 的常见问题和解答。

---



### Q: 配置文件位置在哪里

**A:** tauri客户端配置文件在家目录的`.tauri-terminal`下

## 

```
~\.tauri-terminal\
├── recording                # 录制文件目录
├── ai_chat_history.json     # AI历史对话文件
├── ai_config.json           # AI 配置文件
├── app_config.json          # 应用配置文件
├── sessions.json            # 会话配置文件
└── shortcuts.json           # 快捷键配置文件
└── ssh_terminal.db          # sqlite数据库文件
```

### Q: Windows 安装时提示缺少 WebView2

**A:** WebView2 是 Windows 上运行 Tauri 应用的必需组件。

**解决方法：**
1. 下载并安装 [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
2. 重启计算机
3. 重新安装 SSH Terminal

---

### Q: macOS 提示"无法打开，因为无法验证开发者"

**A:** 这是 macOS 的安全机制。

**解决方法：**
1. 右键点击 SSH Terminal 应用
2. 选择"打开"
3. 再次点击"打开"确认
4. 或在系统偏好设置中允许应用运行

---

### Q: Linux AppImage 无法运行

**A:** 需要添加执行权限。

**解决方法：**
```bash
chmod +x SSH-Terminal-x.x.x.AppImage
./SSH-Terminal-x.x.x.AppImage
```

---

### Q: 从源码构建失败

**A:** 可能是依赖或工具版本问题。

**解决方法：**
1. 检查 Node.js 版本（需要 18+）
2. 检查 Rust 版本（需要 1.70+）
3. 清除缓存重新构建：
   ```bash
   rm -rf node_modules
   pnpm install
   cd src-tauri
   cargo clean
   cargo build
   ```

---


### Q: 无法连接到服务器

**A:** 可能的原因和解决方法：

**排查步骤：**
1. 检查网络连接：
   ```bash
   ping server.com
   ```

2. 检查 SSH 服务是否运行：
   ```bash
   ssh -v user@server.com
   ```

3. 检查防火墙设置：
   ```bash
   sudo ufw status
   ```

4. 验证服务器地址和端口

---

### Q: 认证失败，无法登录

**A:** 可能是密码或密钥问题。

**解决方法：**
1. 验证用户名和密码
2. 检查 SSH 密钥权限：
   ```bash
   chmod 600 ~/.ssh/id_rsa
   chmod 644 ~/.ssh/id_rsa.pub
   ```
3. 确认密钥密码正确
4. 查看服务器认证日志：
   ```bash
   sudo tail -f /var/log/auth.log
   ```

---

### Q: 连接超时

**A:** 可能是网络延迟或防火墙问题。

**解决方法：**
1. 增加连接超时时间
2. 检查网络延迟：
   ```bash
   ping -c 10 server.com
   ```
3. 检查防火墙规则
4. 尝试使用不同的网络

---

### Q: 主机密钥验证失败

**A:** 主机密钥已更改。

**解决方法：**
1. 删除旧的主机密钥：
   ```bash
   ssh-keygen -R server.com
   ```
2. 重新连接，接受新的主机密钥
3. 或在设置中禁用严格主机密钥验证（不推荐）

---

### Q: 如何切换终端主题

**A:** 有多种方法切换主题：

1. 点击底部工具栏的"主题"按钮
2. 右键终端 → "设置" → "主题"
3. 使用快捷键（如适用）
4. 在全局设置中设置默认主题

---

### Q: 如何复制粘贴文本

**A:** 复制粘贴方法：

**复制：**
- 选中文本后按 `Ctrl+C`
- 右键 → "复制"

**粘贴：**
- 按 `Ctrl+V`
- 右键 → "粘贴"
- 中键点击（Linux）

---

### Q: 如何录制终端操作

**A:** 使用录制功能：

1. 点击底部工具栏的"录制"按钮
2. 执行你的操作
3. 点击"停止"结束录制
4. 在录制管理中查看和播放

---

### Q: 如何导出截图

**A:** 使用截图功能：

1. 点击底部工具栏的"截图"按钮
2. 选择截图区域
3. 保存为 SVG 或 PNG 格式
4. 或使用快捷键 `Ctrl+Shift+S`

---

## AI 功能问题

### Q: AI 助手无响应

**A:** 可能是 API 配置或网络问题。

**解决方法：**
1. 检查 API Key 是否正确
2. 验证网络连接
3. 查看错误日志
4. 尝试不同的 AI Provider

---

### Q: AI 响应速度慢

**A:** 可能是网络或 API 限制。

**优化方法：**
1. 启用 AI 缓存
2. 使用更快的网络
3. 选择更快的模型
4. 减少 Token 数量

---

### Q: 如何配置多个 AI Provider

**A:** 在 AI 设置中配置多个 Provider：

1. 点击 AI 助手 → "设置"
2. 点击"添加 Provider"
3. 选择 Provider 类型
4. 输入配置信息
5. 保存配置
6. 可以设置默认 Provider

---


### Q: 应用启动慢

**A:** 可能是配置或资源问题。

**优化方法：**
1. 清除应用缓存
2. 减少启动时加载的会话
3. 禁用不必要的插件
4. 更新到最新版本

---

### Q: 终端响应慢

**A:** 可能是网络或渲染问题。

**优化方法：**
1. 减少滚动缓冲区大小
2. 启用 SSH 压缩
3. 使用更快的主题
4. 关闭不必要的功能

---

### Q: 文件传输速度慢

**A:** 可能是网络或配置问题。

**优化方法：**
1. 使用并行传输
2. 启用压缩
3. 使用更快的网络
4. 调整块大小

---


### Q: 密码是否安全存储

**A:** 是的，使用 AES-256-GCM 加密。

**安全措施：**
- 密码使用 AES-256-GCM 加密
- 密钥使用 Argon2 派生
- 敏感信息不写入日志
- 支持主密码保护

---

### Q: 如何保护 SSH 密钥

**A:** 密钥保护建议：

1. 为密钥设置密码
2. 使用不同的密钥
3. 定期轮换密钥
4. 不要将密钥提交到版本控制
5. 使用硬件安全模块（HSM）

---

### Q: 云同步是否安全

**A:** 是的，使用端到端加密。

**安全措施：**
- 数据使用 TLS 加密传输
- 数据在服务器端加密存储
- 支持用户自托管
- 可选禁用云同步

---


### Q: 如何报告 Bug

**A:** 通过 GitHub Issues 报告：

1. 访问 [GitHub Issues](https://github.com/shenjianZ/ssh-terminal/issues)
2. 点击"New Issue"
3. 选择问题类型
4. 填写问题描述和复现步骤
5. 提交 Issue

---

### Q: 如何请求新功能

**A:** 通过 GitHub Issues 或 Discussions：

1. 搜索现有 Feature Request
2. 如果没有，创建新的 Issue
3. 详细描述功能需求
4. 说明使用场景

---

### Q: 如何贡献代码

**A:** 参考贡献者指南：

1. Fork 仓库
2. 创建特性分支
3. 提交代码
4. 创建 Pull Request

详细步骤请查看 [贡献者指南](/contributing/setup)。

---

## 获取更多帮助

如果以上 FAQ 没有解决你的问题：

- 📖 查看 [故障排除](/support/troubleshooting) 文档
- 🔍 搜索 [GitHub Issues](https://github.com/shenjianZ/ssh-terminal/issues)
- 💬 参与 [GitHub Discussions](https://github.com/shenjianZ/ssh-terminal/discussions)
- 📧 发送邮件至 support@ssh-terminal.dev

---

**希望这些 FAQ 能帮助你解决问题！** 🎉
