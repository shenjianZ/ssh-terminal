# Testing Guide

The SSH Terminal project adopts a comprehensive testing strategy, including unit tests, integration tests, and end-to-end tests. This document details how to write and run tests.

## Table of Contents

- [Testing Overview](#testing-overview)
- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [Integration Testing](#integration-testing)
- [Test Coverage](#test-coverage)
- [CI/CD Testing](#cicd-testing)
- [Testing Best Practices](#testing-best-practices)

---

## Testing Overview

### Testing Pyramid

```
        E2E Tests
       /          \
    Integration Tests
   /                \
  Unit Tests
```

- **Unit Tests**: Test individual functions, components, or modules
- **Integration Tests**: Test interactions between multiple modules
- **E2E Tests**: Test complete user flows

### Testing Tools

| Test Type | Tool | Description |
|-----------|------|-------------|
| Frontend Unit Tests | Vitest | Fast unit testing framework |
| Frontend Component Tests | React Testing Library | React component testing |
| Backend Unit Tests | Rust Built-in | Rust native testing framework |
| Integration Tests | Rust Built-in | Rust native testing framework |
| E2E Tests | Playwright | Browser automation testing |

---

## Frontend Testing

### Environment Configuration

Install testing dependencies:

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Configure `vite.config.ts`:

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

### Unit Tests

#### Test Utility Functions

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, validateEmail } from './utils';

describe('formatDate', () => {
  it('should format date to YYYY-MM-DD', () => {
    const date = new Date('2024-01-01');
    expect(formatDate(date)).toBe('2024-01-01');
  });

  it('should handle invalid date', () => {
    expect(formatDate(null)).toBe('N/A');
  });
});

describe('validateEmail', () => {
  it('should validate valid email address', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should reject invalid email address', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

#### Test Store

```typescript
// src/store/sessionStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ sessions: [] });
  });

  it('should add session', () => {
    const { addSession, sessions } = useSessionStore.getState();
    addSession({ id: '1', name: 'Test', host: 'localhost' });

    expect(sessions).toHaveLength(1);
    expect(sessions[0].name).toBe('Test');
  });

  it('should delete session', () => {
    const { addSession, removeSession, sessions } = useSessionStore.getState();
    addSession({ id: '1', name: 'Test', host: 'localhost' });
    removeSession('1');

    expect(sessions).toHaveLength(0);
  });
});
```

### Component Tests

#### Test React Components

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

  it('should render session name', () => {
    render(<SessionItem session={mockSession} />);
    expect(screen.getByText('Test Server')).toBeInTheDocument();
  });

  it('should call onConnect when connect button is clicked', () => {
    const onConnect = vi.fn();
    render(<SessionItem session={mockSession} onConnect={onConnect} />);

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    expect(onConnect).toHaveBeenCalledWith('1');
  });
});
```

#### Test Async Components

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

  it('should load and display session list', async () => {
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

### Run Frontend Tests

```bash
# Run all tests
pnpm test

# Run specific file
pnpm test src/lib/utils.test.ts

# Watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# UI mode
pnpm test:ui
```

---

## Backend Testing

### Unit Tests

#### Test Rust Functions

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

#### Test Async Functions

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

### Integration Tests

#### Test Tauri Commands

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

#### Test Database Operations

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

### Run Backend Tests

```bash
# Run all tests
cd src-tauri
cargo test

# Run specific test
cargo test test_create_session

# Run tests and show output
cargo test -- --nocapture

# Run tests (concurrent)
cargo test -- --test-threads=4

# Run tests for specific package
cargo test --package ssh-terminal

# Run doc tests
cargo test --doc
```

---

## Integration Testing

### Frontend-Backend Integration Tests

```typescript
// tests/integration/ssh-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

describe('SSH Connection Flow', () => {
  let sessionId: string;

  beforeAll(async () => {
    // Create test session
    const session = await invoke('create_session', {
      name: 'Test Server',
      host: 'localhost',
      port: 22,
    });
    sessionId = session.id;
  });

  afterAll(async () => {
    // Clean up test data
    await invoke('delete_session', { id: sessionId });
  });

  it('should successfully connect to SSH server', async () => {
    const connectionId = await invoke('ssh_connect', { sessionId });
    expect(connectionId).toBeDefined();
  });

  it('should send command and receive output', async () => {
    const connectionId = await invoke('ssh_connect', { sessionId });

    await invoke('ssh_write', {
      connectionId,
      data: 'echo "Hello, World!"\n',
    });

    // Wait for output
    await new Promise(resolve => setTimeout(resolve, 1000));

    const output = await invoke('ssh_read', { connectionId });
    expect(output).toContain('Hello, World!');
  });

  it('should disconnect', async () => {
    const connectionId = await invoke('ssh_connect', { sessionId });
    await invoke('ssh_disconnect', { connectionId });

    // Verify connection is closed
    const connections = await invoke('get_connections');
    expect(connections).not.toContain(connectionId);
  });
});
```

---

## Test Coverage

### Frontend Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View report
open coverage/index.html
```

**Coverage Goals**:

- Statement coverage: > 80%
- Branch coverage: > 75%
- Function coverage: > 80%
- Line coverage: > 80%

### Backend Coverage

```bash
# Generate coverage report
cd src-tauri
cargo tarpaulin --out Html

# View report
open tarpaulin-report.html
```

**Coverage Goals**:

- Statement coverage: > 85%
- Branch coverage: > 80%
- Function coverage: > 85%

---

## CI/CD Testing

### GitHub Actions Configuration

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

## Testing Best Practices

### 1. Test Naming

```typescript
// ✅ Correct: Clear test names
it('should return formatted date', () => {});

// ❌ Wrong: Vague test names
it('test date', () => {});
```

### 2. AAA Pattern

```typescript
// ✅ Correct: Arrange-Act-Assert
it('should calculate sum of two numbers', () => {
  // Arrange
  const a = 1;
  const b = 2;

  // Act
  const result = add(a, b);

  // Assert
  expect(result).toBe(3);
});

// ❌ Wrong: Mixed together
it('test', () => {
  expect(add(1, 2)).toBe(3);
});
```

### 3. Avoid Testing Implementation Details

```typescript
// ✅ Correct: Test behavior
it('should display loading state', () => {
  render(<Component />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

// ❌ Wrong: Test implementation
it('should set loading to true', () => {
  render(<Component />);
  expect(component.state.loading).toBe(true);  // ❌ Testing internal state
});
```

### 4. Use Meaningful Assertions

```typescript
// ✅ Correct: Specific assertions
expect(result).toBe(42);
expect(error.message).toContain('invalid');

// ❌ Wrong: Vague assertions
expect(result).toBeTruthy();
expect(error).toBeDefined();
```

### 5. Mock External Dependencies

```typescript
// ✅ Correct: Mock external dependencies
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

// ❌ Wrong: Call real API
const result = await invoke('ssh_connect', { sessionId });  // ❌ Don't call real API
```

### 6. Test Edge Cases

```typescript
describe('divide', () => {
  it('should handle normal case', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should handle division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });

  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });
});
```

---

## Related Resources

- [Vitest Documentation](https://vitest.dev/) - Vitest testing framework
- [Rust Testing Guide](https://doc.rust-lang.org/book/ch11-00-testing.html) - Rust testing