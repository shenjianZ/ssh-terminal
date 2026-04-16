# 录制功能详解

SSH Terminal 提供强大的终端录制功能，支持视频录制、音频录制和事件录制，可以完整记录终端操作过程。

## 目录

- [录制架构](#录制架构)
- [录制质量设置](#录制质量设置)
- [音频录制配置](#音频录制配置)
- [录制文件格式](#录制文件格式)
- [回放功能](#回放功能)
- [录制管理](#录制管理)
- [使用场景](#使用场景)
- [常见问题](#常见问题)

---

## 录制架构

SSH Terminal 的录制系统采用分层设计，支持多种录制方式：

```
用户点击录制
    ↓
2 秒倒计时
    ↓
┌─────────────────────┐
│  1. TerminalRecorder │ - 记录终端事件
│     (input/output)   │
├─────────────────────┤
│  2. VideoRecorder    │ - 捕获 Canvas 画面
│     canvas.captureStream(30)     │
│     MediaRecorder (WebM/MP4)     │
├─────────────────────┤
│  3. AudioCaptureManager  │ - 捕获音频
│     麦克风 + 扬声器         │
│     AudioContext 混合       │
└─────────────────────┘
    ↓
停止录制
    ↓
保存录制文件 (JSON) + 视频文件
```

### 录制组件详解

#### 1. TerminalRecorder（事件录制器）

**功能**：记录终端的所有交互事件

**记录的事件类型**：
- `input` - 用户输入的命令
- `output` - 终端输出内容
- `resize` - 终端尺寸变化
- `metadata` - 元数据（时间戳、会话信息等）

**数据结构**：

```typescript
interface RecordingEvent {
  type: 'input' | 'output' | 'resize' | 'metadata';
  timestamp: number;
  data: {
    content?: string;
    rows?: number;
    cols?: number;
    sessionId?: string;
  };
}

interface RecordingData {
  id: string;
  sessionId: string;
  startTime: number;
  endTime: number;
  events: RecordingEvent[];
  metadata: {
    title: string;
    description?: string;
    tags?: string[];
  };
}
```

#### 2. VideoRecorder（视频录制器）

**功能**：捕获终端 Canvas 画面并录制为视频

**技术实现**：

```typescript
// 获取 Canvas 元素
const canvas = document.querySelector('.xterm-canvas-layer');

// 捕获画面流（30 FPS）
const stream = canvas.captureStream(30);

// 创建 MediaRecorder
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 2000000 // 2 Mbps
});

// 开始录制
mediaRecorder.start();

// 处理数据块
mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    chunks.push(event.data);
  }
};

// 停止录制
mediaRecorder.stop();
```

**支持的格式**：
- WebM (VP9/VP8) - 默认格式
- MP4 (H.264) - 需要浏览器支持

#### 3. AudioCaptureManager（音频录制管理器）

**功能**：捕获麦克风和扬声器音频

**技术实现**：

```typescript
// 创建 AudioContext
const audioContext = new AudioContext({ sampleRate: 48000 });

// 获取麦克风音频
const micStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 48000,
    channelCount: 1
  }
});

// 获取扬声器音频（Windows WASAPI Loopback）
const speakerStream = await navigator.mediaDevices.getDisplayMedia({
  video: true,
  audio: true
});

// 混合音频
const micSource = audioContext.createMediaStreamSource(micStream);
const speakerSource = audioContext.createMediaStreamSource(speakerStream);

// 创建增益节点（补偿扬声器音量）
const speakerGain = audioContext.createGain();
speakerGain.gain.value = 2.0; // 2.0x 增益

// 创建混合器
const destination = audioContext.createMediaStreamDestination();
micSource.connect(destination);
speakerSource.connect(speakerGain);
speakerGain.connect(destination);

// 添加到视频流
const audioTrack = destination.stream.getAudioTracks()[0];
stream.addTrack(audioTrack);
```

---

## 录制质量设置

SSH Terminal 提供三种预设质量，用户可以根据需求选择：

### Low（低质量）

**参数**：
- 视频码率：500 kbps
- 音频质量：Low
- 文件大小：约 1-2 MB/分钟

**适用场景**：
- 长时间录制
- 存储空间有限
- 对画质要求不高

**优点**：
- 文件小
- 录制时间长
- CPU 占用低

**缺点**：
- 画质较低
- 音频质量一般

### Medium（中等质量）- 默认

**参数**：
- 视频码率：2 Mbps
- 音频质量：Medium
- 文件大小：约 3-5 MB/分钟

**适用场景**：
- 日常使用
- 教学演示
- 操作记录

**优点**：
- 平衡质量和大小
- 清晰度适中
- 适合大多数场景

**缺点**：
- 文件较大
- 需要较多存储空间

### High（高质量）

**参数**：
- 视频码率：5 Mbps
- 音频质量：High
- 文件大小：约 8-12 MB/分钟

**适用场景**：
- 专业演示
- 教学视频
- 需要高质量输出

**优点**：
- 画质清晰
- 音频质量高
- 适合后期编辑

**缺点**：
- 文件很大
- CPU 占用高
- 录制时间受限

### 自定义质量

用户也可以自定义录制质量：

```typescript
interface RecordingQuality {
  videoBitsPerSecond: number;  // 视频码率（bps）
  audioBitsPerSecond: number;  // 音频码率（bps）
  frameRate: number;            // 帧率（FPS）
}
```

**自定义示例**：

```typescript
const customQuality: RecordingQuality = {
  videoBitsPerSecond: 3000000,  // 3 Mbps
  audioBitsPerSecond: 128000,   // 128 kbps
  frameRate: 30                  // 30 FPS
};
```

---

## 音频录制配置

### 麦克风录制

**配置参数**：

| 参数 | 值 | 说明 |
|------|-----|------|
| 采样率 | 48000 Hz | 48 kHz 采样率 |
| 通道数 | 1 | 单声道 |
| 回声消除 | 开启 | 减少回声 |
| 噪声抑制 | 开启 | 减少背景噪声 |
| 音频缓冲区 | 300 个包 | 约 5 秒缓冲 |
| 音频包大小 | 960 样本 | 20ms @ 48kHz |

**技术实现**：

```typescript
const micStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 48000,
    channelCount: 1
  }
});
```

### 扬声器录制

**配置参数**：

| 参数 | 值 | 说明 |
|------|-----|------|
| 音量增益 | 2.0x | 补偿 WASAPI Loopback 音量较低 |
| 采样率 | 48000 Hz | 48 kHz 采样率 |
| 通道数 | 2 | 立体声 |

**技术实现**：

```typescript
// 获取扬声器音频流
const speakerStream = await navigator.mediaDevices.getDisplayMedia({
  video: true,
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    sampleRate: 48000
  }
});

// 创建增益节点
const speakerGain = audioContext.createGain();
speakerGain.gain.value = 2.0; // 2.0x 增益
```

### 音频混合

**原理**：将麦克风和扬声器音频混合到一个流中

**流程**：
1. 获取麦克风音频流
2. 获取扬声器音频流
3. 创建 AudioContext
4. 创建增益节点（扬声器）
5. 创建混合目标（MediaStreamDestination）
6. 连接音频源到混合目标
7. 将混合后的音频添加到视频流

**代码示例**：

```typescript
// 创建 AudioContext
const audioContext = new AudioContext({ sampleRate: 48000 });

// 获取音频流
const micStream = await getMicStream();
const speakerStream = await getSpeakerStream();

// 创建源节点
const micSource = audioContext.createMediaStreamSource(micStream);
const speakerSource = audioContext.createMediaStreamSource(speakerStream);

// 创建增益节点
const speakerGain = audioContext.createGain();
speakerGain.gain.value = 2.0;

// 创建混合目标
const destination = audioContext.createMediaStreamDestination();

// 连接
micSource.connect(destination);
speakerSource.connect(speakerGain);
speakerGain.connect(destination);

// 获取混合后的音频流
const mixedAudio = destination.stream;
```

---

## 录制文件格式

### 录制数据文件（JSON）

**文件扩展名**：`.json`

**用途**：保存终端事件数据，用于精确回放

**数据结构**：

```json
{
  "id": "rec_20240416_123456",
  "sessionId": "session_abc123",
  "startTime": 1713266966000,
  "endTime": 1713267026000,
  "duration": 60000,
  "metadata": {
    "title": "演示录制",
    "description": "演示 SSH Terminal 的录制功能",
    "tags": ["demo", "tutorial"]
  },
  "events": [
    {
      "type": "metadata",
      "timestamp": 1713266966000,
      "data": {
        "rows": 24,
        "cols": 80,
        "sessionId": "session_abc123"
      }
    },
    {
      "type": "input",
      "timestamp": 1713266970000,
      "data": {
        "content": "ls -la"
      }
    },
    {
      "type": "output",
      "timestamp": 1713266971000,
      "data": {
        "content": "total 16\r\ndrwxr-xr-x 2 user user 4096 Apr 16 12:00 .\r\ndrwxr-xr-x 3 user user 4096 Apr 16 12:00 ..\r\n-rw-r--r-- 1 user user 123 Apr 16 12:00 file.txt\r\n"
      }
    }
  ]
}
```

### 视频文件

**支持的格式**：
1. **WebM** (默认)
   - 编码器：VP9 / VP8
   - 扩展名：`.webm`
   - 优点：开源、压缩率高、浏览器支持好

2. **MP4**
   - 编码器：H.264
   - 扩展名：`.mp4`
   - 优点：兼容性好、支持广泛

**选择格式**：

```typescript
// WebM 格式
const webmRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 2000000
});

// MP4 格式
const mp4Recorder = new MediaRecorder(stream, {
  mimeType: 'video/mp4;codecs=h264',
  videoBitsPerSecond: 2000000
});
```

**兼容性检查**：

```typescript
function isMimeTypeSupported(mimeType: string): boolean {
  return MediaRecorder.isTypeSupported(mimeType);
}

// 检查支持的格式
const supportedFormats = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/mp4;codecs=h264'
];

supportedFormats.forEach(format => {
  console.log(`${format}: ${isMimeTypeSupported(format) ? '✓' : '✗'}`);
});
```

---

## 回放功能

SSH Terminal 提供基于事件的精确回放功能。

### 回放原理

**流程**：
1. 读取录制数据文件（JSON）
2. 解析事件列表
3. 按时间戳顺序播放事件
4. 更新终端显示

**架构**：

```
加载录制文件
    ↓
解析事件列表
    ↓
┌─────────────────────┐
│  1. EventScheduler  │ - 事件调度器
│     (定时执行事件)   │
├─────────────────────┤
│  2. TerminalPlayer  │ - 终端播放器
│     (显示事件内容)   │
├─────────────────────┤
│  3. PlaybackControl │ - 播放控制
│     (播放/暂停/跳转) │
└─────────────────────┘
    ↓
完成回放
```

### 播放控制

**播放速度**：

| 速度 | 倍率 | 说明 |
|------|------|------|
| 慢速 | 0.5x | 慢速播放，便于观察 |
| 正常 | 1.0x | 正常速度 |
| 快速 | 1.5x | 1.5 倍速 |
| 极速 | 2.0x | 2 倍速 |

**控制操作**：
- 播放 / 暂停
- 跳转到指定时间
- 调整播放速度
- 停止回放

**代码示例**：

```typescript
class PlaybackController {
  private events: RecordingEvent[];
  private currentIndex = 0;
  private playbackSpeed = 1.0;
  private isPlaying = false;
  private timer: number | null = null;

  constructor(events: RecordingEvent[]) {
    this.events = events.sort((a, b) => a.timestamp - b.timestamp);
  }

  play() {
    this.isPlaying = true;
    this.scheduleNextEvent();
  }

  pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  seekTo(time: number) {
    this.pause();
    this.currentIndex = this.events.findIndex(
      event => event.timestamp >= time
    );
    if (this.isPlaying) {
      this.play();
    }
  }

  setSpeed(speed: number) {
    this.playbackSpeed = speed;
  }

  private scheduleNextEvent() {
    if (!this.isPlaying || this.currentIndex >= this.events.length) {
      this.pause();
      return;
    }

    const event = this.events[this.currentIndex];
    const nextEvent = this.events[this.currentIndex + 1];

    if (nextEvent) {
      const delay = (nextEvent.timestamp - event.timestamp) / this.playbackSpeed;
      this.timer = setTimeout(() => {
        this.playEvent(nextEvent);
        this.currentIndex++;
        this.scheduleNextEvent();
      }, delay);
    }
  }

  private playEvent(event: RecordingEvent) {
    switch (event.type) {
      case 'input':
        this.terminal.write(event.data.content);
        break;
      case 'output':
        this.terminal.write(event.data.content);
        break;
      case 'resize':
        this.terminal.resize(event.data.cols, event.data.rows);
        break;
    }
  }
}
```

### 回放 UI

**时间轴**：
- 显示录制总时长
- 显示当前播放位置
- 可拖动跳转

**控制按钮**：
- 播放 / 暂停
- 停止
- 速度选择

**信息显示**：
- 当前时间
- 总时长
- 播放速度

---

## 录制管理

### 录制列表

**功能**：
- 查看所有录制
- 显示录制信息（标题、时间、时长）
- 按时间排序
- 搜索录制

### 录制操作

**播放**：
- 点击录制项
- 打开回放界面
- 自动开始播放

**删除**：
- 选择录制
- 点击删除按钮
- 确认删除

**导出**：
- 选择录制
- 选择导出格式
- 保存到本地

**编辑元数据**：
- 修改标题
- 添加描述
- 添加标签

### 录制存储

**存储位置**：
- 本地文件系统
- 数据库（可选）

**文件结构**：

```
recordings/
├── rec_20240416_123456.json
├── rec_20240416_123456.webm
├── rec_20240416_234567.json
├── rec_20240416_234567.webm
└── ...
```

**数据库记录**：

```typescript
interface Recording {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  tags?: string[];
  startTime: number;
  endTime: number;
  duration: number;
  filePath: string;       // JSON 文件路径
  videoPath: string;      // 视频文件路径
  fileSize: number;       // 文件大小（字节）
  createdAt: number;
}
```

---

## 使用场景

### 1. 教学演示

**场景**：演示如何使用 SSH Terminal 或其他命令行工具

**用法**：
1. 开始录制
2. 执行操作步骤
3. 添加说明（通过麦克风）
4. 停止录制
5. 导出视频分享

**优点**：
- 视频直观易懂
- 包含操作和讲解
- 可以反复观看

### 2. 操作记录

**场景**：记录重要的操作过程，便于回顾和审计

**用法**：
1. 开始录制
2. 执行操作
3. 停止录制
4. 保存录制数据

**优点**：
- 完整记录操作过程
- 可以精确回放
- 便于问题排查

### 3. 故障排查

**场景**：记录出现问题的操作过程，便于分析

**用法**：
1. 开始录制
2. 重现问题
3. 停止录制
4. 回放分析问题

**优点**：
- 精确记录问题发生过程
- 可以反复分析
- 便于团队协作

### 4. 知识分享

**场景**：分享技术知识和操作技巧

**用法**：
1. 准备演示内容
2. 开始录制
3. 讲解和演示
4. 导出视频分享

**优点**：
- 视频形式易于传播
- 可以添加讲解
- 适合团队内部培训

---

## 常见问题

### Q: 录制时 CPU 占用很高怎么办？

A: 可能的原因和解决方案：
1. 降低录制质量（使用 Low 质量）
2. 降低帧率（从 30 FPS 降到 15 FPS）
3. 关闭其他占用 CPU 的程序
4. 使用硬件加速（如果浏览器支持）

### Q: 录制的视频文件太大怎么办？

A: 解决方案：
1. 使用更低的录制质量
2. 缩短录制时间
3. 录制后使用视频压缩工具压缩
4. 只录制事件数据（JSON），不录制视频

### Q: 音频录制没有声音怎么办？

A: 检查以下项：
1. 确认麦克风权限已授予
2. 检查麦克风是否正常工作
3. 检查音频设置中的音量
4. 尝试重新获取音频流

### Q: 录制时终端卡顿怎么办？

A: 可能的原因：
1. 录制质量过高，降低质量
2. CPU 占用过高，关闭其他程序
3. 内存不足，关闭其他应用
4. 磁盘 I/O 瓶颈，检查磁盘性能

### Q: 如何在录制时添加注释？

A: 当前版本支持通过麦克风添加语音注释。后续版本可能会支持：
- 文字注释
- 时间戳标记
- 章节分割

---

## 总结

SSH Terminal 的录制功能提供了完整的终端操作记录能力，支持事件录制、视频录制和音频录制。用户可以根据需求选择不同的录制质量，支持灵活的回放控制。录制功能适用于教学演示、操作记录、故障排查等多种场景。