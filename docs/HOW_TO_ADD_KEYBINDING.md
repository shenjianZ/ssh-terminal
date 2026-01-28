# 如何添加新的快捷键

本文档说明如何在该 SSH 终端项目中添加新的快捷键。

## 目录

- [系统架构概述](#系统架构概述)
- [添加新快捷键的步骤](#添加新快捷键的步骤)
- [完整示例](#完整示例)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 系统架构概述

项目的快捷键系统由以下几个部分组成：

### 1. 类型定义 (`src/types/keybinding.ts`)
- `KeyCombination` - 快捷键组合的数据结构
- `KeybindingAction` - 快捷键动作的定义
- `KeybindingScope` - 快捷键生效范围（全局/终端/会话/SFTP/设置）
- `KEYBINDING_ACTIONS` - 所有可用的快捷键动作列表

### 2. 默认配置 (`src/config/defaultKeybindings.ts`)
- `DEFAULT_KEYBINDINGS` - 默认快捷键映射
- `KEYBINDING_PRESETS` - 预设方案（VSCode/Terminal/Vim 风格）

### 3. 执行器 (`src/lib/keybindingActions.ts`)
- `KeybindingActionExecutor` - 快捷键动作执行器
- 将动作ID映射到实际的操作逻辑

### 4. 全局处理器 (`src/lib/globalKeyHandler.ts`)
- `GlobalKeyHandler` - 全局快捷键监听器
- 路由检查、作用域管理、事件拦截

### 5. Store (`src/store/keybindingStore.ts`)
- 快捷键配置的持久化
- 冲突检查、导入导出

---

## 添加新快捷键的步骤

### 步骤 1: 在类型定义中添加动作

在 `src/types/keybinding.ts` 的 `KEYBINDING_ACTIONS` 数组中添加新动作：

```typescript
{
  id: 'your.action.id',
  name: '动作名称',
  description: '动作描述',
  category: 'global' | 'terminal' | 'session' | 'sftp' | 'other',
  defaultKeybinding: {
    ctrl: true,
    alt: false,
    shift: false,
    key: 'KeyK'
  },
}
```

**参数说明：**
- `id`: 唯一标识符，使用 `类别.动作名` 格式（如 `terminal.find`）
- `name`: 显示名称，在设置界面显示
- `description`: 详细描述
- `category`: 分类，决定在哪个页面生效
- `defaultKeybinding`: 默认快捷键组合
  - `ctrl`: Ctrl 键（Mac 上是 Cmd）
  - `alt`: Alt 键（Mac 上是 Option）
  - `shift`: Shift 键
  - `key`: 按键代码（使用 `KeyboardEvent.code`）

**常用的按键代码：**
```
字母键: KeyA, KeyB, KeyC, ...
数字键: Digit0, Digit1, Digit2, ...
功能键: F1, F2, F3, ..., F12
特殊键: Tab, Enter, Escape, Backspace, Space, ...
```

### 步骤 2: 添加默认快捷键配置

在 `src/config/defaultKeybindings.ts` 中添加默认配置：

```typescript
export const DEFAULT_KEYBINDINGS: Record<string, KeyCombination> = {
  // ... 其他配置
  'your.action.id': { ctrl: true, alt: false, shift: false, key: 'KeyK' },
};
```

**注意：** 如果使用预设方案，也需要在各个预设中添加相同的配置。

### 步骤 3: 添加作用域限制

在 `src/lib/globalKeyHandler.ts` 的 `ACTION_SCOPES` 中添加作用域：

```typescript
const ACTION_SCOPES: Record<string, KeybindingScope> = {
  // ... 其他映射
  'your.action.id': KeybindingScope.Terminal, // 选择合适的作用域
};
```

**作用域类型：**
- `KeybindingScope.Global` - 全局生效
- `KeybindingScope.Terminal` - 仅终端页面
- `KeybindingScope.Session` - 仅会话管理页面
- `KeybindingScope.SFTP` - 仅 SFTP 页面
- `KeybindingScope.Settings` - 仅设置页面

### 步骤 4: 实现执行器方法

在 `src/lib/keybindingActions.ts` 中：

1. 在 `switch` 语句中添加 case：

```typescript
async execute(actionId: string): Promise<boolean> {
  switch (actionId) {
    // ... 其他 case
    case 'your.action.id':
      return this.executeYourAction();
  }
}
```

2. 实现执行方法：

```typescript
/**
 * 你的动作描述
 */
private async executeYourAction(): Promise<boolean> {
  try {
    // 方式 1: 触发自定义事件（推荐）
    const event = new CustomEvent('keybinding-your-action', {
      detail: { /* 传递的数据 */ }
    });
    window.dispatchEvent(event);
    console.log('[KeybindingExecutor] Triggered your action');
    return true;
  } catch (error) {
    console.error('[KeybindingExecutor] Error executing your action:', error);
    return false;
  }
}
```

**两种实现方式：**

**方式 1: 自定义事件（推荐）**
```typescript
// 在 keybindingActions.ts 中触发事件
const event = new CustomEvent('keybinding-your-action');
window.dispatchEvent(event);

// 在组件中监听
useEffect(() => {
  const handler = () => { /* 处理逻辑 */ };
  window.addEventListener('keybinding-your-action', handler);
  return () => window.removeEventListener('keybinding-your-action', handler);
}, []);
```

**方式 2: 直接执行逻辑**
```typescript
// 在 keybindingActions.ts 中直接调用 store 或 invoke
const activeTab = useTerminalStore.getState().getActiveTab();
if (activeTab) {
  await invoke('some_tauri_command', {
    sessionId: activeTab.connectionId
  });
  return true;
}
```

### 步骤 5: （可选）在预设方案中添加配置

如果需要不同的预设方案有不同的默认值，在 `src/config/defaultKeybindings.ts` 中修改：

```typescript
export const VSCODE_PRESET: KeybindingPreset = {
  id: 'vscode',
  name: 'VSCode 风格',
  keybindings: {
    ...DEFAULT_KEYBINDINGS,
    'your.action.id': { ctrl: true, alt: false, shift: false, key: 'KeyK' },
  },
};

export const TERMINAL_PRESET: KeybindingPreset = {
  id: 'terminal',
  name: 'Terminal 风格',
  keybindings: {
    ...DEFAULT_KEYBINDINGS,
    'your.action.id': { ctrl: false, alt: false, shift: true, key: 'KeyK' }, // 不同的快捷键
  },
};
```

---

## 完整示例

让我们以添加"清空当前终端标签历史"功能为例：

### 1. 定义动作

`src/types/keybinding.ts`:
```typescript
{
  id: 'terminal.clearHistory',
  name: '清空历史',
  description: '清空当前终端标签的命令历史记录',
  category: 'terminal',
  defaultKeybinding: { ctrl: true, alt: false, shift: true, key: 'KeyH' }, // Ctrl+Shift+H
}
```

### 2. 添加默认配置

`src/config/defaultKeybindings.ts`:
```typescript
export const DEFAULT_KEYBINDINGS: Record<string, KeyCombination> = {
  // ... 其他配置
  'terminal.clearHistory': { ctrl: true, alt: false, shift: true, key: 'KeyH' },
};
```

### 3. 添加作用域

`src/lib/globalKeyHandler.ts`:
```typescript
const ACTION_SCOPES: Record<string, KeybindingScope> = {
  // ... 其他映射
  'terminal.clearHistory': KeybindingScope.Terminal,
};
```

### 4. 实现执行器

`src/lib/keybindingActions.ts`:
```typescript
async execute(actionId: string): Promise<boolean> {
  switch (actionId) {
    // ... 其他 case
    case 'terminal.clearHistory':
      return this.executeTerminalClearHistory();
  }
}

private async executeTerminalClearHistory(): Promise<boolean> {
  try {
    // 触发自定义事件
    const event = new CustomEvent('keybinding-terminal-clear-history');
    window.dispatchEvent(event);
    console.log('[KeybindingExecutor] Triggered terminal clear history');
    return true;
  } catch (error) {
    console.error('[KeybindingExecutor] Error clearing terminal history:', error);
    return false;
  }
}
```

### 5. 在组件中监听

`src/components/terminal/XTermWrapper.tsx`:
```typescript
// 在组件内添加监听器
useEffect(() => {
  const handleClearHistory = () => {
    if (terminalRefInstance.current) {
      terminalRefInstance.current.clear();
      console.log(`[XTermWrapper] Cleared history for ${connectionId}`);
    }
  };

  window.addEventListener('keybinding-terminal-clear-history', handleClearHistory);

  return () => {
    window.removeEventListener('keybinding-terminal-clear-history', handleClearHistory);
  };
}, [connectionId]);
```

---

## 最佳实践

### 1. 命名规范

- **动作 ID**: 使用 `类别.动作名` 格式
  - ✅ `terminal.find`
  - ✅ `sftp.upload`
  - ✅ `global.newConnection`
  - ❌ `findInTerminal`
  - ❌ `upload_file`

- **执行方法**: 使用 `execute + 动作名`
  - ✅ `executeTerminalFind`
  - ✅ `executeSftpUpload`
  - ❌ `doFind`
  - ❌ `handleFind`

### 2. 按键选择

**避免使用系统保留快捷键：**
- ❌ Ctrl+C - 中断信号
- ❌ Ctrl+Z - 挂起进程
- ❌ Ctrl+D - EOF
- ❌ Ctrl+L - 清屏（终端专用）

**推荐使用：**
- ✅ Ctrl+Shift+字母
- ✅ 功能键 (F1-F12)
- ✅ Ctrl+Alt+字母

### 3. 作用域选择

根据动作的特性选择合适的作用域：

| 作用域 | 适用场景 | 示例 |
|--------|---------|------|
| `Global` | 影响整个应用的操作 | 新建连接、打开设置 |
| `Terminal` | 仅在终端页面有用的操作 | 新建标签、清屏、查找 |
| `Session` | 会话管理相关的操作 | 新建会话、快速连接 |
| `SFTP` | 文件管理相关的操作 | 上传、下载、刷新 |
| `Settings` | 设置页面的操作 | 重置配置、导入导出 |

### 4. 事件驱动 vs 直接调用

**推荐使用事件驱动模式：**

✅ **优点：**
- 解耦：快捷键系统不需要知道具体实现
- 灵活：多个组件可以监听同一个事件
- 可测试：可以单独测试事件触发

❌ **直接调用的缺点：**
- 耦合：快捷键系统需要了解 store 结构
- 难维护：逻辑集中在 keybindingActions.ts 中

### 5. 冲突处理

系统会自动检测快捷键冲突，并通过对话框提示用户。如果需要强制覆盖（如系统更新时），使用：

```typescript
await useKeybindingStore.getState().registerKeybinding(
  'your.action.id',
  { ctrl: true, alt: false, shift: false, key: 'KeyK' },
  true // skipConflictCheck = true
);
```

---

## 常见问题

### Q1: 快捷键没有生效？

**检查清单：**
1. ✅ 是否在 `KEYBINDING_ACTIONS` 中定义了动作？
2. ✅ 是否在 `DEFAULT_KEYBINDINGS` 中添加了配置？
3. ✅ 是否在 `ACTION_SCOPES` 中添加了作用域？
4. ✅ 是否在 `keybindingActions.ts` 的 switch 语句中添加了 case？
5. ✅ 当前路径是否在作用域允许的范围内？
6. ✅ 浏览器控制台是否有错误日志？

### Q2: 快捷键在所有页面都生效了，但我不想这样？

**解决方案：**
在 `ACTION_SCOPES` 中添加作用域限制，参考 [步骤 3](#步骤-3-添加作用域限制)。

### Q3: 快捷键冲突了怎么办？

系统会自动检测冲突并提示用户。如果需要预定义优先级，可以在 `KeybindingHandler` 中使用 `priority` 参数：

```typescript
// 高优先级（如对话框）
globalKeyHandler.register(KeybindingPriority.Component, handler);

// 页面级（如终端页面）
globalKeyHandler.register(KeybindingPriority.Page, handler);

// 全局级（默认）
globalKeyHandler.register(KeybindingPriority.Global, handler);
```

### Q4: 如何测试快捷键？

**手动测试：**
1. 启动应用
2. 按下配置的快捷键
3. 查看浏览器控制台日志
4. 验证功能是否正常执行

**日志示例：**
```
[GlobalKeyHandler] Matched keybinding: terminal.find {ctrl: true, alt: false, shift: false, key: 'KeyF'}
[KeybindingExecutor] Executing action: terminal.find
[KeybindingExecutor] Triggered terminal find dialog
```

### Q5: 如何获取按键代码？

在浏览器控制台中运行：
```javascript
document.addEventListener('keydown', (e) => {
  console.log(`Key: ${e.key}, Code: ${e.code}`);
});
```

然后按下想要的键，控制台会输出对应的 `code` 值。

**常用映射：**
```
按键          code
-----------------------------------
A-Z          KeyA, KeyB, ..., KeyZ
0-9          Digit0, Digit1, ..., Digit9
F1-F12        F1, F2, ..., F12
Tab          Tab
Enter         Enter
Shift         ShiftLeft, ShiftRight
Ctrl          ControlLeft, ControlRight
Alt          AltLeft, AltRight
Space         Space
Backspace    Backspace
Escape       Escape
```

### Q6: 如何支持 Mac 的 Command 键？

在 Tauri 应用中，`ctrl` 自动映射为 Mac 的 `Cmd` 键。用户看到的快捷键会显示为 `⌘K`（Command+K）。

---

## 相关文件清单

添加快捷键需要修改的文件：

1. ✏️ `src/types/keybinding.ts` - 添加动作定义
2. ✏️ `src/config/defaultKeybindings.ts` - 添加默认配置
3. ✏️ `src/lib/globalKeyHandler.ts` - 添加作用域
4. ✏️ `src/lib/keybindingActions.ts` - 实现执行器
5. ✏️ `src/components/xxx/XxxComponent.tsx` - 监听事件并处理

---

## 进阶话题

### 自定义快捷键 UI

项目已经支持用户在设置页面自定义快捷键。添加新快捷键后，它会自动出现在快捷键设置界面中。

### 持久化

快捷键配置会自动保存到 Rust 后端，位置在：
```
~/.tauri-terminal/keybindings.json
```

### 导入导出

用户可以导入导出快捷键配置，格式为 JSON。预设方案会自动包含新添加的快捷键。

---

## 总结

添加新快捷键的核心步骤：

1. 📝 定义动作（`KEYBINDING_ACTIONS`）
2. ⚙️ 配置快捷键（`DEFAULT_KEYBINDINGS`）
3. 🎯 设置作用域（`ACTION_SCOPES`）
4. ⚡ 实现执行器（`keybindingActions.ts`）
5. 👂 监听事件（组件中）

遵循本文档的步骤和最佳实践，可以轻松地为项目添加新的快捷键功能。
