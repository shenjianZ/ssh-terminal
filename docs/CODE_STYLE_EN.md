# Code Style Guide

This document defines the code style and conventions for the SSH Terminal project to ensure code quality and consistency.

## Table of Contents

- [Frontend Conventions (React + TypeScript)](#frontend-conventionsreact--typescript)
- [Backend Conventions (Rust)](#backend-conventionsrust)
- [Git Commit Conventions](#git-commit-conventions)
- [Code Review Checklist](#code-review-checklist)

---

## Frontend Conventions (React + TypeScript)

### Naming Conventions

**Component Naming**:
- Use PascalCase
- Examples: `UserProfile.tsx`, `TerminalTab.tsx`

**File Naming**:
- Component files: PascalCase
- Utility files: camelCase
- Constant files: UPPER_SNAKE_CASE
- Examples:
  - `UserProfile.tsx` (component)
  - `formatDate.ts` (utility)
  - `API_CONSTANTS.ts` (constants)

**Variable Naming**:
- Use camelCase
- Booleans: Start with `is`, `has`, `should`
- Examples:
  ```typescript
  const userName = 'John';
  const isActive = true;
  const hasPermission = false;
  ```

**Function Naming**:
- Use camelCase
- Start with verb, describe function behavior
- Examples:
  ```typescript
  function getUserById(id: string) {}
  function handleSave() {}
  function shouldUpdate() {}
  ```

**Constant Naming**:
- Use UPPER_SNAKE_CASE
- Examples:
  ```typescript
  const MAX_RETRY_COUNT = 3;
  const API_BASE_URL = 'https://api.example.com';
  ```

### Type Definitions

**Use `interface` for Object Types**:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

interface UserResponse {
  user: User;
  token: string;
}
```

**Use `type` for Union Types**:
```typescript
type Theme = 'light' | 'dark';
type Status = 'pending' | 'success' | 'error';
type ID = string | number;
```

**Type Definition Location**:
- Component-related types: Place in component file
- Shared types: Place in `src/types/` directory
- API types: Place in `src/types/api.ts`

### Import Order

Import in the following order:

1. React related
2. Third-party libraries
3. Local components (using `@/` alias)
4. Local utility functions and types
5. Style files

**Example**:
```typescript
// 1. React related
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

// 3. Local components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 4. Local utility functions and types
import { formatDate } from '@/utils/date';
import type { User } from '@/types/user';

// 5. Style files
import './UserProfile.css';
```

### Component Structure

**Function Component Structure**:
```typescript
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/user';

interface UserProfileProps {
  user: User;
  onUpdate?: (user: User) => void;
}

export default function UserProfile({ user, onUpdate }: UserProfileProps) {
  // 1. Hooks
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);

  // 2. Effects
  useEffect(() => {
    setFormData(user);
  }, [user]);

  // 3. Event handlers
  const handleSave = () => {
    onUpdate?.(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  // 4. Render helper functions
  const renderEditForm = () => (
    <form onSubmit={handleSave}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Button type="submit">Save</Button>
      <Button type="button" onClick={handleCancel}>
        Cancel
      </Button>
    </form>
  );

  const renderViewMode = () => (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <Button onClick={() => setIsEditing(true)}>Edit</Button>
    </div>
  );

  // 5. Return JSX
  return (
    <div className="user-profile">
      {isEditing ? renderEditForm() : renderViewMode()}
    </div>
  );
}
```

### Using shadcn/ui Components

**Prefer shadcn/ui Components**:
```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Tabs } from '@/components/ui/tabs';
```

**Custom Styles**:
```typescript
<Button className="bg-blue-500 hover:bg-blue-600">
  Custom Button
</Button>
```

### State Management

**Use Zustand for Global State Management**:
```typescript
// src/store/userStore.ts
import { create } from 'zustand';

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

**Using Store in Components**:
```typescript
import { useUserStore } from '@/store/userStore';

function UserProfile() {
  const { user, setUser } = useUserStore();

  return <div>{user?.name}</div>;
}
```

**Follow Single Source of Truth Principle**:
- Avoid managing same state in multiple places
- Use Zustand Store as single source of truth
- Components only responsible for display and user interaction

### Hooks Usage

**Custom Hooks**:
```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

**Using Custom Hooks**:
```typescript
function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  return <div>Current theme: {theme}</div>;
}
```

### Error Handling

**Use try-catch for Async Errors**:
```typescript
async function handleSubmit() {
  try {
    const result = await invoke('save_user', { userData });
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
    // Show error notification
  }
}
```

**Error Boundaries**:
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

---

## Backend Conventions (Rust)

### Naming Conventions

**Types, Structs, Enums**: Use PascalCase
```rust
struct User {
    id: String,
    name: String,
}

enum Status {
    Active,
    Inactive,
}

type Result<T> = std::result::Result<T, Error>;
```

**Functions, Variables, Modules**: Use snake_case
```rust
fn get_user_by_id(id: &str) -> Result<User> {
    // ...
}

let user_name = "John";
```

**Constants**: Use SCREAMING_SNAKE_CASE
```rust
const MAX_RETRY_COUNT: u32 = 3;
const API_BASE_URL: &str = "https://api.example.com";
```

### Error Handling

**Use `Result<T, E>`**:
```rust
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err("Cannot divide by zero".to_string())
    } else {
        Ok(a / b)
    }
}
```

**Use `?` Operator for Error Propagation**:
```rust
fn process_data(data: &str) -> Result<ProcessedData, Error> {
    let parsed = parse_data(data)?;
    let validated = validate_data(parsed)?;
    Ok(validated)
}
```

**Custom Error Types**:
```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Parse error: {0}")]
    Parse(String),

    #[error("Network error: {0}")]
    Network(String),
}
```

### Async Programming

**Use `async/await`**:
```rust
async fn fetch_user(id: &str) -> Result<User, Error> {
    let response = reqwest::get(format!("{}/users/{}", API_URL, id)).await?;
    let user = response.json::<User>().await?;
    Ok(user)
}
```

**Use `tokio` Runtime**:
```rust
#[tokio::main]
async fn main() -> Result<(), Error> {
    let user = fetch_user("123").await?;
    println!("User: {:?}", user);
    Ok(())
}
```

### Tauri Commands

**Use `#[tauri::command]` Macro**:
```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

**Command Parameters and Return Values Must Implement Serialize/Deserialize**:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct UserRequest {
    pub name: String,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: String,
    pub name: String,
    pub email: String,
}

#[tauri::command]
fn create_user(request: UserRequest) -> Result<UserResponse, String> {
    // Create user logic
    Ok(UserResponse {
        id: generate_id(),
        name: request.name,
        email: request.email,
    })
}
```

