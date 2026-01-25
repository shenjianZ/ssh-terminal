/**
 * 文件列表组件
 *
 * 显示文件和目录列表
 */

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getFileIcon, formatFileSize, formatPermissions, type SftpFileInfo } from '@/types/sftp';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface FileListProps {
  type: 'local' | 'remote';
  path: string;
  connectionId?: string; // 用于远程文件
  selectedFiles: SftpFileInfo[];
  onSelectedFilesChange: (files: SftpFileInfo[]) => void;
  onFileDoubleClick: (file: SftpFileInfo) => void;
  isLoading?: boolean;
  refreshKey?: number;
}

export function FileList({
  type,
  path,
  connectionId,
  selectedFiles,
  onSelectedFilesChange,
  onFileDoubleClick,
  isLoading = false,
  refreshKey = 0,
}: FileListProps) {
  const [files, setFiles] = useState<SftpFileInfo[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFiles = async () => {
      if (type === 'local') {
        // 本地文件系统访问
        setLoading(true);
        try {
          const result = await invoke<SftpFileInfo[]>('local_list_dir', {
            path,
          });
          setFiles(result);
        } catch (error) {
          console.error('Failed to list local directory:', error);
          setFiles([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!connectionId) {
        setFiles([]);
        return;
      }

      setLoading(true);
      try {
        const result = await invoke<SftpFileInfo[]>('sftp_list_dir', {
          connectionId,
          path,
        });
        setFiles(result);
      } catch (error) {
        console.error('Failed to list directory:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [path, type, connectionId, refreshKey]);

  // 检查是否所有文件都被选中
  useEffect(() => {
    if (files.length > 0 && selectedFiles.length === files.length) {
      setAllSelected(true);
    } else {
      setAllSelected(false);
    }
  }, [selectedFiles, files]);

  const handleCheckboxClick = (file: SftpFileInfo, checked: boolean | string) => {
    const isSelected = selectedFiles.some((f) => f.path === file.path);

    // 如果是要选中且当前未选中，添加到选中列表
    // 如果是要取消选中且当前已选中，从选中列表移除
    if (checked === true && !isSelected) {
      onSelectedFilesChange([...selectedFiles, file]);
    } else if (checked === false && isSelected) {
      onSelectedFilesChange(selectedFiles.filter((f) => f.path !== file.path));
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectedFilesChange([]);
    } else {
      onSelectedFilesChange(files);
    }
    setAllSelected(!allSelected);
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* 表头 */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
        <div className="col-span-1 flex items-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
          />
        </div>
        <div className="col-span-5">名称</div>
        <div className="col-span-2">大小</div>
        <div className="col-span-2">修改时间</div>
        <div className="col-span-2">权限</div>
      </div>

      {/* 文件列表 */}
      {files.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          空目录
        </div>
      ) : (
        <div>
          {files.map((file) => (
            <div
              key={file.path}
              className={`grid grid-cols-12 gap-2 px-4 py-2 border-b hover:bg-muted/30 cursor-pointer transition-colors ${
                selectedFiles.some((f) => f.path === file.path)
                  ? 'bg-muted/50'
                  : ''
              }`}
              onDoubleClick={() => onFileDoubleClick(file)}
            >
              <div className="col-span-1 flex items-center" onDoubleClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedFiles.some((f) => f.path === file.path)}
                  onCheckedChange={(checked) => handleCheckboxClick(file, checked)}
                />
              </div>
              <div className="col-span-5 flex items-center gap-2 overflow-hidden">
                <span className="text-lg">{getFileIcon(file)}</span>
                <span className="truncate text-sm">{file.name}</span>
              </div>
              <div className="col-span-2 flex items-center text-xs text-muted-foreground">
                {file.is_dir ? '-' : formatFileSize(file.size)}
              </div>
              <div className="col-span-2 flex items-center text-xs text-muted-foreground">
                {formatTimestamp(file.modified)}
              </div>
              <div className="col-span-2 flex items-center text-xs font-mono text-muted-foreground">
                {formatPermissions(file.mode)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 30) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString();
  }
}
