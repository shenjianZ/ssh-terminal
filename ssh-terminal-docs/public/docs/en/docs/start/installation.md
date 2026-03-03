# Installation Guide

This document will guide you through installing SSH Terminal on different platforms.

---

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 11+, Linux (Ubuntu 20.04+)
- **Memory**: 4GB RAM
- **Storage**: 500MB available space
- **Network**: Internet connection (for cloud sync and AI features)

### Recommended Configuration
- **Operating System**: Windows 11, macOS 12+, Linux (Ubuntu 22.04+)
- **Memory**: 8GB RAM
- **Storage**: 1GB available space
- **Network**: Stable internet connection

---

## 🪟 Windows Installation

### Method 1: Using Installer (Recommended)

1. Visit the [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) page
2. Download the latest Windows installer (`SSH.Terminal_vx.x.x-windows-x86_64-setup.exe`)
3. Double-click the installer to run
4. Follow the installation wizard to complete installation
5. Launch SSH Terminal

### Method 2: Using MSI Installer

1. Visit the [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) page
2. Download the latest Windows MSI installer (`SSH.Terminal_vx.x.x-windows-x86_64.msi`)
3. Double-click the installer to run
4. Follow the installation wizard to complete installation
5. Launch SSH Terminal

---

## 🍎 macOS Installation

### Using DMG Installer (Recommended)

1. Visit the [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) page
2. Download the latest macOS installer (`SSH.Terminal_vx.x.x-macos-universal.dmg`)
3. Double-click the DMG file to mount the disk image
4. Drag SSH Terminal to the Applications folder
5. Launch SSH Terminal from Launchpad

### Using ZIP Installer

1. Visit the [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) page
2. Download the latest macOS ZIP package (`SSH.Terminal_vx.x.x-macos-universal.app.zip`)
3. Extract the ZIP file
4. Drag SSH Terminal.app to the Applications folder
5. Launch SSH Terminal from Launchpad

---

## 🐧 Linux Installation

### Method 1: Using Debian/Ubuntu Package

**System Requirements**: Ubuntu 22.04+ or glibc 2.34+

> **⚠️ Important**: This package requires glibc 2.34 or higher.

1. Visit the [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) page
2. Download the latest Debian/Ubuntu package (`SSH.Terminal_vx.x.x-linux-x86_64.deb`)
3. Install using the following command:

```bash
# Install deb package
sudo dpkg -i SSH.Terminal_vx.x.x-linux-x86_64.deb

# If dependency issues are prompted, run the following command
sudo apt-get install -f
```

**Compatibility Notes**:
- ✅ Ubuntu 24.04+ (glibc 2.39)
- ✅ Ubuntu 22.04 (glibc 2.35)
- ❌ Ubuntu 20.04 (glibc 2.31) - Incompatible

### Method 2: Using Fedora/RHEL Package

**System Requirements**: Fedora 36+ or glibc 2.34+

> **⚠️ Important**: This package requires glibc 2.34 or higher.

1. Visit the [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases) page
2. Download the latest Fedora/RHEL package (`SSH.Terminal_vx.x.x-linux-x86_64.rpm`)
3. Install using the following command:

```bash
# Install rpm package
sudo dnf install SSH.Terminal_vx.x.x-linux-x86_64.rpm

# Or use yum (for older versions)
sudo yum install SSH.Terminal_vx.x.x-linux-x86_64.rpm
```

**Compatibility Notes**:
- ✅ Fedora 40+ (glibc 2.39+)
- ✅ Fedora 36-39 (glibc 2.35-2.38)
- ❌ Other older versions - Incompatible

---

## 📱 Android Installation (Coming Soon)

The Android version is under development, stay tuned!

---

## 🔧 Verify Installation

After installation is complete, you can verify if installation was successful through the following methods:

1. **Launch Application**
   - Windows: Launch from Start menu or desktop shortcut
   - macOS: Launch from Applications folder or Launchpad
   - Linux: Launch from application menu or command line

2. **Test Features**
   - Try creating a new SSH connection
   - Test AI assistant features
   - Check SFTP file management

---

## 🔄 Update

### Manual Update

1. Visit [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases)
2. Download the latest version
3. Overwrite install

---

## 🗑️ Uninstall

### Windows

**Using installer:**
1. Open "Control Panel" → "Programs and Features"
2. Find SSH Terminal
3. Click "Uninstall"

### macOS

**Manual uninstall:**
1. Delete SSH Terminal from Applications folder
2. Clean up configuration files:
   ```bash
   rm -rf ~/Library/Application\ Support/ssh-terminal
   rm -rf ~/Library/Caches/ssh-terminal
   ```

### Linux

**Debian/Ubuntu:**
```bash
sudo apt remove ssh-terminal
```

**Fedora:**
```bash
sudo dnf remove ssh-terminal
```

**General cleanup:**
```bash
rm -rf ~/.config/ssh-terminal
rm -rf ~/.cache/ssh-terminal
```

---

## ❓ Common Questions

### Windows

**Q: Installation prompts "Missing WebView2"**
A: Install [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

**Q: Antivirus reports virus**
A: SSH Terminal is safe open source software, you can add it to the whitelist

### macOS

**Q: Prompt "Cannot be opened because it cannot be verified developer"**
A: Right-click the application → "Open" → "Open"

**Q: M1/M2 chip installation issues**
A: Make sure to download the ARM64 version installer

### Linux

**Q: AppImage cannot run**
A: Add execute permission: `chmod +x SSH-Terminal-x.x.x.AppImage`

**Q: Missing dependency libraries**
A: Install corresponding dependency packages based on error messages

---

## 📞 Get Help

If you encounter issues during installation:

1. Check the [Troubleshooting](/docs/support/troubleshooting) documentation
2. Search [GitHub Issues](https://github.com/shenjianZ/ssh-terminal/issues)
3. Submit a new [Issue](https://github.com/shenjianZ/ssh-terminal/issues/new)
4. Participate in [GitHub Discussions](https://github.com/shenjianZ/ssh-terminal/discussions)

---

**After successful installation, please continue reading the [Quick Start](/docs/start/quick-start) documentation!** 🚀