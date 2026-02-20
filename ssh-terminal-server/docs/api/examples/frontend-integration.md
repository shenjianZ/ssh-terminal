# 前端集成示例

本文档提供完整的前端集成代码示例，包括 JavaScript/TypeScript、React 和 Vue。

## 目录

- [TypeScript 基础示例](#typescript-基础示例)
- [React 集成示例](#react-集成示例)
- [Vue 集成示例](#vue-集成示例)
- [Token 存储建议](#token-存储建议)
- [错误处理](#错误处理)

---

## TypeScript 基础示例

### 认证客户端类

以下是一个完整的 TypeScript 认证客户端实现，包含注册、登录、Token 刷新等功能：

```typescript
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface RegisterData {
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterResponse {
  email: string;
  created_at: string;
  access_token: string;
  refresh_token: string;
}

interface LoginResponse {
  id: string;
  email: string;
  created_at: string;
  access_token: string;
  refresh_token: string;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

class AuthClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
    // 从 localStorage 加载 Token
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  /**
   * 用户注册
   */
  async register(email: string, password: string): Promise<RegisterResponse> {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result: ApiResponse<RegisterResponse> = await response.json();

    if (result.code === 200) {
      this.saveTokens(result.data.access_token, result.data.refresh_token);
      return result.data;
    }

    throw new Error(result.message);
  }

  /**
   * 用户登录
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result: ApiResponse<LoginResponse> = await response.json();

    if (result.code === 200) {
      this.saveTokens(result.data.access_token, result.data.refresh_token);
      return result.data;
    }

    throw new Error(result.message);
  }

  /**
   * 刷新 Token
   */
  async refreshTokens(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });

    const result: ApiResponse<RefreshResponse> = await response.json();

    if (result.code === 200) {
      this.saveTokens(result.data.access_token, result.data.refresh_token);
    } else {
      this.clearTokens();
      throw new Error(result.message);
    }
  }

  /**
   * 发起需要认证的请求
   */
  async authenticatedFetch(url: string, options?: RequestInit): Promise<Response> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    let response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    // Token 过期，尝试刷新
    if (response.status === 401) {
      try {
        await this.refreshTokens();
        // 重试原请求
        response = await fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });
      } catch (error) {
        // 刷新失败，清除 Token 并抛出错误
        this.clearTokens();
        throw error;
      }
    }

    return response;
  }

  /**
   * 保存 Token 到 localStorage
   */
  private saveTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * 清除 Token
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * 登出
   */
  logout(): void {
    this.clearTokens();
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}

// 使用示例
const authClient = new AuthClient();

// 注册
try {
  const result = await authClient.register('user@example.com', 'password123');
  console.log('注册成功:', result);
} catch (error) {
  console.error('注册失败:', error);
}

// 登录
try {
  const result = await authClient.login('user@example.com', 'password123');
  console.log('登录成功:', result);
} catch (error) {
  console.error('登录失败:', error);
}

// 访问受保护接口
try {
  const response = await authClient.authenticatedFetch(
    'http://localhost:3000/auth/delete',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: '1234567890', password: 'password123' }),
    }
  );
  const data = await response.json();
  console.log('请求成功:', data);
} catch (error) {
  console.error('请求失败:', error);
}

// 登出
authClient.logout();
```

---

## React 集成示例

### AuthContext Provider

```typescript
// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 加载 Token
    const storedAccessToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken && storedUser) {
      setAccessToken(storedAccessToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.code === 200) {
      const userData: User = {
        id: result.data.id,
        email: result.data.email,
        created_at: result.data.created_at,
      };

      setUser(userData);
      setAccessToken(result.data.access_token);

      localStorage.setItem('access_token', result.data.access_token);
      localStorage.setItem('refresh_token', result.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      throw new Error(result.message);
    }
  };

  const register = async (email: string, password: string) => {
    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.code === 200) {
      const userData: User = {
        id: result.data.id || '',
        email: result.data.email,
        created_at: result.data.created_at,
      };

      setUser(userData);
      setAccessToken(result.data.access_token);

      localStorage.setItem('access_token', result.data.access_token);
      localStorage.setItem('refresh_token', result.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      throw new Error(result.message);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### API Hook（带 Token 刷新）

```typescript
// useApi.ts
import { useCallback } from 'react';
import { useAuth } from './AuthContext';

export function useApi() {
  const { accessToken, setAccessToken, logout } = useAuth();

  const fetchWithAuth = useCallback(
    async (url: string, options?: RequestInit): Promise<Response> => {
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      let response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      // Token 过期，尝试刷新
      if (response.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
          const refreshResponse = await fetch('http://localhost:3000/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          const refreshResult = await refreshResponse.json();

          if (refreshResult.code === 200) {
            setAccessToken(refreshResult.data.access_token);
            localStorage.setItem('access_token', refreshResult.data.access_token);
            localStorage.setItem('refresh_token', refreshResult.data.refresh_token);

            // 重试原请求
            response = await fetch(url, {
              ...options,
              headers: {
                ...options?.headers,
                'Authorization': `Bearer ${refreshResult.data.access_token}`,
              },
            });
          } else {
            // 刷新失败，登出
            logout();
            throw new Error('Session expired');
          }
        } else {
          logout();
          throw new Error('Session expired');
        }
      }

      return response;
    },
    [accessToken, setAccessToken, logout]
  );

  return { fetchWithAuth };
}
```

### 登录组件示例

```typescript
// Login.tsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // 登录成功，路由跳转
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>登录</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
```

---

## Vue 集成示例

### Auth Composable

```typescript
// composables/useAuth.ts
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface User {
  id: string;
  email: string;
  created_at: string;
}

export function useAuth() {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const router = useRouter();

  const isAuthenticated = computed(() => !!accessToken.value);

  // 初始化：从 localStorage 加载
  const init = () => {
    const storedAccessToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken && storedUser) {
      accessToken.value = storedAccessToken;
      user.value = JSON.parse(storedUser);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.code === 200) {
      const userData: User = {
        id: result.data.id,
        email: result.data.email,
        created_at: result.data.created_at,
      };

      user.value = userData;
      accessToken.value = result.data.access_token;

      localStorage.setItem('access_token', result.data.access_token);
      localStorage.setItem('refresh_token', result.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      throw new Error(result.message);
    }
  };

  const register = async (email: string, password: string) => {
    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.code === 200) {
      const userData: User = {
        id: result.data.id || '',
        email: result.data.email,
        created_at: result.data.created_at,
      };

      user.value = userData;
      accessToken.value = result.data.access_token;

      localStorage.setItem('access_token', result.data.access_token);
      localStorage.setItem('refresh_token', result.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      throw new Error(result.message);
    }
  };

  const logout = () => {
    user.value = null;
    accessToken.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return {
    user,
    accessToken,
    isAuthenticated,
    login,
    register,
    logout,
    init,
  };
}
```

### Axios 拦截器示例

```typescript
// api/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// 请求拦截器：添加 Authorization header
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 响应拦截器：处理 401 错误并刷新 Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', {
            refresh_token: refreshToken,
          });

          if (response.data.code === 200) {
            const { access_token, refresh_token } = response.data.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            // 重试原请求
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          // 刷新失败，清除 Token
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // 没有 Refresh Token，跳转到登录页
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## Token 存储建议

### localStorage vs sessionStorage vs Cookie

| 存储方式 | 优点 | 缺点 | 推荐场景 |
|---------|------|------|----------|
| localStorage | 数据持久化，刷新页面不丢失 | 容易受到 XSS 攻击 | Access Token、Refresh Token |
| sessionStorage | 关闭标签页自动清除 | 刷新页面会丢失 | 不推荐 |
| Cookie | 可设置 HttpOnly 防止 XSS | 容易受到 CSRF 攻击 | 服务器渲染场景 |

### 推荐方案

**前端应用（SPA）**：
- Access Token：localStorage
- Refresh Token：localStorage
- 添加适当的 XSS 防护（内容安全策略、输入验证）

**安全性要求高的场景**：
- Access Token：内存（React Context/Vue Reactive）
- Refresh Token：HttpOnly Cookie（需要后端支持）

---

## 错误处理

### 通用错误处理

```typescript
async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    if (onError) {
      onError(error as Error);
    } else {
      console.error('API 调用失败:', error);
    }
    return null;
  }
}

// 使用示例
const result = await handleApiCall(
  () => authClient.login('user@example.com', 'password123'),
  (error) => {
    alert(`登录失败: ${error.message}`);
  }
);
```

### 网络错误重试

```typescript
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}
```

---

## 相关文档

- [公开接口文档](../endpoints/public.md) - API 接口详细说明
- [认证机制详解](../authentication.md) - JWT 认证流程
- [受保护接口文档](../endpoints/protected.md) - 需要认证的接口

---

**提示**：以上示例代码仅供参考，实际使用时请根据项目需求调整。
