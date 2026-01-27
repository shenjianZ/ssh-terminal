# SSH Terminal - 项目上下文文档

## 项目概述

SSH Terminal 是一个基于 Tauri + React 的现代化 SSH 终端客户端应用，提供跨平台的 SSH 连接管理功能。该应用支持多会话管理、终端模拟、会话持久化、主题切换等功能，采用现代化的前端技术栈和 Rust 后端，提供安全、高效的 SSH 远程连接体验。

### 核心特性

- **多会话管理**：支持同时管理多个 SSH 连接，使用标签页切换
- **终端模拟**：基于 xterm.js 提供完整的终端模拟体验
- **会话持久化**：保存 SSH 连接配置，方便快速重连
- **主题支持**：支持多种终端主题和深色模式切换
- **现代化 UI**：使用 shadcn/ui 组件库，提供美观、可访问的界面
- **跨平台**：支持 Windows、macOS、Linux

## 技术栈

### 前端技术栈

- **React 19**：最新的 React 版本，支持现代特性
- **TypeScript 5.8+**：完整的类型安全支持
- **shadcn/ui**：美观、可访问的 UI 组件库
- **Tailwind CSS 4.0**：实用优先的 CSS 框架
- **Zustand**：轻量级状态管理库
- **React Router 7**：前端路由管理
- **xterm.js**：终端模拟器核心库
- **React Hook Form + Zod**：表单管理和验证

### 后端技术栈

- **Rust**：高性能、安全的系统编程语言
- **Tauri 2.0**：跨平台桌面应用框架
- **tokio**：异步运行时
- **portable-pty**：跨平台 PTY 支持
- **serde**：序列化/反序列化

### 开发工具

- **pnpm**：快速、节省磁盘空间的包管理器
- **Vite**：现代化的前端构建工具
- **ESLint**：代码质量检查和格式化
- **TypeScript**：类型检查

## 项目结构

