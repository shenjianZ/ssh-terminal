# 主题系统

SSH Terminal 支持多种终端主题，使用 CSS 变量实现主题切换，提供良好的视觉体验。

## 目录

- [支持的主题](#支持的主题)
- [主题配置](#主题配置)
- [自定义主题](#自定义主题)
- [主题切换](#主题切换)
- [主题预览](#主题预览)

---

## 支持的主题

SSH Terminal 内置 8 种精心设计的主题：

### 1. One Dark

**类型**：深色主题

**特点**：
- 经典的深色配色
- 高对比度
- 适合长时间使用

**适用场景**：
- 日常开发
- 夜间使用
- 需要高对比度

**配色方案**：
```css
--background: #282c34
--foreground: #abb2bf
--black: #282c34
--red: #e06c75
--green: #98c379
--yellow: #e5c07b
--blue: #61afef
--magenta: #c678dd
--cyan: #56b6c2
--white: #abb2bf
```

### 2. Dracula

**类型**：深色主题

**特点**：
- 优雅的深色配色
- 柔和的对比度
- 面向程序员设计

**适用场景**：
- 代码开发
- 长时间工作
- 需要护眼

**配色方案**：
```css
--background: #282a36
--foreground: #f8f8f2
--black: #282a36
--red: #ff5555
--green: #50fa7b
--yellow: #f1fa8c
--blue: #bd93f9
--magenta: #ff79c6
--cyan: #8be9fd
--white: #f8f8f2
```

### 3. Nord

**类型**：深色主题

**特点**：
- 北欧风格配色
- 冷色调
- 视觉舒适

**适用场景**：
- 需要冷静的环境
- 喜欢冷色调
- 长时间使用

**配色方案**：
```css
--background: #2e3440
--foreground: #eceff4
--black: #3b4252
--red: #bf616a
--green: #a3be8c
--yellow: #ebcb8b
--blue: #81a1c1
--magenta: #b48ead
--cyan: #88c0d0
--white: #eceff4
```

### 4. Tokyo Night

**类型**：深色主题

**特点**：
- 现代深色主题
- 丰富的色彩
- 适合夜间使用

**适用场景**：
- 夜间开发
- 喜欢现代风格
- 需要丰富的色彩

**配色方案**：
```css
--background: #1a1b26
--foreground: #c0caf5
--black: #15161e
--red: #f7768e
--green: #9ece6a
--yellow: #e0af68
--blue: #7aa2f7
--magenta: #bb9af7
--cyan: #7dcfff
--white: #c0caf5
```

### 5. Monokai

**类型**：深色主题

**特点**：
- 经典的代码编辑器主题
- 高对比度
- 语法突出

**适用场景**：
- 代码开发
- 需要语法高亮
- 经典主题爱好者

**配色方案**：
```css
--background: #272822
--foreground: #f8f8f2
--black: #272822
--red: #f92672
--green: #a6e22e
--yellow: #f4bf75
--blue: #66d9ef
--magenta: #ae81ff
--cyan: #a1efe4
--white: #f8f8f2
```

### 6. GitHub Light

**类型**：浅色主题

**特点**：
- GitHub 官方浅色主题
- 明亮清爽
- 适合日间使用

**适用场景**：
- 日间使用
- 需要明亮环境
- GitHub 用户

**配色方案**：
```css
--background: #ffffff
--foreground: #24292f
--black: #24292f
--red: #cf222e
--green: #1a7f37
--yellow: #9a6700
--blue: #0969da
--magenta: #8250df
--cyan: #1f883d
--white: #ffffff
```

### 7. Solarized Light

**类型**：浅色主题

**特点**：
- Solarized 浅色版本
- 精心设计的对比度
- 护眼设计

**适用场景**：
- 长时间日间使用
- 需要护眼
- 喜欢 Solarized 配色

**配色方案**：
```css
--background: #fdf6e3
--foreground: #657b83
--black: #002b36
--red: #dc322f
--green: #859900
--yellow: #b58900
--blue: #268bd2
--magenta: #d33682
--cyan: #2aa198
--white: #fdf6e3
```

### 8. Solarized Dark

**类型**：深色主题

**特点**：
- Solarized 深色版本
- 精心设计的对比度
- 护眼设计

**适用场景**：
- 长时间夜间使用
- 需要护眼
- 喜欢 Solarized 配色

**配色方案**：
```css
--background: #002b36
--foreground: #839496
--black: #073642
--red: #dc322f
--green: #859900
--yellow: #b58900
--blue: #268bd2
--magenta: #d33682
--cyan: #2aa198
--white: #eee8d5
```

---

## 主题配置

### 配置文件位置

主题配置文件位于：`src/config/themes.ts`

### 配置结构

```typescript
interface TerminalTheme {
  name: string;
  displayName: string;
  type: 'light' | 'dark';
  colors: {
    background: string;
    foreground: string;
    cursor: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    brightBlack: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightMagenta: string;
    brightCyan: string;
    brightWhite: string;
  };
}

export const themes: TerminalTheme[] = [
  // 主题定义...
];

export const defaultTheme = 'one-dark';
```

### 主题使用

**在组件中使用**：

```typescript
import { themes, defaultTheme } from '@/config/themes';
import { useTerminalConfigStore } from '@/store/terminalConfigStore';

function Terminal() {
  const { theme } = useTerminalConfigStore();
  const currentTheme = themes.find(t => t.name === theme) || themes[0];

  return (
    <div style={{
      '--background': currentTheme.colors.background,
      '--foreground': currentTheme.colors.foreground,
      // ...
    }}>
      <XTerm theme={currentTheme} />
    </div>
  );
}
```

**xterm.js 主题配置**：

```typescript
const xtermTheme = {
  background: currentTheme.colors.background,
  foreground: currentTheme.colors.foreground,
  cursor: currentTheme.colors.cursor,
  black: currentTheme.colors.black,
  red: currentTheme.colors.red,
  green: currentTheme.colors.green,
  yellow: currentTheme.colors.yellow,
  blue: currentTheme.colors.blue,
  magenta: currentTheme.colors.magenta,
  cyan: currentTheme.colors.cyan,
  white: currentTheme.colors.white,
  brightBlack: currentTheme.colors.brightBlack,
  brightRed: currentTheme.colors.brightRed,
  brightGreen: currentTheme.colors.brightGreen,
  brightYellow: currentTheme.colors.brightYellow,
  brightBlue: currentTheme.colors.brightBlue,
  brightMagenta: currentTheme.colors.brightMagenta,
  brightCyan: currentTheme.colors.brightCyan,
  brightWhite: currentTheme.colors.brightWhite,
};

terminal.setOption('theme', xtermTheme);
```

---

## 自定义主题

### 创建新主题

1. 在 `src/config/themes.ts` 中添加新主题定义：

```typescript
const customTheme: TerminalTheme = {
  name: 'custom-theme',
  displayName: '自定义主题',
  type: 'dark',
  colors: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#ffffff',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#ffffff',
  },
};

export const themes: TerminalTheme[] = [
  // ... 现有主题
  customTheme,
];
```

2. 在设置页面中会自动显示新主题

### 主题设计原则

**对比度**：
- 确保前景色和背景色有足够的对比度
- 遵循 WCAG 2.1 AA 标准（对比度至少 4.5:1）

**色彩和谐**：
- 使用和谐的配色方案
- 避免过多颜色
- 考虑色彩心理学

**可读性**：
- 确保文本清晰可读
- 避免使用过于鲜艳的颜色
- 考虑长时间使用的舒适度

**一致性**：
- 保持配色方案的一致性
- 遵循色彩理论
- 参考知名主题设计

---

## 主题切换

### 切换方式

1. **通过设置页面**
   - 打开设置页面
   - 进入"终端"标签
   - 在"主题"下拉菜单中选择

2. **通过快捷键**（可自定义）
   - 打开快捷键设置
   - 找到"切换主题"
   - 设置自定义快捷键

3. **通过代码**
   ```typescript
   import { useTerminalConfigStore } from '@/store/terminalConfigStore';

   function changeTheme(themeName: string) {
     const { setTheme } = useTerminalConfigStore.getState();
     setTheme(themeName);
   }
   ```

### 主题持久化

主题选择会自动保存到本地存储：

```typescript
// 保存主题
localStorage.setItem('terminal-theme', themeName);

// 读取主题
const savedTheme = localStorage.getItem('terminal-theme');
```

### 主题预览

在设置页面中，选择主题后会立即预览效果，无需保存。

---

## 主题预览

### 主题截图

| 主题 | 预览 |
|------|------|
| One Dark | ![One Dark](../public/themes/one-dark.png) |
| Dracula | ![Dracula](../public/themes/dracula.png) |
| Nord | ![Nord](../public/themes/nord.png) |
| Tokyo Night | ![Tokyo Night](../public/themes/tokyo-night.png) |
| Monokai | ![Monokai](../public/themes/monokai.png) |
| GitHub Light | ![GitHub Light](../public/themes/github-light.png) |
| Solarized Light | ![Solarized Light](../public/themes/solarized-light.png) |
| Solarized Dark | ![Solarized Dark](../public/themes/solarized-dark.png) |

### 主题对比

| 主题 | 类型 | 对比度 | 护眼 | 流行度 |
|------|------|--------|------|--------|
| One Dark | 深色 | 高 | 中 | ⭐⭐⭐⭐⭐ |
| Dracula | 深色 | 中 | 高 | ⭐⭐⭐⭐⭐ |
| Nord | 深色 | 中 | 高 | ⭐⭐⭐⭐ |
| Tokyo Night | 深色 | 中 | 中 | ⭐⭐⭐⭐ |
| Monokai | 深色 | 高 | 中 | ⭐⭐⭐⭐ |
| GitHub Light | 浅色 | 高 | 中 | ⭐⭐⭐⭐ |
| Solarized Light | 浅色 | 中 | 高 | ⭐⭐⭐ |
| Solarized Dark | 深色 | 中 | 高 | ⭐⭐⭐ |

---

## 常见问题

### Q: 如何让主题跟随系统主题？

A: 当前版本需要手动选择主题。后续版本可能会支持自动跟随系统主题。

### Q: 可以为不同的会话设置不同的主题吗？

A: 当前版本所有会话使用相同的主题。后续版本可能会支持会话级别的主题设置。

### Q: 如何导入/导出主题？

A: 当前版本不支持导入/导出主题。可以通过编辑 `src/config/themes.ts` 文件来添加自定义主题。

### Q: 主题不生效怎么办？

A: 检查以下项：
1. 确认主题名称正确
2. 检查浏览器控制台是否有错误
3. 尝试刷新页面
4. 清除缓存后重试

---

## 总结

SSH Terminal 提供了 8 种精心设计的主题，包括深色和浅色主题，满足不同用户的需求。主题使用 CSS 变量实现，支持快速切换和自定义。用户可以根据使用场景和个人喜好选择合适的主题。