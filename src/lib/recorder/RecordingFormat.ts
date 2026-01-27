/**
 * 录制格式定义和序列化工具
 */

import type { RecordingFile, RecordingEvent } from '@/types/recording';

/**
 * 验证录制文件格式
 */
export function validateRecordingFile(file: unknown): file is RecordingFile {
  if (!file || typeof file !== 'object') {
    return false;
  }

  const recordingFile = file as Partial<RecordingFile>;

  // 检查版本
  if (recordingFile.version !== '1.0') {
    console.warn('[RecordingFormat] Unsupported version:', recordingFile.version);
    return false;
  }

  // 检查元数据
  if (!recordingFile.metadata || typeof recordingFile.metadata !== 'object') {
    console.error('[RecordingFormat] Missing or invalid metadata');
    return false;
  }

  const { metadata } = recordingFile;

  // 检查必需的元数据字段
  if (
    typeof metadata.startTime !== 'number' ||
    typeof metadata.terminalSize !== 'object' ||
    typeof metadata.connectionId !== 'string' ||
    typeof metadata.sessionName !== 'string'
  ) {
    console.error('[RecordingFormat] Missing required metadata fields');
    return false;
  }

  // 检查终端尺寸
  if (
    typeof metadata.terminalSize.cols !== 'number' ||
    typeof metadata.terminalSize.rows !== 'number'
  ) {
    console.error('[RecordingFormat] Invalid terminal size');
    return false;
  }

  // 检查事件数组
  if (!Array.isArray(recordingFile.events)) {
    console.error('[RecordingFormat] Events must be an array');
    return false;
  }

  // 验证每个事件
  for (let i = 0; i < recordingFile.events.length; i++) {
    const event = recordingFile.events[i];
    if (!validateRecordingEvent(event)) {
      console.error(`[RecordingFormat] Invalid event at index ${i}`);
      return false;
    }
  }

  return true;
}

/**
 * 验证录制事件
 */
export function validateRecordingEvent(event: unknown): event is RecordingEvent {
  if (!event || typeof event !== 'object') {
    return false;
  }

  const recordingEvent = event as Partial<RecordingEvent>;

  // 检查必需字段
  if (
    typeof recordingEvent.timestamp !== 'number' ||
    typeof recordingEvent.type !== 'string' ||
    recordingEvent.data === undefined
  ) {
    return false;
  }

  // 检查事件类型
  const validTypes = ['input', 'output', 'resize', 'metadata'];
  if (!validTypes.includes(recordingEvent.type)) {
    console.warn('[RecordingFormat] Unknown event type:', recordingEvent.type);
    return false;
  }

  return true;
}

/**
 * 序列化录制文件为 JSON 字符串
 */
export function serializeRecordingFile(file: RecordingFile): string {
  try {
    return JSON.stringify(file, null, 2);
  } catch (error) {
    console.error('[RecordingFormat] Failed to serialize recording file:', error);
    throw new Error('Serialization failed');
  }
}

/**
 * 从 JSON 字符串反序列化录制文件
 */
export function deserializeRecordingFile(jsonString: string): RecordingFile | null {
  try {
    const file = JSON.parse(jsonString);

    if (!validateRecordingFile(file)) {
      console.error('[RecordingFormat] Invalid recording file format');
      return null;
    }

    return file;
  } catch (error) {
    console.error('[RecordingFormat] Failed to deserialize recording file:', error);
    return null;
  }
}

/**
 * 压缩录制文件（移除不必要的数据以减小文件大小）
 * 注意：这是一个可选的优化功能，暂时只返回原始文件
 */
export function compressRecordingFile(file: RecordingFile): RecordingFile {
  // TODO: 实现压缩逻辑
  // 可能的优化：
  // 1. 合并连续的输出事件
  // 2. 移除重复的元数据事件
  // 3. 使用二进制格式而不是 JSON

  return file;
}

/**
 * 计算录制文件的统计信息
 */
