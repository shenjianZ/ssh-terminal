/**
 * SFTP 文件管理器主页面
 *
 * 提供双面板文件管理界面
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Upload, Download, HardDrive, X, File, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { useSessionStore } from '@/store/sessionStore';
import { useSftpStore } from '@/store/sftpStore';
import { toast } from 'sonner';
import { DualPane } from '@/components/sftp/DualPane';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';

// 上传进度事件类型
interface UploadProgressEvent {
  task_id: string; // 上传任务的唯一 ID
  connection_id: string;
  current_file: string;
  current_dir: string;
  files_completed: number;
  total_files: number;
  bytes_transferred: number;
  total_bytes: number;
  speed_bytes_per_sec: number;
}

export function SftpManager() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessions } = useSessionStore();
  const {
    initializeLocalPath,
    selectedLocalFiles,
    selectedRemoteFiles,
    localPath,
    remotePath,
    setSelectedLocalFiles,
    setSelectedRemoteFiles,
  } = useSftpStore();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [remoteRefreshKey, setRemoteRefreshKey] = useState(0);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const [uploadProgressMap, setUploadProgressMap] = useState<Map<string, UploadProgressEvent>>(new Map());
  const [uploadCancellable, setUploadCancellable] = useState(false);

  // 获取可用的 SSH 连接，根据 id 去重
  const availableConnections = (sessions || [])
    .filter((conn) => conn.status === 'connected')
    .filter((conn, index, self) =>
      index === self.findIndex((c) => c.id === conn.id)
    );

  // 初始化本地路径
  useEffect(() => {
    initializeLocalPath();
  }, []);

  useEffect(() => {
    // 如果有连接且未选择，自动选择第一个
    if (availableConnections.length > 0 && !selectedConnectionId) {
      setSelectedConnectionId(availableConnections[0].id);
    }
  }, [availableConnections, selectedConnectionId]);

  // 监听快捷键事件
  useEffect(() => {
    const handleUploadShortcut = () => {
      console.log('[SftpManager] Upload shortcut triggered');
      handleUpload();
    };

    const handleDownloadShortcut = () => {
      console.log('[SftpManager] Download shortcut triggered');
      handleDownload();
    };

    const handleRefreshShortcut = () => {
      console.log('[SftpManager] Refresh shortcut triggered');
      handleRefresh();
    };

    window.addEventListener('keybinding-sftp-upload', handleUploadShortcut);
    window.addEventListener('keybinding-sftp-download', handleDownloadShortcut);
    window.addEventListener('keybinding-sftp-refresh', handleRefreshShortcut);

    return () => {
      window.removeEventListener('keybinding-sftp-upload', handleUploadShortcut);
      window.removeEventListener('keybinding-sftp-download', handleDownloadShortcut);
      window.removeEventListener('keybinding-sftp-refresh', handleRefreshShortcut);
    };
  }, [selectedConnectionId, selectedLocalFiles, selectedRemoteFiles, localPath, remotePath]);

  // 监听上传进度事件
  useEffect(() => {
    const unlisten = listen<UploadProgressEvent>('sftp-upload-progress', (event) => {
      const progress = event.payload;
      if (progress.connection_id === selectedConnectionId) {
        setUploadProgressMap(prev => new Map(prev).set(progress.task_id, progress));
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [selectedConnectionId]);

  const handleConnect = async (connectionId: string) => {
    playSound(SoundEffect.BUTTON_CLICK);
    setSelectedConnectionId(connectionId);
    const connection = availableConnections.find(c => c.id === connectionId);
    toast.success(t('sftp.success.switchedToConnection', { name: connection?.name || connectionId, host: connection?.host }));
  };

  const handleRefresh = async () => {
    playSound(SoundEffect.BUTTON_CLICK);
    if (!selectedConnectionId) {
      toast.error(t('sftp.error.noConnectionSelected'));
      return;
    }
    setIsLoading(true);
    try {
      // 刷新远程文件列表
      setRemoteRefreshKey(prev => prev + 1);

      // 刷新本地文件列表
      setLocalRefreshKey(prev => prev + 1);

      // 取消所有选中状态
      setSelectedLocalFiles([]);
      setSelectedRemoteFiles([]);

      // 等待一下让刷新生效
      await new Promise((resolve) => setTimeout(resolve, 300));

      toast.success(t('sftp.success.refreshSuccess'));
      playSound(SoundEffect.SUCCESS);
    } catch (error) {
      toast.error(t('sftp.error.refreshFailed'), { description: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    playSound(SoundEffect.BUTTON_CLICK);
    if (!selectedConnectionId) {
      toast.error(t('sftp.error.noConnectionSelected'));
      return;
    }

    if (selectedLocalFiles.length === 0) {
      toast.error(t('sftp.error.noFileSelected'));
      return;
    }

    console.log('Upload button clicked');
    console.log('Selected local files:', selectedLocalFiles);
    console.log('Remote path:', remotePath);
    console.log('Connection ID:', selectedConnectionId);

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

    setUploading(true);
    setUploadProgressMap(new Map());
    setUploadCancellable(directories.length > 0);

    try {
      // 上传文件
      for (const file of files) {
        // 构建远程文件路径
        let remoteFilePath: string;
        if (remotePath === '/') {
          remoteFilePath = `/${file.name}`;
        } else if (remotePath.endsWith('/')) {
          remoteFilePath = `${remotePath}${file.name}`;
        } else {
          remoteFilePath = `${remotePath}/${file.name}`;
        }

        console.log('Uploading file:', file.path, '->', remoteFilePath);

        await invoke('sftp_upload_file', {
          connectionId: selectedConnectionId,
          localPath: file.path,
          remotePath: remoteFilePath,
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
          connectionId: selectedConnectionId,
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
      playSound(SoundEffect.SUCCESS);
      setSelectedLocalFiles([]);

      // 刷新远程面板
      setRemoteRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(t('sftp.error.uploadFailed', { error }));
      playSound(SoundEffect.ERROR);
    } finally {
      setUploading(false);
      setUploadProgressMap(new Map());
      setUploadCancellable(false);
    }
  };

  const handleCancelUpload = async () => {
    if (!selectedConnectionId) {
      return;
    }

    try {
      await invoke('sftp_cancel_upload', {
        connectionId: selectedConnectionId,
      });
      toast.info(t('sftp.status.uploadCancelled'));
      playSound(SoundEffect.BUTTON_CLICK);
    } catch (error) {
      console.error('Cancel upload failed:', error);
      toast.error(t('sftp.error.cancelUploadFailed', { error }));
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

  const handleDownload = async () => {
    playSound(SoundEffect.BUTTON_CLICK);
    if (!selectedConnectionId) {
      toast.error(t('sftp.error.noConnectionSelected'));
      return;
    }

    if (selectedRemoteFiles.length === 0) {
      toast.error(t('sftp.error.noFileSelected'));
      return;
    }

    setDownloading(true);
    try {
      for (const file of selectedRemoteFiles) {
        // 跳过目录
        if (file.isDir) {
          toast.warning(t('sftp.error.skipDirectory', { name: file.name }));
          continue;
        }

        const localFilePath = localPath.endsWith('\\')
          ? `${localPath}${file.name}`
          : `${localPath}\\${file.name}`;

        await invoke('sftp_download_file', {
          connectionId: selectedConnectionId,
          remotePath: file.path,
          localPath: localFilePath,
        });
      }

      toast.success(t('sftp.success.downloadSuccess', { count: selectedRemoteFiles.length }));
      playSound(SoundEffect.SUCCESS);
      setSelectedRemoteFiles([]);

      // 刷新本地面板
      setLocalRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(t('sftp.error.downloadFailed', { error }));
      playSound(SoundEffect.ERROR);
    } finally {
      setDownloading(false);
    }
  };

  if (availableConnections.length === 0) {
    return (
      <div className="flex-1 flex items-start justify-center pt-32 bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('sftp.title')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('sftp.error.noConnectionsAvailable')}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {t('sftp.error.connectFirst')}
          </p>
          <Button onClick={() => {
            playSound(SoundEffect.BUTTON_CLICK);
            navigate('/terminal');
          }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('sftp.action.goToTerminal')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 顶部工具栏 */}
      <div className="border-b bg-muted/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                playSound(SoundEffect.BUTTON_CLICK);
                navigate('/terminal');
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <h1 className="text-lg font-semibold">{t('sftp.title')}</h1>
              <p className="text-xs text-muted-foreground">
                {t('sftp.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 连接选择器 */}
            <Select
              value={selectedConnectionId || ''}
              onValueChange={handleConnect}
              disabled={availableConnections.length === 0}
            >
              <SelectTrigger className="w-[200px]">
                <HardDrive className="h-4 w-4 mr-2 opacity-50" />
                <SelectValue placeholder={t('sftp.action.selectConnection')} />
              </SelectTrigger>
              <SelectContent>
                {availableConnections.map((conn) => (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.name} - {conn.username}@{conn.host}:{conn.port}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || !selectedConnectionId}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleUpload}
              disabled={!selectedConnectionId || uploading || selectedLocalFiles.length === 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? t('sftp.status.uploading') : t('sftp.action.upload')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!selectedConnectionId || downloading || selectedRemoteFiles.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? t('sftp.status.downloading') : t('sftp.action.download')}
            </Button>
          </div>
        </div>
      </div>

      {/* 上传进度显示 */}
      {uploadProgressMap.size > 0 && (
        <div className="mx-4 mt-2 space-y-2">
          {Array.from(uploadProgressMap.values()).map((progress) => (
            <Card key={progress.task_id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <span className="font-medium">{t('sftp.uploading')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {progress.files_completed}/{progress.total_files} {t('sftp.files')}
                    </span>
                    {uploadCancellable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelUpload}
                        className="h-7 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* 文件计数进度 */}
                <Progress
                  value={(progress.files_completed / progress.total_files) * 100}
                  className="h-2"
                />

                {/* 当前上传的文件 */}
                <div className="flex items-start gap-2 text-sm">
                  {progress.current_file ? (
                    <>
                      <File className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs truncate" title={progress.current_file}>
                          {progress.current_file}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatFileSize(progress.bytes_transferred)} / {formatFileSize(progress.total_bytes)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Folder className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs truncate" title={progress.current_dir}>
                          {progress.current_dir}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 传输速度和统计信息 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatSpeed(progress.speed_bytes_per_sec)}</span>
                  <span>{((progress.files_completed / progress.total_files) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 双面板文件管理器 */}
      {selectedConnectionId ? (
        <div className="flex-1 overflow-hidden">
          <DualPane
            connectionId={selectedConnectionId}
            remoteRefreshKey={remoteRefreshKey}
            localRefreshKey={localRefreshKey}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t('sftp.error.selectConnectionFirst')}</p>
        </div>
      )}
    </div>
  );
}
