use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use anyhow::{anyhow, Result};
use base64::{engine::general_purpose::STANDARD, Engine};

/// 服务器端加密服务
/// 用于二次加密客户端已加密的 SSH 认证信息
pub struct ServerEncryptionService {
    cipher: Aes256Gcm,
}

impl ServerEncryptionService {
    /// 从环境变量读取密钥
    pub fn from_env() -> Result<Self> {
        let key_str = std::env::var("SSH_ENCRYPTION_KEY")
            .unwrap_or_else(|_| {
                // 默认密钥（仅用于开发环境）
                "ssh-terminal-default-encryption-key-32bytes!!".to_string()
            });

        // 密钥必须是 32 字节（256 位）
        let key_bytes = key_str.as_bytes();
        let key_array = if key_bytes.len() >= 32 {
            let mut arr = [0u8; 32];
            arr.copy_from_slice(&key_bytes[0..32]);
            arr
        } else {
            return Err(anyhow!("SSH_ENCRYPTION_KEY 长度必须 >= 32 字节"));
        };

        let cipher = Aes256Gcm::new(&key_array.into());
        Ok(Self { cipher })
    }

    /// 加密 SSH 认证信息（客户端已加密的数据）
    pub fn encrypt_auth_method(&self, client_encrypted: &str) -> Result<String> {
        // 生成随机 nonce
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        
        // 加密
        let ciphertext = self.cipher
            .encrypt(&nonce, client_encrypted.as_bytes())
            .map_err(|e| anyhow!("加密失败: {}", e))?;
        
        // 组合 nonce + ciphertext
        let mut result = nonce.to_vec();
        result.extend_from_slice(&ciphertext);
        
        Ok(STANDARD.encode(result))
    }

    /// 解密 SSH 认证信息
    pub fn decrypt_auth_method(&self, encrypted: &str) -> Result<String> {
        // Base64 解码
        let data = STANDARD.decode(encrypted)
            .map_err(|e| anyhow!("Base64 解码失败: {}", e))?;
        
        if data.len() < 12 {
            return Err(anyhow!("加密数据格式错误"));
        }
        
        // 分离 nonce 和 ciphertext
        let (nonce_bytes, ciphertext) = data.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        
        // 解密
        let plaintext = self.cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| anyhow!("解密失败: {}", e))?;
        
        String::from_utf8(plaintext)
            .map_err(|e| anyhow!("UTF-8 解码失败: {}", e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_decryption() {
        let service = ServerEncryptionService::from_env().unwrap();
        
        let original = r#"{"Password":{"password":"test123"}}"#;
        let encrypted = service.encrypt_auth_method(original).unwrap();
        let decrypted = service.decrypt_auth_method(&encrypted).unwrap();
        
        assert_eq!(original, decrypted);
    }
}
