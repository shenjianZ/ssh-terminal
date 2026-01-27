import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
  RecordingFile,
  RecordingSession,
  PlaybackSession,
  PlaybackStatus,
  RecordingFileItem,
  VideoExportConfig,
  VideoExportProgress,
} from '@/types/recording';
import { TerminalRecorder } from '@/lib/recorder/TerminalRecorder';
import { VideoRecorder } from '@/lib/recorder/VideoRecorder';
import { useTerminalConfigStore } from '@/store/terminalConfigStore';

interface RecordingStore {
  // ========== 状态 ==========

  // 当前录制会话（按 connectionId 索引）
  recordingSessions: Map<string, RecordingSession>;

  // 当前回放会话（最多同时一个）
  playbackSession: PlaybackSession | null;

  // 录制文件列表
  recordingFiles: RecordingFileItem[];

  // 视频导出进度
  exportProgress: VideoExportProgress | null;

  // 视频 Blob 缓存（key 为录制文件的 filePath）
  videoBlobCache: Map<string, Blob>;

  // ========== 录制控制方法 ==========

  /**
   * 开始录制
   * @param connectionId SSH 连接 ID
   * @param sessionName 会话名称
   * @param terminalSize 终端尺寸
   * @param initialPrompt 初始终端内容（包括提示符）
   * @param preInitializedVideoRecorder 预初始化的视频录制器（可选）
   */
  startRecording: (
    connectionId: string,
    sessionName: string,
    terminalSize: { cols: number; rows: number },
    initialPrompt?: string,
    preInitializedVideoRecorder?: any
  ) => Promise<void>;

  /**
   * 停止录制并保存
   * @param connectionId SSH 连接 ID
   * @returns 录制文件（如果成功）
   */
  stopRecording: (connectionId: string) => Promise<RecordingFile | null>;

  /**
   * 暂停录制
   * @param connectionId SSH 连接 ID
   */
  pauseRecording: (connectionId: string) => void;

  /**
   * 恢复录制
   * @param connectionId SSH 连接 ID
   */
  resumeRecording: (connectionId: string) => void;

  /**
   * 获取录制会话
   * @param connectionId SSH 连接 ID
   */
  getRecordingSession: (connectionId: string) => RecordingSession | undefined;

  /**
   * 检查是否正在录制
   * @param connectionId SSH 连接 ID
   */
  isRecording: (connectionId: string) => boolean;

  /**
   * 记录输入事件
   * @param connectionId SSH 连接 ID
   * @param data 输入数据
   */
  recordInput: (connectionId: string, data: string) => void;

  /**
   * 记录输出事件
   * @param connectionId SSH 连接 ID
   * @param data 输出数据
   */
  recordOutput: (connectionId: string, data: Uint8Array) => void;

  /**
   * 记录终端大小调整事件
   * @param connectionId SSH 连接 ID
   * @param cols 列数
   * @param rows 行数
   */
  recordResize: (connectionId: string, cols: number, rows: number) => void;

  // ========== 录制文件管理方法 ==========

  /**
   * 保存录制文件
   * @param recordingFile 录制文件
   * @param fileName 文件名（可选）
   * @returns 保存的文件路径
   */
  saveRecordingFile: (
    recordingFile: RecordingFile,
    fileName?: string
  ) => Promise<string | null>;

  /**
   * 加载录制文件
   * @param filePath 文件路径
   * @returns 录制文件
   */
  loadRecordingFile: (filePath: string) => Promise<RecordingFile | null>;

  /**
   * 列出所有录制文件
   */
  listRecordingFiles: () => Promise<void>;

  /**
   * 删除录制文件
   * @param fileId 文件 ID
   */
  deleteRecordingFile: (fileId: string) => Promise<void>;

  /**
   * 更新录制文件元数据
   * @param fileId 文件 ID
   * @param metadata 新的元数据
   */
  updateRecordingMetadata: (
    fileId: string,
    metadata: Partial<RecordingFile['metadata']>
  ) => Promise<void>;

  /**
   * 导出录制文件为 JSON
   * @param fileId 文件 ID
   */
  exportRecordingAsJson: (fileId: string) => Promise<void>;

