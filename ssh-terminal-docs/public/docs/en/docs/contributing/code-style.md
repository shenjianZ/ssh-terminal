# Code Style

The SSH Terminal project follows the following code standards to ensure code quality and maintainability.

---

## Tech Stack

### Frontend
- **Framework**: React 19
- **Language**: TypeScript 5.8+
- **Styling**: Tailwind CSS 4.0
- **State Management**: Zustand
- **Build Tool**: Vite 7.0

### Backend
- **Language**: Rust 2021
- **Framework**: Tauri 2.4
- **Async Runtime**: tokio 1.35
- **SSH Implementation**: russh 0.55

---

## Frontend Code Standards

### Naming Conventions
- **Components**: PascalCase (e.g., `SessionManager.tsx`)
- **Files**: PascalCase (components), camelCase (utilities, types, constants)
- **Variables/Functions**: camelCase
- **Classes/Interfaces**: PascalCase
- **Constants**: SCREAMING_SNAKE_CASE

```typescript
// ✅ Correct
const userName = "admin";
interface UserData { id: string; name: string; }
const MAX_CONNECTIONS = 100;
export const SessionManager: React.FC = () => <div>...</div>;
```

### Import Order
1. React related
2. Third-party libraries
3. Local components
4. Local utilities
5. Type definitions

### Type Definitions
- **Object types**: Use `interface`
- **Union types**: Use `type`
- **Avoid using `any`**

```typescript
// ✅ Correct
interface SessionConfig { name: string; host: string; }
type AuthMethod = Password | PublicKey;
```

### Component Standards
- Prefer **function components**
- **Destructure Props**
- Custom Hooks start with `use`

### State Management
- Use **Zustand** for global state management
- Prefer Zustand over Context API

### Error Handling
- All async operations use `try-catch` to catch errors
- Avoid directly exposing error details to users

### Style Standards
- Use **Tailwind CSS** class names
- Avoid inline styles and magic numbers

```typescript
// ✅ Correct
<div className="flex items-center justify-between p-4 bg-white rounded-lg">
```

---

## Backend Code Standards

### Naming Conventions (Follow Rust Standards)
- **Types/Structs/Enums**: PascalCase
- **Functions/Variables/Modules**: snake_case
- **Constants**: SCREAMING_SNAKE_CASE

```rust
// ✅ Correct
pub struct SessionManager { sessions: Vec<Session> }
impl SessionManager {
    pub fn new() -> Self { Self { sessions: Vec::new() } }
    pub fn add_session(&mut self, session: Session) { self.sessions.push(session); }
}
const MAX_SESSIONS: usize = 100;
```

### Error Handling
- Use `Result<T, E>` type
- Use `?` operator to propagate errors
- Avoid using `unwrap()` or `expect()`
- Define custom error types

```rust
// ✅ Correct
pub fn connect_ssh(config: &SessionConfig) -> Result<Connection, SshError> {
    let stream = TcpStream::connect(&config.address)?;
    Ok(Connection { stream })
}

#[derive(Debug, thiserror::Error)]
pub enum SshError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}
```

### Async Programming
- Use `async/await`
- Use tokio runtime
- Avoid blocking calls in async environments

```rust
// ✅ Correct
pub async fn fetch_sessions() -> Result<Vec<Session>, Error> {
    db::get_sessions().await
}
```

### Tauri Commands
- Use `#[tauri::command]` macro
- Register all commands in `lib.rs`

```rust
// ✅ Correct
#[tauri::command]
pub async fn ssh_connect(session_id: String) -> Result<String, String> {
    manager.connect(&session_id).await.map_err(|e| e.to_string())
}

// Register in lib.rs
.invoke_handler(tauri::generate_handler![
    ssh_connect,
    ssh_disconnect,
])
```

### Module Organization
```
src/
├── main.rs
├── lib.rs
├── commands/       # Tauri commands
├── ssh/            # SSH module
└── services/       # Service layer
```

---

## Git Commit Standards

### Commit Message Format
```
<type>(<scope>): <subject>
```

### Type Types
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation update |
| `style` | Code formatting (no functional changes) |
| `refactor` | Refactoring |
| `test` | Test related |
| `chore` | Build/toolchain related |

### Examples
```
feat(ssh): add public key authentication support

Added SSH public key authentication feature, supporting RSA, ECDSA and Ed25519 keys.

Closes #123
```

```
fix(ai): resolve streaming response buffering issue

Fixed buffering issue during AI streaming responses.

Fixes #456
```

---

## Code Review Checklist

### Frontend
- [ ] Code passes ESLint check
- [ ] Code passes Prettier formatting
- [ ] Avoid using `any` type
- [ ] All errors are properly handled
- [ ] No use of `@ts-ignore`

### Backend
- [ ] Code passes `cargo check`
- [ ] Code passes `cargo clippy`
- [ ] Code passes `cargo fmt`
- [ ] All errors use `Result` type
- [ ] No use of `unwrap()` or `expect()`

### General
- [ ] Git commit message follows standards
- [ ] No sensitive information included
- [ ] Code logic is clear and easy to understand
- [ ] No dead code or commented code