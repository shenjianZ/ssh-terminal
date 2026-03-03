# Quick Start

This guide will help you get started with SSH Terminal in 5 minutes.

---

> After completing this guide, you will be able to:
> - ✅ Create your first SSH connection
> - ✅ Execute commands in the terminal
> - ✅ Use the AI intelligent assistant
> - ✅ Manage SFTP files

---

## 📦 Prerequisites

Before starting, please ensure:
1. SSH Terminal is installed ([Installation Guide](/docs/start/installation))
2. You have an accessible SSH server
3. You have login credentials for the server (username and password or SSH key)

---

## 🚀 Step 1: Launch the Application

### Windows
Double-click the desktop icon or launch SSH Terminal from the Start menu.

### macOS
Launch SSH Terminal from the Applications folder or Launchpad.

### Linux
Launch `ssh-terminal` from the application menu or command line.

---

## 🔗 Step 2: Create SSH Connection

### Method 1: Using Quick Connect

1. Click the **"New Connection"** button on the main interface (or press `Ctrl+N`)
2. Fill in connection information:
   - **Name**: Give the connection a name (e.g., "My Server")
   - **Host**: Server IP address or domain (e.g., `192.168.1.100` or `example.com`)
   - **Port**: SSH port (default `22`)
   - **Username**: Login username (e.g., `root` or `ubuntu`)
   - **Authentication Method**: Choose password or key
     - **Password**: Enter login password
     - **Key**: Select private key file
3. Click the **"Connect"** button

### Method 2: Using Keyboard Shortcut

Press `Ctrl+N` to open the quick connect dialog and enter information to connect.

---

## 💻 Step 3: Use the Terminal

After successful connection, you will see a fully functional terminal window.

Verify if it's working:

```bash
# View current directory
pwd
# List files
ls -la /
```

### Terminal Operations

- **New Tab**: Press `Ctrl+T`
- **Close Tab**: Press `Ctrl+W`
- **Switch Tabs**: Press `Ctrl+Tab` or click the tab
- **Copy**: Select text, then right-click and select **Copy**
- **Paste**: Press `Ctrl+V` or right-click and select **Paste**

---

## 🤖 Step 4: Use AI Intelligent Assistant

SSH Terminal has a built-in AI intelligent assistant to help you work more efficiently.

### Open AI Assistant

Click the **"AI Assistant"** icon in the sidebar or press `Ctrl+Shift+I`.

### Feature Demo

#### 1. Command Explanation (Ctrl+Shift+E)

If the keyboard shortcut doesn't work, modify it in settings

Select text in the terminal, and AI will explain its meaning:
```
User: Select "ps aux | grep nginx"

AI: This command is used to find running nginx processes:
- ps aux: Display detailed information of all processes
- |: Pipe, passes the output of the previous command to the next command
- grep nginx: Filter lines containing "nginx"
```

#### 2. Natural Language to Command (Shift+#)

Describe what you want to do in natural language:
```
User: Check system memory usage

AI: Recommended command:
free -h
```

#### 3. Error Diagnosis (Ctrl+Shift+A)

When you encounter an error, let AI help you analyze:
```
User: Permission denied when trying to delete a file

AI: Possible causes and solutions:
1. Insufficient file permissions, try using sudo
2. File is occupied by another process, check and close it
3. File system is read-only, check mount options
```

### Configure AI Provider

When using for the first time, you need to configure an AI Provider:

1. Click the AI tab in settings, click the "Add New Service" button to configure AI
2. Select service type, enter relevant information, click Add
3. Find the corresponding AI service. Configure API Key, BaseUrl, model name, etc.
4. Finally save the configuration to persist

---

## 📁 Step 5: Manage Files

SSH Terminal integrates SFTP file management features.

### Open SFTP Manager

Click the **"File Management"** icon in the sidebar.

### Basic Operations

#### Upload Files

1. Select files in the local panel
2. Click the upload button above, or use shortcut `Ctrl+U`

#### Download Files

1. Select files in the remote panel
2. Click the download button above, or use shortcut `Ctrl+D`

#### File Operations

- **Create Folder**: Click the "New Folder" icon above the file panel
- **Delete**: Select file → Click the "Delete" icon above the file panel
- **Rename**: Right-click → Click the "Rename" icon above the file panel

---

## 🎨 Step 6: Personalize Settings

### Switch Theme

1. Click the **"Settings"** button in the top right
2. Select **"Appearance"** → **"Theme"**
3. Choose your preferred theme (e.g., Light, Dark, System, etc.)

### Configure Keyboard Shortcuts

1. Click **"Settings"** → **"Keyboard Shortcuts"**
2. Modify your desired shortcuts
3. Click **"Save"**

### Other Settings

- **Font**: Set terminal font and size
- **Cursor**: Select cursor style and color
- **Scrolling**: Set scroll lines
- **Sound**: Enable/disable notification sounds

---

## 💾 Step 7: Session Management

Created sessions are automatically saved to the local SQLite file for persistence:

1. Click the **"Session Management"** icon in the sidebar
2. You will see all saved sessions
3. Click the connect button on the session card to connect

---

## 📝 Step 8: Record Operations (Optional)

SSH Terminal supports recording terminal operations.

### Start Recording

1. Click the **"Start Recording"** button in the top toolbar
2. Start executing your operations
3. Click **"Pause"** to pause recording
4. Click **"Stop"** to end recording

### View Recordings

1. Click the **"Recording Management"** icon
2. Select a recording file
3. Click **"Export Video"**, click start export, save to local

---

## 🎉 Congratulations!

You have completed the quick start of SSH Terminal!

### Next Steps

- 📖 Read [User Guide](/docs/guide/basics) to learn more features
- 🤝 Participate in [Community Discussions](https://github.com/shenjianZ/ssh-terminal/discussions)

---

## ❓ Having Issues?

If you encounter issues during use:

1. Check [FAQ](/docs/support/faq)
2. Read the [Troubleshooting](/docs/support/troubleshooting) documentation
3. Search for solutions in [GitHub Issues](https://github.com/shenjianZ/ssh-terminal/issues)
4. Submit a new Issue for help

---

**Enjoy using!** 🚀