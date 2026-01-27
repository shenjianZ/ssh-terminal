import { useState, useEffect } from 'react';
import { useRecordingStore } from '@/store/recordingStore';
import { useTerminalStore } from '@/store/terminalStore';
import { useTerminalConfigStore } from '@/store/terminalConfigStore';
import { Button } from '@/components/ui/button';
import {
  Circle,
  Pause,
  Square,
} from 'lucide-react';

interface RecordingControlsProps {
  connectionId: string;
  sessionName?: string;
}

export function RecordingControls({
  connectionId,
  sessionName = 'Session',
}: RecordingControlsProps) {
  const recordingSession = useRecordingStore((state) =>
    state.getRecordingSession(connectionId)
  );
  const [sessionInputName, setSessionInputName] = useState(sessionName);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentDuration, setCurrentDuration] = useState(0);

  // 实时更新录制时长（每秒更新）
  useEffect(() => {
    if (!recordingSession || recordingSession.status === 'stopped') {
      setCurrentDuration(0);
      return;
    }

    // 立即更新一次
    if (recordingSession.recorder) {
      const preview = recordingSession.recorder.getPreview();
      setCurrentDuration(preview.duration);
    }

    // 每秒更新显示（即使暂停也更新，因为录制器会返回正确的时长）
    const interval = setInterval(() => {
      if (recordingSession.recorder) {
        const preview = recordingSession.recorder.getPreview();
        setCurrentDuration(preview.duration);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [recordingSession]);

  const startRecording = async () => {
    if (recordingSession?.status === 'recording' || recordingSession?.status === 'paused') {
      return;
    }

    // 关闭命名对话框
    setShowNameDialog(false);

    // 使用用户输入的会话名称，或使用默认名称
    const finalSessionName = sessionInputName.trim() || sessionName;

    // 从 terminalStore 获取当前终端实例
    const terminalInstance = useTerminalStore.getState().getTerminalInstance(connectionId);
    const terminalSize = terminalInstance?.terminal
      ? { cols: terminalInstance.terminal.cols, rows: terminalInstance.terminal.rows }
      : { cols: 80, rows: 24 };

    // === 准备阶段：在倒计时前完成所有初始化工作 ===

    // 1. 聚焦终端并等待稳定
    if (terminalInstance?.terminal) {
      try {
        const terminal = terminalInstance.terminal;
        terminal.focus();
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.warn('[RecordingControls] Failed to focus terminal:', e);
      }
    }

    // 2. 捕获初始终端内容（包括提示符）
    let initialPrompt = '';
    if (terminalInstance?.terminal) {
      try {
        const terminal = terminalInstance.terminal;

        const buffer = terminal.buffer.active;
        const cursorY = buffer.cursorY;
        const cursorX = buffer.cursorX;

        // 获取光标所在行及其之前的所有行
        const lines: string[] = [];
        for (let y = 0; y <= cursorY; y++) {
          const line = buffer.getLine(y);
          if (line) {
            let lineText = line.translateToString(true);

            // 对于光标所在行，只截取到光标位置（不包括光标后的内容）
            if (y === cursorY && lineText.length > cursorX) {
              lineText = lineText.substring(0, cursorX);
            }

            // 去除行尾的空白
            lineText = lineText.trimEnd();
            lines.push(lineText);
          }
        }

        // 合并所有行，用换行符分隔
        initialPrompt = lines.join('\r\n');

        // 检查是否像提示符（包含常见的提示符模式）
        const hasPromptPattern = /[@:~\$#%]|\w+@\w+/.test(initialPrompt);

        console.log('[RecordingControls] Captured initial terminal content:', {
          cursorY,
          cursorX,
          lineCount: lines.length,
          hasPromptPattern,
          preview: initialPrompt.substring(0, 100),
          fullContent: initialPrompt,
          contentLength: initialPrompt.length
        });

        // 如果不像提示符（比如在执行命令时），清空
        if (!hasPromptPattern) {
          console.log('[RecordingControls] Content does not look like a prompt, clearing it');
          initialPrompt = '';
        }
      } catch (e) {
        console.warn('[RecordingControls] Failed to capture initial content:', e);
      }
    }

    // 3. 初始化VideoRecorder（在倒计时前完成Canvas准备）
    const { VideoRecorder } = await import('@/lib/recorder/VideoRecorder');
    const videoRecorder = new VideoRecorder();
    try {
      const terminalConfig = useTerminalConfigStore.getState().config;
      await videoRecorder.initialize(finalSessionName, terminalSize, terminalConfig);
      console.log('[RecordingControls] VideoRecorder initialized');
    } catch (error) {
      console.error('[RecordingControls] Failed to initialize video recorder:', error);
    }

    // === 准备完成，开始倒计时 ===
    setShowCountdown(true);
    setCountdown(2);

    // 倒计时逻辑
    for (let i = 2; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 倒计时结束，开始录制
    setShowCountdown(false);

    // 调用录制开始方法，传入已初始化的videoRecorder
    await useRecordingStore.getState().startRecording(
      connectionId,
      finalSessionName,
      terminalSize,
      initialPrompt,
      videoRecorder
    );
  };

  const stopRecording = async () => {
    if (recordingSession?.status !== 'recording' && recordingSession?.status !== 'paused') {
      return;
    }

    await useRecordingStore.getState().stopRecording(connectionId);
  };

  const pauseRecording = () => {
    if (recordingSession?.status === 'recording') {
      useRecordingStore.getState().pauseRecording(connectionId);
    } else if (recordingSession?.status === 'paused') {
      useRecordingStore.getState().resumeRecording(connectionId);
    }
  };

  const isRecording = recordingSession?.status === 'recording';
  const isPaused = recordingSession?.status === 'paused';
  const isActive = isRecording || isPaused;

  // 格式化持续时间
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* 倒计时界面 */}
      {showCountdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <div className="text-9xl font-bold text-white animate-pulse">
              {countdown}
            </div>
            <div className="text-white text-xl mt-4">即将开始录制...</div>
          </div>
        </div>
      )}

      {/* 会话名称输入对话框 */}
      {showNameDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border rounded-lg shadow-lg p-4 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">命名录制会话</h3>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md mb-4"
              placeholder="请输入会话名称"
              value={sessionInputName}
              onChange={(e) => setSessionInputName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  await startRecording();
                } else if (e.key === 'Escape') {
                  setShowNameDialog(false);
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNameDialog(false)}
              >
                取消
              </Button>
              <Button size="sm" onClick={startRecording}>
                开始录制
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 开始录制按钮 */}
      {!isActive && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNameDialog(true)}
          className="gap-2"
        >
          <Circle className="w-4 h-4" />
          开始录制
        </Button>
      )}

      {/* 录制控制按钮 */}
      {isActive && (
        <>
          {/* 暂停/恢复按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={pauseRecording}
            className="gap-2"
          >
            {isPaused ? (
              <>
                <Circle className="w-4 h-4 fill-red-500 text-red-500" />
                恢复
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                暂停
              </>
            )}
          </Button>

          {/* 停止录制按钮 */}
          <Button
            variant="destructive"
            size="sm"
            onClick={stopRecording}
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            停止
          </Button>

          {/* 显示录制信息 */}
          {isActive && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
              <span>{formatDuration(currentDuration)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
