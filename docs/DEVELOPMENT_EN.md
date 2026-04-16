# Development Guide

This document provides SSH Terminal development environment setup, development workflow, and common development task guides.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Common Development Tasks](#common-development-tasks)
- [Debugging Tips](#debugging-tips)
- [Testing](#testing)
- [Building and Release](#building-and-release)

---

## Development Environment Setup

### System Requirements

**Required Software**:
- Node.js 18+
- Rust 1.70+
- pnpm 10.14.0+
- Git

**Recommended Software**:
- VS Code (recommended extensions)
- Tauri CLI
- Docker (for deployment testing)

### Installation Steps

#### 1. Clone Project

```bash
git clone https://github.com/shenjianZ/ssh-terminal.git
cd ssh-terminal
```

#### 2. Install Frontend Dependencies

```bash
pnpm install
```

#### 3. Verify Rust Environment

```bash
rustc --version
cargo --version
```

#### 4. Install Tauri CLI (Optional)

```bash
cargo install tauri-cli --version "^2.0.0"
```

#### 5. Verify Environment

```bash
# Test frontend development
pnpm dev

# Test full application
pnpm tauri dev
```

### VS Code Recommended Extensions

**Required Extensions**:
- Tauri - Tauri development support
- Rust Analyzer - Rust language support
- ESLint - Code linting
- Prettier - Code formatting

**Recommended Extensions**:
- Tailwind CSS IntelliSense - Tailwind CSS intelligent suggestions
- TypeScript Vue Plugin (Volar) - Vue/React support
- GitLens - Git enhancements
- Error Lens - Error information display

---

## Project Structure

```
ssh-terminal/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── ai/                   # AI related components
│   │   ├── layout/               # Layout components
│   │   ├── session/              # Session management components
│   │   ├── settings/             # Settings components
│   │   ├── ssh/                  # SSH related components
│   │   ├── sftp/                 # SFTP file manager
│   │   ├── terminal/             # Terminal components
│   │   └── ui/                   # UI components (shadcn/ui)
│   ├── config/                   # Configuration files
│   │   ├── defaultKeybindings.ts # Default shortcuts
│   │   └── themes.ts             # Theme configuration
│   ├── hooks/                    # React Hooks
│   ├── lib/                      # Utility libraries
│   ├── pages/                    # Page components
│   ├── store/                    # Zustand state management
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   ├── App.tsx                   # Application entry
│   └── main.tsx                  # Main entry file
├── src-tauri/                    # Rust backend code
│   ├── src/
│   │   ├── commands/             # Tauri commands
│   │   ├── ssh/                  # SSH related
│   │   ├── storage/              # Storage related
│   │   └── lib.rs                # Library entry
│   ├── Cargo.toml                # Rust dependencies configuration
│   └── tauri.conf.json           # Tauri configuration
├── docs/                         # Documentation
├── public/                       # Static resources
├── package.json                  # Frontend dependencies configuration
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
└── tailwind.config.js            # Tailwind CSS configuration
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Develop Feature

**Frontend Development**:
```bash
# Start frontend development server only
pnpm dev

# Start full application (frontend + backend)
pnpm tauri dev
```

**Backend Development**:
- Modify Rust code in `src-tauri/src/`
- Use `pnpm tauri dev` for hot reload
- Check terminal output for error messages

### 3. Test Feature

- Manually test if feature works normally
- Check console for errors
- Verify edge cases

### 4. Commit Code

```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. Push to Remote

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

- Create PR on GitHub
- Fill in PR description
- Wait for code review

---

## Common Development Tasks

### Adding New shadcn/ui Component

```bash
# Add single component
npx shadcn@latest add [component-name]

# Example: Add Button component
npx shadcn@latest add button

# Example: Add multiple components
npx shadcn@latest add button input dialog
```

**Available Components List**:
- button
- input
- dialog
- dropdown-menu
- tabs
- toast
- card
- table
- etc.

Detailed component list: https://ui.shadcn.com/docs/components

### Adding New Tauri Command

#### 1. Create Command File

Create new file in `src-tauri/src/commands/`:

```rust
// src-tauri/src/commands/example.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ExampleRequest {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExampleResponse {
    pub message: String,
}

#[tauri::command]
pub fn greet(request: ExampleRequest) -> Result<ExampleResponse, String> {
    Ok(ExampleResponse {
        message: format!("Hello, {}!", request.name),
    })
}
```

#### 2. Register Command

Register command in `src-tauri/src/lib.rs`:

```rust
mod commands;
use commands::example::greet;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            // ... other commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 3. Frontend Call

```typescript
import { invoke } from '@tauri-apps/api/core';

interface ExampleRequest {
  name: string;
}

interface ExampleResponse {
  message: string;
}

async function greet(name: string) {
  const request: ExampleRequest = { name };
  const response = await invoke<ExampleResponse>('greet', { request });
  console.log(response.message);
}
```

### Adding New Page

#### 1. Create Page Component

Create new file in `src/pages/`:

```typescript
// src/pages/NewPage.tsx
import React from 'react';

export default function NewPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">New Page</h1>
      <p>This is a new page.</p>
    </div>
  );
}
```

#### 2. Add Route

Add route in `src/App.tsx`:

```typescript
import NewPage from '@/pages/NewPage';

// Add in route configuration
<Route path="/new-page" element={<NewPage />} />
```

#### 3. Add Navigation Link

Add navigation in sidebar component:

```typescript
import NewPage from '@/pages/NewPage';

// Add in navigation menu
<NavLink to="/new-page">
  New Page
</NavLink>
```

### Adding New Zustand Store

#### 1. Create Store

Create new file in `src/store/`:

```typescript
// src/store/newStore.ts
import { create } from 'zustand';

interface NewStore {
  data: string;
  setData: (data: string) => void;
}

export const useNewStore = create<NewStore>((set) => ({
  data: '',
  setData: (data) => set({ data }),
}));
```

#### 2. Use Store

```typescript
import { useNewStore } from '@/store/newStore';

function MyComponent() {
  const { data, setData } = useNewStore();

  return (
    <div>
      <p>{data}</p>
      <button onClick={() => setData('Hello')}>
        Set Data
      </button>
    </div>
  );
}
```

### Modifying Theme

Edit `src/config/themes.ts` file:

```typescript
export const themes: TerminalTheme[] = [
  {
    name: 'custom-theme',
    displayName: 'Custom Theme',
    type: 'dark',
    colors: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      // ... other colors
    },
  },
  // ... other themes
];
```

### Adding New Shortcut

Edit `src/config/defaultKeybindings.ts` file:

```typescript
export const defaultKeybindings: Keybinding[] = [
  {
    id: 'custom-action',
    name: 'Custom Action',
    description: 'This is a custom action',
    accelerator: 'Ctrl+Shift+X',
    action: () => {
      console.log('Custom action triggered');
    },
    scope: 'global',
  },
  // ... other shortcuts
];
```

---

## Debugging Tips

### Frontend Debugging

**Using Browser Developer Tools**:
```bash
pnpm tauri dev
```

**Common Shortcuts**:
- `F12` - Open developer tools
- `Ctrl+Shift+I` - Open developer tools
- `Ctrl+Shift+J` - Open console

**Debugging React Components**:
- Install React Developer Tools
- Check component state and props
- View component tree

### Backend Debugging

**View Terminal Output**:
```bash
pnpm tauri dev
```

**Using Rust Debugger**:
```bash
# Use lldb or gdb
cargo build
lldb ./target/debug/ssh-terminal
```

**Add Logging**:
```rust
use log::{info, warn, error};

#[tauri::command]
pub fn example_command() -> Result<(), String> {
    info!("Command executed");
    Ok(())
}
```

### Debugging Tauri Commands

**Frontend Call**:
```typescript
try {
  const result = await invoke('command_name', { param });
  console.log('Result:', result);
} catch (error) {
  console.error('Error:', error);
}
```

**Backend Return Error**:
```rust
#[tauri::command]
pub fn example_command() -> Result<String, String> {
    Err("Something went wrong".to_string())
}
```

---

## Testing

### Frontend Testing

**Unit Tests**:
```bash
pnpm test
```

**Component Tests**:
```bash
pnpm test:ui
```

### Backend Testing

**Unit Tests**:
```bash
cd src-tauri
cargo test
```

**Integration Tests**:
```bash
cargo test --test integration
```

---

## Building and Release

### Development Build

```bash
# Frontend build
pnpm build

# Tauri build
pnpm tauri build
```

### Production Build

```bash
# Windows
pnpm tauri:build:win

# macOS
pnpm tauri:build:mac

# Linux
pnpm tauri:build:linux
```

### Build Artifacts

**Windows**:
- `src-tauri/target/release/bundle/msi/` - MSI installer
- `src-tauri/target/release/bundle/nsis/` - NSIS installer

**macOS**:
- `src-tauri/target/release/bundle/dmg/` - DMG installer
- `src-tauri/target/release/bundle/macos/` - APP file

**Linux**:
- `src-tauri/target/release/bundle/deb/` - DEB package
- `src-tauri/target/release/bundle/appimage/` - AppImage

---

## FAQ

### Q: What if hot reload doesn't work?

A:
1. Check if Vite dev server is running normally
2. Check if port 1420 is occupied
3. Try restarting dev server
4. Clear cache: `pnpm clean`

### Q: What if Tauri command call fails?

A:
1. Check if command is registered in `lib.rs`
2. Check if command name is correct
3. Check terminal output for error messages
4. Ensure command parameter types are correct

### Q: What if Rust compilation fails?

A:
1. Check if Rust version meets requirements
2. Update dependencies: `cargo update`
3. Clear build cache: `cargo clean`
4. Check error details and suggestions

### Q: What if frontend styles don't take effect?

A:
1. Check Tailwind CSS configuration
2. Ensure class names are correct
3. Check CSS priority
4. Try clearing browser cache

---

## Resource Links

**Official Documentation**:
- [Tauri Documentation](https://tauri.app/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

**Community Resources**:
- [Tauri Discord](https://discord.gg/tauri)
- [Tauri GitHub](https://github.com/tauri-apps/tauri)
- [React GitHub](https://github.com/facebook/react)

---

## Summary

SSH Terminal uses Tauri + React + Rust tech stack, providing cross-platform SSH terminal management features. Development environment requires Node.js, Rust, and pnpm. Project structure is clear, divided into frontend and backend parts. Common development tasks include adding components, creating commands, adding pages, etc. Using developer tools and logging makes it easy to debug code.