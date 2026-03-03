# Troubleshooting Guide

This document collects common errors and issues encountered when using SSH Terminal and provides detailed solutions.

## Table of Contents

* [SSH Connection Issues](#ssh-connection-issues)
* [Terminal Display Issues](#terminal-display-issues)
* [AI Function Issues](#ai-function-issues)
* [SFTP Issues](#sftp-issues)
* [Cloud Sync Issues](#cloud-sync-issues)
* [Build and Deployment Issues](#build-and-deployment-issues)
* [Performance Issues](#performance-issues)
* [Other Issues](#other-issues)

---

## SSH Connection Issues

### Issue 1: SSH Connection Failed

**Symptoms**: Cannot connect to SSH server, error "Connection Failed"

**Possible Causes**:

1. Incorrect host address or port
2. Wrong username or password
3. SSH service not running
4. Firewall blocking connection
5. Network unreachable

**Solutions**:

```bash
# 1. Test network connectivity
ping <host>

# 2. Test SSH port
telnet <host> 22
# or
nc -zv <host> 22

# 3. Test SSH connection
ssh <user>@<host>

# 4. Check SSH service status (on server)
systemctl status sshd

# 5. Check firewall (on server)
sudo ufw status
sudo firewall-cmd --list-all
```

**UI Checks**:

1. Verify host, port, and username in the session configuration
2. Test connection using system SSH client
3. Check network connectivity

---

### Issue 2: Authentication Failed

**Symptoms**: Connection succeeds but authentication fails, error "Authentication Failed"

**Possible Causes**:

1. Incorrect password or private key
2. Improper private key permissions
3. Server disabled this authentication method
4. Wrong username

**Solutions**:

```bash
# 1. Verify password
ssh <user>@<host>  # Enter password manually

# 2. Check private key permissions (Linux/macOS)
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub

# 3. Test public key authentication
ssh -i ~/.ssh/id_rsa <user>@<host>

# 4. Check SSH server logs (on server)
tail -f /var/log/auth.log  # Ubuntu/Debian
tail -f /var/log/secure    # CentOS/RHEL
```

**UI Checks**:

1. Confirm password is correct (case-sensitive)
2. Confirm private key path is correct
3. If key has a passphrase, verify it
4. Try alternative authentication methods

---

## Terminal Display Issues

### Issue 3: Terminal Output Garbled

**Symptoms**: Characters display incorrectly or formatting is broken

**Possible Causes**:

1. Server encoding not UTF-8
2. Terminal type mismatch
3. Font does not support some characters

**Solutions**:

```bash
# 1. Set server encoding to UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# 2. Permanent setting (add to ~/.bashrc)
echo 'export LANG=en_US.UTF-8' >> ~/.bashrc
echo 'export LC_ALL=en_US.UTF-8' >> ~/.bashrc

# 3. Reset terminal
reset
```

**UI Settings**:

1. Set `terminalType` to `xterm-256color` in session configuration
2. Use fonts that support UTF-8

---

### Issue 4: Terminal Response Slow

**Symptoms**: Terminal input takes a long time to respond

**Possible Causes**:

1. High network latency
2. High server load
3. Excessive terminal output
4. Complex shell configuration

**Solutions**:

```bash
# 1. Check network latency
ping <host>

# 2. Check server load
top
htop

# 3. Optimize shell configuration
# Check ~/.bashrc or ~/.zshrc for slow operations

# 4. Use faster shell
# Consider using dash instead of bash
```

**UI Optimizations**:

1. Reduce terminal rows and columns
2. Disable unnecessary terminal features
3. Use faster network connection

---

### Issue 5: Special Keys Not Working

**Symptoms**: Arrow keys, Tab, etc., do not function correctly

**Possible Causes**:

1. Terminal type mismatch
2. Shell configuration issue
3. Keyboard mapping issue

**Solutions**:

```bash
# 1. Check terminal type
echo $TERM

# 2. Set correct terminal type
export TERM=xterm-256color

# 3. Reload shell configuration
source ~/.bashrc

# 4. Test keys
# Press Ctrl+V then arrow key to see output
```

**UI Settings**:

1. Set `terminalType` to `xterm-256color` in session configuration
2. Try other terminal types (`xterm`, `vt100`)

---

## AI Function Issues

### Issue 6: AI Response Timeout

**Symptoms**: AI response takes too long or times out

**Possible Causes**:

1. Network connectivity issues
2. API server slow
3. Request content too long
4. Invalid API Key

**Solutions**:

```typescript
// 1. Check network connectivity
ping api.openai.com

// 2. Test API connection
curl https://api.openai.com/v1/models

// 3. Verify API Key
// Check API Key in settings

// 4. Reduce maxTokens
{
  maxTokens: 1024
}

// 5. Switch to a faster provider
// e.g., local Ollama deployment
```

**UI Actions**:

1. Check network connection
2. Switch to a different AI provider
3. Reduce `maxTokens`
4. Ensure API Key is valid

---

### Issue 7: API Key Invalid

**Symptoms**: "API Key Invalid" or "Authentication Failed"

**Possible Causes**:

1. Incorrectly copied API Key
2. API Key expired
3. Insufficient permissions
4. API server issue

**Solutions**:

1. **Verify API Key**: Ensure no extra spaces and correct value
2. **Regenerate API Key**: Update configuration
3. **Check API Key permissions**: Confirm sufficient access and quota
4. **Test API Key**:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### Issue 8: AI Output Interrupted

**Symptoms**: AI output stops unexpectedly

**Possible Causes**:

1. Network interruption
2. Token limit reached
3. API server error
4. Client timeout

**Solutions**:

```typescript
// 1. Increase maxTokens
{
  maxTokens: 4096
}

// 2. Ensure stable network

// 3. Retry request

// 4. Check API error logs
```

---

## SFTP Issues

### Issue 9: SFTP Transfer Failed

**Symptoms**: File upload/download fails

**Possible Causes**:

1. Insufficient permissions
2. Low disk space
3. File already exists
4. Network interruption

**Solutions**:

```bash
# 1. Check permissions
ls -l /path/to/remote
chmod +w /path/to/remote

# 2. Check disk space
df -h

# 3. Check if file exists
ls /path/to/file

# 4. Check network connection
ping <host>
```

**UI Actions**:

1. Verify write permissions
2. Check disk space
3. Choose "overwrite" if needed
4. Retry transfer

---

### Issue 10: SFTP Slow Transfer

**Symptoms**: File transfer is very slow

**Possible Causes**:

1. Network bandwidth limitation
2. Server bandwidth limitation
3. Large number of files

**Solutions**:

1. Check network and server bandwidth
2. Compress files before transfer
3. Avoid transferring many small files at once
4. Use multi-threaded or batch transfer tools

---

## Cloud Sync Issues

### Issue 11: Sync Failed

**Symptoms**: "Sync Failed" message

**Possible Causes**:

1. Network issues
2. Server unavailable
3. Token expired
4. Invalid data format

**UI Actions**:

1. Check network connection
2. Re-login to sync account
3. Trigger manual sync
4. Check sync logs

---

### Issue 12: Too Many Sync Conflicts

**Symptoms**: Frequent conflicts on each sync

**Possible Causes**:

1. Multiple devices editing same data
2. Sync interval too short
3. Network delay causing inconsistency

**Avoid Conflicts**:

* Avoid editing the same data on multiple devices simultaneously
* Wait for sync to complete before making further changes

---

## Build and Deployment Issues

### Issue 13: Build Failed

**Symptoms**: `pnpm build` or `pnpm tauri build` fails

**Possible Causes**:

1. Dependency version conflicts
2. Missing system tools
3. Low disk space
4. Permission issues

**Solutions**:

```bash
# 1. Clear caches
pnpm clean
cargo clean

# 2. Reinstall dependencies
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# 3. Check system tools
# Windows: Visual Studio Build Tools
# macOS: Xcode Command Line Tools
# Linux: build-essential

# 4. Check disk space
df -h

# 5. Run as admin (Windows)
```

**Common Errors**:

```bash
# Node not found
# Solution: Install Node.js and add to PATH

# Cargo not found
# Solution: Install Rust and add to PATH

# Linker errors
# Solution: Install system dependencies
# Ubuntu: sudo apt-get install build-essential
# macOS: xcode-select --install
```

---

### Issue 14: Hot Reload Not Working

**Symptoms**: Code changes do not refresh page automatically

**Possible Causes**:

1. Vite dev server not running
2. Port occupied
3. Browser caching

**Solutions**:

```bash
# 1. Check Vite dev server
pnpm dev

# 2. Check if port is occupied
netstat -ano | findstr :1420  # Windows
lsof -i :1420                  # macOS/Linux

# 3. Clear browser cache
# Ctrl+Shift+R

# 4. Restart dev server
# Stop (Ctrl+C) and start again (pnpm dev)
```

---

## Performance Issues

### Issue 15: Slow App Startup

**Symptoms**: App takes long to start

**Possible Causes**:

1. Too many session configurations loaded
2. Slow database queries
3. Insufficient system resources

**Solutions**:

1. Clean up history and unnecessary sessions
2. Increase system resources (RAM, SSD)

---

### Issue 16: High Memory Usage

**Symptoms**: App consumes excessive memory

**Possible Causes**:

1. Multiple terminal tabs open
2. Excessive terminal output
3. Memory leaks

**Solutions**:

1. Close unused tabs
2. Limit terminal output:

```typescript
{
  scrollback: 1000  // Keep last 1000 lines
}
```

3. Restart app regularly
4. Check for memory leaks

---

## Other Issues

### Issue 17: Shortcuts Not Working

**Symptoms**: Keyboard shortcuts do not work

**Possible Causes**:

1. Conflicts with other apps
2. Wrong shortcut configuration
3. OS shortcut conflict

**Solutions**:

1. Verify shortcut settings
2. Try alternative shortcuts
3. Reset to default

---

### Issue 18: UI Display Issues

**Symptoms**: Layout broken or interface abnormal

**Possible Causes**:

1. Browser zoom issues
2. OS theme conflicts
3. Cached files

**Solutions**:

1. Reset browser zoom to 100%
2. Switch themes
3. Clear cache and/or reinstall app

---

## Getting Help

If the above solutions cannot resolve your problem, you can get help via:

1. **Documentation**:

   * [Project Docs](https://github.com/shenjianZ/ssh-terminal)
   * [API Docs](https://github.com/shenjianZ/ssh-terminal-server)
2. **Search Issues**:

   * Search similar issues on GitHub
   * Check if known solutions exist
3. **Submit Issue**:

   * Provide detailed error info and reproduction steps
4. **Community Support**:

   * Join community discussions
   * Seek help from other users
