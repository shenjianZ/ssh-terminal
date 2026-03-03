# Changelog

This document records all version updates of SSH Terminal.

---

## [1.2.1] - 2026-03-02

### Fixes
- 🐛 Fixed Linux build compatibility, using ubuntu-20.04 runner
- 🔧 Ensured GLIBC 2.31 baseline for compatibility with Ubuntu 20.04+ / Debian 11+
- 📦 Updated libwebkit2gtk to 4.0-dev for better compatibility

---

## [1.2.0] - 2026-02-28

### Added
- ✨ SFTP upload/download record management feature
- ✨ Real-time file upload progress tracking and visualization panel
- ✨ Recursive directory upload, upload cancellation, and streaming transfer features
- ✨ Email verification code system
- ✨ Docker deployment support
- ✨ Web frontend support
- ✨ User avatar upload feature
- ✨ Multi-language internationalization support

### Improved
- 🎨 Optimized file transfer performance and state management
- 🔄 Implemented anonymous user SSH session migration to logged-in user
- 🔧 Implemented Redis auto-reconnection mechanism
- 🔐 Enhanced API network error handling
- 🔄 Implemented token auto-refresh mechanism

### Fixes
- 🐛 Fixed content slice panic issue with unicode characters
- 🐛 Fixed ID overflow issue

---

## [1.1.0] - 2026-02-26

### Email Verification Code System

- Added email verification code sending feature (auth_send_verify_code)
- Integrated verification code sending and validation in registration page
- Redis rate limiting optimization, check before incrementing count
- Internationalization support
- Anonymous user session migration
- Supports automatic migration of SSH session configurations under anonymous status to current user after user registration or login, using new user's device_id to re-encrypt authentication information

---

## [1.0.0] - 2025-12-15

### Added
- ✨ First release
- ✨ Multi-session SSH terminal management
- ✨ SFTP file management
- ✨ xterm.js terminal emulator
- ✨ Tauri 2.0 cross-platform support
- ✨ React 19 frontend
- ✨ Rust backend

---

## Version Notes

### Version Number Format

Adopts Semantic Versioning:
- **Major Version**: Incompatible API modifications
- **Minor Version**: Backwards compatible new features
- **Patch Version**: Backwards compatible bug fixes

### Update Types

- **Added**: New features
- **Changed**: Improvements to existing features
- **Deprecated**: Features to be removed
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security-related fixes

---

## Historical Versions

Detailed version history can be viewed at [GitHub Releases](https://github.com/shenjianZ/ssh-terminal/releases).

---

**Thank you for using SSH Terminal!** 🎉