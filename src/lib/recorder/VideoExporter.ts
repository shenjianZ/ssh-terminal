/**
 * 视频导出器
 * 使用 MediaRecorder API 将终端录制导出为视频文件
 * 通过创建真实的 xterm.js 实例进行回放，然后从 Canvas 捕获视频流
 */

import '@xterm/xterm/css/xterm.css';
import { PlaybackEngine } from './PlaybackEngine';
import type { RecordingFile } from '@/types/recording';
import { Terminal } from '@xterm/xterm';
import { WebglAddon } from '@xterm/addon-webgl';
import { TERMINAL_THEMES } from '@/config/themes';

export interface VideoExportConfig {
  format: 'webm' | 'mp4';
  quality: 'low' | 'medium' | 'high';
  fps: number;
  bitrate?: number;
}

export interface VideoExportProgress {
  totalFrames: number;
  currentFrame: number;
  percentage: number;
  status: 'preparing' | 'encoding' | 'finalizing' | 'completed' | 'error';
  error?: string;
}

export type VideoExportProgressCallback = (progress: VideoExportProgress) => void;

export class VideoExporter {
  private playbackEngine: PlaybackEngine;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isExporting: boolean = false;
  private onProgressCallback?: VideoExportProgressCallback;

  // 配置
  private config: VideoExportConfig = {
    format: 'webm',
    quality: 'medium',
    fps: 30,
  };

  // 导出控制 - 使用真实的 xterm.js 实例
  private container: HTMLElement | null = null;
  private terminal: Terminal | null = null;
  private webglAddon: WebglAddon | null = null;
  private totalFrames: number = 0;

  constructor() {
    this.playbackEngine = new PlaybackEngine();
  }

  /**
   * 导出为视频
   * @param recordingFile 录制文件
   * @param container 容器 DOM 元素
   * @param config 导出配置
   * @param onProgress 进度回调
   */
  async exportToVideo(
    recordingFile: RecordingFile,
    container: HTMLElement,
    config: VideoExportConfig,
    onProgress?: VideoExportProgressCallback
  ): Promise<Blob | null> {
    this.config = config;
    this.onProgressCallback = onProgress;
    this.container = container;
    this.isExporting = true;
    this.recordedChunks = [];

    try {
      // 1. 准备阶段
      this.reportProgress({
        totalFrames: 0,
        currentFrame: 0,
        percentage: 0,
        status: 'preparing',
      });

      // 2. 计算总帧数
      const duration = recordingFile.metadata.duration || 0;
      this.totalFrames = Math.ceil(duration * config.fps);

      // 3. 创建真实的 xterm.js 终端实例用于回放
      // 从录制文件中获取终端配置
      const terminalConfig = recordingFile.metadata.terminalConfig;
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
        rows: recordingFile.metadata.terminalSize.rows || 24,
        cols: recordingFile.metadata.terminalSize.cols || 80,
        allowProposedApi: true,
      });

      // 将终端添加到容器
      container.innerHTML = '';
      this.terminal.open(container);

      // 启用 WebGL 渲染器（Canvas 渲染）
      try {
        this.webglAddon = new WebglAddon();
        this.terminal.loadAddon(this.webglAddon);
      } catch (e) {
        throw new Error('WebGL renderer is required for video export');
      }

      // 等待终端初始化并渲染 canvas
      await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100;

        const checkCanvas = () => {
          attempts++;
          const canvasElement = container.querySelector('canvas') as HTMLCanvasElement;
          if (canvasElement) {
            clearTimeout(timeout);
            resolve();
          } else if (attempts >= maxAttempts) {
            reject(new Error('Timeout: Failed to get xterm.js canvas element'));
          } else {
            setTimeout(checkCanvas, 50);
          }
        };

        const timeout = setTimeout(() => {
          reject(new Error('Timeout: Failed to get xterm.js canvas element'));
        }, 5000);

