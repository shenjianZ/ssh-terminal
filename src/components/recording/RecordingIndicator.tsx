import { useEffect, useState } from 'react';
import { useRecordingStore } from '@/store/recordingStore';

interface RecordingIndicatorProps {
  connectionId: string;
}

export function RecordingIndicator({ connectionId }: RecordingIndicatorProps) {
  const recordingSession = useRecordingStore((state) =>
    state.getRecordingSession(connectionId)
  );
  const [isBlinking, setIsBlinking] = useState(true);
  const [currentDuration, setCurrentDuration] = useState(0);

  // 闪烁效果（每秒闪烁一次）
  useEffect(() => {
    if (!recordingSession || recordingSession.status === 'stopped') {
      setIsBlinking(false);
      return;
    }

    const interval = setInterval(() => {
      setIsBlinking((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, [recordingSession]);

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

  // 如果没有录制或已停止，不显示
  if (!recordingSession || recordingSession.status === 'stopped') {
    return null;
  }

  const isPaused = recordingSession.status === 'paused';

  // 格式化持续时间
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-background border-l border-r border-t border-border rounded-t-md">
      {/* 红点指示器 */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isPaused
              ? 'bg-yellow-500'
              : isBlinking
              ? 'bg-red-500 animate-pulse'
              : 'bg-red-500'
          }`}
        />
        <span className="text-sm font-medium">
          {isPaused ? '录制暂停' : '录制中'}
        </span>
      </div>

      {/* 显示录制信息 */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{formatDuration(currentDuration)}</span>
      </div>
    </div>
  );
}
