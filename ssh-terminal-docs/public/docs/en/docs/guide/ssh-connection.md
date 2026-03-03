# SSH Connection Management

This guide will help you deeply understand the advanced configuration and management features of SSH connections.

---

## Connection Configuration Details

### Basic Configuration

When creating an SSH connection, you need to fill in the following basic information:

- **Host Address** - Server IP address or domain
- **Port** - SSH port (default 22)
- **Username** - Login username
- **Authentication Method** - Choose password or key authentication
- **Password or Private Key** - Enter password or private key path

---

## Authentication Methods

SSH Terminal supports two authentication methods:

### Password Authentication
The simplest and most direct authentication method, just enter the login password.

**Notes:**
- Passwords are stored using AES-256-GCM encryption
- Host key verification prompt will appear on first connection

### Key Authentication
A more secure authentication method using SSH key pairs for identity verification.

**Configuration Steps:**
1. Select "Key" in authentication method
2. Click the "Select Key File" button
3. Select your private key file (such as `id_rsa` or `id_ed25519`)
4. If the key is password protected, you need to enter the key password

**Key File Formats:**
- Supports OpenSSH format
- Supports PEM format
- Supports PKCS8 format

---

## Advanced Configuration

### Terminal Type

Terminal type specifies the terminal emulator type expected by the server. Common options:
- **xterm-256color** - Supports 256 colors, recommended
- **xterm** - Standard xterm terminal
- **vt100** - Best compatibility terminal type

In most cases, using the default `xterm-256color` is sufficient.

### Keep Alive

To prevent connection disconnection due to long periods of inactivity, you can enable the keep alive feature.

- **Keep Alive Interval** - Time interval for sending heartbeat packets (seconds)
- Default value: 30 seconds
- Recommended value: 30-60 seconds

If the network is unstable, you can appropriately reduce the interval time.

---

## Session Management

### Create Session

Click the "New Session" button on the session management page, fill in connection information, and click "Save". The session will be saved to the local database and can be reconnected at any time.

### Edit Session

Find the session you want to edit in the session list, click the edit button to modify the configuration. Changes take effect immediately without recreating the connection.

### Delete Session

Select the session you want to delete, click the delete button. Note:
- Deleting a session will not affect currently established connections
- Deletion operation cannot be undone, please operate with caution

### Session Grouping

To better manage a large number of servers, you can group related sessions.

**Create Group:**
1. When creating or editing a session, fill in the "Group" field
2. Enter a group name (e.g., "Production Environment", "Test Environment")
3. Sessions will be displayed in the list by group

**Default Group:**
- Sessions without a specified group will automatically be assigned to "Default Group"

---

## Quick Connect vs Session Management

### Quick Connect

Quick connect is suitable for temporary use scenarios:
- Connection configuration is not saved
- Cannot quickly restore after connection is closed
- Suitable for one-time operations

### Session Management

Session management is suitable for frequently used servers:
- Configuration is persistently saved to database
- Can reconnect at any time
- Supports grouping management
- Can edit and delete

**Selection Suggestions:**
- Temporary access or testing → Use quick connect
- Frequently used servers → Create session

---

## Connection Status

### Status Types

The session list will display the connection status of each session:

- **Connected** - Green icon, indicates normal connection
- **Disconnected** - Gray icon, indicates no connection established
- **Connecting** - Yellow icon, indicates connection is being established
- **Connection Failed** - Red icon, indicates connection failed

### Connection Management

- **Connect** - Click the connect button on the session card to establish connection
- **Disconnect** - Click the disconnect button to terminate connection
- **Reconnect** - Can quickly reconnect after disconnection

---

## Common Questions

### Connection Timeout

If connection times out, please check:
- Whether server address and port are correct
- Whether network connection is normal
- Whether firewall allows SSH connection
- Whether server SSH service is running

### Authentication Failed

If authentication fails, please check:
- Whether username is correct
- Whether password or key is correct
- Whether key file format is supported
- Whether key permissions are correct

### Host Key Warning

If host key warning appears, possible reasons:
- Server SSH service was reinstalled
- Man-in-the-middle attack (security risk)

Suggestions:
- Confirm server status before deciding whether to continue
- Contact server administrator to confirm

---

## Next Steps

Now that you have mastered SSH connection management, you can continue learning:

- [Basics](/docs/guide/basics) - Review basic operations
- [AI Intelligent Assistant](/docs/guide/ai-assistant) - Use AI assistant to improve efficiency
- [SFTP File Management](/docs/guide/sftp) - Manage remote files
- [Cloud Sync](/docs/guide/cloud-sync) - Sync sessions to cloud