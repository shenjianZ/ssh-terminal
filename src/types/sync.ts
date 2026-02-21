// ==================== 客户端类型（用于 Tauri 命令）====================

// 同步类型定义
export interface SyncStatus {
  lastSyncAt?: number;
  pendingCount: number;
  conflictCount: number;
  lastError?: string;
}

export interface SyncReport {
  success: boolean;
  lastSyncAt: number;
  pushedSessions: number;
  pulledSessions: number;
  conflictCount: number;
  error?: string;
  updatedSessionIds?: string[];
  message?: string;
}

// 冲突信息（客户端格式）
export interface ConflictInfo {
  id: string;
  entityType: string;
  localVersion: number;
  serverVersion: number;
  message: string;
}

export type ConflictStrategy = 'KeepBoth' | 'KeepServer' | 'KeepLocal';

// ==================== 服务器返回类型 ====================

// 服务器 Pull 响应
export interface ServerPullResponse {
  serverTime: number;
  lastSyncAt: number;
  userProfile?: UserProfile;
  sshSessions: SshSession[];
  deletedSessionIds: string[];
  conflicts: ServerConflictInfo[];
}

// 服务器 Push 响应
export interface ServerPushResponse {
  updatedSessionIds: string[];
  deletedSessionIds: string[];
  serverVersions: Record<string, number>;
  conflicts: ServerConflictInfo[];
  lastSyncAt: number;
}

// 服务器冲突信息
export interface ServerConflictInfo {
  id: string;
  entityType: string;
  clientVer: number;
  serverVer: number;
  clientData?: unknown;
  serverData?: unknown;
  message: string;
}

// 服务器解决冲突响应
export interface ServerResolveConflictResponse {
  conflictId: string;
  resolved: boolean;
  newId?: string;
  message: string;
}

// ==================== 相关类型定义 ====================

export interface UserProfile {
  id: number;
  userId: string;
  username?: string;
  phone?: string;
  qq?: string;
  wechat?: string;
  avatarData?: string;
  avatarMimeType?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  serverVer: number;
}

export interface SshSession {
  id: string;
  userId: string;
  name: string;
  host: string;
  port: number;
  username: string;
  groupName: string;
  terminalType?: string;
  columns?: number;
  rows?: number;
  authMethodEncrypted: string;
  authNonce: string;
  authKeySalt?: string;
  serverVer: number;
  clientVer: number;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}


