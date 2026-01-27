/**
 * 音频捕获管理器
 * 负责麦克风和系统音频的捕获、混合和处理
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export class AudioCaptureManager {
  private microphoneStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private microphoneSource: MediaStreamAudioSourceNode | null = null;
  private destinationStream: MediaStream | null = null;
  private isInitialized: boolean = false;

  // 音频配置
  private _recordMicrophone: boolean = false;
  private _recordSpeaker: boolean = false;
  private audioQuality: 'low' | 'medium' | 'high' = 'medium';
  private sampleRate: number = 48000;

  // 扬声器捕获状态
  private speakerCapturingActive: boolean = false;
  private speakerWorkletNode: AudioWorkletNode | null = null;
  private speakerUnlisten: (() => void) | null = null;

  // 性能监控
  private lastAudioPacketTime: number = 0;
  private audioPacketCount: number = 0;
  private audioPacketHealthCheckInterval: number | null = null;

  /**
   * 初始化音频捕获管理器
   */
  async initialize(
    recordMicrophone: boolean,
    recordSpeaker: boolean,
    audioQuality: 'low' | 'medium' | 'high',
    sampleRate: number
  ): Promise<void> {
    this._recordMicrophone = recordMicrophone;
    this._recordSpeaker = recordSpeaker;
    this.audioQuality = audioQuality;
    this.sampleRate = sampleRate;

    // 如果两种音频都关闭，直接返回
    if (!recordMicrophone && !recordSpeaker) {
      console.log('[AudioCapture] Audio recording disabled');
      return;
    }

    try {
      // 创建 AudioContext
      this.audioContext = new AudioContext({
        sampleRate: this.sampleRate,
      });

      // 获取麦克风流 (如果启用)
      if (this._recordMicrophone) {
        await this.initializeMicrophone();
      }

      // 初始化扬声器捕获 (使用 Tauri 后端)
      if (this._recordSpeaker) {
        await this.initializeSpeaker();
      }

      this.isInitialized = true;
      console.log('[AudioCapture] Initialized successfully', {
        microphone: recordMicrophone,
        speaker: recordSpeaker,
        quality: audioQuality,
        sampleRate,
      });
    } catch (error) {
      console.error('[AudioCapture] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 初始化麦克风捕获
   */
  private async initializeMicrophone(): Promise<void> {
    try {
      console.log('[AudioCapture] Requesting microphone access...');

      // 请求麦克风权限
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // 单声道
          sampleRate: this.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('[AudioCapture] Microphone access granted');

      // 创建音频源节点
      if (!this.audioContext) {
        throw new Error('AudioContext not initialized');
      }

      this.microphoneSource = this.audioContext.createMediaStreamSource(
        this.microphoneStream
      );

      console.log('[AudioCapture] Microphone source node created');
    } catch (error) {
      console.error('[AudioCapture] Failed to get microphone access:', error);
      throw new Error(`麦克风访问失败: ${error}`);
    }
  }

  /**
   * 初始化扬声器捕获（使用 Tauri 后端 + AudioWorklet）
   */
  private async initializeSpeaker(): Promise<void> {
    try {
      console.log('[AudioCapture] Starting speaker audio capture via Tauri...');

      if (!this.audioContext) {
        throw new Error('AudioContext not initialized');
      }

      // 加载 AudioWorklet
      const workletUrl = new URL('./pcm-processor.worklet.ts', import.meta.url);
      await this.audioContext.audioWorklet.addModule(workletUrl);
      console.log('[AudioCapture] AudioWorklet module loaded');

      // 创建 WorkletNode
      this.speakerWorkletNode = new AudioWorkletNode(
        this.audioContext,
        'pcm-processor'
      );

      // 调用 Tauri 后端命令开始捕获
      await invoke('audio_start_capturing');

      // 监听来自后端的音频数据
      // 注意：事件名称需要与 Rust 后端发送的事件名称一致
      this.speakerUnlisten = await listen<Float32Array>('audio-packet', (event) => {
        // 性能监控：记录接收时间
        this.lastAudioPacketTime = Date.now();
        this.audioPacketCount++;

        // 将接收到的 PCM 数据转发到 Worklet
        if (this.speakerWorkletNode) {
          this.speakerWorkletNode.port.postMessage(event.payload);
        }
      });

      // 启动音频健康检查（每 3 秒检查一次）
      this.startAudioHealthCheck();

      this.speakerCapturingActive = true;
      console.log('[AudioCapture] Speaker audio capture started with AudioWorklet');
    } catch (error) {
      console.error('[AudioCapture] Failed to start speaker capture:', error);
      throw new Error(`扬声器捕获启动失败: ${error}`);
    }
  }

  /**
   * 启动音频健康检查
   * 定期检查音频数据包是否正常到达
   */
  private startAudioHealthCheck(): void {
    this.audioPacketHealthCheckInterval = window.setInterval(() => {
      const timeSinceLastPacket = Date.now() - this.lastAudioPacketTime;

      // 如果超过 5 秒没有收到音频数据包，发出警告
      if (timeSinceLastPacket > 5000 && this.speakerCapturingActive) {
        console.warn('[AudioCapture] No audio packets received in last 5 seconds - Backend may have stopped or connection issue');

        // 重置计数器避免重复警告
        this.lastAudioPacketTime = Date.now();
      }
    }, 3000);
  }

  /**
   * 停止音频健康检查
   */
  private stopAudioHealthCheck(): void {
    if (this.audioPacketHealthCheckInterval !== null) {
      clearInterval(this.audioPacketHealthCheckInterval);
      this.audioPacketHealthCheckInterval = null;
    }
  }

  /**
   * 停止扬声器捕获
   */
  private async stopSpeaker(): Promise<void> {
    if (!this.speakerCapturingActive) {
      return;
    }

    try {
      console.log('[AudioCapture] Stopping speaker audio capture...');

      // 停止音频健康检查
      this.stopAudioHealthCheck();

      // 输出统计信息
      console.log('[AudioCapture] Speaker capture statistics:', {
        totalPackets: this.audioPacketCount,
        duration: this.lastAudioPacketTime ? `${Date.now() - this.lastAudioPacketTime}ms since last packet` : 'N/A',
      });

      // 取消事件监听
      if (this.speakerUnlisten) {
        this.speakerUnlisten();
        this.speakerUnlisten = null;
      }

      // 断开 WorkletNode 连接
      if (this.speakerWorkletNode) {
        this.speakerWorkletNode.disconnect();
        this.speakerWorkletNode = null;
      }

      // 调用 Tauri 后端命令停止捕获
      await invoke('audio_stop_capturing');

      // 重置统计信息
      this.lastAudioPacketTime = 0;
      this.audioPacketCount = 0;

      this.speakerCapturingActive = false;
      console.log('[AudioCapture] Speaker audio capture stopped');
    } catch (error) {
      console.error('[AudioCapture] Failed to stop speaker capture:', error);
      // 不抛出错误，避免影响其他清理操作
    }
  }

  /**
   * 获取混合后的音频流 (用于添加到 MediaRecorder)
   */
  getAudioStream(): MediaStream | null {
    if (!this.isInitialized) {
      return null;
    }

    if (!this.audioContext) {
      console.warn('[AudioCapture] AudioContext not available');
      return null;
    }

    // 创建目标流
    const destination = this.audioContext.createMediaStreamDestination();

    // 连接麦克风流 (如果有)
    if (this.microphoneSource) {
      this.microphoneSource.connect(destination);
      console.log('[AudioCapture] Microphone connected to destination');
    }

    // 连接扬声器 WorkletNode (如果有)
    if (this.speakerWorkletNode) {
      this.speakerWorkletNode.connect(destination);
      console.log('[AudioCapture] Speaker WorkletNode connected to destination');
    }

    this.destinationStream = destination.stream;

    const audioTracks = this.destinationStream.getAudioTracks();
    console.log('[AudioCapture] Returning audio stream with', audioTracks.length, 'track(s)');

    return this.destinationStream;
  }

  /**
   * 获取音频比特率配置
   */
  getAudioBitrate(): number {
    const bitrates = {
      low: 64000,     // 64 kbps
      medium: 128000, // 128 kbps
      high: 256000,   // 256 kbps
    };
    return bitrates[this.audioQuality];
  }

  /**
   * 停止音频捕获
   */
  async stop(): Promise<void> {
    console.log('[AudioCapture] Stopping audio capture...');

    // 停止扬声器捕获
    await this.stopSpeaker();

    // 停止麦克风流
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => {
        track.stop();
        console.log('[AudioCapture] Microphone track stopped');
      });
      this.microphoneStream = null;
    }

    // 关闭音频上下文
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      console.log('[AudioCapture] AudioContext closed');
    }

    this.microphoneSource = null;
    this.destinationStream = null;
    this.isInitialized = false;

    console.log('[AudioCapture] Stopped');
  }

  /**
   * 清理资源
   */
  async dispose(): Promise<void> {
    // 停止扬声器捕获（异步但不等待完成）
    this.stopSpeaker().catch(console.error);

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }

    this.microphoneSource = null;
    this.destinationStream = null;
    this.isInitialized = false;
  }
}
