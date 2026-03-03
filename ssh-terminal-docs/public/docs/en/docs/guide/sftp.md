# SFTP File Management

SSH Terminal integrates powerful SFTP file management features, allowing you to efficiently manage files on remote servers.

---

## SFTP Manager Introduction

SFTP (SSH File Transfer Protocol) is a secure file transfer protocol that transfers files through SSH connections.

**Main Features:**
- Dual-panel design, intuitive file browsing
- Supports uploading and downloading files, folders
- Supports deleting, renaming

---

## Interface Layout

The SFTP manager uses a dual-panel design:

### Left Panel - Local Files
Displays your local computer's file system, you can:
- Browse local folders
- Select files to upload

### Right Panel - Remote Files
Displays the file system on the remote server, you can:
- Browse remote folders
- Select files to download
- Manage remote files

### Middle Toolbar
Provides quick access buttons for common operations:
- Upload (transfer local files to server)
- Download (transfer remote files to local)

---

## Basic Operations

### Open SFTP Manager

There are two ways to open the SFTP manager:
1. Click the "File Management" icon in the sidebar
2. Right-click on the terminal tab and select "Open SFTP"

**Note:** You need to establish an SSH connection before using SFTP features.

### Browse Files

#### Local Files
- Double-click a folder to enter a subdirectory
- Quick navigation in the top path bar

#### Remote Files
- Double-click a folder to enter a subdirectory
- Quick navigation in the top path bar

### Upload Files

Transfer local files to the remote server:

**Method 1: Using Toolbar**
1. Select files to upload in the left panel
2. Click the "Upload" button in the toolbar
3. Wait for transfer to complete

**Method 2: Using Keyboard Shortcut**
1. Select files to upload
2. Press `Ctrl+U` keyboard shortcut

**Batch Upload:**
- Can select multiple files at once
- Can select entire folders to upload

### Download Files

Transfer remote files to your local computer:

**Method 1: Using Toolbar**
1. Select files to download in the right panel
2. Click the "Download" button in the toolbar
3. Wait for transfer to complete

**Method 2: Using Keyboard Shortcut**
1. Select files to download
2. Press `Ctrl+D` keyboard shortcut

**Batch Download:**
- Can select multiple files at once
- Can select entire folders to download

### Create Folder

Create a new folder in the remote panel:

1. Click the "New Folder" button in the toolbar
2. Enter folder name
3. Press Enter to confirm

### Delete Files

Delete remote files:

1. Select the file or folder to delete
2. Click the "Delete" button in the toolbar
3. Confirm the delete operation

**Note:** Delete operation cannot be undone, please operate with caution.

### Rename Files

Rename remote files:

1. Select the file to rename
2. Click the "Rename" button in the toolbar
3. Enter new name
4. Press Enter to confirm

### Refresh File List

If the file list changes, you can manually refresh:

1. Click the "Refresh" button in the toolbar
2. Or press `F5` keyboard shortcut

---

## File Permission Management

### View File Permissions

File permissions are displayed in the file list:
- `r` - Read permission
- `w` - Write permission
- `x` - Execute permission

Format example: `-rwxr-xr-x`

---

## Keyboard Shortcuts

The SFTP manager provides the following keyboard shortcuts:

| Shortcut | Function | Description |
|----------|----------|-------------|
| `Ctrl+U` | Upload Files | Upload selected local files to remote server |
| `Ctrl+D` | Download Files | Download selected remote files to local |
| `F5` | Refresh File List | Refresh current file list |

**Design Principles:**
- Use `F5` instead of `Ctrl+R` to avoid conflicts with terminal reverse search
- Keyboard shortcuts only work in SFTP page, won't affect other features

---

## Common Questions

### Upload Failed

Possible causes:
- Insufficient disk space on remote server
- Insufficient file permissions
- Network connection interrupted

Solutions:
- Check remote server disk space
- Check write permissions of target directory
- Check network connection

### Download Failed

Possible causes:
- Insufficient local disk space
- Remote file does not exist
- Network connection interrupted

Solutions:
- Check local disk space
- Confirm remote file exists
- Check network connection

### Cannot Browse Remote Files

Possible causes:
- SSH connection disconnected
- Insufficient remote directory permissions
- SFTP service not enabled

Solutions:
- Confirm SSH connection is normal
- Check read permissions of remote directory
- Contact server administrator to confirm SFTP service status

### Slow Transfer Speed

Possible causes:
- Network bandwidth limitation
- High server load
- File too large

Solutions:
- Check network connection
- Transfer during network idle periods
- Transfer large files in batches

---

## Security

SSH Terminal's SFTP features have the following security characteristics:

- **Encrypted Transfer** - All file transfers are encrypted through SSH
- **Authentication Mechanism** - Uses SSH connection's authentication method
- **Permission Control** - Follows server file system's permission settings

---

## Next Steps

Now that you have mastered SFTP file management, you can continue learning:

- [Basics](/docs/guide/basics) - Review basic operations
- [SSH Connection Management](/docs/guide/ssh-connection) - Manage your server connections
- [AI Intelligent Assistant](/docs/guide/ai-assistant) - Use AI assistant to improve efficiency
- [Cloud Sync](/docs/guide/cloud-sync) - Sync configuration to cloud