export type AuthMethod =
  | { password: { password: string } }
  | { publicKey: { privateKeyPath: string; passphrase?: string } };

export interface SessionConfig {
  id?: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: AuthMethod;
  terminalType?: string;
  columns?: number;
  rows?: number;
  /** 是否启用严格的主机密钥验证（默认true） */
  strictHostKeyChecking?: boolean;
  /** 会话分组（默认为"默认分组"） */
  group?: string;
  /** 心跳间隔（秒），0表示禁用（默认30秒） */
  keepAliveInterval?: number;
}

export type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SessionInfo {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  status: SessionStatus;
  connectedAt?: string;
  error?: string;
  group: string;
  /** 如果是连接实例，这个字段指向所属的session配置ID；如果是配置本身，这个字段为undefined */
  connectionSessionId?: string;
  /** 如果是连接实例且已连接，这个字段存储实际的connectionId */
  connectionId?: string;
}
