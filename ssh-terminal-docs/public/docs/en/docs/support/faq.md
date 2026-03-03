# Frequently Asked Questions (FAQ)

This document summarizes common questions and answers about SSH Terminal.

---

### Q: Where is the configuration file located?

**A:** The Tauri client configuration file is in the `.tauri-terminal` directory in your home directory

```
~\.tauri-terminal\
├── recording                # Recording files directory
├── ai_chat_history.json     # AI chat history file
├── ai_config.json           # AI configuration file
├── app_config.json          # Application configuration file
├── sessions.json            # Session configuration file
├── shortcuts.json           # Keyboard shortcut configuration file
└── ssh_terminal.db          # SQLite database file
```

---

### Q: Windows installation prompts missing WebView2

**A:** WebView2 is a required component for running Tauri applications on Windows.

**Solution:**
1. Download and install [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
2. Restart your computer
3. Reinstall SSH Terminal

---

### Q: macOS prompts "Cannot be opened because it cannot be verified"

**A:** This is a security mechanism of macOS.

**Solution:**
1. Right-click the SSH Terminal application
2. Select "Open"
3. Click "Open" again to confirm
4. Or allow the application to run in System Preferences

---

### Q: Linux AppImage cannot run

**A:** Need to add execute permission.

**Solution:**
```bash
chmod +x SSH-Terminal-x.x.x.AppImage
./SSH-Terminal-x.x.x.AppImage
```

---

### Q: Build from source fails

**A:** May be dependency or tool version issues.

**Solution:**
1. Check Node.js version (requires 18+)
2. Check Rust version (requires 1.70+)
3. Clear cache and rebuild:
   ```bash
   rm -rf node_modules
   pnpm install
   cd src-tauri
   cargo clean
   cargo build
   ```

---

### Q: Cannot connect to server

**A:** Possible causes and solutions:

**Troubleshooting Steps:**
1. Check network connection:
   ```bash
   ping server.com
   ```

2. Check if SSH service is running:
   ```bash
   ssh -v user@server.com
   ```

3. Check firewall settings:
   ```bash
   sudo ufw status
   ```

4. Verify server address and port

---

### Q: Authentication failed, cannot login

**A:** May be password or key issues.

**Solution:**
1. Verify username and password
2. Check SSH key permissions:
   ```bash
   chmod 600 ~/.ssh/id_rsa
   chmod 644 ~/.ssh/id_rsa.pub
   ```
3. Confirm key password is correct

---

### Q: Connection timeout

**A:** May be network latency or firewall issues.

**Solution:**
1. Increase connection timeout
2. Check network latency:
   ```bash
   ping -c 10 server.com
   ```
3. Check firewall rules
4. Try using different network

---

### Q: How to switch terminal theme

**A:** Switch theme:

1. Enter settings interface
2. Click Terminal, select terminal theme

---

### Q: How to copy and paste text

**A:** Copy and paste methods:

**Copy:**
- Select text, right-click → "Copy"

**Paste:**
- Press `Ctrl+V`
- Select text, right-click → "Paste"

---

### Q: How to record terminal operations

**A:** Use recording feature:

1. Click the "Record" button in the bottom toolbar
2. Perform your operations
3. Click "Stop" to end recording
4. View and play in recording management

---

### Q: How to export screenshot (local development mode only)

**A:** Use screenshot feature:

1. Click the "Screenshot" button in the bottom toolbar
2. Select screenshot area
3. Save as SVG or PNG format
4. Or use keyboard shortcut `Ctrl+Shift+S`

---

## AI Feature Questions

### Q: AI assistant not responding

**A:** May be API configuration or network issues.

**Solution:**
1. Check if API Key is correct
2. Verify network connection
3. Check error logs
4. Try different AI Provider

---

### Q: AI response slow

**A:** May be network or API limitations.

**Optimization Methods:**
1. Enable AI caching
2. Use faster network
3. Choose faster model
4. Reduce Token count

---

### Q: How to configure multiple AI Providers

**A:** Configure multiple Providers in AI settings:

1. Enter settings interface
2. Click AI tab
3. Click "Add New Service" button
4. Select service type, enter relevant information, click Add
5. Continue to complete relevant information (API Key), click save configuration
6. Can set default Provider

---

### Q: Terminal response slow

**A:** May be network or rendering issues.

**Optimization Methods:**
1. Reduce scroll buffer size

---

### Q: File transfer slow

**A:** May be network or configuration issues.

**Optimization Methods:**
1. Use faster network

---

### Q: Are passwords stored securely?

**A:** Yes, using AES-256-GCM encryption.

**Security Measures:**
- Passwords encrypted with AES-256-GCM
- Keys derived using Argon2
- Sensitive information not written to logs
- Supports master password protection

---

### Q: Is cloud sync secure?

**A:** Yes, using end-to-end encryption.

**Security Measures:**
- Data transferred with TLS encryption
- Data encrypted at rest on server
- Supports user self-hosting
- Can disable cloud sync

---

### Q: How to report a Bug

**A:** Report through GitHub Issues:

1. Visit [GitHub Issues](https://github.com/shenjianZ/ssh-terminal/issues)
2. Click "New Issue"
3. Select issue type
4. Fill in issue description and reproduction steps
5. Submit Issue

---

### Q: How to request new features

**A:** Request through GitHub Issues or Discussions:

1. Search existing Feature Requests
2. If none exist, create new Issue
3. Describe feature requirements in detail
4. Explain use cases

---

### Q: How to contribute code

**A:** Refer to contributor guide:

1. Fork repository
2. Create feature branch
3. Submit code
4. Create Pull Request

For detailed steps, please check [Contributing Guide](/docs/contributing/setup).

---

## Get More Help

If the above FAQ doesn't solve your problem:

- 📖 Check [Troubleshooting](/docs/support/troubleshooting) documentation
- 🔍 Search [GitHub Issues](https://github.com/shenjianZ/ssh-terminal/issues)
- 💬 Participate in [GitHub Discussions](https://github.com/shenjianZ/ssh-terminal/discussions)
- 📧 Send email to support@ssh-terminal.dev

---

**Hope these FAQs help you solve your problems!** 🎉