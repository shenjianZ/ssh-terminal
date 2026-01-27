export interface TerminalTheme {
  id: string;
  name: string;
  preview: string; // 主题预览色

  // xterm.js 主题配置
  foreground: string;
  background: string;
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
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
}

export interface TerminalConfig {
  themeId: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  lineHeight: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  letterSpacing: number;
  padding: number;
  scrollback: number;
  /** 心跳间隔（秒），0表示禁用（默认30秒） */
  keepAliveInterval: number;
  /** 通知设置 */
  notificationsEnabled: boolean;
  soundEffectsEnabled: boolean;
  /** 视频录制质量 */
  videoQuality: 'low' | 'medium' | 'high';
  /** 视频录制格式 */
  videoFormat: 'webm' | 'mp4';
}