**Register Commands in lib.rs**:
```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            create_user,
            // ... other commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Comments and Documentation

**Use `///` for Documentation Comments**:
```rust
/// Create a new user
///
/// # Arguments
///
/// * `request` - User creation request
///
/// # Returns
///
/// Returns created user information
///
/// # Errors
///
/// Returns error if user already exists
#[tauri::command]
fn create_user(request: UserRequest) -> Result<UserResponse, AppError> {
    // ...
}
```

**Use `//` for Inline Comments**:
```rust
// Check if user already exists
if user_exists(&request.email)? {
    return Err(AppError::UserAlreadyExists);
}

// Create new user
let user = User::new(request.name, request.email);
```

### Module Organization

**Module Structure**:
```
src-tauri/src/
├── commands/          # Tauri commands
│   ├── mod.rs
│   ├── user.rs
│   └── session.rs
├── models/            # Data models
│   ├── mod.rs
│   └── user.rs
├── services/          # Business logic
│   ├── mod.rs
│   └── auth.rs
├── storage/           # Storage layer
│   ├── mod.rs
│   └── database.rs
├── error.rs           # Error definitions
└── lib.rs             # Library entry
```

**Module Declarations**:
```rust
// lib.rs
mod commands;
mod models;
mod services;
mod storage;
mod error;
```

