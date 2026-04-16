# Recording Features Guide

SSH Terminal provides powerful terminal recording capabilities, supporting video recording, audio recording, and event recording to completely record terminal operation processes.

## Table of Contents

- [Recording Architecture](#recording-architecture)
- [Recording Quality Settings](#recording-quality-settings)
- [Audio Recording Configuration](#audio-recording-configuration)
- [Recording File Formats](#recording-file-formats)
- [Playback Features](#playback-features)
- [Recording Management](#recording-management)
- [Use Cases](#use-cases)
- [FAQ](#faq)

---

## Recording Architecture

SSH Terminal's recording system adopts a layered design supporting multiple recording methods:

```
User clicks record
    ↓
2 second countdown
    ↓
┌─────────────────────┐
│  1. TerminalRecorder │ - Records terminal events
│     (input/output)   │
├─────────────────────┤
│  2. VideoRecorder    │ - Captures Canvas screen
│     canvas.captureStream(30)     │
│     MediaRecorder (WebM/MP4)     │
├─────────────────────┤
│  3. AudioCaptureManager  │ - Captures audio
│     Microphone + Speaker        │
│     AudioContext mixing         │
└─────────────────────┘
    ↓
Stop recording
    ↓
Save recording file (JSON) + video file
```

### Recording Components Details

#### 1. TerminalRecorder (Event Recorder)

**Function**: Records all terminal interaction events

**Recorded Event Types**:
- `input` - User input commands
- `output` - Terminal output content
- `resize` - Terminal size changes
- `metadata` - Metadata (timestamp, session info, etc.)

**Data Structure**:

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

#### 2. VideoRecorder (Video Recorder)

**Function**: Captures terminal Canvas screen and records as video

**Technical Implementation**:

```typescript
// Get Canvas element
const canvas = document.querySelector('.xterm-canvas-layer');

// Capture screen stream (30 FPS)
const stream = canvas.captureStream(30);

// Create MediaRecorder
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 2000000 // 2 Mbps
});

// Start recording
mediaRecorder.start();

// Handle data chunks
mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    chunks.push(event.data);
  }
};

// Stop recording
mediaRecorder.stop();
```

**Supported Formats**:
- WebM (VP9/VP8) - Default format
- MP4 (H.264) - Requires browser support

#### 3. AudioCaptureManager (Audio Recording Manager)

**Function**: Captures microphone and speaker audio

**Technical Implementation**:

```typescript
// Create AudioContext
const audioContext = new AudioContext({ sampleRate: 48000 });

// Get microphone audio
const micStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 48000,
    channelCount: 1
  }
});

// Get speaker audio (Windows WASAPI Loopback)
const speakerStream = await navigator.mediaDevices.getDisplayMedia({
  video: true,
  audio: true
});

// Mix audio
const micSource = audioContext.createMediaStreamSource(micStream);
const speakerSource = audioContext.createMediaStreamSource(speakerStream);

// Create gain node (compensate speaker volume)
const speakerGain = audioContext.createGain();
speakerGain.gain.value = 2.0; // 2.0x gain

// Create mixer
const destination = audioContext.createMediaStreamDestination();
micSource.connect(destination);
speakerSource.connect(speakerGain);
speakerGain.connect(destination);

// Add to video stream
const audioTrack = destination.stream.getAudioTracks()[0];
stream.addTrack(audioTrack);
```

---

## Recording Quality Settings

SSH Terminal provides three preset quality options that users can choose based on needs:

### Low (Low Quality)

**Parameters**:
- Video bitrate: 500 kbps
- Audio quality: Low
- File size: About 1-2 MB/minute

**Use Cases**:
- Long duration recording
- Limited storage space
- Low video quality requirements

**Advantages**:
- Small file size
- Long recording time
- Low CPU usage

**Disadvantages**:
- Lower video quality
- Average audio quality

### Medium (Medium Quality) - Default

**Parameters**:
- Video bitrate: 2 Mbps
- Audio quality: Medium
- File size: About 3-5 MB/minute

**Use Cases**:
- Daily use
- Teaching demos
- Operation recording

**Advantages**:
- Balanced quality and size
- Moderate clarity
- Suitable for most scenarios

**Disadvantages**:
- Larger file size
- Requires more storage space

### High (High Quality)

**Parameters**:
- Video bitrate: 5 Mbps
- Audio quality: High
- File size: About 8-12 MB/minute

**Use Cases**:
- Professional demos
- Teaching videos
- High quality output needed

**Advantages**:
- Clear video quality
- High audio quality
- Suitable for post-production editing

**Disadvantages**:
- Very large file size
- High CPU usage
- Limited recording time

### Custom Quality

Users can also customize recording quality:

```typescript
interface RecordingQuality {
  videoBitsPerSecond: number;  // Video bitrate (bps)
  audioBitsPerSecond: number;  // Audio bitrate (bps)
  frameRate: number;            // Frame rate (FPS)
}
```

**Custom Example**:

```typescript
const customQuality: RecordingQuality = {
  videoBitsPerSecond: 3000000,  // 3 Mbps
  audioBitsPerSecond: 128000,   // 128 kbps
  frameRate: 30                  // 30 FPS
};
```

---

## Audio Recording Configuration

### Microphone Recording

**Configuration Parameters**:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Sample Rate | 48000 Hz | 48 kHz sample rate |
| Channels | 1 | Mono |
| Echo Cancellation | Enabled | Reduce echo |
| Noise Suppression | Enabled | Reduce background noise |
| Audio Buffer | 300 packets | About 5 seconds buffer |
| Audio Packet Size | 960 samples | 20ms @ 48kHz |

**Technical Implementation**:

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

### Speaker Recording

**Configuration Parameters**:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Volume Gain | 2.0x | Compensate for low WASAPI Loopback volume |
| Sample Rate | 48000 Hz | 48 kHz sample rate |
| Channels | 2 | Stereo |

**Technical Implementation**:

```typescript
// Get speaker audio stream
const speakerStream = await navigator.mediaDevices.getDisplayMedia({
  video: true,
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    sampleRate: 48000
  }
});

// Create gain node
const speakerGain = audioContext.createGain();
speakerGain.gain.value = 2.0; // 2.0x gain
```

### Audio Mixing

**Principle**: Mix microphone and speaker audio into one stream

**Flow**:
1. Get microphone audio stream
2. Get speaker audio stream
3. Create AudioContext
4. Create gain node (speaker)
5. Create mix destination (MediaStreamDestination)
6. Connect audio sources to mix destination
7. Add mixed audio to video stream

**Code Example**:

```typescript
// Create AudioContext
const audioContext = new AudioContext({ sampleRate: 48000 });

// Get audio streams
const micStream = await getMicStream();
const speakerStream = await getSpeakerStream();

// Create source nodes
const micSource = audioContext.createMediaStreamSource(micStream);
const speakerSource = audioContext.createMediaStreamSource(speakerStream);

// Create gain node
const speakerGain = audioContext.createGain();
speakerGain.gain.value = 2.0;

// Create mix destination
const destination = audioContext.createMediaStreamDestination();

// Connect
micSource.connect(destination);
speakerSource.connect(speakerGain);
speakerGain.connect(destination);

// Get mixed audio stream
const mixedAudio = destination.stream;
```

---

## Recording File Formats

### Recording Data File (JSON)

**File Extension**: `.json`

**Purpose**: Save terminal event data for precise playback

**Data Structure**:

```json
{
  "id": "rec_20240416_123456",
  "sessionId": "session_abc123",
  "startTime": 1713266966000,
  "endTime": 1713267026000,
  "duration": 60000,
  "metadata": {
    "title": "Demo Recording",
    "description": "Demonstrate SSH Terminal recording features",
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

### Video File

**Supported Formats**:
1. **WebM** (Default)
   - Encoder: VP9 / VP8
   - Extension: `.webm`
   - Advantages: Open source, high compression, good browser support

2. **MP4**
   - Encoder: H.264
   - Extension: `.mp4`
   - Advantages: Good compatibility, wide support

**Selecting Format**:

```typescript
// WebM format
const webmRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 2000000
});

// MP4 format
const mp4Recorder = new MediaRecorder(stream, {
  mimeType: 'video/mp4;codecs=h264',
  videoBitsPerSecond: 2000000
});
```

**Compatibility Check**:

```typescript
function isMimeTypeSupported(mimeType: string): boolean {
  return MediaRecorder.isTypeSupported(mimeType);
}

// Check supported formats
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

## Playback Features

SSH Terminal provides event-based precise playback capabilities.

### Playback Principle

**Flow**:
1. Read recording data file (JSON)
2. Parse event list
3. Play events in timestamp order
4. Update terminal display

**Architecture**:

```
Load recording file
    ↓
Parse event list
    ↓
┌─────────────────────┐
│  1. EventScheduler  │ - Event scheduler
│     (timed events)   │
├─────────────────────┤
│  2. TerminalPlayer  │ - Terminal player
│     (display events) │
├─────────────────────┤
│  3. PlaybackControl │ - Playback control
│     (play/pause/seek)│
└─────────────────────┘
    ↓
Playback complete
```

### Playback Control

**Playback Speed**:

| Speed | Rate | Description |
|-------|------|-------------|
| Slow | 0.5x | Slow playback, easy to observe |
| Normal | 1.0x | Normal speed |
| Fast | 1.5x | 1.5x speed |
| Very Fast | 2.0x | 2x speed |

**Control Operations**:
- Play / Pause
- Seek to specific time
- Adjust playback speed
- Stop playback

**Code Example**:

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

### Playback UI

**Timeline**:
- Shows total recording duration
- Shows current playback position
- Draggable to seek

**Control Buttons**:
- Play / Pause
- Stop
- Speed selection

**Info Display**:
- Current time
- Total duration
- Playback speed

---

## Recording Management

### Recording List

**Features**:
- View all recordings
- Display recording info (title, time, duration)
- Sort by time
- Search recordings

### Recording Operations

**Play**:
- Click recording item
- Open playback interface
- Auto start playback

**Delete**:
- Select recording
- Click delete button
- Confirm deletion

**Export**:
- Select recording
- Select export format
- Save locally

**Edit Metadata**:
- Modify title
- Add description
- Add tags

### Recording Storage

**Storage Location**:
- Local file system
- Database (optional)

**File Structure**:

```
recordings/
├── rec_20240416_123456.json
├── rec_20240416_123456.webm
├── rec_20240416_234567.json
├── rec_20240416_234567.webm
└── ...
```

**Database Record**:

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
  filePath: string;       // JSON file path
  videoPath: string;      // Video file path
  fileSize: number;       // File size (bytes)
  createdAt: number;
}
```

---

## Use Cases

### 1. Teaching Demos

**Scenario**: Demonstrate how to use SSH Terminal or other command line tools

**Usage**:
1. Start recording
2. Execute operation steps
3. Add explanations (via microphone)
4. Stop recording
5. Export and share video

**Advantages**:
- Intuitive and easy to understand video
- Includes operations and explanations
- Can be watched repeatedly

### 2. Operation Recording

**Scenario**: Record important operation processes for review and audit

**Usage**:
1. Start recording
2. Execute operations
3. Stop recording
4. Save recording data

**Advantages**:
- Complete record of operation process
- Can be precisely replayed
- Facilitates troubleshooting

### 3. Troubleshooting

**Scenario**: Record operation process when problems occur for analysis

**Usage**:
1. Start recording
2. Reproduce problem
3. Stop recording
4. Playback and analyze problem

**Advantages**:
- Precisely record problem occurrence process
- Can be analyzed repeatedly
- Facilitates team collaboration

### 4. Knowledge Sharing

**Scenario**: Share technical knowledge and operation tips

**Usage**:
1. Prepare demo content
2. Start recording
3. Explain and demonstrate
4. Export and share video

**Advantages**:
- Video format easy to distribute
- Can add explanations
- Suitable for internal team training

---

## FAQ

### Q: What if CPU usage is high during recording?

A: Possible causes and solutions:
1. Lower recording quality (use Low quality)
2. Lower frame rate (from 30 FPS to 15 FPS)
3. Close other CPU-intensive programs
4. Use hardware acceleration (if browser supports)

### Q: What if recorded video file is too large?

A: Solutions:
1. Use lower recording quality
2. Shorten recording time
3. Compress video after recording using video compression tools
4. Only record event data (JSON), not video

### Q: What if audio recording has no sound?

A: Check the following:
1. Confirm microphone permission is granted
2. Check if microphone is working properly
3. Check volume in audio settings
4. Try getting audio stream again

### Q: What if terminal is laggy during recording?

A: Possible causes:
1. Recording quality too high, lower quality
2. CPU usage too high, close other programs
3. Insufficient memory, close other applications
4. Disk I/O bottleneck, check disk performance

### Q: How to add annotations during recording?

A: Current version supports adding voice annotations via microphone. Future versions may support:
- Text annotations
- Timestamp markers
- Chapter segmentation

---

## Summary

SSH Terminal's recording features provide complete terminal operation recording capabilities, supporting event recording, video recording, and audio recording. Users can choose different recording qualities based on needs, with flexible playback control. Recording features are suitable for various scenarios including teaching demos, operation recording, and troubleshooting.