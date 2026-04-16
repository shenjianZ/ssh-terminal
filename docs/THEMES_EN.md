# Theme System

SSH Terminal supports multiple terminal themes using CSS variables for theme switching, providing excellent visual experience.

## Table of Contents

- [Supported Themes](#supported-themes)
- [Theme Configuration](#theme-configuration)
- [Custom Themes](#custom-themes)
- [Theme Switching](#theme-switching)
- [Theme Preview](#theme-preview)

---

## Supported Themes

SSH Terminal includes 8 carefully designed themes:

### 1. One Dark

**Type**: Dark theme

**Features**:
- Classic dark color scheme
- High contrast
- Suitable for long-term use

**Use Cases**:
- Daily development
- Nighttime use
- Need high contrast

**Color Scheme**:
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

**Type**: Dark theme

**Features**:
- Elegant dark color scheme
- Soft contrast
- Designed for programmers

**Use Cases**:
- Code development
- Long-term work
- Eye protection needed

**Color Scheme**:
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

**Type**: Dark theme

**Features**:
- Nordic style color scheme
- Cool tones
- Visually comfortable

**Use Cases**:
- Need calm environment
- Like cool tones
- Long-term use

**Color Scheme**:
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

**Type**: Dark theme

**Features**:
- Modern dark theme
- Rich colors
- Suitable for nighttime use

**Use Cases**:
- Nighttime development
- Like modern style
- Need rich colors

**Color Scheme**:
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

**Type**: Dark theme

**Features**:
- Classic code editor theme
- High contrast
- Syntax highlighting

**Use Cases**:
- Code development
- Need syntax highlighting
- Classic theme enthusiasts

**Color Scheme**:
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

**Type**: Light theme

**Features**:
- GitHub official light theme
- Bright and fresh
- Suitable for daytime use

**Use Cases**:
- Daytime use
- Need bright environment
- GitHub users

**Color Scheme**:
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

**Type**: Light theme

**Features**:
- Solarized light version
- Carefully designed contrast
- Eye protection design

**Use Cases**:
- Long-term daytime use
- Need eye protection
- Like Solarized colors

**Color Scheme**:
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

**Type**: Dark theme

**Features**:
- Solarized dark version
- Carefully designed contrast
- Eye protection design

**Use Cases**:
- Long-term nighttime use
- Need eye protection
- Like Solarized colors

**Color Scheme**:
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

## Theme Configuration

### Configuration File Location

Theme configuration file located at: `src/config/themes.ts`

### Configuration Structure

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
  // Theme definitions...
];

export const defaultTheme = 'one-dark';
```

### Theme Usage

**Using in Components**:

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

**xterm.js Theme Configuration**:

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

## Custom Themes

### Creating New Theme

1. Add new theme definition in `src/config/themes.ts`:

```typescript
const customTheme: TerminalTheme = {
  name: 'custom-theme',
  displayName: 'Custom Theme',
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
  // ... existing themes
  customTheme,
];
```

2. New theme will automatically appear in settings page

### Theme Design Principles

**Contrast**:
- Ensure sufficient contrast between foreground and background
- Follow WCAG 2.1 AA standard (contrast at least 4.5:1)

**Color Harmony**:
- Use harmonious color schemes
- Avoid too many colors
- Consider color psychology

**Readability**:
- Ensure text is clearly readable
- Avoid overly bright colors
- Consider comfort for long-term use

**Consistency**:
- Maintain color scheme consistency
- Follow color theory
- Reference well-known theme designs

---

## Theme Switching

### Switching Methods

1. **Via Settings Page**
   - Open settings page
   - Go to "Terminal" tab
   - Select from "Theme" dropdown

2. **Via Shortcut** (customizable)
   - Open shortcut settings
   - Find "Switch Theme"
   - Set custom shortcut

3. **Via Code**
   ```typescript
   import { useTerminalConfigStore } from '@/store/terminalConfigStore';

   function changeTheme(themeName: string) {
     const { setTheme } = useTerminalConfigStore.getState();
     setTheme(themeName);
   }
   ```

### Theme Persistence

Theme selection is automatically saved to local storage:

```typescript
// Save theme
localStorage.setItem('terminal-theme', themeName);

// Read theme
const savedTheme = localStorage.getItem('terminal-theme');
```

### Theme Preview

In settings page, theme effect is previewed immediately upon selection, no need to save.

---

## Theme Preview

### Theme Screenshots

| Theme | Preview |
|-------|---------|
| One Dark | ![One Dark](../public/themes/one-dark.png) |
| Dracula | ![Dracula](../public/themes/dracula.png) |
| Nord | ![Nord](../public/themes/nord.png) |
| Tokyo Night | ![Tokyo Night](../public/themes/tokyo-night.png) |
| Monokai | ![Monokai](../public/themes/monokai.png) |
| GitHub Light | ![GitHub Light](../public/themes/github-light.png) |
| Solarized Light | ![Solarized Light](../public/themes/solarized-light.png) |
| Solarized Dark | ![Solarized Dark](../public/themes/solarized-dark.png) |

### Theme Comparison

| Theme | Type | Contrast | Eye Protection | Popularity |
|-------|------|----------|----------------|------------|
| One Dark | Dark | High | Medium | ⭐⭐⭐⭐⭐ |
| Dracula | Dark | Medium | High | ⭐⭐⭐⭐⭐ |
| Nord | Dark | Medium | High | ⭐⭐⭐⭐ |
| Tokyo Night | Dark | Medium | Medium | ⭐⭐⭐⭐ |
| Monokai | Dark | High | Medium | ⭐⭐⭐⭐ |
| GitHub Light | Light | High | Medium | ⭐⭐⭐⭐ |
| Solarized Light | Light | Medium | High | ⭐⭐⭐ |
| Solarized Dark | Dark | Medium | High | ⭐⭐⭐ |

---

## FAQ

### Q: How to make theme follow system theme?

A: Current version requires manual theme selection. Future versions may support automatic system theme following.

### Q: Can different sessions use different themes?

A: Current version uses same theme for all sessions. Future versions may support session-level theme settings.

### Q: How to import/export themes?

A: Current version doesn't support import/export. You can add custom themes by editing `src/config/themes.ts` file.

### Q: What if theme doesn't take effect?

A: Check the following:
1. Confirm theme name is correct
2. Check browser console for errors
3. Try refreshing page
4. Clear cache and retry

---

## Summary

SSH Terminal provides 8 carefully designed themes including dark and light themes to meet different user needs. Themes use CSS variables for quick switching and customization. Users can choose appropriate theme based on usage scenarios and personal preferences.