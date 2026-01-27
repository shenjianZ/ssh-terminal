/**
 * 视频录制器
 * 在录制终端会话的同时，后台同步录制视频
 */

import '@xterm/xterm/css/xterm.css';
import type { TerminalConfig } from '@/types/terminal';
import { Terminal } from '@xterm/xterm';
import { WebglAddon } from '@xterm/addon-webgl';
import { TERMINAL_THEMES } from '@/config/themes';

export class VideoRecorder {
  private terminal: Terminal | null = null;
  private webglAddon: WebglAddon | null = null;
  private container: HTMLElement | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private videoQuality: 'low' | 'medium' | 'high' = 'medium';
  private videoFormat: 'webm' | 'mp4' = 'webm';

  constructor() {
    // 创建隐藏的容器
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.left = '0';
    this.container.style.top = '0';
    this.container.style.zIndex = '-9999';
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';
    document.body.appendChild(this.container);
  }

  /**
   * 初始化视频录制
   */
  async initialize(
    _sessionName: string,
    terminalSize: { cols: number; rows: number },
    terminalConfig?: TerminalConfig
  ): Promise<void> {

    // 保存视频质量和格式设置
    this.videoQuality = terminalConfig?.videoQuality || 'medium';
    this.videoFormat = terminalConfig?.videoFormat || 'webm';

    // 创建 xterm.js 实例
    const fontSize = terminalConfig?.fontSize || 14;
    const fontFamily = terminalConfig?.fontFamily || 'Consolas, "Courier New", monospace';
    const fontWeight = terminalConfig?.fontWeight || 400;
    const lineHeight = terminalConfig?.lineHeight || 1.0;
    const letterSpacing = terminalConfig?.letterSpacing || 0;
    const cursorBlink = terminalConfig?.cursorBlink || false;
    const cursorStyle = terminalConfig?.cursorStyle || 'block';

    // 从主题 ID 获取完整的主题配置
    let theme: { [key: string]: string } = {
      background: '#1e1e1e',
      foreground: '#ffffff',
      cursor: '#ffffff',
    };

    if (terminalConfig?.themeId) {
      const themeData = TERMINAL_THEMES[terminalConfig.themeId];
      if (themeData) {
        theme = {
          background: themeData.background,
          foreground: themeData.foreground,
          cursor: themeData.cursor,
          selectionBackground: themeData.selectionBackground,
          black: themeData.black,
          red: themeData.red,
          green: themeData.green,
          yellow: themeData.yellow,
          blue: themeData.blue,
          magenta: themeData.magenta,
          cyan: themeData.cyan,
          white: themeData.white,
          brightBlack: themeData.brightBlack,
          brightRed: themeData.brightRed,
          brightGreen: themeData.brightGreen,
          brightYellow: themeData.brightYellow,
          brightBlue: themeData.brightBlue,
          brightMagenta: themeData.brightMagenta,
          brightCyan: themeData.brightCyan,
          brightWhite: themeData.brightWhite,
        };
      }
    }

    this.terminal = new Terminal({
      cursorBlink,
      cursorStyle,
      fontSize,
      fontFamily,
      fontWeight,
      lineHeight,
      letterSpacing,
      theme,
      rows: terminalSize.rows || 24,
      cols: terminalSize.cols || 80,
      allowProposedApi: true,
    });

    // 打开终端
    if (!this.container) {
      throw new Error('Container not initialized');
    }
    this.terminal.open(this.container);

    // 启用 WebGL 渲染器
    try {
      this.webglAddon = new WebglAddon();
      this.terminal.loadAddon(this.webglAddon);
    } catch (e) {
      console.warn('[VideoRecorder] Failed to enable WebGL renderer:', e);
    }

    // 等待 Canvas 渲染
    await new Promise<void>((resolve) => {
      const checkCanvas = () => {
        const canvasElement = this.container?.querySelector('canvas:not(.xterm-link-layer)') as HTMLCanvasElement;
        if (canvasElement) {
          resolve();
        } else {
          setTimeout(checkCanvas, 50);
        }
      };
      checkCanvas();
    });

    // 设置 MediaRecorder
    const canvasElement = this.container?.querySelector('canvas:not(.xterm-link-layer)') as HTMLCanvasElement;
    if (!canvasElement) {
      throw new Error('Failed to get canvas element');
    }

    // 根据质量设置比特率
    const bitrates = {
      low: 500000,    // 500 kbps
      medium: 2000000, // 2 Mbps
      high: 5000000,   // 5 Mbps
    };
    const bitrate = bitrates[this.videoQuality] || bitrates.medium;

    // 根据格式选择 mimeType
    const getMimeType = (): string => {
      if (this.videoFormat === 'mp4') {
        // MP4 格式（浏览器支持有限）
        const mp4H264 = 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"';
        const mp4 = 'video/mp4';
        if (MediaRecorder.isTypeSupported(mp4H264)) {
          return mp4H264;
        } else if (MediaRecorder.isTypeSupported(mp4)) {
          return mp4;
        } else {
          console.warn('[VideoRecorder] MP4 not supported, falling back to WebM');
          return 'video/webm;codecs=vp9';
        }
      } else {
        // WebM 格式（默认，支持最好）
        const webmVp9 = 'video/webm;codecs=vp9';
        const webmVp8 = 'video/webm;codecs=vp8';
        const webm = 'video/webm';

        if (MediaRecorder.isTypeSupported(webmVp9)) {
          return webmVp9;
        } else if (MediaRecorder.isTypeSupported(webmVp8)) {
          return webmVp8;
        } else if (MediaRecorder.isTypeSupported(webm)) {
          return webm;
        } else {
          console.warn('[VideoRecorder] WebM not supported, using default format');
          return '';
        }
      }
    };

    const mimeType = getMimeType();

    const stream = canvasElement.captureStream(30); // 30 FPS
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: bitrate,
    });

    // 设置数据收集
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    // 打印录制配置信息
    const bitrateLabels: Record<string, string> = {
      low: '500 Kbps',
      medium: '2 Mbps',
      high: '5 Mbps',
    };
    console.log(`[VideoRecorder] 视频录制配置 - 格式: ${this.videoFormat.toUpperCase()}, MIME: ${mimeType}, 质量: ${this.videoQuality} (${bitrateLabels[this.videoQuality]})`);
  }

  /**
   * 开始录制视频
   */
  start(): void {
    if (!this.mediaRecorder || this.isRecording) {
      return;
    }

    this.recordedChunks = [];
    this.mediaRecorder.start(100); // 每 100ms 生成一个数据块
    this.isRecording = true;
  }

  /**
   * 写入数据到终端（同时显示在后台终端）
   */
  write(data: string | Uint8Array): void {
    if (this.terminal) {
      this.terminal.write(data);
    }
  }

  /**
   * 调整终端大小
   */
  resize(cols: number, rows: number): void {
    if (this.terminal) {
      this.terminal.resize(cols, rows);
    }
  }

  /**
   * 停止录制并获取视频 Blob
   */
  async stop(): Promise<Blob | null> {
    if (!this.isRecording || !this.mediaRecorder) {
      return null;
    }

    return new Promise<Blob | null>((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        // 使用与录制时相同的 MIME 类型
        const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder!.mimeType || 'video/webm' });
        console.log('[VideoRecorder] Stopped. Blob size:', blob.size, 'bytes', 'type:', blob.type);
        this.recordedChunks = [];
        this.isRecording = false;
        resolve(blob);
      };

      // 停止录制
      this.mediaRecorder.stop();
    });
  }

  /**
   * 销毁
   */
  dispose(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    if (this.webglAddon) {
      this.webglAddon.dispose();
    }

    if (this.terminal) {
      this.terminal.dispose();
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.terminal = null;
    this.webglAddon = null;
    this.mediaRecorder = null;
    this.container = null;
  }
}
