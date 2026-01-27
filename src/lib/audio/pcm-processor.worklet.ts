/**
 * PCM Audio Processor
 *
 * 这是一个 AudioWorkletProcessor，运行在独立的音频处理线程中
 * 负责接收来自 Rust 后端的 PCM 音频数据，并输出到 Web Audio API
 *
 * 主要功能：
 * - 维护 RingBuffer 缓冲区
 * - 从主线程接收 PCM 数据（通过 port.postMessage）
 * - 在 process() 回调中填充音频输出
 * - 处理缓冲区下溢（填充静音）
 */

// @ts-ignore - AudioWorkletProcessor 是全局对象
interface AudioWorkletProcessor {
  readonly port: MessagePort;
}

// @ts-ignore
interface AudioWorkletProcessorConstructor {
  new (options?: { processorOptions?: Record<string, unknown> }): AudioWorkletProcessor;
}

// RingBuffer 大小（48kHz * 2 通道 * 3秒 = 288000 个样本）
// 增加到 3 秒以应对数据包抖动和延迟
const DEFAULT_BUFFER_SIZE = 288000;

// 报告间隔（5 秒）
// @ 48kHz，每次 process() 回调通常处理 128 样本
// 5 秒 ≈ 5 * 48000 / 128 = 1875 次 process 调用
const REPORT_INTERVAL_SAMPLES = 240000; // 5 秒的样本数

class PCMProcessor implements AudioWorkletProcessor {
  private buffer: Float32Array;
  private writeIndex: number = 0;
  private readIndex: number = 0;
  private readonly bufferSize: number;
  private totalSamplesReceived: number = 0;
  private totalSamplesProcessed: number = 0;
  private samplesSinceLastReport: number = 0;

  // port 属性由 Web Audio API 自动注入到 AudioWorkletProcessor 实例上
  declare port: MessagePort;

  constructor(options?: { processorOptions?: Record<string, unknown> }) {
    // 从 options 获取缓冲区大小，或使用默认值
    const bufferSizeOption = options?.processorOptions?.['bufferSize'] as number;
    this.bufferSize = typeof bufferSizeOption === 'number' && bufferSizeOption > 0
      ? bufferSizeOption
      : DEFAULT_BUFFER_SIZE;

    this.buffer = new Float32Array(this.bufferSize);

    console.log('[PCMProcessor] Initialized with buffer size:', this.bufferSize);

    // 监听来自主线程的 PCM 数据
    this.port.onmessage = (event: MessageEvent) => {
      try {
        const pcmData = event.data as Float32Array;

        // 验证数据类型
        if (!(pcmData instanceof Float32Array)) {
          console.error('[PCMProcessor] Invalid data type received:', typeof event.data);
          return;
        }

        // 验证数据长度
        if (pcmData.length === 0) {
          console.warn('[PCMProcessor] Empty PCM data received');
          return;
        }

        this.totalSamplesReceived += pcmData.length;
        this.writeToBuffer(pcmData);
      } catch (error) {
        console.error('[PCMProcessor] Error processing message:', error);
      }
    };
  }

  /**
   * 将 PCM 数据写入 RingBuffer
   */
  private writeToBuffer(data: Float32Array): void {
    for (let i = 0; i < data.length; i++) {
      // 检查缓冲区是否已满
      const nextWriteIndex = (this.writeIndex + 1) % this.bufferSize;
      if (nextWriteIndex === this.readIndex) {
        // 缓冲区已满，丢弃最旧的数据
        this.readIndex = (this.readIndex + 1) % this.bufferSize;
      }

      this.buffer[this.writeIndex] = data[i];
      this.writeIndex = nextWriteIndex;
    }
  }

  /**
   * 音频 Worklet 的 process 回调
   *
   * @param _inputs - 输入音频流（本例中不使用）
   * @param outputs - 输出音频流
   * @param _parameters - 音频参数（本例中不使用）
   * @returns boolean - true 表示继续处理
   */
  process(
    _inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    const output = outputs[0];

    // 如果没有输出通道，直接返回
    if (!output || output.length === 0) {
      return true;
    }

    const outputChannel = output[0];
    const samplesProcessed = outputChannel.length;

    // 从 buffer 读取数据填充到输出
    let underflowCount = 0;
    for (let i = 0; i < samplesProcessed; i++) {
      if (this.readIndex !== this.writeIndex) {
        // 缓冲区有数据，读取
        outputChannel[i] = this.buffer[this.readIndex];
        this.readIndex = (this.readIndex + 1) % this.bufferSize;
        this.totalSamplesProcessed++;
      } else {
        // 缓冲区空，填充静音
        outputChannel[i] = 0;
        underflowCount++;
      }
    }

    // 如果是立体声输出，复制到第二个声道
    if (output.length > 1) {
      output[1].set(output[0]);
    }

    // 更新样本计数器
    this.samplesSinceLastReport += samplesProcessed;

    // 每隔一定样本数报告一次缓冲区状态（约 5 秒）
    if (this.samplesSinceLastReport >= REPORT_INTERVAL_SAMPLES) {
      const bufferUsage = this.getBufferUsage();
      const underflowPercentage = (underflowCount / samplesProcessed) * 100;

      // 输出详细日志
      console.log('[PCMProcessor] Buffer stats:', {
        usage: `${bufferUsage.toFixed(1)}%`,
        samplesReceived: this.totalSamplesReceived,
        samplesProcessed: this.totalSamplesProcessed,
        underflowSamples: underflowCount,
        underflowPercentage: `${underflowPercentage.toFixed(2)}%`,
      });

      // 警告日志
      if (underflowPercentage > 5) {
        console.warn('[PCMProcessor] High underflow rate detected:', `${underflowPercentage.toFixed(2)}% - Audio data may be arriving too slowly`);
      }
      if (bufferUsage > 90) {
        console.warn('[PCMProcessor] Buffer nearly full:', `${bufferUsage.toFixed(1)}% - Consider increasing buffer size`);
      }

      this.samplesSinceLastReport = 0;
    }

    return true;
  }

  /**
   * 获取缓冲区使用率（0-100）
   */
  private getBufferUsage(): number {
    if (this.writeIndex >= this.readIndex) {
      return ((this.writeIndex - this.readIndex) / this.bufferSize) * 100;
    } else {
      return ((this.writeIndex + this.bufferSize - this.readIndex) / this.bufferSize) * 100;
    }
  }
}

// 注册 Processor
// @ts-ignore
registerProcessor('pcm-processor', PCMProcessor);