```
terminal/
├── src/                           # React 前端源码
│   ├── components/                # UI 组件
│   │   ├── layout/               # 布局组件
│   │   │   ├── MainLayout.tsx    # 主布局
│   │   │   ├── Sidebar.tsx       # 侧边栏
│   │   │   └── TopBar.tsx        # 顶部栏
│   │   ├── session/              # 会话管理组件
│   │   │   ├── EditSessionDialog.tsx
│   │   │   ├── QuickConnect.tsx
│   │   │   ├── QuickConnectDialog.tsx
│   │   │   ├── SaveSessionDialog.tsx
│   │   │   ├── SessionCard.tsx
│   │   │   └── SessionToolbar.tsx
│   │   ├── settings/             # 设置组件
│   │   │   └── TerminalSettings.tsx
│   │   ├── ssh/                  # SSH 相关组件
│   │   │   ├── ConnectionStatusBadge.tsx
│   │   │   └── HostKeyConfirmDialog.tsx
│   │   ├── terminal/             # 终端组件
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── TabBar.tsx
│   │   │   └── XTermWrapper.tsx
│   │   ├── recording/            # 录制相关组件
│   │   │   ├── RecordingControls.tsx
│   │   │   ├── RecordingIndicator.tsx
│   │   │   ├── RecordingManager.tsx
│   │   │   └── VideoExportDialog.tsx
│   │   ├── sftp/                 # SFTP 组件
│   │   ├── keybindings/          # 快捷键设置组件
│   │   └── ui/                   # shadcn/ui 基础组件
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── slider.tsx
│   │       ├── switch.tsx
│   │       └── tabs.tsx
│   ├── config/                   # 配置文件
│   │   └── themes.ts             # 主题配置
│   ├── lib/                      # 工具函数和库
│   │   ├── audio/                # 音频相关
│   │   │   ├── AudioCaptureManager.ts
│   │   │   └── pcm-processor.worklet.ts
│   │   ├── recorder/             # 录制相关
│   │   │   ├── VideoRecorder.ts
│   │   │   ├── TerminalRecorder.ts
│   │   │   ├── VideoExporter.ts
│   │   │   ├── PlaybackEngine.ts
│   │   │   └── RecordingFormat.ts
│   │   ├── sounds.ts             # 音效管理
│   │   ├── keybindingActions.ts  # 快捷键动作
│   │   └── utils.ts              # 通用工具函数
│   ├── pages/                    # 页面组件
│   │   ├── SessionManager.tsx    # 会话管理页面
│   │   ├── Settings.tsx          # 设置页面
│   │   ├── SftpManager.tsx       # SFTP 管理页面
│   │   └── Terminal.tsx          # 终端页面
│   ├── store/                    # Zustand 状态管理
│   │   ├── sessionStore.ts       # 会话状态管理
│   │   ├── terminalConfigStore.ts # 终端配置状态管理
│   │   ├── terminalStore.ts      # 终端状态管理
│   │   ├── recordingStore.ts     # 录制状态管理
│   │   ├── sftpStore.ts         # SFTP 状态管理
│   │   └── keybindingStore.ts   # 快捷键状态管理
│   ├── types/                    # TypeScript 类型定义
│   │   ├── ssh.ts                # SSH 相关类型
│   │   ├── terminal.ts           # 终端相关类型
│   │   └── recording.ts          # 录制相关类型
│   ├── App.tsx                   # 主应用组件
│   ├── index.css                 # 全局样式
│   └── main.tsx                  # 应用入口
├── src-tauri/                    # Rust 后端源码
│   ├── src/
│   │   ├── commands/             # Tauri 命令
│   │   │   ├── mod.rs
│   │   │   ├── session.rs        # 会话管理命令
│   │   │   ├── storage.rs        # 存储命令
│   │   │   ├── terminal.rs       # 终端命令
│   │   │   ├── audio.rs         # 音频捕获命令
│   │   │   └── recording.rs     # 录制命令
│   │   ├── config/               # 配置管理
│   │   │   ├── mod.rs
│   │   │   └── storage.rs
│   │   ├── ssh/                  # SSH 管理
│   │   │   ├── mod.rs
│   │   │   ├── manager.rs        # SSH 管理器
│   │   │   ├── session.rs        # SSH 会话
│   │   │   ├── connection.rs     # SSH 连接实例
│   │   │   ├── backend.rs        # SSH 后端抽象
│   │   │   ├── backends/         # SSH 后端实现
│   │   │   │   ├── system_ssh.rs # 系统 SSH 实现
│   │   │   │   └── russh.rs     # Russh 纯 Rust 实现
│   │   │   └── pty/             # PTY 支持
│   │   ├── audio/                 # 音频捕获
│   │   │   ├── mod.rs
│   │   │   └── capturer.rs       # 系统音频捕获器
│   │   ├── sftp/                 # SFTP 实现
│   │   ├── error.rs              # 错误处理
│   │   ├── lib.rs                # 库入口
│   │   └── main.rs               # 应用入口
│   ├── capabilities/             # Tauri 权限配置
│   │   └── default.json
│   ├── Cargo.toml                # Rust 依赖配置
│   ├── build.rs                  # 构建脚本
│   └── tauri.conf.json           # Tauri 配置
├── components.json               # shadcn/ui 配置
├── package.json                  # Node.js 依赖
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 配置
└── README.md                     # 项目文档
```

## 构建和运行

### 环境要求

- **Node.js** 18+
- **pnpm** 10.14.0+
- **Rust** 1.70+
- **系统 SSH 客户端**（Windows 需要 Git Bash 或 WSL）

### 安装依赖

```bash
pnpm install
```

### 开发模式

启动开发服务器（同时运行前端和后端）：

```bash
pnpm tauri dev
```

这将：
1. 启动 Vite 开发服务器（端口 1420）
2. 启动 Tauri 应用窗口
3. 启用热模块替换（HMR）

### 前端开发（仅开发前端）

```bash
pnpm dev
```

### 生产构建

构建生产版本：

```bash
pnpm tauri build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录。

### 测试

#### 前端类型检查

```bash
# 运行 TypeScript 类型检查
pnpm tsc --noEmit
```

#### 代码质量检查

```bash
# 运行 ESLint 检查
pnpm lint

# 自动修复 ESLint 问题
pnpm lint:fix
```

#### Rust 后端检查

```bash
# Rust 代码检查（在 src-tauri 目录下）
cd src-tauri
cargo check
cargo clippy

# 运行 Rust 测试
cargo test
```

TODO: 添加端到端测试和前端单元测试

## 开发约定

### 代码风格

#### 前端 (React + TypeScript)

- **组件命名**：使用 PascalCase（如 `MainLayout.tsx`）
- **文件命名**：使用 PascalCase（组件）、camelCase（工具函数）
- **类型定义**：使用 `interface` 定义对象类型，使用 `type` 定义联合类型
- **导入顺序**：
  1. React 相关
  2. 第三方库
  3. 本地组件（使用 `@/` 别名）
  4. 本地工具函数和类型
- **使用 shadcn/ui 组件**：优先使用 `src/components/ui/` 中的组件
- **状态管理**：使用 Zustand 进行全局状态管理，遵循单一数据源原则

#### 后端 (Rust)

- **命名风格**：遵循 Rust 命名规范
  - 类型、结构体、枚举：PascalCase
  - 函数、变量、模块：snake_case
  - 常量：SCREAMING_SNAKE_CASE
- **错误处理**：使用 `Result<T, E>` 和自定义错误类型（定义在 `error.rs`）
- **异步编程**：使用 `async/await` 和 `tokio` 运行时
- **Tauri 命令**：
  - 使用 `#[tauri::command]` 宏标记命令函数
  - 命令参数和返回值必须实现 `serde::Serialize` 和 `serde::Deserialize`
  - 在 `lib.rs` 中注册命令

