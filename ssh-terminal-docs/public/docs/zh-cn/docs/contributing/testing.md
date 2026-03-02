# 测试指南

SSH Terminal 项目采用全面的测试策略，包括单元测试、集成测试和端到端测试。本文档详细介绍如何编写和运行测试。

## 目录

- [测试概述](#测试概述)
- [前端测试](#前端测试)
- [后端测试](#后端测试)
- [集成测试](#集成测试)
- [测试覆盖率](#测试覆盖率)
- [CI/CD 测试](#cicd-测试)
- [测试最佳实践](#测试最佳实践)

---

## 测试概述

### 测试金字塔

```
        E2E Tests
       /          \
    Integration Tests
   /                \
  Unit Tests
```

- **单元测试**：测试单个函数、组件或模块
- **集成测试**：测试多个模块之间的交互
- **E2E 测试**：测试完整的用户流程

### 测试工具

| 测试类型 | 工具 | 说明 |
|---------|------|------|
| 前端单元测试 | Vitest | 快速的单元测试框架 |
| 前端组件测试 | React Testing Library | React 组件测试 |
| 后端单元测试 | Rust 内置 | Rust 原生测试框架 |
| 集成测试 | Rust 内置 | Rust 原生测试框架 |
| E2E 测试 | Playwright | 浏览器自动化测试 |

---

## 前端测试

### 环境配置

安装测试依赖：

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

配置 `vite.config.ts`：

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### 单元测试

#### 测试工具函数

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, validateEmail } from './utils';

describe('formatDate', () => {
  it('应该格式化日期为 YYYY-MM-DD', () => {
    const date = new Date('2024-01-01');
    expect(formatDate(date)).toBe('2024-01-01');
  });

  it('应该处理无效日期', () => {
    expect(formatDate(null)).toBe('N/A');
  });
});

describe('validateEmail', () => {
  it('应该验证有效的邮箱地址', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('应该拒绝无效的邮箱地址', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

#### 测试 Store

```typescript
// src/store/sessionStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ sessions: [] });
  });

  it('应该添加会话', () => {
    const { addSession, sessions } = useSessionStore.getState();
    addSession({ id: '1', name: 'Test', host: 'localhost' });

    expect(sessions).toHaveLength(1);
    expect(sessions[0].name).toBe('Test');
  });

  it('应该删除会话', () => {
    const { addSession, removeSession, sessions } = useSessionStore.getState();
    addSession({ id: '1', name: 'Test', host: 'localhost' });
    removeSession('1');

    expect(sessions).toHaveLength(0);
  });
});
```

### 组件测试

#### 测试 React 组件

```typescript
// src/components/SessionItem.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionItem } from './SessionItem';

describe('SessionItem', () => {
  const mockSession = {
    id: '1',
    name: 'Test Server',
    host: 'localhost',
    port: 22,
  };

  it('应该渲染会话名称', () => {
    render(<SessionItem session={mockSession} />);
    expect(screen.getByText('Test Server')).toBeInTheDocument();
  });

  it('应该调用 onConnect 当点击连接按钮', () => {
    const onConnect = vi.fn();
    render(<SessionItem session={mockSession} onConnect={onConnect} />);

    const connectButton = screen.getByText('连接');
    fireEvent.click(connectButton);

    expect(onConnect).toHaveBeenCalledWith('1');
  });
});
```

#### 测试异步组件

```typescript
// src/components/SessionList.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SessionList } from './SessionList';

// Mock Tauri API
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

describe('SessionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该加载并显示会话列表', async () => {
    const mockSessions = [
      { id: '1', name: 'Server 1', host: 'host1' },
      { id: '2', name: 'Server 2', host: 'host2' },
    ];

    vi.mocked(invoke).mockResolvedValue(mockSessions);

    render(<SessionList />);

    await waitFor(() => {
      expect(screen.getByText('Server 1')).toBeInTheDocument();
      expect(screen.getByText('Server 2')).toBeInTheDocument();
    });
  });
});
```

### 运行前端测试

```bash
# 运行所有测试
pnpm test

# 运行特定文件
pnpm test src/lib/utils.test.ts

# 监视模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage

# UI 模式
pnpm test:ui
```

---

## 后端测试

### 单元测试

#### 测试 Rust 函数

```rust
// src-tauri/src/ssh/manager_test.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_session() {
        let config = SessionConfig {
            name: "Test".to_string(),
            host: "localhost".to_string(),
            port: 22,
        };

        let session = Session::new(config);
        assert_eq!(session.name(), "Test");
        assert_eq!(session.host(), "localhost");
    }

    #[test]
    fn test_invalid_port() {
        let result = SessionConfig::new("Test", "localhost", 99999);
        assert!(result.is_err());
    }
}
```

#### 测试异步函数

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_async_connect() {
        let manager = SessionManager::new();
        let result = manager.connect("session-1").await;

        assert!(result.is_ok());
    }
}
```

### 集成测试

#### 测试 Tauri 命令

```rust
// src-tauri/tests/integration_test.rs
#[cfg(test)]
mod tests {
    use ssh_terminal::commands::ssh_connect;

    #[test]
    fn test_ssh_connect_command() {
        let result = ssh_connect("session-1".to_string());
        assert!(result.is_ok());
    }
}
```

#### 测试数据库操作

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_save_session_to_db() {
        let db = Database::new(":memory:").await.unwrap();
        let session = Session::new("Test", "localhost", 22);

        let result = db.save_session(&session).await;
        assert!(result.is_ok());

        let loaded = db.get_session(session.id()).await.unwrap();
        assert_eq!(loaded.name(), "Test");
    }
}
```

### 运行后端测试

```bash
# 运行所有测试
cd src-tauri
cargo test

# 运行特定测试
cargo test test_create_session

# 运行测试并显示输出
cargo test -- --nocapture

# 运行测试（并发）
cargo test -- --test-threads=4

# 运行特定包的测试
cargo test --package ssh-terminal

# 运行文档测试
cargo test --doc
```

---

## 集成测试

### 前后端集成测试

```typescript
// tests/integration/ssh-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

describe('SSH 连接流程', () => {
  let sessionId: string;

  beforeAll(async () => {
    // 创建测试会话
    const session = await invoke('create_session', {
      name: 'Test Server',
      host: 'localhost',
      port: 22,
    });
    sessionId = session.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await invoke('delete_session', { id: sessionId });
  });

  it('应该成功连接到 SSH 服务器', async () => {
    const connectionId = await invoke('ssh_connect', { sessionId });
    expect(connectionId).toBeDefined();
  });

  it('应该发送命令并接收输出', async () => {
    const connectionId = await invoke('ssh_connect', { sessionId });

    await invoke('ssh_write', {
      connectionId,
      data: 'echo "Hello, World!"\n',
    });

    // 等待输出
    await new Promise(resolve => setTimeout(resolve, 1000));

    const output = await invoke('ssh_read', { connectionId });
    expect(output).toContain('Hello, World!');
  });

  it('应该断开连接', async () => {
    const connectionId = await invoke('ssh_connect', { sessionId });
    await invoke('ssh_disconnect', { connectionId });

    // 验证连接已关闭
    const connections = await invoke('get_connections');
    expect(connections).not.toContain(connectionId);
  });
});
```

---

## 测试覆盖率

### 前端覆盖率

```bash
# 生成覆盖率报告
pnpm test:coverage

# 查看报告
open coverage/index.html
```

**覆盖率目标**：

- 语句覆盖率：> 80%
- 分支覆盖率：> 75%
- 函数覆盖率：> 80%
- 行覆盖率：> 80%

### 后端覆盖率

```bash
# 生成覆盖率报告
cd src-tauri
cargo tarpaulin --out Html

# 查看报告
open tarpaulin-report.html
```

**覆盖率目标**：

- 语句覆盖率：> 85%
- 分支覆盖率：> 80%
- 函数覆盖率：> 85%

---

## CI/CD 测试

### GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies
        run: pnpm install

      - name: Run frontend tests
        run: pnpm test

      - name: Run backend tests
        run: cd src-tauri && cargo test

      - name: Generate coverage
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## 测试最佳实践

### 1. 测试命名

```typescript
// ✅ 正确：清晰的测试名称
it('应该返回格式化后的日期', () => {});

// ❌ 错误：模糊的测试名称
it('test date', () => {});
```

### 2. AAA 模式

```typescript
// ✅ 正确：Arrange-Act-Assert
it('应该计算两个数字的和', () => {
  // Arrange（准备）
  const a = 1;
  const b = 2;

  // Act（执行）
  const result = add(a, b);

  // Assert（断言）
  expect(result).toBe(3);
});

// ❌ 错误：混合在一起
it('test', () => {
  expect(add(1, 2)).toBe(3);
});
```

### 3. 避免测试实现细节

```typescript
// ✅ 正确：测试行为
it('应该显示加载状态', () => {
  render(<Component />);
  expect(screen.getByText('加载中...')).toBeInTheDocument();
});

// ❌ 错误：测试实现
it('应该设置 loading 为 true', () => {
  render(<Component />);
  expect(component.state.loading).toBe(true);  // ❌ 测试内部状态
});
```

### 4. 使用有意义的断言

```typescript
// ✅ 正确：具体的断言
expect(result).toBe(42);
expect(error.message).toContain('invalid');

// ❌ 错误：模糊的断言
expect(result).toBeTruthy();
expect(error).toBeDefined();
```

### 5. Mock 外部依赖

```typescript
// ✅ 正确：Mock 外部依赖
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

// ❌ 错误：调用真实的 API
const result = await invoke('ssh_connect', { sessionId });  // ❌ 不要调用真实 API
```

### 6. 测试边界情况

```typescript
describe('divide', () => {
  it('应该处理正常情况', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('应该处理除以零', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });

  it('应该处理负数', () => {
    expect(divide(-10, 2)).toBe(-5);
  });
});
```

---

## 相关资源

- [代码规范](./code-style.md) - 代码质量规范
- [提交流程](./pr-flow.md) - Pull Request 流程
- [环境搭建](./setup.md) - 开发环境配置
- [Vitest 文档](https://vitest.dev/) - Vitest 测试框架
- [Rust 测试指南](https://doc.rust-lang.org/book/ch11-00-testing.html) - Rust 测试