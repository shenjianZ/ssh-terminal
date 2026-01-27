/**
 * 终端回放引擎
 * 负责回放录制文件，支持播放控制（播放、暂停、跳转、变速）
 */

import type { RecordingFile, RecordingEvent } from '@/types/recording';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'stopped';

export interface PlaybackEngineCallbacks {
  onOutput?: (data: Uint8Array) => void;
  onResize?: (cols: number, rows: number) => void;
  onMetadata?: (key: string, value: unknown) => void;
  onProgress?: (currentTime: number, totalTime: number) => void;
  onEnded?: () => void;
}

// 调试模式开关（可通过环境变量或配置控制）
const DEBUG_PLAYBACK = false;

export class PlaybackEngine {
  private recordingFile: RecordingFile | null = null;
  private status: PlaybackStatus = 'idle';
  private currentTime: number = 0; // 当前播放位置（毫秒）
  private playbackSpeed: number = 1.0; // 播放速度倍数
  private timerId: number | null = null;
  private callbacks: PlaybackEngineCallbacks = {};

  // 回放控制
  private currentEventIndex: number = 0;
  private baseTime: number = 0; // 回放开始的时间戳

  constructor() {
    // 绑定方法到 this
    this.tick = this.tick.bind(this);
  }

  /**
   * 加载录制文件
   */
  load(recordingFile: RecordingFile): void {
    this.recordingFile = recordingFile;
    this.status = 'idle';
    this.currentTime = recordingFile.metadata.startTime;
    this.currentEventIndex = 0;
    this.playbackSpeed = 1.0;
    this.stopTimer();

    console.log(
      `[PlaybackEngine] Loaded recording: ${recordingFile.metadata.sessionName}, ` +
        `${recordingFile.events.length} events, ${recordingFile.metadata.duration?.toFixed(1)}s`
    );
  }

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks: PlaybackEngineCallbacks): void {
    this.callbacks = { ...callbacks };
  }

  /**
   * 开始播放
   */
  play(): void {
    if (!this.recordingFile || this.status === 'playing') {
      return;
    }

    if (DEBUG_PLAYBACK) {
      console.log('[PlaybackEngine] Starting playback');
    }
    this.status = 'playing';
    this.baseTime = Date.now();
    this.startTimer();

    // 立即处理第一个事件
    this.processEvents();
  }

  /**
   * 暂停播放
   */
  pause(): void {
    if (this.status !== 'playing') {
      return;
    }

    if (DEBUG_PLAYBACK) {
      console.log('[PlaybackEngine] Pausing playback');
    }
    this.status = 'paused';
    this.stopTimer();
  }

  /**
   * 恢复播放
   */
  resume(): void {
    if (this.status !== 'paused') {
      return;
    }

    if (DEBUG_PLAYBACK) {
      console.log('[PlaybackEngine] Resuming playback');
    }
    this.status = 'playing';
    this.baseTime = Date.now() - (this.currentTime - this.recordingFile!.metadata.startTime);
    this.startTimer();
  }

  /**
   * 停止播放
   */
  stop(): void {
    console.log('[PlaybackEngine] Stopping playback');
    this.status = 'stopped';
    this.stopTimer();
    this.currentTime = this.recordingFile?.metadata.startTime || 0;
    this.currentEventIndex = 0;

    this.callbacks.onEnded?.();
  }

  /**
   * 跳转到指定时间
   */
  seek(timestamp: number): void {
    if (!this.recordingFile) {
      return;
    }

    // 限制范围
    const startTime = this.recordingFile.metadata.startTime;
    const endTime = this.recordingFile.metadata.endTime || Date.now();
    const clampedTimestamp = Math.max(startTime, Math.min(endTime, timestamp));

    console.log(`[PlaybackEngine] Seeking to ${clampedTimestamp}`);

    // 更新当前时间
    this.currentTime = clampedTimestamp;

    // 找到对应的事件索引
    this.currentEventIndex = 0;
    for (let i = 0; i < this.recordingFile.events.length; i++) {
      if (this.recordingFile.events[i].timestamp >= clampedTimestamp) {
        this.currentEventIndex = i;
        break;
      }
    }

    // 如果正在播放，重置基准时间
    if (this.status === 'playing') {
      this.baseTime = Date.now() - (clampedTimestamp - startTime);
    }

    // 触发进度回调
    this.callbacks.onProgress?.(this.currentTime, endTime);
  }

  /**
   * 设置播放速度
   */
  setPlaybackSpeed(speed: number): void {
    console.log(`[PlaybackEngine] Setting playback speed: ${speed}x`);
    this.playbackSpeed = Math.max(0.1, Math.min(4.0, speed)); // 限制在 0.1x - 4x 之间
  }

  /**
   * 获取当前时间
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * 获取总时长（毫秒）
   */
  getTotalDuration(): number {
    if (!this.recordingFile) {
      return 0;
    }
    const endTime = this.recordingFile.metadata.endTime || Date.now();
    return endTime - this.recordingFile.metadata.startTime;
  }

  /**
   * 获取播放状态
   */
  getStatus(): PlaybackStatus {
    return this.status;
  }

  /**
   * 是否正在播放
   */
  isPlaying(): boolean {
    return this.status === 'playing';
  }

  /**
   * 是否已暂停
   */
  isPaused(): boolean {
    return this.status === 'paused';
  }

  /**
   * 启动定时器
   */
  private startTimer(): void {
    if (this.timerId !== null) {
      return;
    }

    // 根据播放速度调整定时器间隔
    const interval = 50 / this.playbackSpeed; // 基础间隔 50ms，根据速度调整
    this.timerId = window.setInterval(this.tick, interval);
  }

  /**
   * 停止定时器
   */
  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * 定时器回调
   */
  private tick(): void {
    if (!this.recordingFile || this.status !== 'playing') {
      return;
    }

    const startTime = this.recordingFile.metadata.startTime;
    const endTime = this.recordingFile.metadata.endTime || Date.now();

    // 计算当前播放位置（考虑播放速度）
    const elapsed = (Date.now() - this.baseTime) * this.playbackSpeed;
    this.currentTime = startTime + elapsed;

    // 检查是否到达结尾
    if (this.currentTime >= endTime) {
      this.stop();
      return;
    }

    // 处理事件
    this.processEvents();

    // 触发进度回调
    this.callbacks.onProgress?.(this.currentTime, endTime);
  }

  /**
   * 处理事件
   */
  private processEvents(): void {
    if (!this.recordingFile) {
      return;
    }

    const events = this.recordingFile.events;

    // 只在调试模式下输出详细日志
    if (DEBUG_PLAYBACK) {
      console.log('[PlaybackEngine] processEvents:', {
        currentEventIndex: this.currentEventIndex,
        totalEvents: events.length,
        currentTime: this.currentTime,
        startTime: this.recordingFile.metadata.startTime,
        endTime: this.recordingFile.metadata.endTime
      });
    }

    // 处理所有应该在当前时间之前触发的事件
    while (
      this.currentEventIndex < events.length &&
      events[this.currentEventIndex].timestamp <= this.currentTime
    ) {
      const event = events[this.currentEventIndex];
      this.dispatchEvent(event);
      this.currentEventIndex++;
    }
  }

  /**
   * 分发事件
   */
  private dispatchEvent(event: RecordingEvent): void {
    if (DEBUG_PLAYBACK) {
      console.log('[PlaybackEngine] Dispatching event:', event.type, 'at', event.timestamp);
    }

    switch (event.type) {
      case 'input':
        // 输入事件不需要在回放时处理（只记录）
        if (DEBUG_PLAYBACK) {
          console.log('[PlaybackEngine] Skipping input event');
        }
        break;

      case 'output':
        if (this.callbacks.onOutput) {
          const data = event.data as { data: number[] };
          if (DEBUG_PLAYBACK) {
            console.log('[PlaybackEngine] Calling onOutput with', data.data.length, 'bytes');
          }
          this.callbacks.onOutput(new Uint8Array(data.data));
        }
        break;

      case 'resize':
        if (this.callbacks.onResize) {
          const data = event.data as { cols: number; rows: number };
          this.callbacks.onResize(data.cols, data.rows);
        }
        break;

      case 'metadata':
        if (this.callbacks.onMetadata) {
          const data = event.data as { key: string; value: unknown };
          this.callbacks.onMetadata(data.key, data.value);
        }
        break;
    }
  }

  /**
   * 销毁引擎
   */
  dispose(): void {
    this.stop();
    this.recordingFile = null;
    this.callbacks = {};
  }
}