### 文件组织

- **组件**：按功能模块组织，每个组件包含相关的样式和逻辑
- **状态管理**：每个功能模块对应一个 Zustand store
- **类型定义**：集中定义在 `src/types/` 目录
- **配置**：集中管理在 `src/config/` 目录

### Git 提交规范

使用清晰的提交信息：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：
- `feat`：新功能
- `fix`：Bug 修复
- `docs`：文档更新
- `style`：代码格式（不影响功能）
- `refactor`：重构
- `test`：测试相关
- `chore`：构建/工具相关

示例：
```
feat(terminal): add support for multiple terminal tabs

Implement tab management for SSH sessions, allowing users to
switch between multiple active connections.

Closes #123
```

### 代码审查要点

- **类型安全**：确保所有代码通过 TypeScript 类型检查
- **错误处理**：所有异步操作必须有错误处理
- **用户体验**：提供加载状态、错误提示等反馈
- **性能优化**：避免不必要的重渲染，使用 `useMemo`、`useCallback` 等
- **可访问性**：使用语义化 HTML 和 ARIA 属性

## 核心功能实现

### SSH 连接管理

SSH 连接通过 Rust 后端的 `SSHManager` 管理，使用系统 SSH 命令和 PTY（伪终端）实现。

**关键文件**：
- `src-tauri/src/ssh/manager.rs`：SSH 管理器实现
- `src-tauri/src/ssh/session.rs`：SSH 会话实现
- `src-tauri/src/commands/session.rs`：Tauri 命令接口

**流程**：
1. 前端调用 `ssh_create_session` 创建会话配置
2. 前端调用 `ssh_connect` 建立连接
3. 后端创建 PTY 并启动 SSH 进程
4. 后端通过事件 `ssh-output-{sessionId}` 向前端发送终端输出
5. 前端调用 `ssh_write` 向终端发送输入
6. 前端调用 `ssh_resize_pty` 调整终端大小

### 终端模拟

使用 xterm.js 实现终端模拟，支持 ANSI 转义序列、颜色、光标控制等。

**关键文件**：
- `src/components/terminal/XTermWrapper.tsx`：xterm.js 包装组件
- `src/store/terminalStore.ts`：终端状态管理

**特性**：
- 支持多个终端实例（标签页）
- 自动适应窗口大小
- 支持 WebGL 渲染（可选）
- 支持搜索功能

### 会话持久化

会话配置通过 Tauri 的文件系统 API 持久化到本地。

**关键文件**：
- `src-tauri/src/commands/storage.rs`：存储命令实现
- `src-tauri/src/config/storage.rs`：存储配置管理