        checkCanvas();
      });

      // 4. 获取 xterm.js 的 Canvas 元素
      // 注意：xterm.js 有多个 canvas，我们需要获取实际的渲染层，而不是 link-layer
      const allCanvases = Array.from(container.querySelectorAll('canvas'));

      // 找到非 link-layer 的 canvas（实际的渲染层）
      const canvasElement = allCanvases.find(
        canvas => !canvas.classList.contains('xterm-link-layer')
      ) || allCanvases[0];

      if (!canvasElement) {
        throw new Error('Failed to get xterm.js canvas element');
      }

      // 5. 设置 MediaRecorder，直接从 xterm.js 的 Canvas 捕获流
      const stream = canvasElement.captureStream(config.fps);
      const mimeType = this.getMimeType();
      const mediaRecorderOptions = this.getMediaRecorderOptions();

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: mediaRecorderOptions.bitrate,
      });

      // 6. 设置数据收集
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // 7. 完成回调
      const exportPromise = new Promise<Blob | null>((resolve) => {
        this.mediaRecorder!.onstop = () => {
          this.reportProgress({
            totalFrames: this.totalFrames,
            currentFrame: this.totalFrames,
            percentage: 100,
            status: 'finalizing',
          });

          // 创建最终的 Blob
          const blob = new Blob(this.recordedChunks, { type: mimeType });
          console.log('[VideoExporter] Export completed. Blob size:', blob.size, 'bytes, type:', blob.type);

          this.recordedChunks = [];
          this.isExporting = false;

          this.reportProgress({
            totalFrames: this.totalFrames,
            currentFrame: this.totalFrames,
            percentage: 100,
            status: 'completed',
          });

          resolve(blob);
        };
      });

      // 8. 设置回放引擎，连接到真实的终端
      this.setupPlaybackEngine(recordingFile);

      // 9. 使用实时速度回放（1倍速），确保导出的视频保持原始时长
      const exportSpeed = 1.0; // 实时速度
      this.playbackEngine.setPlaybackSpeed(exportSpeed);

      // 10. 开始录制和回放
      // 每 100ms 生成一个数据块，确保持续捕获
      this.mediaRecorder.start(100);
      this.playbackEngine.play();

      return await exportPromise;
    } catch (error) {
      console.error('[VideoExporter] Export failed:', error);
      this.isExporting = false;

      this.reportProgress({
        totalFrames: 0,
        currentFrame: 0,
        percentage: 0,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  }

  /**
   * 取消导出
   */
  cancel(): void {
    if (!this.isExporting) {
      return;
    }

    this.isExporting = false;
    this.playbackEngine.stop();

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    this.recordedChunks = [];
  }

  /**
   * 设置回放引擎
   */
  private setupPlaybackEngine(recordingFile: RecordingFile): void {
    this.playbackEngine.load(recordingFile);

    const startTime = recordingFile.metadata.startTime;
    const endTime = recordingFile.metadata.endTime || Date.now();

    // 设置回调
    this.playbackEngine.setCallbacks({
      onOutput: (data: Uint8Array) => {
        // 将输出数据写入真实的终端
        if (this.terminal) {
          this.terminal.write(data);
        }
      },
      onResize: (cols: number, rows: number) => {
        // 调整终端大小
        if (this.terminal) {
          this.terminal.resize(cols, rows);
        }
      },
      onMetadata: (key: string, _value: unknown) => {
        // 处理元数据
        if (key === 'recording_start') {
          // 录制开始时，清空终端（提示符会作为第一个输出事件被回放）
          if (this.terminal) {
            this.terminal.reset();
          }
        }
      },
      onEnded: () => {
        // 等待一小段时间让最后一个数据块生成
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }, 500); // 等待 500ms
      },
      onProgress: (currentTime: number) => {
        // 更新进度
        const progress = ((currentTime - startTime) / (endTime - startTime)) * 100;
        this.reportProgress({
          totalFrames: this.totalFrames,
          currentFrame: Math.floor((progress / 100) * this.totalFrames),
          percentage: Math.min(100, Math.max(0, Math.round(progress))),
          status: 'encoding',
        });
      },
    });
  }

  /**
   * 报告进度
   */
  private reportProgress(progress: VideoExportProgress): void {
    if (this.onProgressCallback) {
      this.onProgressCallback(progress);
    }
  }

  /**
   * 获取 MIME 类型
   */
  private getMimeType(): string {
    // 优先使用 WebM 格式（浏览器支持最好）
    const webmVp9 = 'video/webm;codecs=vp9';
    const webmVp8 = 'video/webm;codecs=vp8';
    const webm = 'video/webm';

    // 检查支持的格式
    if (MediaRecorder.isTypeSupported(webmVp9)) {
      return webmVp9;
    } else if (MediaRecorder.isTypeSupported(webmVp8)) {
      return webmVp8;
    } else if (MediaRecorder.isTypeSupported(webm)) {
      return webm;
    } else {
      // 回退到任何支持的格式
      console.warn('[VideoExporter] WebM not supported, trying default format');
      return ''; // 让浏览器使用默认格式
    }
  }

  /**
   * 获取 MediaRecorder 配置
   */
  private getMediaRecorderOptions(): { bitrate: number } {
    // 根据质量设置比特率
    const bitrates = {
      low: 500000,    // 500 kbps
      medium: 2000000, // 2 Mbps
      high: 5000000,   // 5 Mbps
    };

    return {
      bitrate: bitrates[this.config.quality] || bitrates.medium,
    };
  }

  /**
   * 销毁导出器
   */
  dispose(): void {
    this.cancel();
    this.playbackEngine.dispose();

    // 清理 WebGL addon
    if (this.webglAddon) {
      this.webglAddon.dispose();
      this.webglAddon = null;
    }

    // 清理终端
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }

    // 清理容器
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
}
