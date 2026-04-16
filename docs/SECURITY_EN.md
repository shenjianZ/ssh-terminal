# Security Features

SSH Terminal prioritizes user data security, implementing multi-layer security mechanisms including encrypted storage, host key verification, authentication mechanisms, and more.

## Table of Contents

- [Encrypted Storage](#encrypted-storage)
- [Host Key Verification](#host-key-verification)
- [Authentication Mechanism](#authentication-mechanism)
- [Data Transmission Security](#data-transmission-security)
- [Security Best Practices](#security-best-practices)
- [Security Considerations](#security-considerations)

---

## Encrypted Storage

SSH Terminal uses industry-standard encryption algorithms to protect user sensitive data.

### Encryption Algorithms

**Symmetric Encryption**:
- Algorithm: AES-256-GCM
- Key length: 256 bits
- Mode: GCM (Galois/Counter Mode)
- Features:
  - Authenticated encryption
  - Tamper-proof
  - High performance

**Password Derivation**:
- Algorithm: Argon2id
- Parameters:
  - Time cost: 3
  - Memory cost: 64 MB
  - Parallelism: 4
  - Output length: 32 bytes
- Features:
  - Resistant to brute force
  - Resistant to GPU/ASIC attacks
  - Memory-intensive

### Encryption Flow

**Encrypting Password**:

```rust
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{SaltString, rand_core::OsRng};

// 1. Derive encryption key from user password
let password = user_password;
let salt = SaltString::generate(&mut OsRng);
let argon2 = Argon2::default();
let password_hash = argon2.hash_password(password.as_bytes(), &salt)?;
let key = Key::from_slice(password_hash.hash.unwrap().as_bytes());

// 2. Create AES-256-GCM cipher
let cipher = Aes256Gcm::new(key);

// 3. Generate random Nonce
let nonce = Nonce::from_slice(b"unique nonce"); // 96 bits

// 4. Encrypt data
let ciphertext = cipher.encrypt(nonce, plaintext.as_ref())?;

// 5. Save encrypted data (nonce needs to be saved together)
let encrypted_data = format!("{}:{}", hex::encode(nonce), hex::encode(ciphertext));
```

**Decrypting Password**:

```rust
// 1. Extract nonce and ciphertext from stored data
let parts: Vec<&str> = encrypted_data.split(':').collect();
let nonce_bytes = hex::decode(parts[0])?;
let ciphertext_bytes = hex::decode(parts[1])?;

// 2. Re-derive key
let key = derive_key_from_password(user_password)?;

// 3. Create decrypter
let cipher = Aes256Gcm::new(key);
let nonce = Nonce::from_slice(&nonce_bytes);

// 4. Decrypt data
let plaintext = cipher.decrypt(nonce, ciphertext_bytes.as_ref())?;
```

### Encrypted Data Types

**Session Passwords**:
- Storage: `ssh_sessions.password_encrypted`
- Encryption: AES-256-GCM
- Key Source: User password derivation

**SSH Private Keys**:
- Storage: `ssh_sessions.private_key_encrypted`
- Encryption: AES-256-GCM
- Key Source: User password derivation

**Private Key Passphrases**:
- Storage: `ssh_sessions.passphrase_encrypted`
- Encryption: AES-256-GCM
- Key Source: User password derivation

### Key Management

**Key Derivation**:
- Uses Argon2id algorithm
- Each session uses unique Salt
- Keys not stored, re-derived each time used

**Key Security**:
- Keys exist only in memory
- Not written to disk
- Not logged

**Key Rotation**:
- After changing user password, all encrypted data needs re-encryption
- Provides key rotation functionality

---

## Host Key Verification

SSH Terminal automatically detects SSH host key changes to prevent man-in-the-middle attacks.

### Host Key Types

**RSA**:
- Key length: 2048 / 4096 bits
- Signature algorithm: RSA-SHA2-256 / RSA-SHA2-512

**ECDSA**:
- Curve: P-256 / P-384 / P-521
- Signature algorithm: ECDSA-SHA2

**ED25519**:
- Key length: 256 bits
- Signature algorithm: EdDSA
- Features: High performance, strong security

### Host Key Verification Flow

**First Connection**:

```
User initiates connection
    ↓
SSH server sends host key
    ↓
Calculate host key fingerprint
    ↓
Check known_hosts file
    ↓
Record not found (first connection)
    ↓
Display host key fingerprint
    ↓
User confirms
    ↓
Save to known_hosts
    ↓
Establish connection
```

**Key Change Detection**:

```
User initiates connection
    ↓
SSH server sends host key
    ↓
Calculate host key fingerprint
    ↓
Check known_hosts file
    ↓
Record found but fingerprint doesn't match
    ↓
⚠️ WARNING: Host key has changed!
    ↓
Display warning message
    ↓
User confirms:
  - 1. Continue connecting (update known_hosts)
  - 2. Cancel connection
```

### known_hosts File

**File Location**:
- Windows: `%APPDATA%\ssh-terminal\known_hosts`
- macOS: `~/Library/Application Support/ssh-terminal/known_hosts`
- Linux: `~/.config/ssh-terminal/known_hosts`

**File Format**:

```
# Comments
[algorithm] [base64 encoded public key]
```

**Example**:

```
github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl
gitlab.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBFSMqzJeV9rUzU4kWitGjeR4PWSa29SPqJyFtMW6Mbf4uQrTJVzuu0dWjQ4H8+1Dp4n0mYJgG8qj0qLqVqVqVq
```

### Host Key Fingerprint Display

**Display Method**:
- SHA-256 fingerprint (recommended)
- MD5 fingerprint (compatibility)

**SHA-256 Format**:

```
SHA256:uNiVztksCsDhcc0u4e87B2pR0b0rJ6xQ7vJ7vJ7vJ7v
```

**MD5 Format**:

```
MD5:3f:4d:5e:6f:7g:8h:9i:0j:1k:2l:3m:4n:5o:6p:7q:8r
```

### Security Recommendations

1. **Verify fingerprint on first connection**
   - Get fingerprint through other channels (email, website)
   - Compare with displayed fingerprint

2. **Be vigilant on key changes**
   - Unless you explicitly know the key has changed
   - Otherwise cancel connection
   - Contact server administrator to confirm

3. **Regularly check known_hosts**
   - Delete records for unused servers
   - Keep file clean

---

## Authentication Mechanism

SSH Terminal uses JWT-based secure authentication mechanism.

### JWT Authentication

**Token Types**:
1. **Access Token**
   - Purpose: Access API
   - Expiration: 15 minutes
   - Storage: Memory / LocalStorage

2. **Refresh Token**
   - Purpose: Refresh Access Token
   - Expiration: 7 days
   - Storage: Redis

### Token Generation

**Access Token**:

```rust
use jsonwebtoken::{encode, EncodingKey, Header};

let claims = Claims {
    sub: user_id.to_string(),
    exp: (Utc::now() + Duration::minutes(15)).timestamp(),
    iat: Utc::now().timestamp(),
    token_type: "access".to_string(),
};

let token = encode(
    &Header::default(),
    &claims,
    &EncodingKey::from_secret(jwt_secret.as_ref())
)?;
```

**Refresh Token**:

```rust
use jsonwebtoken::{encode, EncodingKey, Header};

let claims = Claims {
    sub: user_id.to_string(),
    exp: (Utc::now() + Duration::days(7)).timestamp(),
    iat: Utc::now().timestamp(),
    token_type: "refresh".to_string(),
};

let token = encode(
    &Header::default(),
    &claims,
    &EncodingKey::from_secret(jwt_secret.as_ref())
)?;
```

### Token Verification

**Verify Access Token**:

```rust
use jsonwebtoken::{decode, DecodingKey, Validation, Validation};

let token_data = decode::<Claims>(
    &token,
    &DecodingKey::from_secret(jwt_secret.as_ref()),
    &Validation::new(jsonwebtoken::Algorithm::HS256)
)?;

let user_id = token_data.claims.sub;
```

**Verify Refresh Token**:

```rust
// 1. Verify Token signature
let token_data = decode::<Claims>(&token, ...)?;

// 2. Check if Token exists in Redis
let key = format!("refresh_tokens:{}", token_data.claims.sub);
let exists = redis.exists(&key)?;

if !exists {
    return Err("Invalid refresh token".into());
}

// 3. Generate new Access Token
let new_access_token = generate_access_token(&user_id)?;

// 4. Update Refresh Token in Redis
redis.del(&key)?;
redis.sadd(&key, &new_refresh_token)?;

return Ok((new_access_token, new_refresh_token));
```

### Token Refresh

**Auto Refresh**:
- Automatically refresh 5 minutes before Access Token expires
- Use Refresh Token to get new Access Token

**Manual Refresh**:
- Call `/auth/refresh` API
- Provide Refresh Token
- Get new Token pair

### Token Revocation

**Revoke Refresh Token**:
```rust
// Delete Token from Redis
let key = format!("refresh_tokens:{}", user_id);
redis.del(&key)?;
```

**Revoke All Tokens**:
```rust
// Delete all Refresh Tokens for user
let pattern = format!("refresh_tokens:{}", user_id);
redis.del(&pattern)?;
```

---

## Data Transmission Security

### HTTPS/TLS

**Enforce HTTPS**:
- All API requests must use HTTPS
- Prevent man-in-the-middle attacks
- Protect data transmission security

**TLS Configuration**:
- Minimum version: TLS 1.2
- Recommended version: TLS 1.3
- Cipher suites: Strong cipher suites

### SSH Connection Security

**SSH Protocol Version**:
- Minimum version: SSH-2.0
- Recommended version: SSH-2.0

**Encryption Algorithms**:
- Symmetric encryption: AES-256-GCM / ChaCha20-Poly1305
- Key exchange: ECDH / Curve25519
- Signature algorithms: Ed25519 / RSA-SHA2-256

**Disable Insecure Algorithms**:
- SSH-1.0
- RC4
- 3DES
- CBC mode

---

## Security Best Practices

### 1. Password Security

**Set Strong Passwords**:
- Length at least 12 characters
- Include uppercase, lowercase, numbers, special characters
- Don't use common passwords

**Change Passwords Regularly**:
- Recommended every 3-6 months
- Don't reuse old passwords

**Don't Share Passwords**:
- Don't tell passwords to others
- Don't use same password in multiple places

### 2. Key Management

**Use SSH Key Authentication**:
- Prefer key authentication
- Use strong encryption algorithms (ED25519)
- Set password for keys

**Protect Private Keys**:
- Set private key file permissions to 600
- Don't upload private keys to public repositories
- Rotate keys regularly

### 3. Network Security

**Use Secure Networks**:
- Avoid using on public WiFi
- Use VPN for encrypted connections
- Verify SSL certificates

**Firewall Configuration**:
- Only open necessary ports
- Limit access sources
- Regularly review firewall rules

### 4. Data Security

**Regular Backups**:
- Regularly backup important data
- Use encrypted backups
- Test backup recovery

**Data Classification**:
- Distinguish sensitive and non-sensitive data
- Encrypt sensitive data storage
- Limit access permissions

### 5. Software Security

**Keep Updated**:
- Update SSH Terminal promptly
- Update OS and dependencies
- Install security patches

**Use Trusted Sources**:
- Download software from official channels
- Verify software signatures
- Don't use cracked software

---

## Security Considerations

### 1. Don't Enter Sensitive Information in Prompts

**Risk**:
- AI prompts may be logged
- Sensitive information may leak

**Recommendations**:
- Don't enter passwords, keys, or other sensitive information
- Don't enter personal identity information
- Don't enter trade secrets

### 2. Verify Host Keys

**Risk**:
- Man-in-the-middle attacks
- Connect to malicious servers

**Recommendations**:
- Verify fingerprint on first connection
- Be vigilant on key changes
- Contact server administrator to confirm

### 3. Protect Tokens

**Risk**:
- Token leakage leads to account compromise

**Recommendations**:
- Don't share Tokens
- Refresh Tokens regularly
- Clear Tokens on logout

### 4. Use Trusted AI Providers

**Risk**:
- Untrusted AI Providers may leak data

**Recommendations**:
- Use legitimate AI service providers
- Review privacy policies
- Understand data processing methods

### 5. Use Remote Commands Carefully

**Risk**:
- Accidentally executing dangerous commands
- Causing data loss or system damage

**Recommendations**:
- Carefully check commands
- Verify in test environment first
- Use version control

---

## Security Audit

### Logging

**Logged Security Events**:
- User login / logout
- Password changes
- Key operations
- File access
- Abnormal behavior

**Log Levels**:
- INFO: Normal operations
- WARN: Potential risks
- ERROR: Errors
- CRITICAL: Critical security events

### Security Monitoring

**Monitoring Metrics**:
- Login failure count
- Abnormal IP access
- Abnormal time access
- Large data transfers

**Alert Mechanism**:
- Send alerts when abnormal behavior detected
- Automatically lock accounts
- Notify administrators

---

## Summary

SSH Terminal implements multi-layer security mechanisms including AES-256-GCM encrypted storage, Argon2 password derivation, host key verification, JWT authentication, etc. Users should follow security best practices to protect their data and account security. Regularly updating software, using strong passwords, verifying host keys, and protecting Tokens are all important security measures.