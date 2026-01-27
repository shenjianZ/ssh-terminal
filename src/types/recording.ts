/**
 * 终端录制和回放功能的类型定义
 */

// 录制事件类型
export type RecordingEventType = 'input' | 'output' | 'resize' | 'metadata';

// 基础录制事件接口
export interface RecordingEvent {
  timestamp: number;  // Unix 时间戳（毫秒）
  type: RecordingEventType;
  data: unknown;
}

// 输入事件数据
export interface InputEventData {
  data: string;  // 用户输入的数据
}

// 输出事件数据
export interface OutputEventData {
  data: number[];  // 终端输出的字节数组
}

// 调整大小事件数据
export interface ResizeEventData {
  cols: number;
  rows: number;
}

// 元数据事件数据
export interface MetadataEventData {
  key: string;
  value: unknown;
}

// 录制文件格式
export interface RecordingFile {
  version: '1.0';  // 格式版本
  metadata: RecordingMetadata;
  events: RecordingEvent[];
}

// 录制元数据
export interface RecordingMetadata {
  startTime: number;   // 开始时间（Unix 时间戳）
  endTime?: number;    // 结束时间（Unix 时间戳）
  duration?: number;   // 持续时间（秒）
  terminalSize: {
    cols: number;
    rows: number;
  };
  connectionId: string;   // SSH 连接 ID
  sessionName: string;    // 会话名称（用户可编辑）
  description?: string;   // 描述（可选）
  tags: string[];         // 标签
  eventCount: number;     // 事件总数
  fileSize?: number;      // 文件大小（字节）
  // 终端样式配置（用于视频导出时还原样式）
  terminalConfig?: {
    themeId: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    lineHeight: number;
    cursorStyle: 'block' | 'underline' | 'bar';
    cursorBlink: boolean;
    letterSpacing: number;
    videoQuality: string;
    videoFormat: string;
  };
  // 关联的视频文件路径（相对于 recordings 目录）
  videoFile?: string;
}

// 录制状态
export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

// 回放状态
export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'stopped';

// 录制会话信息（用于 Store）
export interface RecordingSession {
  connectionId: string;
  status: RecordingStatus;
  startTime: number;
  eventCount: number;
  recorder?: ITerminalRecorder;  // 录制器实例
  videoBlob?: Blob;  // 录制的视频 Blob（在停止录制时生成）
}

// 回放会话信息
export interface PlaybackSession {
  recordingFile: RecordingFile;
  status: PlaybackStatus;
  currentTime: number;  // 当前回放位置（Unix 时间戳）
  playbackSpeed: number;  // 播放速度倍数（0.5x, 1x, 2x 等）
}

// 视频导出配置
export interface VideoExportConfig {
  format: 'webm' | 'mp4';
  quality: 'low' | 'medium' | 'high';
  fps: number;  // 帧率（通常为 30）
  bitrate?: number;  // 比特率（kbps）
}

// 视频导出进度
export interface VideoExportProgress {
  totalFrames: number;
  currentFrame: number;
  percentage: number;
  status: 'preparing' | 'encoding' | 'finalizing' | 'completed' | 'error';
  error?: string;
}

// 录制器类接口
export interface ITerminalRecorder {
  start(): void;
  recordInput(data: string): void;
  recordOutput(data: Uint8Array): void;
  recordResize(cols: number, rows: number): void;
  stop(): RecordingFile;
  pause(): void;
  resume(): void;
  isRecording(): boolean;
  isPaused(): boolean;
  getEventCount(): number;
  getPreview(): { duration: number; eventCount: number };
}

// 回放引擎类
export interface IPlaybackEngine {
  load(recordingFile: RecordingFile): void;
  play(): void;
  pause(): void;
  stop(): void;
  seek(timestamp: number): void;
  setPlaybackSpeed(speed: number): void;
  getCurrentTime(): number;
  getTotalDuration(): number;
  isPlaying(): boolean;
  isPaused(): boolean;
}

// 录制文件列表项（用于 UI 显示）
export interface RecordingFileItem {
  id: string;  // 文件 ID（文件名或 UUID）
  filePath: string;  // 文件路径
  metadata: RecordingMetadata;
  createdAt: number;  // 创建时间
  fileSize: number;  // 文件大小（字节）
}
