/**
 * SFTP 文件管理器主页面
 *
 * 提供双面板文件管理界面
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Upload, Download, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSessionStore } from '@/store/sessionStore';
import { useSftpStore } from '@/store/sftpStore';
import { toast } from 'sonner';
import { DualPane } from '@/components/sftp/DualPane';
import { invoke } from '@tauri-apps/api/core';

export function SftpManager() {
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

  const handleConnect = async (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    const connection = availableConnections.find(c => c.id === connectionId);
    toast.success(`已切换到: ${connection?.name || connectionId} (${connection?.host})`);
  };

  const handleRefresh = async () => {
    if (!selectedConnectionId) {
      toast.error('请先选择一个连接');
      return;
    }
    setIsLoading(true);
    try {
      // TODO: 刷新文件列表
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('刷新成功');
    } catch (error) {
      toast.error('刷新失败', { description: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedConnectionId) {
      toast.error('请先选择一个连接');
      return;
    }

    if (selectedLocalFiles.length === 0) {
      toast.error('请先选择要上传的文件');
      return;
    }

    console.log('Upload button clicked');
    console.log('Selected local files:', selectedLocalFiles);
    console.log('Remote path:', remotePath);
    console.log('Connection ID:', selectedConnectionId);

    setUploading(true);
    try {
      for (const file of selectedLocalFiles) {
        // 跳过目录
        if (file.is_dir) {
          toast.warning(`跳过目录: ${file.name}`);
          continue;
        }

        // 构建远程文件路径
        let remoteFilePath: string;
        if (remotePath === '/') {
          // 根目录特殊处理
          remoteFilePath = `/${file.name}`;
        } else if (remotePath.endsWith('/')) {
          remoteFilePath = `${remotePath}${file.name}`;
        } else {
          remoteFilePath = `${remotePath}/${file.name}`;
        }

        console.log('Remote path:', remotePath);
        console.log('File name:', file.name);
        console.log('Constructed remote file path:', remoteFilePath);
        console.log('Uploading:', file.path, '->', remoteFilePath);

        await invoke('sftp_upload_file', {
          connectionId: selectedConnectionId,
          localPath: file.path,
          remotePath: remoteFilePath,
        });
      }

      toast.success(`成功上传 ${selectedLocalFiles.length} 个文件`);
      setSelectedLocalFiles([]);

      // 刷新远程面板
      setRemoteRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`上传失败: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedConnectionId) {
      toast.error('请先选择一个连接');
      return;
    }

    if (selectedRemoteFiles.length === 0) {
      toast.error('请先选择要下载的文件');
      return;
    }

    setDownloading(true);
    try {
      for (const file of selectedRemoteFiles) {
        // 跳过目录
        if (file.is_dir) {
          toast.warning(`跳过目录: ${file.name}`);
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

      toast.success(`成功下载 ${selectedRemoteFiles.length} 个文件`);
      setSelectedRemoteFiles([]);

      // 刷新本地面板
      setLocalRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`下载失败: ${error}`);
    } finally {
      setDownloading(false);
    }
  };

  if (availableConnections.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">SFTP 文件管理器</h2>
          <p className="text-muted-foreground mb-6">
            没有可用的 SSH 连接
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            请先在终端页面连接到 SSH 服务器
          </p>
          <Button onClick={() => navigate('/terminal')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            前往终端
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
              onClick={() => navigate('/terminal')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <h1 className="text-lg font-semibold">SFTP 文件管理器</h1>
              <p className="text-xs text-muted-foreground">
                管理远程文件
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
                <SelectValue placeholder="选择连接" />
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
              {uploading ? '上传中...' : '上传'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!selectedConnectionId || downloading || selectedRemoteFiles.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? '下载中...' : '下载'}
            </Button>
          </div>
        </div>
      </div>

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
          <p className="text-muted-foreground">请选择一个 SSH 连接</p>
        </div>
      )}
    </div>
  );
}
