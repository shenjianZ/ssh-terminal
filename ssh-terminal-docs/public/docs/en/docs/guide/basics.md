# Basics

This tutorial will help you quickly understand the basic functions and operations of SSH Terminal.

---

## Interface Overview

The main interface of SSH Terminal is divided into the following areas:

### Sidebar
The sidebar is located on the left side of the interface, providing quick navigation features, including:
- **Terminal** - Manage multiple SSH terminal connections
- **Session Management** - View and manage saved SSH session configurations
- **AI Assistant** - Access AI intelligent assistant features
- **File Management** - Open SFTP file manager
- **Recording Management** - View and manage recorded terminal operations

You can use the `Ctrl+B` keyboard shortcut to toggle the visibility of the sidebar.

### Terminal Area
The center of the interface is the main terminal display area, supporting multi-tab management. Each tab represents an independent SSH connection session.
Above the terminal area is a toolbar providing quick access to common features:
- New connection
- Session management
- Start/stop recording, recording management

---

## Basic Operation Flow

### Create SSH Connection

There are two ways to create an SSH connection:

#### Quick Connect
Press `Ctrl+N` keyboard shortcut to open the quick connect dialog and fill in the following information:
- **Host Address** - Server IP address or domain
- **Port** - SSH port (default 22)
- **Username** - Login username
- **Authentication Method** - Choose password or key authentication
- **Password or Private Key** - Enter password or private key path

Quick connect does not save configuration, suitable for temporary use.

#### Create Persistent Session
Click "New Session" on the session management page, fill in connection information, and the session will be saved to the local database for easy reuse.

### Connection Management

After successful connection, you can:
- **New Tab** - Press `Ctrl+T` to create a new terminal tab
- **Close Tab** - Press `Ctrl+W` to close the current tab
- **Switch Tabs** - Press `Ctrl+Tab` to switch to the next tab, press `Ctrl+Alt+Tab` to switch to the previous tab

---

## Terminal Usage Basics

### Common Operations

- **Copy Text** - Select text and use the right-click menu to copy
- **Paste Text** - Press `Ctrl+V` or use the right-click menu to paste
- **Find Text** - Press `Ctrl+F` to search for text in the terminal
- **Clear Screen** - Press `Ctrl+L` to clear the terminal screen content

### Font Adjustment

You can adjust terminal font size in real-time:
- **Increase Font** - Press `Ctrl+=`
- **Decrease Font** - Press `Ctrl+-`
- **Reset Font** - Press `Ctrl+0` to restore default size

Font scaling is cumulative, pressing multiple times quickly will continuously increase or decrease.

---

## Theme Switching

SSH Terminal offers multiple terminal themes to choose from:

### Switching Steps

1. Click the "Settings" button in the top right
2. Select "Terminal" → "Theme"
3. Choose your preferred theme from the list

### Supported Themes

- One Dark - Dark theme, suitable for long-term use
- Dracula - Classic dark theme
- Nord - Fresh dark theme
- Tokyo Night - Modern dark theme
- Monokai - Classic code editor theme
- GitHub Light - Bright light theme
- Solarized Light - Classic light theme
- Solarized Dark - Classic dark theme

---

## Keyboard Shortcut Basics

SSH Terminal provides rich keyboard shortcut support to improve work efficiency.

### Global Shortcuts

- `Ctrl+N` - New connection
- `Ctrl+,` - Open settings
- `Ctrl+B` - Toggle sidebar

### Terminal Shortcuts

- `Ctrl+T` - New tab
- `Ctrl+W` - Close tab
- `Ctrl+Tab` - Next tab
- `Ctrl+Alt+Tab` - Previous tab
- `Ctrl+F` - Find
- `Ctrl+L` - Clear screen
- `Ctrl+V` - Paste

You can customize all keyboard shortcuts in the settings page.

---

## Next Steps

Now that you have mastered the basic features of SSH Terminal, you can continue learning:

- [SSH Connection Management](/docs/guide/ssh-connection) - Deep dive into advanced configuration of SSH connections
- [AI Intelligent Assistant](/docs/guide/ai-assistant) - Master various features of the AI assistant
- [SFTP File Management](/docs/guide/sftp) - Learn how to efficiently manage remote files
- [Cloud Sync](/docs/guide/cloud-sync) - Sync configuration to cloud