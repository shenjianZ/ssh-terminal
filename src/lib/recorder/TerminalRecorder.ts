/**
 * 终端录制器实现
 * 负责记录终端会话的所有事件（输入、输出、调整大小等）
 */

import type {
  RecordingEvent,
  RecordingFile,
  ITerminalRecorder,
} from '@/types/recording';
import type { TerminalConfig } from '@/types/terminal';

export class TerminalRecorder implements ITerminalRecorder {
  private connectionId: string;
  private sessionName: string;
  private events: RecordingEvent[] = [];
  private startTime: number = 0;
  private initialTerminalSize: { cols: number; rows: number };
  private isRecordingFlag: boolean = false;
  private isPausedFlag: boolean = false;
  private terminalConfig?: TerminalConfig; // 保存终端配置

  // 跟踪实际录制时长（不包括暂停时间）
  private lastResumeTime: number = 0; // 上次恢复录制的时间
  private accumulatedDuration: number = 0; // 累计录制时长（秒）

  constructor(
    connectionId: string,
    sessionName: string,
    terminalSize: { cols: number; rows: number },
    terminalConfig?: TerminalConfig
  ) {
    this.connectionId = connectionId;
    this.sessionName = sessionName;
    this.initialTerminalSize = terminalSize;
    this.terminalConfig = terminalConfig;
  }

  start(): void {
    this.startTime = Date.now();
    this.lastResumeTime = this.startTime;
    this.accumulatedDuration = 0;
    this.events = [];
    this.isRecordingFlag = true;
    this.isPausedFlag = false;

    // 记录初始元数据
    this.addEvent({
      timestamp: this.startTime,
      type: 'metadata',
      data: {
        key: 'recording_start',
        value: {
          connectionId: this.connectionId,
          sessionName: this.sessionName,
          terminalSize: this.initialTerminalSize,
        },
      },
    });

    console.log(
      `[TerminalRecorder] Started recording for connection: ${this.connectionId}, session: ${this.sessionName}`
    );
  }

  recordInput(data: string): void {
    if (!this.isRecordingFlag || this.isPausedFlag) return;

    this.addEvent({
      timestamp: Date.now(),
      type: 'input',
      data: { data },
    });
  }

  recordOutput(data: Uint8Array): void {
    if (!this.isRecordingFlag || this.isPausedFlag) return;

    this.addEvent({
      timestamp: Date.now(),
      type: 'output',
      data: { data: Array.from(data) },
    });
  }

  recordResize(cols: number, rows: number): void {
    if (!this.isRecordingFlag || this.isPausedFlag) return;

    this.addEvent({
      timestamp: Date.now(),
      type: 'resize',
      data: { cols, rows },
    });
  }

  stop(): RecordingFile {
    if (!this.isRecordingFlag) {
      throw new Error('Recorder is not recording');
    }

    const endTime = Date.now();
    this.isRecordingFlag = false;
    this.isPausedFlag = false;

    // 计算实际录制时长（不包括暂停时间）
    const finalDuration = this.calculateActualDuration(endTime);

    // 记录结束元数据
    this.addEvent({
      timestamp: endTime,
      type: 'metadata',
      data: {
        key: 'recording_end',
        value: {
          endTime,
        },
      },
    });

    // 准备终端配置数据（如果有的话）
    console.log('[TerminalRecorder] Preparing to save, terminalConfig:', this.terminalConfig);
    let terminalConfigData = undefined;
    if (this.terminalConfig) {
      console.log('[TerminalRecorder] Terminal config found, themeId:', this.terminalConfig.themeId);
      terminalConfigData = {
        themeId: this.terminalConfig.themeId,
        fontSize: this.terminalConfig.fontSize,
        fontFamily: this.terminalConfig.fontFamily,
        fontWeight: this.terminalConfig.fontWeight,
        lineHeight: this.terminalConfig.lineHeight,
        cursorStyle: this.terminalConfig.cursorStyle,
        cursorBlink: this.terminalConfig.cursorBlink,
        letterSpacing: this.terminalConfig.letterSpacing,
      };
      console.log('[TerminalRecorder] Terminal config data prepared:', terminalConfigData);
    } else {
      console.warn('[TerminalRecorder] No terminal config available!');
    }

    const recordingFile: RecordingFile = {
      version: '1.0',
      metadata: {
        startTime: this.startTime,
        endTime,
        duration: finalDuration,
        terminalSize: this.initialTerminalSize,
        connectionId: this.connectionId,
        sessionName: this.sessionName,
        tags: [],
        eventCount: this.events.length,
        terminalConfig: terminalConfigData,
      },
      events: this.events,
    };

    console.log(
      `[TerminalRecorder] Stopped recording for connection: ${this.connectionId}, ` +
        `duration: ${recordingFile.metadata.duration}s, events: ${this.events.length}`
    );

    return recordingFile;
  }

  pause(): void {
    if (this.isRecordingFlag && !this.isPausedFlag) {
      // 在暂停前，计算当前录制时长并累加
      const currentDuration = (Date.now() - this.lastResumeTime) / 1000;
      this.accumulatedDuration += currentDuration;

      this.isPausedFlag = true;
      this.addEvent({
        timestamp: Date.now(),
        type: 'metadata',
        data: {
          key: 'recording_paused',
          value: {},
        },
      });
      console.log(`[TerminalRecorder] Paused recording for connection: ${this.connectionId}, accumulated: ${this.accumulatedDuration}s`);
    }
  }

  resume(): void {
    if (this.isRecordingFlag && this.isPausedFlag) {
      this.isPausedFlag = false;
      this.lastResumeTime = Date.now(); // 记录恢复时间

      this.addEvent({
        timestamp: this.lastResumeTime,
        type: 'metadata',
        data: {
          key: 'recording_resumed',
          value: {},
        },
      });
      console.log(`[TerminalRecorder] Resumed recording for connection: ${this.connectionId}`);
    }
  }

  isRecording(): boolean {
    return this.isRecordingFlag;
  }

  isPaused(): boolean {
    return this.isPausedFlag;
  }

  getEventCount(): number {
    return this.events.length;
  }

  /**
   * 获取当前录制的预览信息（不停止录制）
   */
  getPreview(): {
    startTime: number;
    eventCount: number;
    duration: number;
  } {
    const actualDuration = this.calculateActualDuration(Date.now());
    return {
      startTime: this.startTime,
      eventCount: this.events.length,
      duration: actualDuration,
    };
  }

  /**
   * 计算实际录制时长（不包括暂停时间）
   */
  private calculateActualDuration(currentTime: number): number {
    if (this.isPausedFlag) {
      // 如果已暂停，只返回累计时长
      return this.accumulatedDuration;
    } else {
      // 如果正在录制，返回累计时长 + 当前录制时长
      const currentSessionDuration = (currentTime - this.lastResumeTime) / 1000;
      return this.accumulatedDuration + currentSessionDuration;
    }
  }

  private addEvent(event: RecordingEvent): void {
    this.events.push(event);
  }

  /**
   * 获取连接 ID
   */
  getConnectionId(): string {
    return this.connectionId;
  }

  /**
   * 获取会话名称
   */
  getSessionName(): string {
    return this.sessionName;
  }

  /**
   * 获取所有事件（用于调试或特殊用途）
   */
  getEvents(): RecordingEvent[] {
    return [...this.events];
  }
}
