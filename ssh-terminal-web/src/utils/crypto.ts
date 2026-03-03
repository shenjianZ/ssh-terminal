// 加密工具（用于 SSH 认证信息加密）
// 使用 Web Crypto API 实现 AES-256-GCM 加密
// 匹配 Tauri 后端的加密格式：AES-256-GCM

// 字节数组转 Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Base64 转字节数组
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// 字符串转字节数组
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder()
  return encoder.encode(str).buffer
}

// 字节数组转字符串
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder()
  return decoder.decode(buffer)
}

// 使用 PBKDF2 派生密钥
async function deriveKeyFromPassword(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

// 使用 PBKDF2 派生密钥（返回 Hex 格式，用于匹配 Tauri）
async function deriveKeyFromPasswordHex(password: string, salt: string): Promise<string> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const saltBuffer = base64ToArrayBuffer(salt)
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    256
  )

  // 转换为 Hex 字符串
  const bytes = new Uint8Array(bits)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// 生成随机 nonce (12 bytes, base64 encoded) - 匹配 Tauri
function generateNonce(): string {
  const array = new Uint8Array(12)
  crypto.getRandomValues(array)
  return arrayBufferToBase64(array.buffer)
}

// 生成随机 salt (16 bytes, base64 encoded) - 匹配 Tauri
function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return arrayBufferToBase64(array.buffer)
}

export const cryptoUtils = {
  // 生成随机 nonce
  generateNonce,
  
  // 生成随机 salt
  generateSalt,

  // 从密码派生密钥 (PBKDF2-HMAC-SHA256) - 返回 Hex 格式
  deriveKeyFromPassword: deriveKeyFromPasswordHex,

  // 使用 AES-256-GCM 加密认证信息 - 匹配 Tauri 的 encrypt_auth_method
  async encryptAuthMethod(authMethod: any, userPassword: string): Promise<{ encrypted: string; nonce: string; salt: string }> {
    const salt = this.generateSalt()
    const nonce = this.generateNonce()

    // 生成 Tauri 格式的 JSON: { "Password": { "password": "..." } }
    let authJson: string
    if (authMethod.type === 'password') {
      authJson = JSON.stringify({
        Password: {
          password: authMethod.password
        }
      })
    } else {
      throw new Error('Unsupported auth method type')
    }

    // 派生密钥（使用 Hex 格式）
    const keyHex = await this.deriveKeyFromPassword(userPassword, salt)
    const keyBuffer = new Uint8Array(
      keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    )

    const key = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    // 加密
    const nonceBuffer = base64ToArrayBuffer(nonce)
    const authBuffer = stringToArrayBuffer(authJson)

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonceBuffer
      },
      key,
      authBuffer
    )

    return {
      encrypted: arrayBufferToBase64(encrypted),
      nonce: nonce,
      salt: salt
    }
  },

  // 使用 AES-256-GCM 解密认证信息 - 匹配 Tauri 的 decrypt_auth_method
  async decryptAuthMethod(encrypted: string, nonce: string, salt: string, userPassword: string): Promise<any> {
    const keyHex = await this.deriveKeyFromPassword(userPassword, salt)
    const keyBuffer = new Uint8Array(
      keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    )

    const key = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    const nonceBuffer = base64ToArrayBuffer(nonce)
    const encryptedBuffer = base64ToArrayBuffer(encrypted)

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonceBuffer
      },
      key,
      encryptedBuffer
    )

    const authJson = arrayBufferToString(decrypted)
    const authMethod = JSON.parse(authJson)

    // 转换 Tauri 格式回 Web 格式
    if (authMethod.Password) {
      return {
        type: 'password',
        password: authMethod.Password.password
      }
    }

    throw new Error('Unsupported auth method format')
  },

  // 使用 device_id 加密密码 - 匹配 Tauri 的 encrypt_password
  async encryptPassword(password: string, deviceId: string): Promise<{ encrypted: string; nonce: string }> {
    const nonce = this.generateNonce()

    // 使用 PBKDF2 派生密钥（匹配 Tauri 端）
    // 固定盐值："ssh-terminal-device-id-salt-v1"
    const salt = stringToArrayBuffer('ssh-terminal-device-id-salt-v1')
    
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      stringToArrayBuffer(deviceId),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    // 加密
    const nonceBuffer = base64ToArrayBuffer(nonce)
    const passwordBuffer = stringToArrayBuffer(password)

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonceBuffer
      },
      key,
      passwordBuffer
    )

    return {
      encrypted: arrayBufferToBase64(encrypted),
      nonce: nonce
    }
  },

  // 使用 device_id 解密密码 - 匹配 Tauri 的 decrypt_password
  async decryptPassword(encrypted: string, nonce: string, deviceId: string): Promise<string> {
    const salt = stringToArrayBuffer('ssh-terminal-device-id-salt-v1')
    
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      stringToArrayBuffer(deviceId),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    const nonceBuffer = base64ToArrayBuffer(nonce)
    const encryptedBuffer = base64ToArrayBuffer(encrypted)

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonceBuffer
      },
      key,
      encryptedBuffer
    )

    return arrayBufferToString(decrypted)
  }
}