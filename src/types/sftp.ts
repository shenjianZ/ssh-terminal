/**
 * SFTP 类型定义
 *
 * 与后端 Rust 类型对应
 */

/**
 * SFTP 文件信息
 */
export interface SftpFileInfo {
  /** 文件名 */
  name: string;
  /** 完整路径 */
  path: string;
  /** 文件大小（字节） */
  size: number;
  /** 是否为目录 */
  isDir: boolean;
  /** 是否为符号链接 */
  isSymlink: boolean;
  /** 修改时间（Unix 时间戳） */
  modified: number;
  /** Unix 权限模式 */
  mode: number;
  /** 所有者用户名 */
  owner?: string;
  /** 所属组名 */
  group?: string;
}

/**
 * 文件传输操作类型
 */
export type TransferOperation = 'upload' | 'download' | 'remoteToRemote';

/**
 * 传输源
 */
export type TransferSource =
  | { type: 'local'; path: string }
  | { type: 'remote'; connectionId: string; path: string };

/**
 * 传输状态
 */
export type TransferStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * 文件传输进度
 */
export interface TransferProgress {
  /** 传输 ID */
  id: string;
  /** 操作类型 */
  operation: TransferOperation;
  /** 源 */
  source: TransferSource;
  /** 目标 */
  destination: TransferSource;
  /** 文件总大小 */
  fileSize: number;
  /** 已传输字节数 */
  transferred: number;
  /** 传输速度（字节/秒） */
  speed: number;
  /** 传输状态 */
  status: TransferStatus;
}

/**
 * 文件权限模式
 */
export interface FileMode {
  /** 读权限（所有者） */
  user_read: boolean;
  /** 写权限（所有者） */
  user_write: boolean;
  /** 执行权限（所有者） */
  user_execute: boolean;
  /** 读权限（组） */
  group_read: boolean;
  /** 写权限（组） */
  group_write: boolean;
  /** 执行权限（组） */
  group_execute: boolean;
  /** 读权限（其他） */
  other_read: boolean;
  /** 写权限（其他） */
  other_write: boolean;
  /** 执行权限（其他） */
  other_execute: boolean;
}

/**
 * 格式化文件大小为人类可读格式
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 格式化 Unix 时间戳
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * 格式化权限模式为 rwx 格式
 */
export function formatPermissions(mode: number): string {
  const toStr = (r: boolean, w: boolean, x: boolean) => {
    return (r ? 'r' : '-') + (w ? 'w' : '-') + (x ? 'x' : '-');
  };

  const user = toStr(
    (mode & 0o400) !== 0,
    (mode & 0o200) !== 0,
    (mode & 0o100) !== 0
  );
  const group = toStr(
    (mode & 0o040) !== 0,
    (mode & 0o020) !== 0,
    (mode & 0o010) !== 0
  );
  const other = toStr(
    (mode & 0o004) !== 0,
    (mode & 0o002) !== 0,
    (mode & 0o001) !== 0
  );

  return user + group + other;
}

/**
 * 解析 rwx 格式权限为数字
 */
export function parsePermissions(permissions: string): number {
  let mode = 0;

  if (permissions[0] === 'r') mode |= 0o400;
  if (permissions[1] === 'w') mode |= 0o200;
  if (permissions[2] === 'x') mode |= 0o100;
  if (permissions[3] === 'r') mode |= 0o040;
  if (permissions[4] === 'w') mode |= 0o020;
  if (permissions[5] === 'x') mode |= 0o010;
  if (permissions[6] === 'r') mode |= 0o004;
  if (permissions[7] === 'w') mode |= 0o002;
  if (permissions[8] === 'x') mode |= 0o001;

  return mode;
}

/**
 * 获取文件图标
 */
export function getFileIcon(info: SftpFileInfo): string {
  if (info.isDir) {
    return '📁';
  }
  if (info.isSymlink) {
    return '🔗';
  }

  // 根据扩展名判断
  const ext = info.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'txt':
    case 'md':
    case 'json':
    case 'xml':
    case 'yaml':
    case 'yml':
      return '📄';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return '🖼️';
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
      return '🎬';
    case 'mp3':
    case 'wav':
    case 'flac':
      return '🎵';
    case 'zip':
    case 'tar':
    case 'gz':
    case 'rar':
    case '7z':
      return '📦';
    case 'pdf':
      return '📕';
    default:
      return '📄';
  }
}