**存储位置**：
- Windows：`%APPDATA%\com.shenjianz.ssh-terminal\`
- macOS：`~/Library/Application Support/com.shenjianz.ssh-terminal/`
- Linux：`~/.config/com.shenjianz.ssh-terminal/`

### 主题系统

支持多种终端主题，使用 CSS 变量实现主题切换。

**关键文件**：
- `src/config/themes.ts`：主题配置
- `src/components/theme-provider.tsx`：主题提供者
- `src/store/terminalConfigStore.ts`：主题状态管理

**可用主题**：
- One Dark
- Solarized Dark
- Solarized Light
- Dracula
- Monokai
- Nord
- Tokyo Night
- GitHub Light

### 终端录制系统

终端录制系统支持视频+音频的完整录制能力，使用混合架构实现。

**录制架构**：

**视频录制**：
- 从 xterm.js 的 Canvas 捕获画面（`canvas.captureStream(30)`）
- 使用 WebGL 渲染器（`WebglAddon`）提高性能
- 使用 MediaRecorder API 编码为 WebM (VP9/VP8) 或 MP4 (H.264)
- 支持三种质量：Low (500 kbps), Medium (2 Mbps), High (5 Mbps)

**音频录制**：
- **麦克风录制**：前端使用 `navigator.mediaDevices.getUserMedia()`
  - 单声道，48kHz 采样率
  - 支持回声消除、噪声抑制、自动增益控制
- **扬声器录制**：后端 Rust 使用 Windows WASAPI Loopback Recording
  - 通过 cpal 库捕获默认输出设备的 loopback 音频
  - 使用 AudioWorklet 处理 PCM 数据
  - 关键配置：
    - 音频缓冲区：300 个包（约 5 秒）
    - 音频包大小：960 样本（20ms @ 48kHz）
    - 音量增益：2.0x（WASAPI Loopback 捕获音量较低）
    - 使用阻塞发送 `sender.send()` 防止丢包

**事件录制**：
- 记录所有终端交互事件（input/output/resize/metadata）
- 支持回放功能
- 用于录制文件格式（JSON）和视频导出

**关键文件**：

前端录制组件：
- `src/lib/recorder/VideoRecorder.ts` - 视频录制器
- `src/lib/recorder/TerminalRecorder.ts` - 事件录制器
- `src/lib/recorder/VideoExporter.ts` - 视频导出器
- `src/lib/recorder/PlaybackEngine.ts` - 回放引擎
- `src/lib/recorder/RecordingFormat.ts` - 格式工具

前端音频组件：
- `src/lib/audio/AudioCaptureManager.ts` - 音频捕获管理器
- `src/lib/audio/pcm-processor.worklet.ts` - PCM 音频处理器（AudioWorklet）

前端 UI 组件：
- `src/components/recording/RecordingControls.tsx` - 录制控制
- `src/components/recording/RecordingIndicator.tsx` - 录制指示器
- `src/components/recording/RecordingManager.tsx` - 录制文件管理
- `src/components/recording/VideoExportDialog.tsx` - 视频导出对话框

后端录制相关：
- `src-tauri/src/audio/capturer.rs` - 系统音频捕获器（Windows WASAPI）
- `src-tauri/src/audio/mod.rs` - 音频模块导出
- `src-tauri/src/commands/audio.rs` - 音频命令（启动/停止/列表设备）
- `src-tauri/src/commands/recording.rs` - 录制命令（保存/加载视频）

状态管理：
- `src/store/recordingStore.ts` - 录制会话和文件管理

**音频录制优化要点**：

当调试或改进音频录制时，注意以下关键配置：

1. **音频缓冲区大小** (`src-tauri/src/commands/audio.rs:32`)
   - 当前设置：300 个音频包（约 5 秒）
   - 过小会导致数据丢失，过大会增加延迟

2. **音频包大小** (`src-tauri/src/audio/capturer.rs:78-94`)
   - 当前设置：960 样本（20ms @ 48kHz）
   - 影响 Tauri IPC 事件频率和 CPU 使用率

3. **音量增益** (`src-tauri/src/audio/capturer.rs`)
   - 扬声器默认增益：2.0x（WASAPI Loopback 音量较低）
   - 增益后限制在 [-1.0, 1.0] 防止削波

4. **发送模式** (`src-tauri/src/audio/capturer.rs:174`)
   - 使用阻塞发送 `sender.send()` 确保不丢包
   - 不要使用 `try_send()`，缓冲区满时会直接丢弃数据

5. **前端 Worklet 缓冲区** (`src/lib/audio/pcm-processor.worklet.ts`)
   - 缓冲区大小：288000 样本（3 秒）
   - 包含缓冲区使用率监控日志（每 5 秒报告一次）

**完整录制流程**：

1. **准备阶段**：捕获初始终端内容（包括提示符）
2. **倒计时**：2 秒倒计时
3. **启动录制**：
   - `TerminalRecorder` 开始记录事件
   - `VideoRecorder` 开始从 Canvas 捕获视频流
   - `AudioCaptureManager` 开始捕获音频（麦克风 + 扬声器）
4. **录制中**：
   - 终端输出同时写入 VideoRecorder
   - 麦克风和扬声器音频通过 AudioContext 混合
   - MediaRecorder 将视频+音频流编码为 WebM/MP4
5. **停止录制**：
   - 停止所有录制器
   - 保存录制文件（JSON）
   - 保存视频 Blob 到磁盘
   - 清理资源

### SFTP 文件传输系统

应用包含完整的 SFTP 文件传输功能，支持双窗格文件管理。

**关键文件**：
- `src-tauri/src/sftp/` - SFTP 后端实现
- `src-tauri/src/ssh/backends/russh.rs` - Russh SFTP 通道
- `src/components/sftp/` - SFTP 前端组件
- `src/store/sftpStore.ts` - SFTP 状态管理

**特性**：
- 双窗格文件浏览（本地/远程）
- 文件上传/下载
- 目录创建/删除
- 文件重命名
- 文件权限管理
- 传输进度显示

### 快捷键系统

应用支持丰富的快捷键配置，详见 `docs/Shortcuts.md`。

**关键文件**：
- `src/store/keybindingStore.ts` - 快捷键状态管理
- `src/lib/keybindingActions.ts` - 快捷键动作定义
- `src/components/keybindings/` - 快捷键设置 UI

**快捷键范围**：
- 全局快捷键（如 Ctrl+T 新建标签）
- 终端快捷键（复制、粘贴等）
- SFTP 快捷键
- 录制快捷键

### russh 纯 Rust SSH 后端

除了系统 SSH 后端，项目还集成了 russh 纯 Rust SSH 实现。

**关键文件**：
- `src-tauri/src/ssh/backends/russh.rs` - Russh SSH 后端实现
- `src-tauri/src/ssh/backends/sftp_channel.rs` - SFTP 通道实现

**特性**：
- 纯 Rust 实现，不依赖系统 SSH
- 支持所有标准 SSH 功能
- 内置 SFTP 支持
- 更好的跨平台兼容性

## 常见任务

### 添加新的 shadcn/ui 组件

```bash
npx shadcn@latest add [component-name]
```

示例：
```bash
npx shadcn@latest add toast
```

### 添加新的 Tauri 命令

1. 在 `src-tauri/src/commands/` 中创建或编辑命令文件
2. 使用 `#[tauri::command]` 宏标记函数
3. 在 `src-tauri/src/lib.rs` 的 `invoke_handler` 中注册命令
4. 在前端使用 `invoke('command_name', { params })` 调用

