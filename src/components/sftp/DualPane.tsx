/**
 * 双面板文件管理器组件
 *
 * 显示本地和远程文件面板
 */

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FilePane } from './FilePane';
import { useSftpStore } from '@/store/sftpStore';
import { ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface DualPaneProps {
  connectionId: string;
  remoteRefreshKey?: number;
  localRefreshKey?: number;
}

export function DualPane({ connectionId, remoteRefreshKey = 0, localRefreshKey = 0 }: DualPaneProps) {
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

  const handleLocalPathChange = (path: string) => {
    setLocalPath(path);
  };

  const handleRemotePathChange = (path: string) => {
    setRemotePath(path);
  };

  const handleTransferToRemote = async () => {
    console.log('Upload button clicked');
    console.log('Selected local files:', selectedLocalFiles);
    console.log('Remote path:', remotePath);
    console.log('Connection ID:', connectionId);

    if (selectedLocalFiles.length === 0) {
      toast.error('请先选择要上传的文件');
      return;
    }

    setUploading(true);
    try {
      for (const file of selectedLocalFiles) {
        // 跳过目录
        if (file.is_dir) {
          toast.warning(`跳过目录: ${file.name}`);
          continue;
        }

        const remoteFilePath = remotePath.endsWith('/')
          ? `${remotePath}${file.name}`
          : `${remotePath}/${file.name}`;

        console.log('Uploading:', file.path, '->', remoteFilePath);

        await invoke('sftp_upload_file', {
          connectionId,
          localPath: file.path,
          remotePath: remoteFilePath,
        });
      }

      toast.success(`成功上传 ${selectedLocalFiles.length} 个文件`);
      setSelectedLocalFiles([]);

      // 刷新远程面板
      setRemotePath(remotePath + '#');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`上传失败: ${error}`);
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
        if (file.is_dir) {
          toast.warning(`跳过目录: ${file.name}`);
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

      toast.success(`成功下载 ${selectedRemoteFiles.length} 个文件`);
      setSelectedRemoteFiles([]);

      // 刷新本地面板
      setLocalPath(localPath + '#');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`下载失败: ${error}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="h-full flex">
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
        />
      </div>

      {/* 中间操作栏 */}
      <div className="w-12 border-l border-r flex flex-col items-center py-4 gap-2 bg-muted/20">
        <button
          onClick={handleTransferToRemote}
          disabled={selectedLocalFiles.length === 0 || uploading}
          className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={uploading ? "上传中..." : "上传到远程"}
        >
          <ChevronRight className={`h-4 w-4 ${uploading ? 'animate-pulse' : ''}`} />
        </button>

        <button
          onClick={handleTransferToLocal}
          disabled={selectedRemoteFiles.length === 0 || downloading}
          className="p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={downloading ? "下载中..." : "下载到本地"}
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
        />
      </div>
    </div>
  );
}