export function calculateRecordingStats(file: RecordingFile): {
  eventCount: number;
  inputEventCount: number;
  outputEventCount: number;
  resizeEventCount: number;
  metadataEventCount: number;
  totalOutputBytes: number;
  averageEventInterval: number;
} {
  const stats = {
    eventCount: file.events.length,
    inputEventCount: 0,
    outputEventCount: 0,
    resizeEventCount: 0,
    metadataEventCount: 0,
    totalOutputBytes: 0,
    averageEventInterval: 0,
  };

  let previousTimestamp = file.metadata.startTime;
  let totalInterval = 0;
  let intervalCount = 0;

  for (const event of file.events) {
    switch (event.type) {
      case 'input':
        stats.inputEventCount++;
        break;
      case 'output':
        stats.outputEventCount++;
        if (Array.isArray(event.data)) {
          // 旧格式
          stats.totalOutputBytes += event.data.length;
        } else if (typeof event.data === 'object' && event.data !== null) {
          const data = event.data as { data: number[] };
          if (Array.isArray(data.data)) {
            stats.totalOutputBytes += data.data.length;
          }
        }
        break;
      case 'resize':
        stats.resizeEventCount++;
        break;
      case 'metadata':
        stats.metadataEventCount++;
        break;
    }

    // 计算事件间隔
    if (event.timestamp > previousTimestamp) {
      totalInterval += event.timestamp - previousTimestamp;
      intervalCount++;
    }
    previousTimestamp = event.timestamp;
  }

  stats.averageEventInterval =
    intervalCount > 0 ? totalInterval / intervalCount : 0;

  return stats;
}

/**
 * 生成录制文件的可读摘要
 */
export function generateRecordingSummary(file: RecordingFile): string {
  const stats = calculateRecordingStats(file);
  const duration = file.metadata.duration || 0;

  const minutes = Math.floor(duration / 60);
  const seconds = (duration % 60).toFixed(1);

  let summary = `录制会话: ${file.metadata.sessionName}\n`;
  summary += `连接 ID: ${file.metadata.connectionId}\n`;
  summary += `持续时间: ${minutes}分${seconds}秒\n`;
  summary += `事件总数: ${stats.eventCount}\n`;
  summary += `  - 输入事件: ${stats.inputEventCount}\n`;
  summary += `  - 输出事件: ${stats.outputEventCount}\n`;
  summary += `  - 调整大小事件: ${stats.resizeEventCount}\n`;
  summary += `  - 元数据事件: ${stats.metadataEventCount}\n`;
  summary += `输出总字节数: ${stats.totalOutputBytes}\n`;
  summary += `平均事件间隔: ${stats.averageEventInterval.toFixed(2)}ms\n`;

  if (file.metadata.tags && file.metadata.tags.length > 0) {
    summary += `标签: ${file.metadata.tags.join(', ')}\n`;
  }

  if (file.metadata.description) {
    summary += `描述: ${file.metadata.description}\n`;
  }

  return summary;
}

/**
 * 生成默认的录制文件名
 */
export function generateDefaultFileName(
  sessionName: string,
  startTime: number
): string {
  const date = new Date(startTime);
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS

  // 清理会话名称中的非法字符
  const cleanSessionName = sessionName.replace(/[^a-zA-Z0-9_-]/g, '_');

  return `${cleanSessionName}_${dateStr}_${timeStr}.json`;
}

/**
 * 检查录制文件是否过旧（可能不兼容当前版本）
 */
export function isRecordingFileOutdated(file: RecordingFile): boolean {
  // 当前版本是 1.0，暂时认为所有文件都是兼容的
  // 未来如果有版本升级，可以在这里添加检查逻辑
  return file.version !== '1.0';
}

/**
 * 尝试升级旧版本的录制文件
 */
export function upgradeRecordingFile(file: unknown): RecordingFile | null {
  // TODO: 当有新版本时，实现升级逻辑
  // 例如：将 0.x 版本升级到 1.0

  if (validateRecordingFile(file)) {
    return file as RecordingFile;
  }

  return null;
}