  /**
   * 从 JSON 导入录制文件
   */
  importRecordingFromJson: () => Promise<void>;

  // ========== 回放控制方法 ==========

  /**
   * 开始回放
   * @param recordingFile 录制文件
   */
  startPlayback: (recordingFile: RecordingFile) => void;

  /**
   * 停止回放
   */
  stopPlayback: () => void;

  /**
   * 暂停回放
   */
  pausePlayback: () => void;

  /**
   * 恢复回放
   */
  resumePlayback: () => void;

  /**
   * 跳转到指定时间
   * @param timestamp 目标时间戳
   */
  seekPlayback: (timestamp: number) => void;

  /**
   * 设置回放速度
   * @param speed 速度倍数（0.5x, 1x, 2x 等）
   */
  setPlaybackSpeed: (speed: number) => void;

  /**
   * 获取当前回放状态
   */
  getPlaybackStatus: () => PlaybackStatus;

  // ========== 视频导出方法 ==========

  /**
   * 加载视频文件（从磁盘或缓存）
   * @param videoFilename 视频文件名
   * @returns 视频 Blob
   */
  loadVideoBlob: (videoFilename: string) => Promise<Blob | null>;

  /**
   * 导出为视频
   * @param fileId 文件 ID
   * @param config 导出配置
   */
  exportAsVideo: (
    fileId: string,
    config: VideoExportConfig
  ) => Promise<void>;

  /**
   * 取消视频导出
   */
  cancelVideoExport: () => Promise<void>;

  // ========== 清理方法 ==========

  /**
   * 清理指定连接的录制会话
   * @param connectionId SSH 连接 ID
   */
  cleanupRecordingSession: (connectionId: string) => void;
}

