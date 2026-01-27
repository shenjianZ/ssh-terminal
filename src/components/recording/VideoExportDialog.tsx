import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Download, Video } from 'lucide-react';
import type { VideoExportProgress } from '@/types/recording';
import { VideoExporter } from '@/lib/recorder/VideoExporter';
import { useRecordingStore } from '@/store/recordingStore';

interface VideoExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingFileItem: any; // RecordingFileItem
}

export function VideoExportDialog({
  open,
  onOpenChange,
  recordingFileItem,
}: VideoExportDialogProps) {
  const [progress, setProgress] = useState<VideoExportProgress>({
    totalFrames: 0,
    currentFrame: 0,
    percentage: 0,
    status: 'preparing',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exporter] = useState(() => new VideoExporter());
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [fullRecordingFile, setFullRecordingFile] = useState<any>(null);

  // 用于回放终端的容器引用（隐藏但保留在DOM中供VideoExporter使用）
  const playbackContainerRef = useRef<HTMLDivElement>(null);

  const loadRecordingFile = useRecordingStore((state) => state.loadRecordingFile);

  useEffect(() => {
    return () => {
      exporter.dispose();
    };
  }, [exporter]);

  // 当对话框打开时，加载完整的录制文件
  useEffect(() => {
    if (open && recordingFileItem) {
      loadRecordingFile(recordingFileItem.filePath)
        .then((file) => {
          if (file) {
            setFullRecordingFile(file);
          }
        });
    }
  }, [open, recordingFileItem]);

  const handleStartExport = async () => {
    if (!fullRecordingFile) {
      console.error('[VideoExportDialog] No recording file loaded');
      return;
    }

    // 1. 首先检查录制元数据中是否有视频文件路径
    const videoFilename = fullRecordingFile.metadata?.videoFile;
    if (videoFilename) {
      try {
        // 从磁盘加载视频文件
        const loadVideoBlob = useRecordingStore.getState().loadVideoBlob;
        const videoBlob = await loadVideoBlob(videoFilename);
        
        if (videoBlob && videoBlob.size > 0) {
          // 成功从磁盘加载视频
          setProgress({
            totalFrames: 0,
            currentFrame: 0,
            percentage: 100,
            status: 'completed',
          });
          setExportedBlob(videoBlob);
          console.log('[VideoExportDialog] Loaded video from disk:', videoFilename);
          return;
        }
      } catch (error) {
        console.error('[VideoExportDialog] Failed to load video from disk:', error);
        // 继续尝试其他方法
      }
    }

    // 2. 检查内存缓存中是否有预先录制的视频 blob
    const videoBlobCache = useRecordingStore.getState().videoBlobCache;
    const existingVideoBlob = recordingFileItem ? videoBlobCache.get(recordingFileItem.filePath) : undefined;

    if (existingVideoBlob && existingVideoBlob.size > 0) {
      // 直接使用预先录制的视频，不需要重新导出
      setProgress({
        totalFrames: 0,
        currentFrame: 0,
        percentage: 100,
        status: 'completed',
      });
      setExportedBlob(existingVideoBlob);
      console.log('[VideoExportDialog] Using cached video blob');
      return;
    }

    // 3. 如果没有预先录制的视频，使用旧的回放方式（兼容性）

    setIsExporting(true);
    setExportedBlob(null);

    // 等待 DOM 更新，确保 ref 已绑定且容器已显示
    await new Promise(resolve => setTimeout(resolve, 150));

    if (!playbackContainerRef.current) {
      console.error('[VideoExportDialog] No playback container available');
      setIsExporting(false);
      return;
    }

    try {
      const blob = await exporter.exportToVideo(
        fullRecordingFile,
        playbackContainerRef.current,
        {
          format: 'webm',
          quality: 'medium',
          fps: 30,
        },
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      if (blob) {
        setExportedBlob(blob);
      } else {
        console.error('[VideoExportDialog] Export failed');
      }
    } catch (error) {
      console.error('[VideoExportDialog] Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancelExport = () => {
    exporter.cancel();
    setIsExporting(false);
  };

  const handleDownload = async () => {
    if (!exportedBlob || !recordingFileItem) {
      console.error('[VideoExportDialog] Cannot download: missing blob or file item');
      return;
    }

    try {
      // 使用 Tauri 的文件保存对话框
      const { save } = await import('@tauri-apps/plugin-dialog');

      // 根据 Blob 的 MIME 类型确定文件扩展名
      const mimeType = exportedBlob.type || 'video/webm';
      let fileExtension = 'webm';
      let filterExtensions = ['webm'];

      if (mimeType.includes('mp4')) {
        fileExtension = 'mp4';
        filterExtensions = ['mp4'];
      } else if (mimeType.includes('webm')) {
        fileExtension = 'webm';
        filterExtensions = ['webm'];
      }

      const defaultFileName = `${recordingFileItem.metadata.sessionName}_${recordingFileItem.metadata.startTime}.${fileExtension}`;
      const filePath = await save({
        filters: [
          {
            name: 'Video Files',
            extensions: filterExtensions,
          },
        ],
        defaultPath: defaultFileName,
      });

      if (filePath) {
        // 将 Blob 转换为 ArrayBuffer，然后转换为 Uint8Array
        const arrayBuffer = await exportedBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // 使用 Tauri 的 invoke 调用 Rust 后端写入文件
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('fs_write_file', {
          path: filePath,
          contents: Array.from(uint8Array), // 转换为普通数组以便序列化
        });

        // 下载完成后关闭对话框
        onOpenChange(false);
      }
    } catch (error) {
      console.error('[VideoExportDialog] Download failed:', error);
    }
  };

  const getStatusText = (status: VideoExportProgress['status']) => {
    const statusMap = {
      preparing: '准备中...',
      encoding: '编码中...',
      finalizing: '完成中...',
      completed: '已完成',
      error: '导出失败',
    };
    return statusMap[status];
  };

  const isCompleted = progress.status === 'completed';
  const isError = progress.status === 'error';
  const canExport = !isExporting && !isCompleted && !isError;

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-lg shadow-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            <h3 className="text-lg font-semibold">导出为视频</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 视频信息说明 */}
        <div className="rounded-lg border p-4 bg-muted/20 mb-6">
          <p className="text-sm text-muted-foreground">
            此录制包含预先录制的视频。导出的视频将使用录制时的格式和质量设置。
            <br />
            <span className="text-xs">
              格式和质量在"设置 → 会话"中配置。支持 WebM 和 MP4 格式。
            </span>
          </p>
        </div>

        {/* 回放预览区域 - 透明但保持渲染（opacity: 0 比 display: none 好） */}
        <div style={{ position: 'absolute', left: '0', top: '0', zIndex: -9999, opacity: 0, pointerEvents: 'none' }}>
          <div
            ref={playbackContainerRef}
            className="bg-[#1e1e1e] rounded border border-border overflow-hidden"
            style={{ height: '400px', minHeight: '400px', width: '800px' }}
          />
        </div>

        {/* 进度显示 */}
        {(isExporting || isCompleted || isError) && (
          <div className="space-y-3 mb-6">
            {/* 状态文本 */}
            <div className="text-sm text-muted-foreground">
              {getStatusText(progress.status)}
              {isError && progress.error && (
                <span className="text-destructive ml-2">错误: {progress.error}</span>
              )}
            </div>

            {/* 进度条 */}
            <Progress value={progress.percentage} className="h-2" />

            {/* 帧数显示 */}
            <div className="text-xs text-muted-foreground">
              {progress.totalFrames > 0 ? (
                <>
                  {progress.currentFrame} / {progress.totalFrames} 帧
                  ({progress.percentage}%)
                </>
              ) : (
                '准备中...'
              )}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2">
          {isCompleted && exportedBlob ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                关闭
              </Button>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                下载视频
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={isExporting ? handleCancelExport : () => onOpenChange(false)}
              >
                {isExporting ? '取消' : '关闭'}
              </Button>
              {canExport && (
                <Button onClick={handleStartExport} className="gap-2">
                  <Video className="w-4 h-4" />
                  开始导出
                </Button>
              )}
            </>
          )}
        </div>

        {/* 信息提示 */}
        {canExport && (
          <div className="mt-4 text-xs text-muted-foreground">
            ⚠️ 如果没有预先录制的视频，导出可能需要较长时间，请耐心等待。导出期间请不要关闭窗口。
          </div>
        )}
      </div>
    </div>
  );
}
