# 安全特性

SSH Terminal 重视用户数据安全，实现了多层安全机制，包括加密存储、主机密钥验证、认证机制等。

## 目录

- [加密存储](#加密存储)
- [主机密钥验证](#主机密钥验证)
- [认证机制](#认证机制)
- [数据传输安全](#数据传输安全)
- [安全最佳实践](#安全最佳实践)
- [安全注意事项](#安全注意事项)

---

## 加密存储

SSH Terminal 使用行业标准的加密算法保护用户敏感数据。

### 加密算法

**对称加密**：
- 算法：AES-256-GCM
- 密钥长度：256 位
- 模式：GCM（Galois/Counter Mode）
- 特点：
  - 认证加密
  - 防止篡改
  - 高性能

**密码派生**：
- 算法：Argon2id
- 参数：
  - 时间成本：3
  - 内存成本：64 MB
  - 并行度：4
  - 输出长度：32 字节
- 特点：
  - 抗暴力破解
  - 抗 GPU/ASIC 攻击
  - 内存密集型

### 加密流程

**加密密码**：

```rust
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{SaltString, rand_core::OsRng};

// 1. 从用户密码派生加密密钥
let password = user_password;
let salt = SaltString::generate(&mut OsRng);
let argon2 = Argon2::default();
let password_hash = argon2.hash_password(password.as_bytes(), &salt)?;
let key = Key::from_slice(password_hash.hash.unwrap().as_bytes());

// 2. 创建 AES-256-GCM 加密器
let cipher = Aes256Gcm::new(key);

// 3. 生成随机 Nonce
let nonce = Nonce::from_slice(b"unique nonce"); // 96 位

// 4. 加密数据
let ciphertext = cipher.encrypt(nonce, plaintext.as_ref())?;

// 5. 保存加密数据（nonce 需要一起保存）
let encrypted_data = format!("{}:{}", hex::encode(nonce), hex::encode(ciphertext));
```

**解密密码**：

```rust
// 1. 从存储的数据中提取 nonce 和 ciphertext
let parts: Vec<&str> = encrypted_data.split(':').collect();
let nonce_bytes = hex::decode(parts[0])?;
let ciphertext_bytes = hex::decode(parts[1])?;

// 2. 重新派生密钥
let key = derive_key_from_password(user_password)?;

// 3. 创建解密器
let cipher = Aes256Gcm::new(key);
let nonce = Nonce::from_slice(&nonce_bytes);

// 4. 解密数据
let plaintext = cipher.decrypt(nonce, ciphertext_bytes.as_ref())?;
```

### 加密的数据类型

**会话密码**：
- 存储：`ssh_sessions.password_encrypted`
- 加密方式：AES-256-GCM
- 密钥来源：用户密码派生

**SSH 私钥**：
- 存储：`ssh_sessions.private_key_encrypted`
- 加密方式：AES-256-GCM
- 密钥来源：用户密码派生

**私钥密码**：
- 存储：`ssh_sessions.passphrase_encrypted`
- 加密方式：AES-256-GCM
- 密钥来源：用户密码派生

### 密钥管理

**密钥派生**：
- 使用 Argon2id 算法
- 每个会话使用唯一的 Salt
- 密钥不存储，每次使用时重新派生

**密钥安全**：
- 密钥只存在于内存中
- 不写入磁盘
- 不记录到日志

**密钥轮换**：
- 修改用户密码后，所有加密数据需要重新加密
- 提供密钥轮换功能

---

## 主机密钥验证

SSH Terminal 自动检测 SSH 主机密钥变化，防止中间人攻击。

### 主机密钥类型

**RSA**：
- 密钥长度：2048 / 4096 位
- 签名算法：RSA-SHA2-256 / RSA-SHA2-512

**ECDSA**：
- 曲线：P-256 / P-384 / P-521
- 签名算法：ECDSA-SHA2

**ED25519**：
- 密钥长度：256 位
- 签名算法：EdDSA
- 特点：性能高、安全性强

### 主机密钥验证流程

**首次连接**：

```
用户发起连接
    ↓
SSH 服务器发送主机密钥
    ↓
计算主机密钥指纹
    ↓
检查 known_hosts 文件
    ↓
未找到记录（首次连接）
    ↓
显示主机密钥指纹
    ↓
用户确认
    ↓
保存到 known_hosts
    ↓
建立连接
```

**密钥变化检测**：

```
用户发起连接
    ↓
SSH 服务器发送主机密钥
    ↓
计算主机密钥指纹
    ↓
检查 known_hosts 文件
    ↓
找到记录，但指纹不匹配
    ↓
⚠️ 警告：主机密钥已变化！
    ↓
显示警告信息
    ↓
用户确认：
  - 1. 继续连接（更新 known_hosts）
  - 2. 取消连接
```

### known_hosts 文件

**文件位置**：
- Windows: `%APPDATA%\ssh-terminal\known_hosts`
- macOS: `~/Library/Application Support/ssh-terminal/known_hosts`
- Linux: `~/.config/ssh-terminal/known_hosts`

**文件格式**：

```
# 注释
[算法] [base64编码的公钥]
```

**示例**：

```
github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl
gitlab.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBFSMqzJeV9rUzU4kWitGjeR4PWSa29SPqJyFtMW6Mbf4uQrTJVzuu0dWjQ4H8+1Dp4n0mYJgG8qj0qLqVqVqVq
```

### 主机密钥指纹显示

**显示方式**：
- SHA-256 指纹（推荐）
- MD5 指纹（兼容性）

**SHA-256 格式**：

```
SHA256:uNiVztksCsDhcc0u4e87B2pR0b0rJ6xQ7vJ7vJ7vJ7v
```

**MD5 格式**：

```
MD5:3f:4d:5e:6f:7g:8h:9i:0j:1k:2l:3m:4n:5o:6p:7q:8r
```

### 安全建议

1. **首次连接时验证指纹**
   - 通过其他渠道（邮件、网站）获取指纹
   - 对比显示的指纹是否匹配

2. **密钥变化时警惕**
   - 除非你明确知道密钥已更改
   - 否则应该取消连接
   - 联系服务器管理员确认

3. **定期检查 known_hosts**
   - 删除不再使用的服务器记录
   - 保持文件整洁

---

## 认证机制

SSH Terminal 使用基于 JWT 的安全认证机制。

### JWT 认证

**Token 类型**：
1. **Access Token**
   - 用途：访问 API
   - 过期时间：15 分钟
   - 存储位置：内存 / LocalStorage

2. **Refresh Token**
   - 用途：刷新 Access Token
   - 过期时间：7 天
   - 存储位置：Redis

### Token 生成

**Access Token**：

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

**Refresh Token**：

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

### Token 验证

**验证 Access Token**：

```rust
use jsonwebtoken::{decode, DecodingKey, Validation, Validation};

let token_data = decode::<Claims>(
    &token,
    &DecodingKey::from_secret(jwt_secret.as_ref()),
    &Validation::new(jsonwebtoken::Algorithm::HS256)
)?;

let user_id = token_data.claims.sub;
```

**验证 Refresh Token**：

```rust
// 1. 验证 Token 签名
let token_data = decode::<Claims>(&token, ...)?;

// 2. 检查 Token 是否在 Redis 中
let key = format!("refresh_tokens:{}", token_data.claims.sub);
let exists = redis.exists(&key)?;

if !exists {
    return Err("Invalid refresh token".into());
}

// 3. 生成新的 Access Token
let new_access_token = generate_access_token(&user_id)?;

// 4. 更新 Redis 中的 Refresh Token
redis.del(&key)?;
redis.sadd(&key, &new_refresh_token)?;

return Ok((new_access_token, new_refresh_token));
```

### Token 刷新

**自动刷新**：
- Access Token 过期前 5 分钟自动刷新
- 使用 Refresh Token 获取新的 Access Token

**手动刷新**：
- 调用 `/auth/refresh` API
- 提供 Refresh Token
- 获取新的 Token 对

### Token 撤销

**撤销 Refresh Token**：
```rust
// 删除 Redis 中的 Token
let key = format!("refresh_tokens:{}", user_id);
redis.del(&key)?;
```

**撤销所有 Token**：
```rust
// 删除用户的所有 Refresh Token
let pattern = format!("refresh_tokens:{}", user_id);
redis.del(&pattern)?;
```

---

## 数据传输安全

### HTTPS/TLS

**强制使用 HTTPS**：
- 所有 API 请求必须使用 HTTPS
- 防止中间人攻击
- 保护数据传输安全

**TLS 配置**：
- 最低版本：TLS 1.2
- 推荐版本：TLS 1.3
- 加密套件：强加密套件

### SSH 连接安全

**SSH 协议版本**：
- 最低版本：SSH-2.0
- 推荐版本：SSH-2.0

**加密算法**：
- 对称加密：AES-256-GCM / ChaCha20-Poly1305
- 密钥交换：ECDH / Curve25519
- 签名算法：Ed25519 / RSA-SHA2-256

**禁用不安全的算法**：
- SSH-1.0
- RC4
- 3DES
- CBC 模式

---

## 安全最佳实践

### 1. 密码安全

**设置强密码**：
- 长度至少 12 位
- 包含大小写字母、数字、特殊字符
- 不使用常见密码

**定期更换密码**：
- 建议每 3-6 个月更换一次
- 不要重复使用旧密码

**不要共享密码**：
- 不要将密码告诉他人
- 不要在多个地方使用相同密码

### 2. 密钥管理

**使用 SSH 密钥认证**：
- 优先使用密钥认证
- 使用强加密算法（ED25519）
- 为密钥设置密码

**保护私钥**：
- 私钥文件权限设置为 600
- 不要将私钥上传到公共仓库
- 定期轮换密钥

### 3. 网络安全

**使用安全的网络**：
- 避免在公共 WiFi 上使用
- 使用 VPN 加密连接
- 验证 SSL 证书

**防火墙配置**：
- 只开放必要的端口
- 限制访问来源
- 定期审查防火墙规则

### 4. 数据安全

**定期备份**：
- 定期备份重要数据
- 使用加密备份
- 测试备份恢复

**数据分类**：
- 区分敏感数据和非敏感数据
- 对敏感数据加密存储
- 限制访问权限

### 5. 软件安全

**保持更新**：
- 及时更新 SSH Terminal
- 更新操作系统和依赖库
- 安装安全补丁

**使用可信来源**：
- 从官方渠道下载软件
- 验证软件签名
- 不要使用破解软件

---

## 安全注意事项

### 1. 不要在提示中输入敏感信息

**风险**：
- AI 提示词可能被记录
- 敏感信息可能泄露

**建议**：
- 不要输入密码、密钥等敏感信息
- 不要输入个人身份信息
- 不要输入商业机密

### 2. 验证主机密钥

**风险**：
- 中间人攻击
- 连接到恶意服务器

**建议**：
- 首次连接时验证指纹
- 密钥变化时提高警惕
- 联系服务器管理员确认

### 3. 保护 Token

**风险**：
- Token 泄露导致账号被盗

**建议**：
- 不要分享 Token
- 定期刷新 Token
- 注销时清除 Token

### 4. 使用安全的 AI Provider

**风险**：
- 不安全的 AI Provider 可能泄露数据

**建议**：
- 使用正规的 AI 服务商
- 查看隐私政策
- 了解数据处理方式

### 5. 谨慎使用远程命令

**风险**：
- 误执行危险命令
- 造成数据丢失或系统损坏

**建议**：
- 仔细检查命令
- 先在测试环境验证
- 使用版本控制

---

## 安全审计

### 日志记录

**记录的安全事件**：
- 用户登录 / 登出
- 密码修改
- 密钥操作
- 文件访问
- 异常行为

**日志级别**：
- INFO：正常操作
- WARN：潜在风险
- ERROR：错误
- CRITICAL：严重安全事件

### 安全监控

**监控指标**：
- 登录失败次数
- 异常 IP 访问
- 异常时间访问
- 大量数据传输

**告警机制**：
- 检测到异常行为时发送告警
- 自动锁定账号
- 通知管理员

---

## 总结

SSH Terminal 实现了多层安全机制，包括 AES-256-GCM 加密存储、Argon2 密码派生、主机密钥验证、JWT 认证等。用户应该遵循安全最佳实践，保护自己的数据和账号安全。定期更新软件、使用强密码、验证主机密钥、保护 Token 等都是重要的安全措施。