示例：

```rust
// src-tauri/src/commands/example.rs
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

```typescript
// 前端调用
import { invoke } from '@tauri-apps/api/core';
const message = await invoke('greet', { name: 'World' });
```

### 添加新的页面

1. 在 `src/pages/` 创建页面组件
2. 在 `src/App.tsx` 的 `Routes` 中添加路由
3. 在侧边栏添加导航链接（如果需要）

### 修改主题

编辑 `src/config/themes.ts` 中的主题配置，或添加新主题。

### 调试

- **前端调试**：开发模式下自动打开 DevTools
- **后端调试**：使用 `println!` 输出日志，或集成 `tracing` 库
- **Tauri 日志**：日志输出到终端和应用日志文件

## 故障排查

### 常见问题

1. **SSH 连接失败**
   - 检查系统 SSH 客户端是否安装
   - 检查主机、端口、用户名是否正确
   - 检查认证方式（密码或密钥）是否正确

2. **终端输出乱码**
   - 检查终端编码设置
   - 确保远程服务器使用 UTF-8 编码

3. **构建失败**
   - 确保 Rust 和 Node.js 版本符合要求
   - 清理缓存：`pnpm clean` 或 `cargo clean`

4. **热更新不工作**
   - 检查 Vite 开发服务器是否正常运行
   - 检查端口 1420 是否被占用

5. **扬声器录制质量差或无声**
   - 检查系统音频输出设备是否正常工作
   - 确认音频在扬声器录制前有声音输出
   - 查看浏览器控制台 `[PCMProcessor] Buffer stats` 日志
     - 如果 `underflowSamples` 持续 > 0，说明缓冲区为空
     - 如果 `usage` 持续 > 90%，说明缓冲区积压
   - 检查 Rust 后端日志，确认音频捕获是否正常启动
   - Windows 用户：确保使用 WASAPI Loopback 模式（默认）

6. **音频录制延迟**
   - 减小音频缓冲区大小（`src-tauri/src/commands/audio.rs:32`）
   - 减小音频包大小（`src-tauri/src/audio/capturer.rs` 的 `buffer_size`）

7. **录制视频卡顿**
   - 降低视频质量设置（Low/Medium）
   - 使用 WebGL 渲染器（已默认启用）
   - 检查 Canvas 捕获帧率（默认 30 FPS）

8. **录制文件过大**
   - 降低视频质量设置
   - 缩短录制时长
   - 使用 Medium 或 Low 音频质量

## 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/my-feature`
3. 提交更改：`git commit -m 'feat: add my feature'`
4. 推送到分支：`git push origin feature/my-feature`
5. 创建 Pull Request

## 许可证

MIT License

## 相关资源

- [Tauri 文档](https://tauri.app/)
- [React 文档](https://react.dev/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [xterm.js 文档](https://xtermjs.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)

---

**最后更新**：2026年1月27日