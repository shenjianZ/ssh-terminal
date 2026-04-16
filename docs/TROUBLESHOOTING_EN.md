# Troubleshooting Guide

This document provides solutions to common SSH Terminal issues and debugging tips.

## Table of Contents

- [Installation and Startup Issues](#installation-and-startup-issues)
- [SSH Connection Issues](#ssh-connection-issues)
- [Terminal Display Issues](#terminal-display-issues)
- [AI Feature Issues](#ai-feature-issues)
- [Recording Feature Issues](#recording-feature-issues)
- [Synchronization Feature Issues](#synchronization-feature-issues)
- [Performance Issues](#performance-issues)
- [Other Issues](#other-issues)

---

## Installation and Startup Issues

### Q: Dependency Installation Fails

**Problem**: Error when running `pnpm install`

**Possible Causes**:
1. Node.js version doesn't meet requirements
2. Network issues
3. pnpm version too low

**Solutions**:

```bash
# 1. Check Node.js version (requires 18+)
node --version

# 2. Check pnpm version (requires 10.14.0+)
pnpm --version

# 3. Update pnpm
npm install -g pnpm@latest

# 4. Clear cache and reinstall
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Q: Rust Compilation Fails

**Problem**: Rust compilation fails when running `pnpm tauri dev`

**Possible Causes**:
1. Rust version doesn't meet requirements (requires 1.70+)
2. System dependencies missing
3. Cargo cache corrupted

**Solutions**:

```bash
# 1. Check Rust version
rustc --version

# 2. Update Rust
rustup update

# 3. Clear Cargo cache
cd src-tauri
cargo clean

# 4. Rebuild
cargo build
```

**Windows Specific Issues**:

If you encounter linking errors, you may need to install Microsoft C++ Build Tools:

1. Download [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Select "Desktop development with C++" during installation
3. Rebuild

### Q: Application Fails to Start

**Problem**: Application cannot start, crashes or shows errors

**Solutions**:

```bash
# 1. Check error logs
pnpm tauri dev

# 2. Check if port is occupied (1420)
netstat -ano | findstr :1420  # Windows
lsof -i :1420                  # macOS/Linux

# 3. Clear application data
# Windows: %APPDATA%\ssh-terminal
# macOS: ~/Library/Application Support/ssh-terminal
# Linux: ~/.config/ssh-terminal
```

### Q: Hot Reload Not Working

**Problem**: Application doesn't auto-refresh after code changes

**Solutions**:

```bash
# 1. Check if Vite dev server is running
pnpm dev

# 2. Check if port 1420 is occupied

# 3. Restart dev server
Ctrl+C
pnpm tauri dev

# 4. Clear browser cache
```

---

## SSH Connection Issues

### Q: SSH Connection Fails

**Problem**: Shows connection failure after clicking connect

**Possible Causes**:
1. Host address or port incorrect
2. Username or password incorrect
3. Network issues
4. SSH service not started

**Solutions**:

1. **Check Connection Info**:
   - Confirm host address, port, username are correct
   - Try connecting with other SSH clients (like PuTTY, OpenSSH)

2. **Check Network**:
   ```bash
   # Ping host
   ping example.com

   # Check if port is open
   telnet example.com 22
   ```

3. **Check SSH Service**:
   ```bash
   # Check SSH service status on server
   systemctl status sshd  # Linux
   service ssh status     # Ubuntu/Debian
   ```

4. **View Detailed Errors**:
   - Open developer tools (F12)
   - Check console for error messages

### Q: Authentication Fails

**Problem**: Authentication fails after entering password

**Possible Causes**:
1. Password incorrect
2. Password authentication not supported
3. Key authentication misconfigured

**Solutions**:

1. **Use Key Authentication**:
   - Generate SSH key pair
   - Add public key to server
   - Configure private key in application

2. **Check Password**:
   - Confirm password is correct
   - Pay attention to case and special characters

3. **View Server Logs**:
   ```bash
   # View server SSH logs
   tail -f /var/log/auth.log  # Ubuntu/Debian
   tail -f /var/log/secure    # CentOS/RHEL
   ```

### Q: Host Key Verification Fails

**Problem**: Prompted that host key doesn't match when connecting

**Solutions**:

1. **Verify Host Key**:
   - Contact server administrator to confirm key change
   - If server has been updated, accept new key

2. **Clear known_hosts**:
   ```bash
   # Delete specific host record
   ssh-keygen -R example.com

   # Or delete entire file
   rm known_hosts
   ```

3. **Reconnect in Application**:
   - Application will prompt to accept new key
   - Confirm to save

### Q: Connection Frequently Disconnects

**Problem**: SSH connection frequently disconnects automatically

**Solutions**:

1. **Configure Heartbeat Keepalive**:
   - Enable heartbeat in session settings
   - Set heartbeat interval (recommended 30-60 seconds)

2. **Check Network Stability**:
   - Test network connection quality
   - Use VPN or more stable network

3. **Adjust Server Configuration**:
   ```bash
   # Edit server SSH configuration
   sudo vim /etc/ssh/sshd_config

   # Add following configuration
   ClientAliveInterval 60
   ClientAliveCountMax 3

   # Restart SSH service
   sudo systemctl restart sshd
   ```

---

## Terminal Display Issues

### Q: Terminal Output Garbled

**Problem**: Characters displayed in terminal are garbled

**Possible Causes**:
1. Encoding setting incorrect
2. Server using non-UTF-8 encoding

**Solutions**:

1. **Check Terminal Encoding**:
   - Check encoding settings in application
   - Default uses UTF-8

2. **Set Encoding on Server**:
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export LANG=en_US.UTF-8
   export LC_ALL=en_US.UTF-8

   # Reload configuration
   source ~/.bashrc
   ```

3. **Use locale Command**:
   ```bash
   # View current locale
   locale

   # Set locale
   export LC_CTYPE=en_US.UTF-8
   ```

### Q: Terminal Display Abnormal

**Problem**: Terminal display abnormal, like misalignment, overlap, etc.

**Solutions**:

1. **Reset Terminal**:
   ```bash
   reset
   ```

2. **Adjust Terminal Size**:
   - Adjust terminal window size in application
   - Ensure server recognizes correct terminal size

3. **Check TERM Environment Variable**:
   ```bash
   # View TERM variable
   echo $TERM

   # Set TERM variable
   export TERM=xterm-256color
   ```

### Q: Terminal Unresponsive

**Problem**: Terminal stuck, cannot input or display output

**Solutions**:

1. **Check Connection Status**:
   - Confirm SSH connection is still active
   - Try sending heartbeat

2. **Use Shortcuts**:
   - `Ctrl+C` - Send interrupt signal
   - `Ctrl+Z` - Suspend process
   - `Ctrl+D` - Send EOF

3. **Reconnect**:
   - Close current terminal tab
   - Reconnect

---

## AI Feature Issues

### Q: AI Response Slow

**Problem**: AI takes a long time to generate response

**Solutions**:

1. **Check Network**:
   - Confirm network connection is normal
   - Test latency to AI API

2. **Adjust AI Parameters**:
   - Reduce `max_tokens` value
   - Lower `temperature` value
   - Choose faster model

3. **Check API Quota**:
   - Confirm API Key is valid
   - Check if there are usage limits

4. **Use Cache**:
   - Same requests will use cache
   - Cache time: 30 minutes

### Q: AI Generates Incorrect Results

**Problem**: AI-generated commands or explanations are incorrect

**Solutions**:

1. **Optimize Prompts**:
   - Provide more detailed description
   - Explain context and goals
   - Specify output format

2. **Adjust AI Parameters**:
   - Lower `temperature` value (more deterministic)
   - Increase `max_tokens` value (more detailed)

3. **Use Different Model**:
   - Try using more powerful model
   - Like GPT-4 instead of GPT-3.5

4. **Verify Results**:
   - AI-generated commands need verification
   - Especially commands with destructive operations

### Q: AI Feature Unavailable

**Problem**: AI button or menu cannot be clicked

**Possible Causes**:
1. AI Provider not configured
2. API Key invalid
3. Network issues

**Solutions**:

1. **Configure AI Provider**:
   - Open settings
   - Go to AI tab
   - Select AI Provider
   - Enter API Key

2. **Verify API Key**:
   - Confirm API Key is correct
   - Check if API Key has expired

3. **Check Network**:
   - Confirm AI API can be accessed
   - Test network connection

---

## Recording Feature Issues

### Q: High CPU Usage During Recording

**Problem**: Application lags during recording, high CPU usage

**Solutions**:

1. **Lower Recording Quality**:
   - Use Low quality instead of High
   - Lower frame rate (30 FPS → 15 FPS)

2. **Disable Audio Recording**:
   - If audio not needed, disable audio recording

3. **Close Other Programs**:
   - Close other CPU-intensive programs
   - Reduce system load

### Q: Recorded Video File Too Large

**Problem**: Video file hundreds of MB after few minutes of recording

**Solutions**:

1. **Use Lower Recording Quality**:
   - Use Low quality
   - Lower video bitrate

2. **Shorten Recording Time**:
   - Record in segments
   - Only record necessary parts

3. **Compress After Recording**:
   - Use video compression tools
   - Like HandBrake, FFmpeg

### Q: No Sound in Audio Recording

**Problem**: Recorded video has no sound

**Solutions**:

1. **Check Microphone Permissions**:
   - Confirm application has microphone permission
   - Grant permission in system settings

2. **Check Audio Settings**:
   - Check audio configuration in application settings
   - Confirm microphone is working

3. **Test Microphone**:
   ```bash
   # Test microphone (macOS)
   afplay /System/Library/Sounds/Ping.aiff

   # Test microphone (Linux)
   arecord -d 5 test.wav
   aplay test.wav
   ```

### Q: Recording Cannot Save

**Problem**: Recording file not saved after clicking stop recording

**Solutions**:

1. **Check Storage Space**:
   - Confirm disk has sufficient space
   - Clean unnecessary files

2. **Check Write Permissions**:
   - Confirm application has write permission
   - Check target folder permissions

3. **View Error Logs**:
   - Open developer tools
   - Check console for error messages

---

## Synchronization Feature Issues

### Q: Synchronization Fails

**Problem**: Shows synchronization failure after clicking sync

**Possible Causes**:
1. Network issues
2. Server unavailable
3. Authentication failure

**Solutions**:

1. **Check Network**:
   - Confirm network connection is normal
   - Test connection to server

2. **Check Server Status**:
   - Confirm server is running
   - Check server logs

3. **Check Authentication**:
   - Confirm logged in
   - Check if Token is valid
   - Try logging in again

### Q: Synchronization Conflict

**Problem**: Prompts for conflicts during synchronization

**Solutions**:

1. **View Conflict Details**:
   - Application will display conflicting data
   - View which data has conflicts

2. **Choose Resolution Strategy**:
   - Keep server version
   - Keep local version
   - Keep both versions

3. **Manual Resolution**:
   - Edit conflicting data
   - Resynchronize

### Q: Data Loss

**Problem**: Local data lost after synchronization

**Solutions**:

1. **Check Sync Settings**:
   - Confirm sync strategy is correct
   - Check if wrong strategy was chosen

2. **Recover from Server**:
   - If data exists on server, can recover
   - Use historical versions (if available)

3. **Check Backups**:
   - Check if there are local backups
   - Restore backup data

---

## Performance Issues

### Q: Slow Application Startup

**Problem**: Application takes a long time to start

**Solutions**:

1. **Clear Cache**:
   ```bash
   # Clear application cache
   rm -rf ~/.config/ssh-terminal/cache
   ```

2. **Reduce Startup Items**:
   - Disable unnecessary auto-connections
   - Reduce number of loaded sessions

3. **Update Application**:
   - Update to latest version
   - Performance optimizations may be in latest version

### Q: Application Laggy During Use

**Problem**: Application not smooth, lags during use

**Solutions**:

1. **Close Unnecessary Tabs**:
   - Close unused terminal tabs
   - Reduce memory usage

2. **Lower Terminal Quality**:
   - Lower font rendering quality
   - Reduce terminal buffer size

3. **Check System Resources**:
   - Check CPU and memory usage
   - Close other resource-intensive programs

4. **Update Application**:
   - Update to latest version
   - Performance optimizations may be in latest version

---

## Other Issues

### Q: How to Get Help?

**Solutions**:

1. **View Documentation**:
   - [README.md](../README.md)
   - [Other Documentation](./)

2. **Search for Issues**:
   - Search GitHub Issues
   - Search related error messages

3. **Submit Issue**:
   - Submit Issue on GitHub
   - Provide detailed error information and reproduction steps

4. **Contact Community**:
   - Join Discord community
   - Ask questions in forums

### Q: How to Report Bug?

**Solutions**:

1. **Collect Information**:
   - Error messages
   - Reproduction steps
   - System information (OS, version, etc.)

2. **Submit Issue**:
   - Submit Issue on GitHub
   - Use Bug template

3. **Provide Logs**:
   - Provide application logs
   - Provide browser console logs

### Q: How to Request New Feature?

**Solutions**:

1. **Check if Already Exists**:
   - Search existing Issues
   - Check feature requests

2. **Submit Feature Request**:
   - Submit Issue on GitHub
   - Use Feature Request template
   - Describe feature requirements in detail

3. **Participate in Discussion**:
   - Discuss in Issue
   - Provide feedback and suggestions

---

## Summary

SSH Terminal may encounter various issues, most of which can be resolved by checking configuration, network, permissions, etc. If issues cannot be resolved, you can check documentation, search community, submit Issue, or contact community for help. Providing detailed error information and reproduction steps helps solve problems faster.