# 故障排除

本文档收集了 SSH Terminal 使用过程中常见的错误和问题，并提供详细的解决方案。

## 目录

- [SSH 连接问题](#ssh-连接问题)
- [终端显示问题](#终端显示问题)
- [AI 功能问题](#ai-功能问题)
- [SFTP 问题](#sftp-问题)
- [云同步问题](#云同步问题)
- [构建和部署问题](#构建和部署问题)
- [性能问题](#性能问题)
- [其他问题](#其他问题)

---

## SSH 连接问题

### 问题 1：SSH 连接失败

**症状**：无法连接到 SSH 服务器，提示「连接失败」

**可能原因**：
1. 主机地址或端口错误
2. 用户名或密码错误
3. SSH 服务未启动
4. 防火墙阻止连接
5. 网络不可达

**解决方案**：

```bash
# 1. 测试网络连通性
ping <host>

# 2. 测试 SSH 端口
telnet <host> 22
# 或
nc -zv <host> 22

# 3. 测试 SSH 连接
ssh <user>@<host>

# 4. 检查 SSH 服务状态（在服务器上）
systemctl status sshd

# 5. 检查防火墙（在服务器上）
sudo ufw status
sudo firewall-cmd --list-all
```

**界面检查**：
1. 检查会话配置中的主机、端口、用户名是否正确
2. 尝试使用系统 SSH 客户端测试连接
3. 检查网络连接是否正常

---

### 问题 2：认证失败

**症状**：连接成功但认证失败，提示「认证失败」

**可能原因**：
1. 密码或私钥错误
2. 私钥权限不当
3. 服务器禁用了该认证方式
4. 用户名错误

**解决方案**：

```bash
# 1. 验证密码
ssh <user>@<host>  # 手动输入密码测试

# 2. 检查私钥权限（Linux/macOS）
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub

# 3. 测试公钥认证
ssh -i ~/.ssh/id_rsa <user>@<host>

# 4. 查看 SSH 服务器日志（在服务器上）
tail -f /var/log/auth.log  # Ubuntu/Debian
tail -f /var/log/secure   # CentOS/RHEL
```

**界面检查**：
1. 确认密码是否正确（注意大小写）
2. 确认私钥路径是否正确
3. 如果私钥有密码，确认密码输入正确
4. 尝试使用其他认证方式

---

### 问题 3：连接频繁断开

**症状**：连接一段时间后自动断开

**可能原因**：
1. 服务器配置了超时断开
2. 网络不稳定
3. 防火墙或 NAT 设备断开空闲连接
4. 未启用心跳保活

**解决方案**：

**客户端配置**：
```typescript
// 在会话配置中启用心跳保活
{
  keepAliveInterval: 30  // 每 30 秒发送一次心跳
}
```

**服务器配置**（在服务器上）：
```bash
# 编辑 /etc/ssh/sshd_config
ClientAliveInterval 60
ClientAliveCountMax 3

# 重启 SSH 服务
sudo systemctl restart sshd
```

**网络检查**：
1. 检查网络连接稳定性
2. 检查路由器/NAT 设备的超时设置
3. 尝试使用有线网络代替 Wi-Fi

---

### 问题 4：主机密钥验证失败

**症状**：提示「主机密钥已改变」或「主机密钥验证失败」

**可能原因**：
1. 服务器重装系统，主机密钥改变
2. 存在中间人攻击
3. 本地保存的密钥过期

**解决方案**：

**界面操作**：
1. 确认服务器是否确实更换了密钥
2. 如果确认安全，点击「更新密钥」
3. 如果不确定，请立即断开连接并调查原因

**命令行操作**：
```bash
# 删除旧的主机密钥
ssh-keygen -R <host>

# 重新连接
ssh <user>@<host>
```

**安全建议**：
- 如果在不确定的情况下，不要信任新的主机密钥
- 联系服务器管理员确认
- 检查是否存在安全威胁

---

## 终端显示问题

### 问题 5：终端输出乱码

**症状**：字符显示乱码或格式错乱

**可能原因**：
1. 服务器编码不是 UTF-8
2. 终端类型不匹配
3. 字体不支持某些字符

**解决方案**：

```bash
# 1. 设置服务器编码为 UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# 2. 永久设置（添加到 ~/.bashrc）
echo 'export LANG=en_US.UTF-8' >> ~/.bashrc
echo 'export LC_ALL=en_US.UTF-8' >> ~/.bashrc

# 3. 重置终端
reset
```

**界面设置**：
1. 在会话配置中设置 `terminalType` 为 `xterm-256color`
2. 选择支持 UTF-8 的字体

---

### 问题 6：终端响应慢

**症状**：输入命令后响应很慢

**可能原因**：
1. 网络延迟高
2. 服务器负载高
3. 终端输出过多
4. 启用了复杂的 Shell 配置

**解决方案**：

```bash
# 1. 检查网络延迟
ping <host>

# 2. 检查服务器负载
top
htop

# 3. 优化 Shell 配置
# 检查 ~/.bashrc 或 ~/.zshrc 中是否有耗时操作

# 4. 使用更快的 Shell
# 考虑使用 dash 代替 bash
```

**界面优化**：
1. 减少终端行数和列数
2. 禁用不必要的终端特性
3. 使用更快的网络连接

---

### 问题 7：特殊键无法使用

**症状**：方向键、Tab 键等无法正常工作

**可能原因**：
1. 终端类型不匹配
2. Shell 配置问题
3. 键盘映射问题

**解决方案**：

```bash
# 1. 检查终端类型
echo $TERM

# 2. 设置正确的终端类型
export TERM=xterm-256color

# 3. 重新加载 Shell 配置
source ~/.bashrc

# 4. 测试按键
# 在终端中按 Ctrl+V，然后按方向键，查看输出
```

**界面设置**：
1. 在会话配置中设置 `terminalType` 为 `xterm-256color`
2. 尝试不同的终端类型（如 `xterm`、`vt100`）

---

## AI 功能问题

### 问题 8：AI 响应超时

**症状**：AI 响应时间过长或超时

**可能原因**：
1. 网络连接问题
2. API 服务器响应慢
3. 请求内容过长
4. API Key 无效

**解决方案**：

```typescript
// 1. 检查网络连接
ping api.openai.com

// 2. 测试 API 连接
curl https://api.openai.com/v1/models

// 3. 检查 API Key
// 在设置页面验证 API Key 是否正确

// 4. 减少 maxTokens
{
  maxTokens: 1024  // 减少输出长度
}

// 5. 切换到更快的 Provider
// 如 Ollama 本地部署
```

**界面操作**：
1. 检查网络连接
2. 切换到其他 AI Provider
3. 减少 `maxTokens` 参数
4. 检查 API Key 是否有效

---

### 问题 9：API Key 无效

**症状**：提示「API Key 无效」或「认证失败」

**可能原因**：
1. API Key 复制错误
2. API Key 已过期
3. API Key 权限不足
4. API 服务器问题

**解决方案**：

1. **检查 API Key**：
   - 确认 API Key 是否正确复制
   - 注意不要有多余的空格
   - 确认使用的是正确的 API Key

2. **重新生成 API Key**：
   - 在 Provider 官网重新生成 API Key
   - 更新配置中的 API Key

3. **检查 API Key 权限**：
   - 确认 API Key 有足够的权限
   - 检查配额是否用完

4. **测试 API Key**：
   ```bash
   # 测试 OpenAI API Key
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

---

### 问题 10：AI 输出中断

**症状**：AI 输出过程中突然中断

**可能原因**：
1. 网络连接中断
2. 达到 Token 限制
3. API 服务器错误
4. 客户端超时

**解决方案**：

```typescript
// 1. 增加 maxTokens
{
  maxTokens: 4096  // 增加输出长度限制
}

// 2. 检查网络稳定性
// 确保网络连接稳定

// 3. 重试请求
// 手动重新发送请求

// 4. 检查 API 错误日志
// 查看具体的错误信息
```

---

## SFTP 问题

### 问题 11：SFTP 传输失败

**症状**：文件上传或下载失败

**可能原因**：
1. 权限不足
2. 磁盘空间不足
3. 文件已存在
4. 网络连接中断

**解决方案**：

```bash
# 1. 检查权限
ls -l /path/to/remote
chmod +w /path/to/remote

# 2. 检查磁盘空间
df -h

# 3. 检查文件是否存在
ls /path/to/file

# 4. 检查网络连接
ping <host>
```

**界面操作**：
1. 检查目标路径是否有写权限
2. 检查磁盘空间是否充足
3. 选择「覆盖」选项
4. 重新开始传输

---

### 问题 12：SFTP 速度慢

**症状**：文件传输速度很慢

**可能原因**：
1. 网络带宽限制
2. 服务器带宽限制
3. 文件数量多
4. 未启用压缩

**解决方案**：

```typescript
// 1. 启用压缩传输
await invoke('sftp_upload_compressed', {
  compression: 'gzip'
});

// 2. 减少同时传输的文件数量
// 逐个传输大文件

// 3. 使用更快的网络连接
// 如有线网络代替 Wi-Fi

// 4. 检查服务器带宽
// 在服务器上运行
iftop
nload
```

---

## 云同步问题

### 问题 13：同步失败

**症状**：提示「同步失败」

**可能原因**：
1. 网络连接问题
2. 服务器不可用
3. Token 过期
4. 数据格式错误

**解决方案**：

```typescript
// 1. 检查网络连接
ping sync.example.com

// 2. 刷新 Token
const newToken = await invoke('auth_refresh_token', {
  refreshToken: 'your-refresh-token'
});

// 3. 重新同步
await invoke('sync_full', {
  serverUrl: 'https://sync.example.com',
  token: newToken
});

// 4. 检查服务器日志
// 在服务器上查看错误日志
```

**界面操作**：
1. 检查网络连接
2. 重新登录同步账号
3. 手动触发同步
4. 查看同步日志

---

### 问题 14：同步冲突过多

**症状**：每次同步都有大量冲突

**可能原因**：
1. 多个设备同时修改同一数据
2. 同步间隔太短
3. 网络延迟导致的数据不一致

**解决方案**：

1. **调整同步策略**：
   ```typescript
   {
     conflictStrategy: 'KeepBoth'  // 保留所有版本
   }
   ```

2. **增加同步间隔**：
   ```typescript
   {
     syncInterval: 60 * 60 * 1000  // 1 小时
   }
   ```

3. **手动解决冲突**：
   - 在同步界面手动解决冲突
   - 选择保留哪个版本

4. **避免同时修改**：
   - 避免在多个设备上同时修改同一数据
   - 修改后等待同步完成

---

## 构建和部署问题

### 问题 15：构建失败

**症状**：`pnpm build` 或 `pnpm tauri build` 失败

**可能原因**：
1. 依赖版本不兼容
2. 系统工具缺失
3. 磁盘空间不足
4. 权限问题

**解决方案**：

```bash
# 1. 清理缓存
pnpm clean
cargo clean

# 2. 重新安装依赖
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# 3. 检查系统工具
# Windows: 确保安装了 Visual Studio Build Tools
# macOS: 确保安装了 Xcode Command Line Tools
# Linux: 确保安装了 build-essential

# 4. 检查磁盘空间
df -h

# 5. 使用管理员权限（Windows）
# 以管理员身份运行终端
```

**常见错误**：

```bash
# 错误：找不到 node
# 解决：确保 Node.js 已安装并添加到 PATH

# 错误：找不到 cargo
# 解决：确保 Rust 已安装并添加到 PATH

# 错误：链接错误
# 解决：安装系统依赖
# Ubuntu: sudo apt-get install build-essential
# macOS: xcode-select --install
```

---

### 问题 16：热更新不工作

**症状**：修改代码后页面不自动更新

**可能原因**：
1. Vite 开发服务器未运行
2. 端口被占用
3. 浏览器缓存问题

**解决方案**：

```bash
# 1. 检查 Vite 开发服务器
pnpm dev

# 2. 检查端口是否被占用
netstat -ano | findstr :1420  # Windows
lsof -i :1420                  # macOS/Linux

# 3. 清除浏览器缓存
# 在浏览器中按 Ctrl+Shift+R 强制刷新

# 4. 重启开发服务器
# 停止服务器（Ctrl+C）
# 重新启动（pnpm dev）
```

---

## 性能问题

### 问题 17：应用启动慢

**症状**：应用启动需要很长时间

**可能原因**：
1. 加载的会话配置太多
2. 数据库查询慢
3. 系统资源不足

**解决方案**：

1. **清理历史数据**：
   - 删除不需要的会话配置
   - 清理传输历史

2. **优化数据库**：
   ```bash
   # SQLite 数据库优化
   cd src-tauri/data
   sqlite3 app.db "VACUUM;"
   ```

3. **增加系统资源**：
   - 增加内存
   - 使用 SSD

4. **禁用不必要的功能**：
   - 禁用自动同步
   - 减少后台任务

---

### 问题 18：内存占用高

**症状**：应用占用大量内存

**可能原因**：
1. 打开了多个终端标签
2. 终端输出过多
3. 内存泄漏

**解决方案**：

1. **关闭不需要的标签**：
   - 关闭不使用的终端标签
   - 定期清理终端输出

2. **限制终端输出**：
   ```typescript
   // 在会话配置中限制终端输出
   {
     scrollback: 1000  // 只保留最近 1000 行
   }
   ```

3. **重启应用**：
   - 定期重启应用释放内存

4. **检查内存泄漏**：
   - 使用浏览器开发者工具检查内存
   - 查看是否有未清理的定时器或事件监听器

---

## 其他问题

### 问题 19：快捷键不工作

**症状**：快捷键无法使用

**可能原因**：
1. 快捷键被其他应用占用
2. 快捷键配置错误
3. 系统快捷键冲突

**解决方案**：

1. **检查快捷键配置**：
   - 在设置页面查看快捷键配置
   - 确认快捷键是否正确设置

2. **检查快捷键冲突**：
   - 尝试使用不同的快捷键
   - 检查是否有其他应用占用该快捷键

3. **重置快捷键**：
   - 在设置页面重置为默认快捷键

---

### 问题 20：界面显示异常

**症状**：界面显示不正常，布局错乱

**可能原因**：
1. 浏览器缩放问题
2. 系统主题冲突
3. 缓存问题

**解决方案**：

1. **调整浏览器缩放**：
   - 恢复浏览器缩放为 100%

2. **切换主题**：
   - 尝试切换不同的主题
   - 检查是否是系统主题冲突

3. **清除缓存**：
   ```bash
   # 清除应用缓存
   # 在设置页面清除缓存

   # 重新安装应用
   ```

---

## 获取帮助

如果以上解决方案都无法解决你的问题，可以通过以下方式获取帮助：

1. **查看文档**：
   - [项目文档](https://github.com/shenjianZ/ssh-terminal)
   - [API 文档](https://github.com/shenjianZ/ssh-terminal-server)

2. **搜索 Issue**：
   - 在 GitHub Issues 中搜索类似问题
   - 查看是否有已知的解决方案

3. **提交 Issue**：
   - 在 GitHub 提交新的 Issue
   - 提供详细的错误信息和复现步骤

4. **社区支持**：
   - 加入社区讨论
   - 寻求其他用户的帮助

---

## 相关资源

- [FAQ](./faq.md) - 常见问题
- [SSH 连接管理](../guide/ssh-connection.md) - SSH 连接指南
- [AI 智能助手](../guide/ai-assistant.md) - AI 使用指南
- [配置说明](../config/settings.md) - 配置详解