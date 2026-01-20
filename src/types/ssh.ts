export interface SessionConfig {
  id?: string;
  name: string;
  host: string;
  port: number;
  username: string;
  auth_method: 'password' | 'publicKey';
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
  terminal_type?: string;
  columns?: number;
  rows?: number;
  /** 是否需要持久化保存到存储 */
  persist?: boolean;
  /** 是否启用严格的主机密钥验证（默认true） */
  strict_host_key_checking?: boolean;
  /** 会话分组（默认为"默认分组"） */
  group?: string;
}

export type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SessionInfo extends SessionConfig {
  id: string;
  status: SessionStatus;
  connectedAt?: string;
  error?: string;
}

export interface AuthMethod {
  type: 'password' | 'publicKey';
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
}

export interface CreateSessionOptions {
  name: string;
  host: string;
  port: number;
  username: string;
  auth_method: AuthMethod;
  terminal_type?: string;
  columns?: number;
  rows?: number;
  persist?: boolean;
  strict_host_key_checking?: boolean;
}
