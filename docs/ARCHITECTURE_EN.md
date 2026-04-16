# Architecture Design

This document provides a detailed description of the SSH Terminal system architecture, data flow, core concepts, and database design.

## Table of Contents

- [Overall Architecture](#overall-architecture)
- [Authentication Flow](#authentication-flow)
- [Synchronization Flow](#synchronization-flow)
- [Data Flow](#data-flow)
- [Core Concepts](#core-concepts)
- [Database Architecture](#database-architecture)
- [Data Synchronization Strategy](#data-synchronization-strategy)

---

## Overall Architecture

SSH Terminal adopts a layered architecture design, divided into three main parts: Frontend, Backend, and Server:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React 19)                        │
├─────────────────────────────────────────────────────────────────┤
│  Pages:                                                          │
│    Terminal | SessionManager | Settings | AIChatPage | SftpManager│
│       ↓             ↓              ↓           ↓            ↓     │
│  Components:                                                        │
│    Layout      Session        Settings      AI           SFTP      │
│   (Sidebar,    -QuickConnect  -AI           -Chat        -DualPane │
│    TopBar)     -SessionCard   -Terminal     -Command     -FileList │
│                 -EditDialog    -Keybindings  -History              │
│    Terminal    SSH            Recording    Mobile                  │
│   -TabBar      -HostKey       -Controls    -MobileLayout          │
│   -XTerm       -Confirm       -Export       -SessionList           │
│                -Status        -Manager                             │
│       ↓                                                            │
│  Store (Zustand):                                                 │
│    - sessionStore (session management)                             │
│    - terminalStore (terminal instance management)                  │
│    - terminalConfigStore (configuration management)               │
│    - aiStore (AI state management)                               │
│       ↓                                                            │
│  Lib & Utils:                                                     │
│    - historyManager (AI history management)                       │
│    - AudioCaptureManager (audio recording)                        │
│    - sounds (sound system)                                        │
└────────────────────────┬──────────────────────────────────────────┘
                         │ Tauri IPC Commands
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Rust + Tauri 2.0)                    │
├─────────────────────────────────────────────────────────────────┤
│  Commands Layer:                                                │
│    - session.rs (session management commands)                    │
│    - terminal.rs (terminal operation commands)                   │
│    - storage.rs (persistence commands)                          │
│       ↓                                                         │
│  SSH Manager Layer:                                             │
│    - SSHManager (manages Session and Connection)                 │
│       ↓                                                         │
│  SSH Backend Layer:                                             │
│    - SSHBackend (abstract trait)                                │
│    - SystemSSHBackend (system SSH implementation)                │
│    - portable-pty (cross-platform PTY support)                  │
│       ↓                                                         │
│  Storage Layer:                                                 │
│    - Storage (encrypted storage management)                      │
│    - AES-256-GCM encryption                                     │
└─────────────────────────────────────────────────────────────────┘
                         ↑
                         │ External APIs
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│               Backend Server (ssh-terminal-server)               │
├─────────────────────────────────────────────────────────────────┤
│  API Endpoints:                                                  │
│    - POST /auth/register      - User registration                │
│    - POST /auth/login         - User login                       │
│    - POST /auth/refresh       - Refresh Token                    │
│    - GET  /api/user/profile   - Get user profile                 │
│    - PUT  /api/user/profile   - Update user profile              │
│    - GET  /api/ssh/sessions   - Get SSH session list             │
│    - POST /api/ssh/sessions   - Create SSH session               │
│    - POST /api/sync           - Data synchronization             │
│    - POST /api/sync/resolve-conflict  - Resolve conflict         │
│       ↓                                                         │
│  Services:                                                       │
│    - AuthService (authentication service)                        │
│    - SyncService (synchronization service)                       │
│       ↓                                                         │
│  Repositories:                                                   │
│    - UserRepository (user data access)                           │
│    - UserProfileRepository (user profile data access)            │
│    - SshSessionRepository (SSH session data access)              │
│       ↓                                                         │
│  Storage:                                                        │
│    - SQLite/MySQL/PostgreSQL (database)                          │
│    - Redis (Refresh Token cache)                                │
└─────────────────────────────────────────────────────────────────┘
                         ↑
                         │ External APIs
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
├─────────────────────────────────────────────────────────────────┤
│  - OpenAI API    - Ollama API    - Qwen API    - Wenxin API      │
│  - SSH Servers   - SFTP Servers                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Layer

**Page Components**
- `Terminal` - Main terminal interface with multi-tab support
- `SessionManager` - Session management interface
- `Settings` - Application settings interface
- `AIChatPage` - AI chat interface
- `SftpManager` - SFTP file manager

**Core Components**
- **Layout** - Layout components (sidebar, top bar)
- **Session** - Session-related components (quick connect, session card, edit dialog)
- **Terminal** - Terminal components (tab bar, xterm.js)
- **SSH** - SSH-related components (host key confirmation, status display)
- **AI** - AI-related components (commands, history)
- **Recording** - Recording-related components (controls, export, manager)
- **SFTP** - SFTP file manager (dual pane, file list)
- **Mobile** - Mobile adaptive components (layout, session list)

**State Management (Store - Zustand)**
- `sessionStore` - SSH session configuration management
- `terminalStore` - Terminal instance and tab management
- `terminalConfigStore` - Terminal configuration (theme, font, etc.)
- `aiStore` - AI state and conversation history management
- `authStore` - User authentication state management
- `syncStore` - Data synchronization state management

### Backend Layer (Tauri)

**Commands Layer**
- `session.rs` - Session management commands (create, update, delete, query)
- `terminal.rs` - Terminal operation commands (connect, disconnect, input, output)
- `storage.rs` - Persistence commands (encrypted storage, read)

**SSH Manager Layer**
- `SSHManager` - Manages Session configurations and Connection instances
  - Loads Session configurations from database
  - Creates and manages Connection instances
  - Handles connection states and errors

**SSH Backend Layer**
- `SSHBackend` - Abstract trait defining SSH operation interfaces
- `SystemSSHBackend` - Implementation using system SSH client
- `RusshBackend` - Implementation using russh pure Rust (supports Android)
- `portable-pty` - Cross-platform PTY support

**Storage Layer**
- `Storage` - Encrypted storage management
  - AES-256-GCM encryption
  - Argon2 password derivation
  - SQLite database access

### Server Layer (ssh-terminal-server)

**API Endpoints**
- `/auth/*` - Authentication related APIs
- `/api/user/*` - User profile APIs
- `/api/ssh/*` - SSH session APIs
- `/api/sync/*` - Data synchronization APIs

**Service Layer**
- `AuthService` - User authentication and token management
- `SyncService` - Data synchronization and conflict resolution

**Data Access Layer**
- `UserRepository` - User data access
- `UserProfileRepository` - User profile data access
- `SshSessionRepository` - SSH session data access

---

## Authentication Flow

SSH Terminal uses JWT-based authentication mechanism, supporting Access Token and Refresh Token dual-token mode:

```
┌──────────────┐
│   User Login  │
└──────┬───────┘
       ↓
┌─────────────────────┐
│ POST /auth/login    │
│ (email + password)  │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ Verify Password     │
│ (Argon2)            │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ Generate Access     │
│ Token (15min exp)   │
│ Generate Refresh    │
│ Token (7 days exp)  │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ Store Refresh Token │
│ in Redis Set        │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ Return Token Pair   │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ Subsequent requests │
│ carry Access Token  │
└─────────────────────┘
```

### Authentication Flow Details

1. **User Login**
   - User enters email and password in client
   - Client sends POST request to `/auth/login`

2. **Server Verification**
   - Server queries user information
   - Verifies password hash using Argon2 algorithm
   - Returns 401 Unauthorized if verification fails

3. **Token Generation**
   - Generates Access Token (15 minutes expiration)
   - Generates Refresh Token (7 days expiration)
   - Signed using HS256 algorithm

4. **Store Refresh Token**
   - Stores Refresh Token in Redis Set
   - Key: `refresh_tokens:{user_id}`
   - Supports multi-device simultaneous login

5. **Return Tokens**
   - Returns Access Token and Refresh Token
   - Client stores tokens (LocalStorage or SecureStorage)

6. **Subsequent Requests**
   - Client carries Access Token in request header
   - Server validates token validity
   - Uses Refresh Token to refresh when Access Token expires

### Token Refresh Flow

```
┌─────────────────────┐
│ Access Token Expired│
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ POST /auth/refresh  │
│ (Refresh Token)     │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ Verify Refresh Token│
│ (Redis lookup)      │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ Generate New Token  │
│ Pair                │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ Update Refresh Token│
│ in Redis            │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ Return New Token    │
│ Pair                │
└─────────────────────┘
```

---

## Synchronization Flow

SSH Terminal supports multi-device data synchronization using incremental sync and conflict detection mechanisms:

```
┌──────────────┐
│ Manual/Auto   │
│ Sync          │
└──────┬───────┘
       ↓
┌─────────────────────┐
│ POST /api/sync      │
│ (with Access Token) │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 1. Check User State │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 2. Conflict Detect  │
│ (compare last_sync) │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 3. Push Phase       │
│ - Upload profile    │
│ - Upload sessions   │
│ - Handle deletes    │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 4. Pull Phase       │
│ - Fetch updates     │
│ - Incremental sync  │
└──────┬──────────────┘
       ↓
┌─────────────────────┐
│ 5. Return Sync      │
│ Result              │
│ - Updated data      │
│ - Conflict info     │
└─────────────────────┘
```

### Synchronization Flow Details

1. **Trigger Sync**
   - User manually clicks sync button
   - Or auto sync (based on configured interval)

2. **Prepare Sync Data**
   - Collect locally changed data
   - Mark change type (new, update, delete)

3. **Push Phase (Upload Local Changes)**
   - Upload user profile changes
   - Upload SSH session changes
   - Handle local delete operations

4. **Pull Phase (Fetch Server Changes)**
   - Fetch updated data from server
   - Incremental sync (only fetch data after `last_sync_at`)
   - Merge into local database

5. **Conflict Detection and Resolution**
   - Compare record `updated_at` and version numbers
   - Detect conflicts (same record modified on both sides)
   - Provide conflict resolution strategies:
     - Keep server version
     - Keep local version
     - Keep both versions (create copy)

6. **Update Sync State**
   - Update `last_sync_at` timestamp
   - Update `server_ver` and `client_ver` version numbers

---

## Data Flow

### SSH Connection Flow

```
User Operation → React Component → Zustand Store → Tauri Command → SSH Manager → SSH Backend → SSH Server
    ↓                                                                                   ↑
UI Update ← Tauri Event (ssh-output-{id}) ← SSH Reader ← PTY ← SSH Process ←──────────┘
```

### SSH Connection Flow Details

1. **User Operation**
   - User selects a Session in SessionManager
   - Or enters connection info in QuickConnect

2. **Frontend Processing**
   - React component receives user operation
   - Updates Zustand Store state
   - Calls Tauri Command

3. **Backend Processing**
   - Tauri Command receives request
   - SSH Manager creates Connection
   - SSH Backend establishes actual SSH connection

4. **Establish PTY**
   - Create pseudo-terminal (PTY)
   - Start SSH process
   - Connect PTY input/output streams

5. **Data Transfer**
   - SSH Reader reads remote output
   - Sends to frontend via Tauri Event
   - Frontend updates xterm.js display
   - User input written to remote via PTY

### AI Interaction Flow

```
User Input → AI Component → aiStore → API Call → AI Provider (OpenAI/Claude/...)
    ↓                                                                              ↑
UI Update ← AI Response ← AI Provider ← HTTP Request ←─────────────────────────────┘
```

### AI Interaction Flow Details

1. **User Input**
   - User enters question in AI chat interface
   - Or selects command/error info in terminal

2. **Frontend Processing**
   - AI component receives user input
   - Updates aiStore state
   - Adds user message to conversation history

3. **API Call**
   - Gets current AI Provider config from aiStore
   - Builds API request
   - Sends to AI service provider

4. **Streaming Response**
   - AI Provider returns streaming response
   - Frontend receives and displays in real-time
   - Updates aiStore state

5. **History Management**
   - Saves AI response to conversation history
   - Manages history grouped by server
   - Supports history persistence

---

## Core Concepts

### 1. Session (Session Configuration)

**Definition**: Saved SSH connection configuration containing all information needed for connection.

**Fields**:
- `id` - Unique identifier
- `name` - Session name
- `host` - Host address
- `port` - Port number
- `username` - Username
- `auth_method` - Authentication method (password/key)
- `password_encrypted` - Encrypted password
- `private_key_encrypted` - Encrypted private key
- `passphrase_encrypted` - Encrypted private key password
- `group_name` - Group name

**Features**:
- Saved in local database
- Can be used multiple times to create connections
- Supports encrypted storage

### 2. Connection (Connection Instance)

**Definition**: Actual SSH connection created based on a Session.

**Features**:
- A Session can create multiple Connections
- Each Connection has independent lifecycle
- Multiple Connections can exist simultaneously

**Lifecycle**:
1. Created from Session
2. Establish connection
3. Transfer data
4. Disconnect
5. Destroy

### 3. TerminalTab (Terminal Tab)

**Definition**: Frontend display terminal tab, each tab corresponds to one Connection.

**Features**:
- Displayed in main interface tab bar
- Supports switching and closing
- Shows connection status
- Associated with xterm.js instance

### 4. AI Conversation (AI Conversation)

**Definition**: AI chat session containing multiple rounds of conversation and history.

**Features**:
- Supports multi-round conversation
- Maintains context understanding
- Managed grouped by server
- Supports history persistence

**Data Structure**:
- `messages` - Message list (user messages + AI responses)
- `server_id` - Associated server ID
- `created_at` - Creation time
- `updated_at` - Update time

### 5. AI Provider (AI Service Provider)

**Definition**: AI service provider providing AI capabilities.

**Supported Providers**:
- OpenAI (GPT-4, GPT-3.5)
- Ollama (local models)
- Qwen (Tongyi Qianwen)
- Wenxin (Wenxin Yiyan)
- Other OpenAI API compatible services

**Configuration**:
- `provider_type` - Provider type
- `api_key` - API key
- `model` - Model name
- `base_url` - API base URL
- `parameters` - Model parameters (temperature, max tokens, etc.)

---

## Database Architecture

### Client Local Database (SQLite)

Database location: `src-tauri/data/app.db`

#### Table Structure

**user_auth (User Authentication Table)**

| Field | Type | Description |
|------|------|-------------|
| `id` | INTEGER | Primary key |
| `email` | TEXT | Email |
| `password_hash` | TEXT | Argon2 password hash |
| `device_id` | TEXT | Device ID (for encryption) |
| `created_at` | TEXT | Creation time |
| `deleted_at` | TEXT | Deletion time (soft delete) |

**ssh_sessions (SSH Sessions Table)**

| Field | Type | Description |
|------|------|-------------|
| `id` | INTEGER | Primary key |
| `user_id` | INTEGER | User ID (foreign key to user_auth) |
| `name` | TEXT | Session name |
| `host` | TEXT | Host address |
| `port` | INTEGER | Port |
| `username` | TEXT | Username |
| `auth_method` | TEXT | Authentication method (password/key) |
| `password_encrypted` | TEXT | AES-256-GCM encrypted password |
| `private_key_encrypted` | TEXT | AES-256-GCM encrypted private key |
| `passphrase_encrypted` | TEXT | AES-256-GCM encrypted private key password |
| `group_name` | TEXT | Group name |
| `server_ver` | INTEGER | Server version number |
| `client_ver` | INTEGER | Client version number |
| `last_sync_at` | TEXT | Last sync time |
| `created_at` | TEXT | Creation time |
| `deleted_at` | TEXT | Deletion time (soft delete) |

**user_profiles (User Profiles Table)**

| Field | Type | Description |
|------|------|-------------|
| `id` | INTEGER | Primary key |
| `user_id` | INTEGER | User ID (foreign key to user_auth) |
| `username` | TEXT | Username |
| `bio` | TEXT | Bio |
| `avatar_base64` | TEXT | Avatar (Base64) |
| `phone` | TEXT | Phone |
| `qq` | TEXT | QQ number |
| `wechat` | TEXT | WeChat ID |
| `server_ver` | INTEGER | Server version number |
| `client_ver` | INTEGER | Client version number |
| `last_sync_at` | TEXT | Last sync time |
| `created_at` | TEXT | Creation time |
| `deleted_at` | TEXT | Deletion time (soft delete) |

**app_settings (Application Settings Table)**

| Field | Type | Description |
|------|------|-------------|
| `id` | INTEGER | Primary key |
| `server_url` | TEXT | Server address |
| `auto_sync_enabled` | INTEGER | Auto sync toggle (0/1) |
| `sync_interval_minutes` | INTEGER | Sync interval (minutes) |
| `language` | TEXT | Language setting |
| `updated_at` | TEXT | Update time |

**sync_state (Sync State Table)**

| Field | Type | Description |
|------|------|-------------|
| `id` | INTEGER | Primary key |
| `last_sync_at` | TEXT | Last sync time |
| `pending_count` | INTEGER | Pending sync count |
| `conflict_count` | INTEGER | Conflict count |

### Server Database (SQLite/MySQL/PostgreSQL)

#### Table Structure

**users (Users Table)**

| Field | Type | Description |
|------|------|-------------|
| `id` | INTEGER(10) | Primary key |
| `email` | TEXT | Email (unique) |
| `password_hash` | TEXT | Argon2 password hash |
| `created_at` | TEXT | Creation time |
| `deleted_at` | TEXT | Deletion time (soft delete) |

**user_profiles (User Profiles Table)**

| Field | Type | Description |
|------|------|-------------|
| `id` | INTEGER | Primary key |
| `user_id` | INTEGER | User ID (foreign key to users.id) |
| `username` | TEXT | Username |
| `bio` | TEXT | Bio |
| `avatar_base64` | TEXT | Avatar (Base64) |
| `phone` | TEXT | Phone |
| `qq` | TEXT | QQ number |
| `wechat` | TEXT | WeChat ID |
| `server_ver` | INTEGER | Server version number |
| `client_ver` | INTEGER | Client version number |
| `last_sync_at` | TEXT | Last sync time |
| `created_at` | TEXT | Creation time |
| `deleted_at` | TEXT | Deletion time (soft delete) |

**ssh_sessions (SSH Sessions Table)**

| Field | Type | Description |
|------|------|-------------|
| `id` | INTEGER | Primary key |
| `user_id` | INTEGER | User ID (foreign key to users.id) |
| `name` | TEXT | Session name |
| `host` | TEXT | Host address |
| `port` | INTEGER | Port |
| `username` | TEXT | Username |
| `auth_method` | TEXT | Authentication method (password/key) |
| `password_encrypted` | TEXT | AES-256-GCM encrypted password |
| `private_key_encrypted` | TEXT | AES-256-GCM encrypted private key |
| `passphrase_encrypted` | TEXT | AES-256-GCM encrypted private key password |
| `group_name` | TEXT | Group name |
| `server_ver` | INTEGER | Server version number |
| `client_ver` | INTEGER | Client version number |
| `last_sync_at` | TEXT | Last sync time |
| `created_at` | TEXT | Creation time |
| `deleted_at` | TEXT | Deletion time (soft delete) |

---

## Data Synchronization Strategy

### 1. Version Control

Each record maintains two version numbers:
- `server_ver` - Server version number
- `client_ver` - Client version number

The corresponding version number increments each time a record is updated.

### 2. Conflict Detection

Conflict detection is based on the following conditions:
- Compare record `updated_at` timestamps
- Compare record version numbers
- Check if the same record has been modified on both sides

**Conflict Scenarios**:
- User modifies the same session on two devices simultaneously
- During sync, one side deletes the record while the other modifies it

### 3. Incremental Sync

Only sync data changed after `last_sync_at`:
- Query condition: `updated_at > last_sync_at`
- Reduce data transfer
- Improve sync efficiency

### 4. Soft Delete

Use `deleted_at` field to mark deletion:
- Delete operations don't physically delete records
- Only set `deleted_at` to current time
- Filter deleted records when querying
- Support data recovery

### 5. Sync Strategy

**Push Phase**:
1. Collect locally changed data
2. Upload to server
3. Server updates database

**Pull Phase**:
1. Fetch updated data from server
2. Merge into local database
3. Handle conflicts

**Conflict Resolution Strategies**:
- **Keep server version** - Use server data to overwrite local
- **Keep local version** - Use local data to overwrite server
- **Keep both** - Create copy, keep both versions

### 6. Auto Sync

Configurable auto sync:
- Set sync interval (minutes)
- Enable/disable auto sync
- Manual trigger sync

---

## Summary

SSH Terminal adopts a layered architecture design with React + Zustand for frontend, Rust + Tauri for backend, and Rust + Axum for server. The system supports multi-device data synchronization, uses JWT authentication, AES-256-GCM encrypted storage, providing a secure and efficient SSH terminal management experience.

Core concepts include Session (session configuration), Connection (connection instance), TerminalTab (terminal tab), AI Conversation (AI conversation), and AI Provider (AI service provider). The system uses version control and soft delete mechanisms to implement data synchronization and conflict resolution.