export const useRecordingStore = create<RecordingStore>((set, get) => ({
  // 初始状态
  recordingSessions: new Map(),
  playbackSession: null,
  recordingFiles: [],
  exportProgress: null,
  videoBlobCache: new Map(),

  // ========== 录制控制方法 ==========

  startRecording: async (connectionId, sessionName, terminalSize, initialPrompt, preInitializedVideoRecorder?: any) => {
    // 检查是否已经在录制
    const existingSession = get().recordingSessions.get(connectionId);
    if (existingSession && existingSession.status === 'recording') {
      console.warn(`[RecordingStore] Already recording for connection: ${connectionId}`);
      return;
    }

    // 获取当前终端配置
    const terminalConfig = useTerminalConfigStore.getState().config;

    // 创建录制器实例（包含终端配置）
    const recorder = new TerminalRecorder(connectionId, sessionName, terminalSize, terminalConfig);

    // 使用预初始化的videoRecorder或创建新的
    let videoRecorder = preInitializedVideoRecorder;
    if (!videoRecorder) {
      videoRecorder = new VideoRecorder();
      try {
        await videoRecorder.initialize(sessionName, terminalSize, terminalConfig);
      } catch (error) {
        console.error('[RecordingStore] Failed to initialize video recorder:', error);
        // 视频录制失败不影响事件录制
      }
    }

    // 开始视频录制（在倒计时结束后）
    try {
      await videoRecorder.start();
    } catch (error) {
      console.error('[RecordingStore] Failed to start video recorder:', error);
    }

    // 开始录制
    recorder.start();

    // 如果有初始内容（包括提示符），作为第一个输出事件记录
    if (initialPrompt && initialPrompt.length > 0) {
      const promptBytes = new TextEncoder().encode(initialPrompt);
      recorder.recordOutput(promptBytes);
      // 同时写入视频录制器
      videoRecorder.write(promptBytes);
    }

    // 创建录制会话
    const session: RecordingSession = {
      connectionId,
      status: 'recording',
      startTime: Date.now(),
      eventCount: 0,
      recorder,
    };

    // 更新 store
    const newSessions = new Map(get().recordingSessions);
    newSessions.set(connectionId, session);
    set({ recordingSessions: newSessions });

    // 保存 videoRecorder 实例到 session（用于后续写入）
    (session as any).videoRecorder = videoRecorder;

    console.log(`[RecordingStore] Started recording for connection: ${connectionId}, session: ${sessionName}`);
  },

  stopRecording: async (connectionId) => {
    const session = get().recordingSessions.get(connectionId);
    if (!session || (session.status !== 'recording' && session.status !== 'paused')) {
      console.warn(`[RecordingStore] No active recording for connection: ${connectionId}`);
      return null;
    }

    try {
      // 停止视频录制器并获取视频 blob
      const videoRecorder = (session as any).videoRecorder as VideoRecorder;
      let videoBlob: Blob | null = null;
      if (videoRecorder) {
        videoBlob = await videoRecorder.stop();
        console.log(`[RecordingStore] Video recording stopped, blob size: ${videoBlob?.size || 0} bytes`);
        videoRecorder.dispose();
      }

      // 停止录制器
      const recordingFile = session.recorder!.stop();

      // 生成录制 ID（用于文件命名）
      const recordingId = `${recordingFile.metadata.sessionName}_${recordingFile.metadata.startTime}`;
      
      // 保存视频文件到磁盘
      let videoFilename: string | null = null;
      if (videoBlob && videoBlob.size > 0) {
        try {
          const videoData = new Uint8Array(await videoBlob.arrayBuffer());
          const videoFormat = recordingFile.metadata.terminalConfig?.videoFormat || 'webm';
          
          videoFilename = await invoke<string>('recording_save_video', {
            recordingId,
            videoData: Array.from(videoData),
            fileExtension: videoFormat,
          });

          console.log(`[RecordingStore] Video saved to disk: ${videoFilename}`);
          
          // 将视频文件名添加到录制元数据
          recordingFile.metadata.videoFile = videoFilename;
        } catch (error) {
          console.error('[RecordingStore] Failed to save video to disk:', error);
          // 视频保存失败不影响录制文件保存
        }
      }

      // 生成 JSON 文件名
      const fileName = `${recordingId}.json`;

      // 保存录制文件（包含视频文件路径）
      const filePath = await get().saveRecordingFile(recordingFile, fileName);

      // 如果视频保存成功，也保存到内存缓存中（用于快速访问）
      if (videoBlob && videoBlob.size > 0 && filePath) {
        const newCache = new Map(get().videoBlobCache);
        newCache.set(filePath, videoBlob);
        set({ videoBlobCache: newCache });
        console.log(`[RecordingStore] Video blob cached in memory for quick access`);
      }

      // 更新文件列表
      await get().listRecordingFiles();

      // 清理会话
      get().cleanupRecordingSession(connectionId);

      console.log(`[RecordingStore] Stopped recording for connection: ${connectionId}, saved to: ${filePath}`);
      return recordingFile;
    } catch (error) {
      console.error(`[RecordingStore] Failed to stop recording for connection: ${connectionId}`, error);
      return null;
    }
  },

  pauseRecording: (connectionId) => {
    const session = get().recordingSessions.get(connectionId);
    if (!session || session.status !== 'recording') {
      console.warn(`[RecordingStore] No active recording to pause for connection: ${connectionId}`);
      return;
    }

    session.recorder!.pause();

    // 更新状态
    const newSessions = new Map(get().recordingSessions);
    newSessions.set(connectionId, {
      ...session,
      status: 'paused',
    });
    set({ recordingSessions: newSessions });
  },

  resumeRecording: (connectionId) => {
    const session = get().recordingSessions.get(connectionId);
    if (!session || session.status !== 'paused') {
      console.warn(`[RecordingStore] No paused recording to resume for connection: ${connectionId}`);
      return;
    }

    session.recorder!.resume();

    // 更新状态
    const newSessions = new Map(get().recordingSessions);
    newSessions.set(connectionId, {
      ...session,
      status: 'recording',
    });
    set({ recordingSessions: newSessions });
  },

  getRecordingSession: (connectionId) => {
    return get().recordingSessions.get(connectionId);
  },

  isRecording: (connectionId) => {
    const session = get().recordingSessions.get(connectionId);
    return session?.status === 'recording' || session?.status === 'paused';
  },

  recordInput: (connectionId, data) => {
    const session = get().recordingSessions.get(connectionId);
    if (session?.recorder && session.status === 'recording') {
      session.recorder.recordInput(data);
      // 更新事件计数并触发状态更新
      const newSessions = new Map(get().recordingSessions);
      newSessions.set(connectionId, {
        ...session,
        eventCount: session.recorder.getEventCount(),
      });
      set({ recordingSessions: newSessions });
    }
  },

  recordOutput: (connectionId, data) => {
    const session = get().recordingSessions.get(connectionId);
    if (session?.recorder && session.status === 'recording') {
      session.recorder.recordOutput(data);

      // 同时写入视频录制器
      const videoRecorder = (session as any).videoRecorder as VideoRecorder;
      if (videoRecorder) {
        videoRecorder.write(data);
      }

      // 更新事件计数并触发状态更新
      const newSessions = new Map(get().recordingSessions);
      newSessions.set(connectionId, {
        ...session,
        eventCount: session.recorder.getEventCount(),
      });
      set({ recordingSessions: newSessions });
    }
  },

  recordResize: (connectionId, cols, rows) => {
    const session = get().recordingSessions.get(connectionId);
    if (session?.recorder && session.status === 'recording') {
      session.recorder.recordResize(cols, rows);

      // 同时调整视频录制器中的终端大小
      const videoRecorder = (session as any).videoRecorder as VideoRecorder;
      if (videoRecorder) {
        videoRecorder.resize(cols, rows);
      }
    }
  },

  // ========== 录制文件管理方法 ==========

  saveRecordingFile: async (recordingFile, fileName) => {
    try {
      // 调用后端命令保存文件
      const filePath = await invoke<string>('recording_save', {
        recordingFile,
        fileName,
      });
      return filePath;
    } catch (error) {
      console.error('[RecordingStore] Failed to save recording file:', error);
      return null;
    }
  },

  loadRecordingFile: async (filePath) => {
    try {
      const recordingFile = await invoke<RecordingFile>('recording_load', {
        filePath,
      });
      return recordingFile;
    } catch (error) {
      console.error('[RecordingStore] Failed to load recording file:', error);
      return null;
    }
  },

  listRecordingFiles: async () => {
    try {
      const files = await invoke<RecordingFileItem[]>('recording_list');
      set({ recordingFiles: files });
    } catch (error) {
      console.error('[RecordingStore] Failed to list recording files:', error);
      set({ recordingFiles: [] });
    }
  },

  deleteRecordingFile: async (fileId) => {
    try {
      await invoke('recording_delete', { fileId });
      // 重新加载文件列表
      await get().listRecordingFiles();
    } catch (error) {
      console.error('[RecordingStore] Failed to delete recording file:', error);
    }
  },

  updateRecordingMetadata: async (fileId, metadata) => {
    try {
      await invoke('recording_update_metadata', {
        fileId,
        metadata,
      });
      // 重新加载文件列表
      await get().listRecordingFiles();
    } catch (error) {
      console.error('[RecordingStore] Failed to update recording metadata:', error);
    }
  },

  exportRecordingAsJson: async (fileId) => {
    try {
      const file = get().recordingFiles.find((f) => f.id === fileId);
      if (!file) {
        throw new Error(`Recording file not found: ${fileId}`);
      }

      // 加载完整的录制文件
      const recordingFile = await get().loadRecordingFile(file.filePath);

      if (!recordingFile) {
        throw new Error(`Failed to load recording file: ${file.filePath}`);
      }

      // 使用文件对话框保存
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      const defaultFileName = `${recordingFile.metadata.sessionName}_${recordingFile.metadata.startTime}.json`;
      const filePath = await save({
        filters: [
          {
            name: 'JSON Files',
            extensions: ['json'],
          },
        ],
        defaultPath: defaultFileName,
      });

      if (filePath) {
        await writeTextFile(filePath, JSON.stringify(recordingFile, null, 2));
      }
    } catch (error) {
      console.error('[RecordingStore] Failed to export recording as JSON:', error);
    }
  },

  importRecordingFromJson: async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readTextFile } = await import('@tauri-apps/plugin-fs');

      const filePath = await open({
        filters: [
          {
            name: 'JSON Files',
            extensions: ['json'],
          },
        ],
        multiple: false,
      });

      if (filePath && typeof filePath === 'string') {
        const content = await readTextFile(filePath);
        const recordingFile = JSON.parse(content) as RecordingFile;

        // 保存到录制目录
        await get().saveRecordingFile(recordingFile);

        // 重新加载文件列表
        await get().listRecordingFiles();
      }
    } catch (error) {
      console.error('[RecordingStore] Failed to import recording from JSON:', error);
    }
  },

  // ========== 回放控制方法 ==========

  startPlayback: (recordingFile) => {
    set({
      playbackSession: {
        recordingFile,
        status: 'playing',
        currentTime: recordingFile.metadata.startTime,
        playbackSpeed: 1.0,
      },
    });
  },

  stopPlayback: () => {
    set({ playbackSession: null });
  },

  pausePlayback: () => {
    const session = get().playbackSession;
    if (session && session.status === 'playing') {
      set({
        playbackSession: {
          ...session,
          status: 'paused',
        },
      });
    }
  },

  resumePlayback: () => {
    const session = get().playbackSession;
    if (session && session.status === 'paused') {
      set({
        playbackSession: {
          ...session,
          status: 'playing',
        },
      });
    }
  },

  seekPlayback: (timestamp) => {
    const session = get().playbackSession;
    if (session) {
      set({
        playbackSession: {
          ...session,
          currentTime: timestamp,
        },
      });
    }
  },

  setPlaybackSpeed: (speed) => {
    const session = get().playbackSession;
    if (session) {
      set({
        playbackSession: {
          ...session,
          playbackSpeed: speed,
        },
      });
    }
  },

  getPlaybackStatus: () => {
    return get().playbackSession?.status || 'idle';
  },

  // ========== 视频导出方法 ==========

  loadVideoBlob: async (videoFilename) => {
    try {
      // 从磁盘加载视频文件
      const videoData = await invoke<number[]>('recording_load_video', {
        videoFilename,
      });

      // 转换为 Uint8Array
      const uint8Array = new Uint8Array(videoData);

      // 确定 MIME 类型
      const extension = videoFilename.split('.').pop()?.toLowerCase();
      const mimeType = extension === 'webm' ? 'video/webm' : 'video/mp4';

      // 创建 Blob
      const blob = new Blob([uint8Array], { type: mimeType });

      console.log(`[RecordingStore] Loaded video from disk: ${videoFilename} (${blob.size} bytes)`);
      return blob;
    } catch (error) {
      console.error('[RecordingStore] Failed to load video from disk:', error);
      return null;
    }
  },

  exportAsVideo: async (fileId, _config) => {
    try {
      const file = get().recordingFiles.find((f) => f.id === fileId);
      if (!file) {
        throw new Error(`Recording file not found: ${fileId}`);
      }

      set({
        exportProgress: {
          totalFrames: 0,
          currentFrame: 0,
          percentage: 0,
          status: 'preparing',
        },
      });

      // TODO: 实现视频导出逻辑（需要使用 MediaRecorder API 或 Canvas API）
      // 这部分可能需要在前端实现，使用 Web Worker 进行后台处理
    } catch (error) {
      console.error('[RecordingStore] Failed to export video:', error);
      set({
        exportProgress: {
          totalFrames: 0,
          currentFrame: 0,
          percentage: 0,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  },

  cancelVideoExport: async () => {
    // TODO: 实现取消逻辑
    set({ exportProgress: null });
  },

  // ========== 清理方法 ==========

  cleanupRecordingSession: (connectionId) => {
    const session = get().recordingSessions.get(connectionId);
    if (session) {
      // 清理视频录制器
      const videoRecorder = (session as any).videoRecorder as VideoRecorder;
      if (videoRecorder) {
        try {
          videoRecorder.dispose();
        } catch (error) {
          console.error('[RecordingStore] Failed to dispose video recorder:', error);
        }
      }
    }

    const newSessions = new Map(get().recordingSessions);
    newSessions.delete(connectionId);
    set({ recordingSessions: newSessions });
  },
}));