---

## Git Commit Conventions

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types (type)

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation update
- `style` - Code formatting (no functional changes)
- `refactor` - Refactoring
- `perf` - Performance optimization
- `test` - Testing related
- `chore` - Build/tools related

### Examples

**feat (New Feature)**:
```
feat(terminal): add support for multiple terminal tabs

Implement tab management for SSH sessions, allowing users to
switch between multiple active connections.

- Add TabBar component
- Implement tab switching logic
- Add keyboard shortcuts for tab navigation

Closes #123
```

**fix (Bug Fix)**:
```
fix(ssh): resolve connection timeout issue

Fix the issue where SSH connections would timeout after
30 seconds even with active data transfer.

The problem was caused by incorrect keepalive configuration.
Updated keepalive interval to 60 seconds.

Fixes #456
```

**docs (Documentation Update)**:
```
docs(readme): update installation instructions

Update the installation instructions to include the new
dependency requirements for Rust 1.70+.
```

**style (Code Formatting)**:
```
style(terminal): format code with prettier

Apply prettier formatting to all terminal-related files
to ensure consistent code style.
```

**refactor (Refactoring)**:
```
refactor(store): simplify state management

Refactor the session store to use a simpler state structure.
This improves performance and reduces complexity.

Changes:
- Migrate to Zustand v5
- Simplify state transitions
- Remove redundant selectors
```

### Commit Recommendations

**Use Clear Commit Messages**:
- Describe what you did, not how you did it
- Use present tense ("add" not "added")
- First letter lowercase
- Don't exceed 72 characters (subject)

**Provide Detailed Body**:
- Explain why you made this change
- List major changes
- Reference related issues

**Add Footer**:
- Closed issues: `Closes #123`, `Fixes #456`
- Breaking changes: `BREAKING CHANGE: ...`

---

## Code Review Checklist

### Frontend

**Code Quality**:
- [ ] Code follows TypeScript conventions
- [ ] No `any` types used
- [ ] Correct type definitions used
- [ ] Error handling complete
- [ ] No debug code (console.log)

**Code Style**:
- [ ] Naming follows conventions
- [ ] Import order correct
- [ ] Component structure clear
- [ ] Uses shadcn/ui components
- [ ] Styles use Tailwind CSS

**Functional Correctness**:
- [ ] Feature implementation complete
- [ ] Edge case handling
- [ ] User input validation
- [ ] Performance considerations (avoid unnecessary re-renders)

**Maintainability**:
- [ ] Code readability good
- [ ] Appropriate comments
- [ ] Modular design
- [ ] Reusability considered

### Backend

**Code Quality**:
- [ ] Code follows Rust conventions
- [ ] Error handling complete
- [ ] Uses `Result<T, E>`
- [ ] No unwrap() or expect()
- [ ] Thread safety

**Code Style**:
- [ ] Naming follows conventions
- [ ] Module organization clear
- [ ] Sufficient comments
- [ ] Uses appropriate Rust features

**Functional Correctness**:
- [ ] Feature implementation complete
- [ ] Edge case handling
- [ ] Security considerations (encryption, validation)
- [ ] Performance considerations

**Maintainability**:
- [ ] Code readability good
- [ ] Sufficient documentation comments
- [ ] Modular design
- [ ] Test coverage

### Testing

**Test Coverage**:
- [ ] Unit tests
- [ ] Integration tests
- [ ] Edge case tests
- [ ] Error case tests

---

## Summary

Following code conventions improves code quality, readability, and maintainability. Frontend uses React + TypeScript, backend uses Rust, both need to follow respective naming conventions, code structure, and best practices. Git commit messages use clear format for easy code review and version management.