/**
 * 双面板文件管理器组件
 *
 * 显示本地和远程文件面板
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { FilePane } from './FilePane';
import { useSftpStore } from '@/store/sftpStore';
import { ChevronRight, X, Upload, File, Folder } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UploadProgressEvent {
  task_id: string;
  connection_id: string;
  current_file: string;
  current_dir: string;
  files_completed: number;
  total_files: number;
  bytes_transferred: number;
  total_bytes: number;
  speed_bytes_per_sec: number;
}

interface DualPaneProps {
  connectionId: string;
  remoteRefreshKey?: number;
  localRefreshKey?: number;
}

export function DualPane({ connectionId, remoteRefreshKey = 0, localRefreshKey = 0 }: DualPaneProps) {
  const { t } = useTranslation();
  const {
    localPath,
    remotePath,
    setLocalPath,
    setRemotePath,
    selectedLocalFiles,
    selectedRemoteFiles,
    setSelectedLocalFiles,
    setSelectedRemoteFiles,
  } = useSftpStore();

  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [localRefreshTimestamp, setLocalRefreshTimestamp] = useState(Date.now());
  const [remoteRefreshTimestamp, setRemoteRefreshTimestamp] = useState(Date.now());
  const [uploadProgressMap, setUploadProgressMap] = useState<Map<string, UploadProgressEvent>>(new Map());
  // 优化：使用 CSS transition 来平滑隐藏/显示，而不是完全卸载组件
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // 使用 ref 直接操作 DOM，避免 React 状态更新
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panelPositionRef = useRef({ x: 0, y: 0 });

  const handleLocalPathChange = (path: string) => {
    setLocalPath(path);
  };

  const handleRemotePathChange = (path: string) => {
    setRemotePath(path);
  };

  // 监听上传进度事件
  useEffect(() => {
    const unlisten = listen<UploadProgressEvent>('sftp-upload-progress', (event) => {
      const progress = event.payload;
      if (progress.connection_id === connectionId) {
        setUploadProgressMap(prev => {
          const newMap = new Map(prev).set(progress.task_id, progress);
          // 如果上传完成，从 map 中移除
          if (progress.files_completed >= progress.total_files && progress.total_files > 0) {
            setTimeout(() => {
              setUploadProgressMap(prevMap => {
                const nextMap = new Map(prevMap);
                nextMap.delete(progress.task_id);
                return nextMap;
              });
            }, 3000); // 3秒后移除
          }
          return newMap;
        });
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [connectionId]);

  // 处理拖动 - 直接操作 DOM，完全避免 React 状态更新
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !panelRef.current) return;

      // 直接更新 DOM style，不经过 React
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const newX = panelPositionRef.current.x + deltaX;
      const newY = panelPositionRef.current.y + deltaY;

      panelRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
    };

    const handleMouseUp = () => {
      if (panelRef.current) {
        // 更新 ref 值以备下次拖动
        const transform = panelRef.current.style.transform;
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (match) {
          panelPositionRef.current = {
            x: parseFloat(match[1]),
            y: parseFloat(match[2])
          };
        }
      }
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleCancelUpload = async () => {
    try {
      await invoke('sftp_cancel_upload', {
        connectionId,
      });
      toast.info('上传已取消');
    } catch (error) {
      console.error('Cancel upload failed:', error);
      toast.error('取消上传失败');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSec: number): string => {
    return `${formatFileSize(bytesPerSec)}/s`;
  };

const handleMouseDown = (e: React.MouseEvent) => {
    // 只在拖动区域响应
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-area')) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    // 读取当前 transform 值
    if (panelRef.current) {
      const transform = panelRef.current.style.transform;
      const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
      if (match) {
        panelPositionRef.current = {
          x: parseFloat(match[1]),
          y: parseFloat(match[2])
        };
      }
    }
  };

  const handleTransferToRemote = async () => {
    console.log('Upload button clicked');
    console.log('Selected local files:', selectedLocalFiles);
    console.log('Remote path:', remotePath);
    console.log('Connection ID:', connectionId);

    if (selectedLocalFiles.length === 0) {
      toast.error(t('sftp.error.noFileSelected'));
      return;
    }

    setUploading(true);
    try {
      // 分离文件和目录
      const files: typeof selectedLocalFiles = [];
      const directories: typeof selectedLocalFiles = [];

      selectedLocalFiles.forEach(file => {
        if (file.isDir) {
          directories.push(file);
        } else {
          files.push(file);
        }
      });

      console.log(`Found ${files.length} files and ${directories.length} directories to upload`);

      // 上传文件
      const window = getCurrentWindow();
      for (const file of files) {
        const remoteFilePath = remotePath.endsWith('/')
          ? `${remotePath}${file.name}`
          : `${remotePath}/${file.name}`;

        console.log('Uploading file:', file.path, '->', remoteFilePath);

        await invoke('sftp_upload_file', {
          connectionId,
          localPath: file.path,
          remotePath: remoteFilePath,
          window: window,
        });
      }

      // 上传目录并收集实际文件和目录数量
      let totalFilesInDirectories = 0;
      let totalDirsInDirectories = 0;
      for (const dir of directories) {
        let remoteDirPath: string;
        if (remotePath === '/') {
          remoteDirPath = `/${dir.name}`;
        } else if (remotePath.endsWith('/')) {
          remoteDirPath = `${remotePath}${dir.name}`;
        } else {
          remoteDirPath = `${remotePath}/${dir.name}`;
        }

        // 为每个目录生成唯一的 task_id
        const taskId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        console.log('Uploading directory:', dir.path, '->', remoteDirPath, 'task_id:', taskId);

        // 调用目录上传命令，获取返回结果
        const result = await invoke<{
          totalFiles: number;
          totalDirs: number;
          totalSize: number;
          elapsedTimeMs: number;
        }>('sftp_upload_directory', {
          connectionId,
          localDirPath: dir.path,
          remoteDirPath: remoteDirPath,
          taskId: taskId,
        });

        totalFilesInDirectories += result.totalFiles;
        totalDirsInDirectories += result.totalDirs;
      }

      // 计算实际上传的文件和目录总数
      const totalFiles = files.length + totalFilesInDirectories;
      const totalDirs = directories.length + totalDirsInDirectories;
      toast.success(`上传成功：${totalFiles} 个文件, ${totalDirs} 个目录`);
      setSelectedLocalFiles([]);

      // 只刷新远程面板
      setRemoteRefreshTimestamp(Date.now());
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(t('sftp.error.uploadFailed', { error }));
    } finally {
      setUploading(false);
    }
  };

  const handleTransferToLocal = async () => {
    if (selectedRemoteFiles.length === 0) return;

    setDownloading(true);
    try {
      for (const file of selectedRemoteFiles) {
        // 跳过目录
        if (file.isDir) {
          toast.warning(t('sftp.error.skipDirectory', { name: file.name }));
          continue;
        }

        const localFilePath = localPath.endsWith('/')
          ? `${localPath}${file.name}`
          : `${localPath}/${file.name}`;

        await invoke('sftp_download_file', {
          connectionId,
          remotePath: file.path,
          localPath: localFilePath,
        });
      }

      toast.success(t('sftp.success.downloadSuccess', { count: selectedRemoteFiles.length }));
      setSelectedRemoteFiles([]);

      // 只刷新本地面板
      setLocalRefreshTimestamp(Date.now());
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(t('sftp.error.downloadFailed', { error }));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="h-full flex relative">
      {/* 上传进度悬浮面板 - 即时显示/隐藏 */}
        <div
          ref={panelRef}
          className={`fixed z-[9999] w-96 max-h-96 overflow-y-auto ${
            showUploadPanel ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            top: `${64}px`,
            left: `calc(100% - 400px)`,
            transform: `translate(${panelPosition.x}px, ${panelPosition.y}px)`
          }}
          onMouseDown={handleMouseDown}
        >
          <Card className="shadow-2xl shadow-black/20 border-2 border-primary/40 backdrop-blur-sm bg-background/95">
            {/* 可拖动的标题栏 */}
            <div className="drag-area p-4 pb-3 border-b select-none bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">上传进度</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploadPanel(false)}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                拖动此处移动面板
              </div>
            </div>

            {/* 面板内容 */}
            <div className="p-4">
              {uploadProgressMap.size > 0 ? (
                Array.from(uploadProgressMap.values()).map((progress) => (
                  <div key={progress.task_id} className="mb-3 last:mb-0">
                    {/* 文件计数进度 */}
                    <Progress
                      value={(progress.files_completed / progress.total_files) * 100}
                      className="h-2 mb-2"
                    />

                    {/* 当前上传的文件 */}
                    <div className="flex items-start gap-2 text-xs mb-2">
                      {progress.current_file ? (
                        <>
                          <File className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-mono truncate" title={progress.current_file}>
                              {progress.current_file.split(/[/\\]/).pop()}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Folder className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-mono truncate" title={progress.current_dir}>
                              {progress.current_dir.split(/[/\\]/).pop()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* 传输速度和统计信息 */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatSpeed(progress.speed_bytes_per_sec)}</span>
                      <span>{progress.files_completed}/{progress.total_files} 文件</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>暂无上传任务</p>
                </div>
              )}

              {/* 取消按钮 */}
              {uploadProgressMap.size > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelUpload}
                    className="w-full"
                  >
                    <X className="h-3 w-3 mr-2" />
                    取消所有上传
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

      {/* 本地文件面板 */}
      <div className="flex-1 flex flex-col border-r">
        <FilePane
          type="local"
          path={localPath}
          onPathChange={handleLocalPathChange}
          selectedFiles={selectedLocalFiles}
          onSelectedFilesChange={setSelectedLocalFiles}
          isLoading={false}
          refreshKey={localRefreshKey}
          extraRefreshKey={localRefreshTimestamp}
        />
      </div>

      {/* 中间操作栏 */}
      <div className="w-12 border-l border-r flex flex-col items-center py-4 gap-2 bg-muted/20">
        {/* 上传进度按钮 */}
        <button
          onClick={() => setShowUploadPanel(!showUploadPanel)}
          className={`
            p-2 rounded transition-all duration-200 relative
            ${showUploadPanel
              ? 'bg-foreground text-background hover:bg-foreground/90 shadow-md'
              : 'bg-background text-foreground hover:bg-muted'
            }
          `}
          title="查看上传进度"
        >
          <Upload className={`h-4 w-4 ${uploading ? 'animate-pulse' : ''}`} />
          {uploadProgressMap.size > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
              {uploadProgressMap.size}
            </span>
          )}
        </button>

        <div className="h-px w-6 bg-border my-1"></div>

        <button
          onClick={handleTransferToRemote}
          disabled={selectedLocalFiles.length === 0 || uploading}
          className={`
            p-2 rounded transition-all duration-200
            ${selectedLocalFiles.length > 0 && !uploading
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 shadow-md'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed'
            }
          `}
          title={uploading ? t('sftp.status.uploading') : t('sftp.action.upload')}
        >
          <ChevronRight className={`h-4 w-4 ${uploading ? 'animate-pulse' : ''}`} />
        </button>

        <button
          onClick={handleTransferToLocal}
          disabled={selectedRemoteFiles.length === 0 || downloading}
          className={`
            p-2 rounded transition-all duration-200
            ${selectedRemoteFiles.length > 0 && !downloading
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 shadow-md'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed'
            }
          `}
          title={downloading ? t('sftp.status.downloading') : t('sftp.action.download')}
        >
          <ChevronRight className={`h-4 w-4 transform rotate-180 ${downloading ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      {/* 远程文件面板 */}
      <div className="flex-1 flex flex-col">
        <FilePane
          type="remote"
          path={remotePath}
          connectionId={connectionId}
          onPathChange={handleRemotePathChange}
          selectedFiles={selectedRemoteFiles}
          onSelectedFilesChange={setSelectedRemoteFiles}
          isLoading={false}
          refreshKey={remoteRefreshKey}
          extraRefreshKey={remoteRefreshTimestamp}
        />
      </div>
    </div>
  );
}
