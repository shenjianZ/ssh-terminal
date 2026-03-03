# Cloud Sync

SSH Terminal provides powerful cloud sync features, allowing you to sync SSH sessions, configurations, and user profiles across multiple devices.

---

## Cloud Sync Introduction

The cloud sync feature can securely store your important data in the cloud, enabling:

- **Multi-Device Access** - Access the same configuration on different devices
- **Data Backup** - Automatically backup important data to prevent loss

### Synced Data Types

SSH Terminal supports syncing the following data:

- **SSH Session Configurations** - All saved SSH connection configurations
- **User Profiles** - Username, avatar, and other personal information

**Note:** Sensitive information like passwords and keys are encrypted before storage to ensure security.

---

## Configure Cloud Sync

### Configure Server URL
First-time use of cloud sync requires configuring the server address in settings

1. Go to settings page, click "Account & Services" tab
2. Enter URL in "Server Address", click save

### Account Registration

First-time use of cloud sync requires account registration:

1. Click the avatar icon in the title bar, then click "Register" below
2. Fill in registration information:
   - **Email** - For login and receiving notifications
   - **Verification Code (Optional)** - For email registration verification
   - **Password** - Login password
3. Click "Register" to complete account creation

**Notes:**
- Password must meet strength requirements (at least 8 characters, including letters and numbers)
- Email needs to be verified before using all features

### Account Login

If you already have an account, you can log in directly:

1. Click the avatar icon in the title bar
2. Enter email and password
3. Click "Login" button

- Login status will be saved after login
- Auto-login on next application launch
- Click title bar avatar, dropdown menu appears, click "Logout" to exit login

### Reset Password (Not Currently Supported)

If you forgot your password, you can reset it:

1. Click "Forgot Password" on the login page
2. Enter registered email
3. Check email for reset link
4. Follow email instructions to set new password

---

## Sync Operations

### Manual Sync

Manually trigger data sync:

1. After login, click the "Sync" icon button in the title bar
2. Wait for sync to complete

**Sync Process:**
- Upload locally modified data to cloud
- Download cloud data to local
- Merge data from both sides

### Auto Sync (Not Currently Supported)

After enabling auto sync, the application will automatically sync in the following situations:

- After configuration changes
- Periodic check (default every 30 minutes)
- On application startup

**Enable Auto Sync:**
1. Open settings page, switch to "Sync" tab
2. Turn on "Auto Sync" switch

**Sync Interval Setting:**
- Can customize sync interval (15-120 minutes)
- Recommended value: 30 minutes

### Sync Status (Only Supports Viewing Last Sync Time)

In the sync tab, you can view:
- **Last Sync Time** - Time of most recent sync
- **Pending Sync Count** - Number of data items waiting to sync
- **Conflict Count** - Number of conflicts that need resolution
- **Sync Status** - Current sync status (syncing, completed, failed)

---

## Conflict Resolution

When local and cloud data are inconsistent, conflicts will occur.

### Conflict Types

Common conflict scenarios:
- Same session modified on multiple devices simultaneously
- Delete and modify operation conflicts
- Configuration version inconsistency

### Conflict Strategies (Server Currently Uses Remote-First, and Does Not Support Configuration)

SSH Terminal provides three conflict resolution strategies:

#### Local Priority
Keep local version, overwrite cloud data

**Applicable Scenarios:**
- Confirmed local version is correct
- After network interruption and sync recovery

#### Remote Priority
Keep cloud version, overwrite local data

**Applicable Scenarios:**
- Confirmed cloud version is correct
- Restore data from cloud

#### Keep Latest
Keep the most recently modified version

**Applicable Scenarios:**
- Unsure which version is correct
- Want to keep the latest modification

### Resolve Conflicts (Server Currently Uses Remote-First, and Does Not Support Configuration)

When conflicts are detected:

1. Conflict list will be displayed in the sync tab
2. Click on conflict item to view details
3. Select resolution strategy (local priority / remote priority / keep latest)
4. Click "Resolve" button
5. After conflict resolution, automatically re-sync

**Batch Resolution:**
- Can select multiple conflict items
- Apply same strategy to batch resolve

---

## Common Questions

### Sync Failed

Possible causes:
- Network connection interrupted
- Server maintenance
- Authentication token expired

Solutions:
- Check network connection
- Re-login to account
- Retry later

### Data Loss

If data loss is discovered:

1. Check if other devices have data
2. View sync history to find loss time point
3. Restore data from cloud
4. Contact technical support

### Frequent Conflicts

If conflicts occur frequently:

- Avoid modifying the same configuration on multiple devices simultaneously
- Sync latest data before modifying
- Use "Keep Latest" strategy to automatically resolve

---

## Next Steps

Now that you have mastered SSH Terminal's cloud sync features, you can continue learning:
- [Quick Deployment](/docs/config/env) - Deploy it to a server