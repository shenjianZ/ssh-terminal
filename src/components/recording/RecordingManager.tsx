import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VideoExportDialog } from './VideoExportDialog';
import { useRecordingStore } from '@/store/recordingStore';
import type { RecordingFileItem } from '@/types/recording';
import {
  Video,
  Trash2,
  FileJson,
  Search,
  RefreshCw,
  Clock,
  File,
  Tag,
  AlertTriangle,
} from 'lucide-react';

interface RecordingManagerProps {
  onClose?: () => void;
}

export function RecordingManager({ onClose }: RecordingManagerProps) {
  const recordingFiles = useRecordingStore((state) => state.recordingFiles);
  const listRecordingFiles = useRecordingStore((state) => state.listRecordingFiles);
  const deleteRecordingFile = useRecordingStore((state) => state.deleteRecordingFile);
  const exportRecordingAsJson = useRecordingStore((state) => state.exportRecordingAsJson);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<RecordingFileItem | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<RecordingFileItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 加载录制文件列表
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      await listRecordingFiles();
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤文件
  const filteredFiles = recordingFiles.filter((file) => {
    const query = searchQuery.toLowerCase();
    return (
      file.metadata.sessionName.toLowerCase().includes(query) ||
      file.metadata.connectionId.toLowerCase().includes(query) ||
      (file.metadata.description && file.metadata.description.toLowerCase().includes(query)) ||
      file.metadata.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // 格式化时长
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}分${secs}秒`;
    }
    return `${secs}秒`;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // 格式化日期
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 导出视频
  const handleExportVideo = (file: RecordingFileItem) => {
    setSelectedFile(file);
    setShowExportDialog(true);
  };

  // 删除文件 - 打开确认对话框
  const handleDeleteFile = (file: RecordingFileItem) => {
    setFileToDelete(file);
    setShowDeleteDialog(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!fileToDelete) return;

    await deleteRecordingFile(fileToDelete.id);
    setShowDeleteDialog(false);
    setFileToDelete(null);
  };

  // 导出 JSON
  const handleExportJson = async (file: RecordingFileItem) => {
    await exportRecordingAsJson(file.id);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            <h2 className="text-lg font-semibold">录制文件管理</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadFiles} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                关闭
              </Button>
            )}
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索录制文件..."
              className="w-full pl-10 pr-4 py-2 border rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 文件列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <File className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg mb-2">暂无录制文件</p>
              <p className="text-sm">开始录制后，文件将显示在这里</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors"
                >
                  {/* 文件标题 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" title={file.metadata.sessionName}>
                        {file.metadata.sessionName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {file.metadata.connectionId}
                      </p>
                    </div>
                  </div>

                  {/* 文件信息 */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        时长: {formatDuration(file.metadata.duration || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <File className="w-3.5 h-3.5" />
                      <span>
                        大小: {formatFileSize(file.fileSize)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="w-3.5 h-3.5" />
                      <span>
                        事件: {file.metadata.eventCount}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      创建时间: {formatDate(file.createdAt)}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleExportVideo(file)}
                    >
                      <Video className="w-3.5 h-3.5 mr-1" />
                      导出视频
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportJson(file)}
                      title="导出为 JSON"
                    >
                      <FileJson className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file)}
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 统计信息 */}
        {recordingFiles.length > 0 && (
          <div className="px-6 py-3 border-t text-xs text-muted-foreground">
            共 {recordingFiles.length} 个录制文件
          </div>
        )}
      </div>

      {/* 视频导出对话框 */}
      {showExportDialog && selectedFile && (
        <VideoExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          recordingFileItem={selectedFile}
        />
      )}

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <DialogTitle>确认删除</DialogTitle>
            </div>
            <DialogDescription>
              确定要删除录制文件 "{fileToDelete?.metadata.sessionName}" 吗？
              <br />
              <span className="text-xs text-muted-foreground">
                此操作无法撤销，文件将被永久删除。
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setFileToDelete(null);
              }}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
