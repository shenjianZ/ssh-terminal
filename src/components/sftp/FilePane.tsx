/**
 * 文件面板组件
 *
 * 显示本地或远程文件列表
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileList } from './FileList';
import { ArrowUp, Home, RefreshCw, FolderPlus, Trash2, Edit2, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { SftpFileInfo } from '@/types/sftp';
import { playSound } from '@/lib/sounds';
import { SoundEffect } from '@/lib/sounds';

interface FilePaneProps {
  type: 'local' | 'remote';
  path: string;
  connectionId?: string; // 用于远程文件
  onPathChange: (path: string) => void;
  selectedFiles: SftpFileInfo[];
  onSelectedFilesChange: (files: SftpFileInfo[]) => void;
  isLoading?: boolean;
  refreshKey?: number;
}

export function FilePane({
  type,
  path,
  connectionId,
  onPathChange,
  selectedFiles,
  onSelectedFilesChange,
  isLoading = false,
  refreshKey = 0,
}: FilePaneProps) {
  const [inputPath, setInputPath] = useState(path);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  const [availableDrives, setAvailableDrives] = useState<string[]>([]);

  // 同步外部 path 变化到 inputPath
  useEffect(() => {
    setInputPath(path);
  }, [path]);

  // 监听外部的 refreshKey 变化
  useEffect(() => {
    if (refreshKey > 0) {
      console.log('External refreshKey changed:', refreshKey);
      setInternalRefreshKey(refreshKey);
    }
  }, [refreshKey]);
  const joinPath = (basePath: string, fileName: string): string => {
    if (type === 'local') {
      // Windows 本地路径使用反斜杠
      if (basePath.endsWith('\\') || basePath.endsWith('/')) {
        return `${basePath}${fileName}`;
      }
      return `${basePath}\\${fileName}`;
    } else {
      // 远程 Unix 路径使用正斜杠
      if (basePath === '/') {
        return `/${fileName}`;
      }
      if (basePath.endsWith('/')) {
        return `${basePath}${fileName}`;
      }
      return `${basePath}/${fileName}`;
    }
  };

  // 获取父目录路径
  const getParentPath = (filePath: string): string => {
    if (type === 'local') {
      // Windows 路径
      const lastBackslash = filePath.lastIndexOf('\\');
      const lastSlash = filePath.lastIndexOf('/');
      const lastSeparator = Math.max(lastBackslash, lastSlash);
      if (lastSeparator > 0) {
        return filePath.substring(0, lastSeparator);
      }
      // 如果是根目录（如 D:\），返回原路径
      return filePath;
    } else {
      // Unix 路径
      const lastSlash = filePath.lastIndexOf('/');
      if (lastSlash > 0) {
        return filePath.substring(0, lastSlash);
      }
      return '/';
    }
  };

  // 同步外部 path 变化到 inputPath
  useEffect(() => {
    setInputPath(path);
  }, [path]);

  // 加载可用盘符（仅本地文件系统）
  useEffect(() => {
    if (type === 'local') {
      const loadDrives = async () => {
        try {
          const drives = await invoke<string[]>('local_available_drives');
          setAvailableDrives(drives);
        } catch (error) {
          console.error('Failed to load drives:', error);
        }
      };
      loadDrives();
    }
  }, [type, refreshKey]); // 添加 refreshKey 依赖，刷新时重新加载盘符

  const handleGoToParent = () => {
    playSound(SoundEffect.BUTTON_CLICK);
    const parentPath = getParentPath(path);
    onPathChange(parentPath);

    // 仅对远程文件操作显示提示
    if (type === 'remote') {
      toast.success('已进入上级目录');
    }
    // 本地文件不显示提示
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      if (type === 'remote' && connectionId) {
        const folderPath = joinPath(path, newFolderName);

        // 调用后端创建文件夹API
        await invoke('sftp_create_dir', {
          connectionId,
          path: folderPath,
          recursive: false,
        });
        toast.success(`文件夹 "${newFolderName}" 创建成功`);
        playSound(SoundEffect.SUCCESS);
      }
      setShowNewFolderDialog(false);
      setNewFolderName('');
      // 刷新列表
      setInternalRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to create folder:', error);
      const errorMsg = String(error);
      if (errorMsg.includes('Permission denied')) {
        toast.error('创建失败：没有权限');
      } else if (errorMsg.includes('exists') || errorMsg.includes('already exists')) {
        toast.error(`文件夹 "${newFolderName}" 已存在`);
      } else if (errorMsg.includes('No such file')) {
        toast.error('父路径不存在');
      } else {
        toast.error(`创建文件夹失败: ${errorMsg}`);
      }
      playSound(SoundEffect.ERROR);
    }
  };

  const handleDelete = async () => {
    try {
      if (type === 'remote' && connectionId) {
        // 调用后端删除API
        for (const file of selectedFiles) {
          if (file.isDir) {
            await invoke('sftp_remove_dir', {
              connectionId,
              path: file.path,
              recursive: true, // 递归删除，可以删除包含子目录和文件的目录
            });
          } else {
            await invoke('sftp_remove_file', {
              connectionId,
              path: file.path,
            });
          }
        }
        toast.success(`成功删除 ${selectedFiles.length} 项`);
        playSound(SoundEffect.SUCCESS);
      }
      setShowDeleteDialog(false);
      onSelectedFilesChange([]);
      // 刷新列表
      setInternalRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to delete:', error);
      const errorMsg = String(error);
      if (errorMsg.includes('Permission denied')) {
        toast.error('删除失败：没有权限');
      } else if (errorMsg.includes('No such file')) {
        toast.error('文件或目录不存在');
      } else if (errorMsg.includes('Directory not empty')) {
        toast.error('删除失败：目录不为空');
      } else {
        toast.error(`删除失败: ${errorMsg}`);
      }
      playSound(SoundEffect.ERROR);
    }
  };

  const handleRename = async () => {
    if (!renameValue.trim() || selectedFiles.length !== 1) return;

    try {
      if (type === 'remote' && connectionId) {
        const file = selectedFiles[0];
        const parentPath = getParentPath(file.path);
        const newPath = joinPath(parentPath, renameValue);

        await invoke('sftp_rename', {
          connectionId,
          oldPath: file.path,
          newPath: newPath,
        });
        toast.success(`重命名成功：${file.name} → ${renameValue}`);
        playSound(SoundEffect.SUCCESS);
      }
      setShowRenameDialog(false);
      setRenameValue('');
      onSelectedFilesChange([]);
      // 刷新列表
      setInternalRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to rename:', error);
      const errorMsg = String(error);
      if (errorMsg.includes('Permission denied')) {
        toast.error('重命名失败：没有权限');
      } else if (errorMsg.includes('No such file')) {
        toast.error('文件不存在');
      } else if (errorMsg.includes('exists') || errorMsg.includes('already exists')) {
        toast.error(`文件名 "${renameValue}" 已存在`);
      } else {
        toast.error(`重命名失败: ${errorMsg}`);
      }
      playSound(SoundEffect.ERROR);
    }
  };

  const handleGoToRoot = async () => {
    playSound(SoundEffect.BUTTON_CLICK);
    if (type === 'local') {
      // 本地文件：根据当前盘符判断
      const currentDrive = getCurrentDrive();
      if (currentDrive === 'C:') {
        // C盘：进入用户家目录
        try {
          const homeDir = await invoke<string>('local_home_dir');
          onPathChange(homeDir);
        } catch (error) {
          console.error('Failed to get home directory:', error);
        }
      } else if (currentDrive) {
        // 其他盘符：进入对应盘符的根目录
        const rootPath = await invoke<string>('local_drive_root', { drive: currentDrive });
        onPathChange(rootPath);
      } else {
        // 无法识别盘符，默认进入家目录
        try {
          const homeDir = await invoke<string>('local_home_dir');
          onPathChange(homeDir);
        } catch (error) {
          console.error('Failed to get home directory:', error);
        }
      }
    } else {
      // 远程文件：进入根目录
      onPathChange('/');
      toast.success('已切换到根目录');
    }
  };

  const handleRefresh = () => {
    playSound(SoundEffect.BUTTON_CLICK);
    // 触发重新加载
    setInternalRefreshKey(prev => prev + 1);

    // 清除选中状态
    onSelectedFilesChange([]);

    // 仅对远程文件操作显示提示
    if (type === 'remote') {
      toast.success('已刷新');
    }
    // 本地文件不显示提示
  };

  // 处理盘符切换
  const handleDriveChange = async (drive: string) => {
    console.log('Switching to drive:', drive);

    if (drive === 'C:') {
      // C盘特殊处理：切换到用户家目录
      try {
        const homeDir = await invoke<string>('local_home_dir');
        onPathChange(homeDir);
      } catch (error) {
        console.error('Failed to get home directory:', error);
        toast.error('无法获取用户家目录');
      }
    } else {
      // 其他盘符：切换到盘符根目录
      try {
        const rootPath = await invoke<string>('local_drive_root', { drive });
        onPathChange(rootPath);
      } catch (error) {
        console.error('Failed to get drive root:', error);
        toast.error(`无法访问 ${drive} 盘`);
      }
    }
  };

  // 提取当前盘符（Windows路径）
  const getCurrentDrive = () => {
    if (type !== 'local') return null;
    const match = path.match(/^([A-Z]):/);
    return match ? match[1] + ':' : null;
  };

  const handleSubmitPath = async (e: React.FormEvent) => {
    e.preventDefault();

    // 规范化路径
    let normalizedPath = inputPath.trim();
    if (!normalizedPath) {
      normalizedPath = type === 'local' ? '\\' : '/';
    }

    // 对于远程文件，确保路径以 / 开头
    if (type === 'remote' && !normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }

    // 对于远程文件，尝试验证路径是否存在
    if (type === 'remote' && connectionId) {
      try {
        // 尝试列出目录来验证路径
        await invoke('sftp_list_dir', {
          connectionId,
          path: normalizedPath,
        });
        // 路径有效，更新路径
        onPathChange(normalizedPath);
        toast.success(`已跳转到：${normalizedPath}`);
      } catch (error) {
        console.error('Invalid path:', error);
        // 判断错误类型并显示相应的提示
        const errorMsg = String(error);
        if (errorMsg.includes('No such file') || errorMsg.includes('not found')) {
          toast.error(`路径不存在: ${normalizedPath}`);
        } else if (errorMsg.includes('Not a directory') || errorMsg.includes('not a directory')) {
          toast.error(`不是目录: ${normalizedPath}`);
        } else if (errorMsg.includes('Permission denied')) {
          toast.error(`没有访问权限: ${normalizedPath}`);
        } else {
          toast.error(`无法访问路径: ${normalizedPath}`);
        }
        // 重置输入为当前有效路径
        setInputPath(path);
      }
    } else {
      // 本地文件直接更新路径，不显示提示
      onPathChange(normalizedPath);
    }
  };

  const handleFileDoubleClick = async (file: SftpFileInfo) => {
    console.log('Double clicked file:', file);

    if (file.isDir) {
      // 进入目录
      const newPath = joinPath(path, file.name);
      console.log('Navigating to:', newPath);

      // 验证路径是否可访问
      if (type === 'remote' && connectionId) {
        try {
          await invoke('sftp_list_dir', {
            connectionId,
            path: newPath,
          });
          onPathChange(newPath);
        } catch (error) {
          console.error('Failed to open directory:', error);
          const errorMsg = String(error);
          if (errorMsg.includes('Permission denied')) {
            toast.error('没有访问权限');
          } else if (errorMsg.includes('No such file')) {
            toast.error('目录不存在');
          } else if (errorMsg.includes('Not a directory')) {
            toast.error('不是目录');
          } else {
            toast.error(`无法打开目录: ${errorMsg}`);
          }
        }
      } else {
        // 本地文件直接进入目录，不显示提示
        onPathChange(newPath);
      }
    } else {
      // TODO: 打开文件
      console.log('Open file:', file);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 面板头部 */}
      <div className="border-b bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">
            {type === 'local' ? '本地文件' : '远程文件'}
          </span>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleGoToRoot}
              title="根目录"
            >
              <Home className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleGoToParent}
              title="上级目录"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleRefresh}
              title="刷新"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            {type === 'remote' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowNewFolderDialog(true)}
                  title="新建文件夹"
                >
                  <FolderPlus className="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowDeleteDialog(true)}
                  title="删除"
                  disabled={selectedFiles.length === 0}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    if (selectedFiles.length === 1) {
                      setRenameValue(selectedFiles[0].name);
                      setShowRenameDialog(true);
                    }
                  }}
                  title="重命名"
                  disabled={selectedFiles.length !== 1}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 路径输入 */}
        <div className="flex items-center gap-2">
          {/* 盘符选择器（仅本地） */}
          {type === 'local' && availableDrives.length > 0 && (
            <Select
              value={getCurrentDrive() || ''}
              onValueChange={handleDriveChange}
            >
              <SelectTrigger className="w-[70px] h-8">
                <HardDrive className="h-3 w-3 mr-1 opacity-50" />
                <SelectValue placeholder="盘符" />
              </SelectTrigger>
              <SelectContent>
                {availableDrives.map((drive) => (
                  <SelectItem key={drive} value={drive}>
                    {drive}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <form onSubmit={handleSubmitPath} className="flex-1 flex items-center gap-2">
            <Input
              type="text"
              value={inputPath}
              onChange={(e) => setInputPath(e.target.value)}
              className="h-8 text-sm"
              placeholder="输入路径，按回车跳转"
            />
          </form>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-auto">
        <FileList
          type={type}
          path={path}
          connectionId={connectionId}
          selectedFiles={selectedFiles}
          onSelectedFilesChange={onSelectedFilesChange}
          onFileDoubleClick={handleFileDoubleClick}
          isLoading={isLoading}
          refreshKey={internalRefreshKey}
        />
      </div>

      {/* 状态栏 */}
      <div className="border-t bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
        {selectedFiles.length > 0
          ? `已选择 ${selectedFiles.length} 项`
          : `${type === 'local' ? '本地' : '远程'}文件系统`}
      </div>

      {/* 新建文件夹对话框 */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">文件夹名称</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="输入文件夹名称"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              playSound(SoundEffect.BUTTON_CLICK);
              setShowNewFolderDialog(false);
            }}>
              取消
            </Button>
            <Button onClick={handleCreateFolder}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>确定要删除选中的 {selectedFiles.length} 项吗？</p>
            <p className="text-sm text-muted-foreground mt-2">
              此操作不可撤销。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              playSound(SoundEffect.BUTTON_CLICK);
              setShowDeleteDialog(false);
            }}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重命名对话框 */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename">新名称</Label>
              <Input
                id="rename"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="输入新名称"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              playSound(SoundEffect.BUTTON_CLICK);
              setShowRenameDialog(false);
            }}>
              取消
            </Button>
            <Button onClick={handleRename}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
