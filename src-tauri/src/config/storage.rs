use crate::config::SessionConfig;
use crate::error::{Result, SSHError};
use std::fs;
use std::path::PathBuf;
use dirs::home_dir;
use serde::{Deserialize, Serialize};
use aes_gcm::{Aes256Gcm, Key, Nonce, KeyInit};
use aes_gcm::aead::Aead;
use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::SaltString;
use secrecy::{ExposeSecret, SecretString};
use base64::Engine;

/// 会话存储结构
#[derive(Debug, Serialize, Deserialize)]
pub struct SessionStorage {
    pub version: String,
    pub sessions: Vec<SavedSession>,
}

/// 应用配置存储结构
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub version: String,
    pub terminal_config: TerminalConfig,
}

/// AI 配置存储结构
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIAppConfig {
    pub version: String,
    pub ai_config: AIConfig,
}

/// AI Provider 配置
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct AIProviderConfig {
    #[serde(default)]
    pub id: String,
    #[serde(rename = "type", default)]
    pub provider_type: String, // "openai" | "ollama" | "qwen" | "wenxin"
    #[serde(default)]
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>, // 明文 API Key（前端使用，不保存到文件）
    #[serde(default)]
    pub api_key_encrypted: Option<String>, // 加密的 API Key（保存到文件）
    #[serde(default)]
    pub nonce: Option<String>, // AES-GCM nonce（保存到文件）
    #[serde(default)]
    pub base_url: Option<String>,
    #[serde(default)]
    pub model: String,
    #[serde(default = "default_temperature")]
    pub temperature: f32,
    #[serde(default = "default_max_tokens")]
    pub max_tokens: u32,
    #[serde(default)]
    pub enabled: bool,
}

fn default_temperature() -> f32 {
    0.7
}

fn default_max_tokens() -> u32 {
    2000
}

/// AI 配置
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AIConfig {
    pub providers: Vec<AIProviderConfig>,
    pub default_provider: String,
    pub shortcuts: AIShortcuts,
}

/// AI 快捷键配置
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AIShortcuts {
    pub explain_command: String,
    pub open_chat: String,
    pub nl_to_command: String,
}

/// 终端配置
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TerminalConfig {
    pub theme_id: String,
    pub font_size: u16,
    pub font_family: String,
    pub font_weight: u16,
    pub line_height: f32,
    pub cursor_style: String,
    pub cursor_blink: bool,
    pub letter_spacing: f32,
    pub padding: u16,
    pub scrollback: u32,
    pub keep_alive_interval: u64,
    pub notifications_enabled: bool,
    pub sound_effects_enabled: bool,
    #[serde(default = "default_video_quality")]
    pub video_quality: String,
    #[serde(default = "default_video_format")]
    pub video_format: String,
    #[serde(default = "default_record_microphone")]
    pub record_microphone: bool,
    #[serde(default = "default_record_speaker")]
    pub record_speaker: bool,
    #[serde(default = "default_audio_quality")]
    pub audio_quality: String,
    #[serde(default = "default_audio_sample_rate")]
    pub audio_sample_rate: u32,
    #[serde(default = "default_app_theme")]
    pub app_theme: String,
}

fn default_video_quality() -> String {
    "medium".to_string()
}

fn default_video_format() -> String {
    "webm".to_string()
}

fn default_record_microphone() -> bool {
    false
}

fn default_record_speaker() -> bool {
    false
}

fn default_audio_quality() -> String {
    "medium".to_string()
}

fn default_audio_sample_rate() -> u32 {
    48000
}

fn default_app_theme() -> String {
    "system".to_string()
}

/// 保存的会话（密码已加密）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SavedSession {
    pub id: String, // 服务器配置的唯一标识符
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth_method_encrypted: String, // 加密的认证信息
    #[serde(default)] // 向后兼容：旧版本没有nonce字段
    pub nonce: Option<String>, // AES-GCM nonce
    pub terminal_type: Option<String>,
    pub columns: Option<u16>,
    pub rows: Option<u16>,
    pub created_at: String,
    pub last_connected: Option<String>,
    #[serde(default = "default_group")]
    pub group: String,
}

fn default_group() -> String {
    "默认分组".to_string()
}

/// 存储管理器
pub struct Storage {
    storage_path: PathBuf,
    encryption_key: SecretString,
}

impl Storage {
    /// 创建新的存储实例
    pub fn new(app_handle: Option<&tauri::AppHandle>) -> Result<Self> {
        let storage_dir = Self::get_storage_dir(app_handle)?;

        // 确保存储目录存在
        fs::create_dir_all(&storage_dir)
            .map_err(|e| SSHError::Storage(format!("Failed to create storage directory: {}", e)))?;

        let storage_path = storage_dir.join("sessions.json");
        let key_path = storage_dir.join("encryption_key");

        // 生成或加载加密密钥
        let encryption_key = Self::get_or_create_encryption_key(&key_path)?;

        Ok(Self {
            storage_path,
            encryption_key,
        })
    }

    /// 获取或创建加密密钥
    fn get_or_create_encryption_key(key_path: &PathBuf) -> Result<SecretString> {
        if key_path.exists() {
            // 从文件加载密钥
            let key_content = fs::read_to_string(key_path)
                .map_err(|e| SSHError::Storage(format!("Failed to read encryption key: {}", e)))?;
            Ok(SecretString::new(key_content.trim().to_string()))
        } else {
            // 生成新密钥
            let key: String = (0..64)
                .map(|_| {
                    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ\
                                        abcdefghijklmnopqrstuvwxyz\
                                        0123456789";
                    CHARSET[rand::random::<usize>() % CHARSET.len()] as char
                })
                .collect();

            // 保存密钥到文件（设置权限）
            fs::write(key_path, &key)
                .map_err(|e| SSHError::Storage(format!("Failed to save encryption key: {}", e)))?;

            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = fs::metadata(key_path)
                    .map_err(|e| SSHError::Storage(format!("Failed to get key permissions: {}", e)))?
                    .permissions();
                perms.set_mode(0o600);
                fs::set_permissions(key_path, perms)
                    .map_err(|e| SSHError::Storage(format!("Failed to set key permissions: {}", e)))?;
            }

            Ok(SecretString::new(key))
        }
    }

    /// 获取应用存储目录（公共方法）
    ///
    /// 返回应用的主存储目录，所有配置文件和数据都存储在此目录下。
    ///
    /// # 路径示例
    /// - **Windows**: `C:\Users\{Username}\.tauri-terminal`
    /// - **macOS**: `~/Library/Application Support/tauri-terminal`
    /// - **Linux**: `~/.config/tauri-terminal`
    ///
    /// # 存储内容
    /// - `sessions.json` - SSH 会话配置（加密）
    /// - `app_config.json` - 应用配置
    /// - `ai_config.json` - AI 服务配置（API Keys 加密）
    /// - `encryption_key` - 加密密钥
    /// - `recording/` - 终端录制文件（子目录）
    ///
    /// # 错误处理
    /// 如果无法获取用户主目录，返回 `SSHError::Storage` 错误。
    ///
    /// # 示例
    /// ```no_run
    /// use crate::config::storage::Storage;
    ///
    /// let storage_dir = Storage::get_app_storage_dir().unwrap();
    /// println!("Storage directory: {:?}", storage_dir);
    /// ```
    pub fn get_app_storage_dir() -> Result<PathBuf> {
        let home = home_dir()
            .ok_or_else(|| SSHError::Storage("Failed to get home directory".to_string()))?;

        let storage_dir = if cfg!(target_os = "windows") {
            home.join(".tauri-terminal")
        } else if cfg!(target_os = "macos") {
            home.join("Library/Application Support/tauri-terminal")
        } else {
            // Linux
            home.join(".config/tauri-terminal")
        };

        Ok(storage_dir)
    }

    /// 获取录制文件存储目录（公共方法）
    ///
    /// 返回终端录制文件的专用存储目录。
    ///
    /// # 路径示例
    /// - **Windows**: `C:\Users\{Username}\.tauri-terminal\recording`
    /// - **macOS**: `~/Library/Application Support/tauri-terminal/recording`
    /// - **Linux**: `~/.config/tauri-terminal/recording`
    ///
    /// # 存储内容
    /// - `{session_name}_{date}_{time}.json` - 录制元数据（时长、终端类型等）
    /// - `{session_name}_{date}_{time}.webm` - WebM 格式视频文件
    /// - `{session_name}_{date}_{time}.mp4` - MP4 格式视频文件
    ///
    /// # 注意
    /// 此方法不会自动创建目录，调用者需要确保目录存在。
    ///
    /// # 示例
    /// ```no_run
    /// use crate::config::storage::Storage;
    /// use std::fs;
    ///
    /// let recordings_dir = Storage::get_recordings_storage_dir().unwrap();
    /// // 确保目录存在
    /// fs::create_dir_all(&recordings_dir).unwrap();
    /// println!("Recordings directory: {:?}", recordings_dir);
    /// ```
    pub fn get_recordings_storage_dir() -> Result<PathBuf> {
        let app_dir = Self::get_app_storage_dir()?;
        Ok(app_dir.join("recording"))
    }

    /// 获取存储目录（内部方法）
    fn get_storage_dir(_app_handle: Option<&tauri::AppHandle>) -> Result<PathBuf> {
        #[cfg(target_os = "android")]
        {
            // Android: 使用Tauri的PathResolver API
            if let Some(handle) = app_handle {
                let path_resolver = handle.path();
                let app_data_dir = path_resolver
                    .app_local_data_dir()
                    .map_err(|e| SSHError::Storage(format!("Failed to get app data dir: {}", e)))?;
                Ok(app_data_dir.join("tauri-terminal"))
            } else {
                // 降级方案：使用环境变量或固定路径
                use std::env;
                let app_id = env::var("CARGO_PKG_NAME").unwrap_or_else(|_| "com.shenjianz.ssh_terminal".to_string());
                Ok(PathBuf::from(format!("/data/data/{}/files", app_id.replace('.', "_"))))
            }
        }

        #[cfg(not(target_os = "android"))]
        {
            // 桌面平台：使用统一的存储目录方法
            Self::get_app_storage_dir()
        }
    }

    /// 加载所有保存的会话，返回 (id, config) 元组列表
    pub fn load_sessions(&self) -> Result<Vec<(String, SessionConfig)>> {
        if !self.storage_path.exists() {
            // 如果文件不存在，返回空列表
            return Ok(Vec::new());
        }

        let content = fs::read_to_string(&self.storage_path)
            .map_err(|e| SSHError::Storage(format!("Failed to read storage file: {}", e)))?;

        let storage: SessionStorage = serde_json::from_str(&content)
            .map_err(|e| SSHError::Storage(format!("Failed to parse storage file: {}", e)))?;

        // 解密并转换为 (id, SessionConfig) 元组
        let sessions: Result<Vec<(String, SessionConfig)>> = storage.sessions
            .into_iter()
            .map(|s| self.decrypt_session(s))
            .collect();

        sessions
    }

    /// 保存会话列表
    pub fn save_sessions(&self, sessions: &[(String, SessionConfig)]) -> Result<()> {
        let saved_sessions: Result<Vec<SavedSession>> = sessions
            .iter()
            .map(|(id, config)| self.encrypt_session(id.clone(), config.clone()))
            .collect();

        let saved_sessions = saved_sessions?;

        let storage = SessionStorage {
            version: "1.0".to_string(),
            sessions: saved_sessions,
        };

        let content = serde_json::to_string_pretty(&storage)
            .map_err(|e| SSHError::Storage(format!("Failed to serialize sessions: {}", e)))?;

        fs::write(&self.storage_path, content)
            .map_err(|e| SSHError::Storage(format!("Failed to write storage file: {}", e)))?;

        Ok(())
    }

    /// 加密会话（使用 AES-256-GCM）
    fn encrypt_session(&self, id: String, session: SessionConfig) -> Result<SavedSession> {
        // 将 AuthMethod 序列化为 JSON
        let auth_json = serde_json::to_string(&session.auth_method)
            .map_err(|e| SSHError::Crypto(format!("Failed to serialize auth method: {}", e)))?;

        // 从密钥字符串派生 AES-256 密钥
        let key_bytes = self.derive_key_from_password(self.encryption_key.expose_secret())?;
        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);

        // 生成随机 nonce
        let nonce_bytes: [u8; 12] = rand::random();
        let nonce = Nonce::from_slice(&nonce_bytes);

        // 加密数据
        let cipher = Aes256Gcm::new(key);
        let ciphertext = cipher
            .encrypt(nonce, auth_json.as_bytes())
            .map_err(|e| SSHError::Crypto(format!("Encryption failed: {}", e)))?;

        // 编码为 base64
        let auth_method_encrypted = base64::engine::general_purpose::STANDARD.encode(&ciphertext);
        let nonce_encoded = base64::engine::general_purpose::STANDARD.encode(&nonce_bytes);

        Ok(SavedSession {
            id,
            name: session.name,
            host: session.host,
            port: session.port,
            username: session.username,
            auth_method_encrypted,
            nonce: Some(nonce_encoded),
            terminal_type: session.terminal_type,
            columns: session.columns,
            rows: session.rows,
            created_at: chrono::Utc::now().to_rfc3339(),
            last_connected: None,
            group: session.group,
        })
    }

    /// 从密码派生 AES-256 密钥
    fn derive_key_from_password(&self, password: &str) -> Result<[u8; 32]> {
        // 使用固定的salt，确保加密和解密时密钥一致
        let salt = SaltString::from_b64("dGh1cmktdGVybWluYWwtZml4ZWQtc2FsdC0yMDI0")
            .map_err(|e| SSHError::Crypto(format!("Failed to create salt: {}", e)))?;

        let argon2 = Argon2::default();

        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| SSHError::Crypto(format!("Key derivation failed: {}", e)))?;

        // 从哈希中提取32字节作为密钥
        let hash_output = password_hash.hash.expect("Password hash should be present");
        let hash_bytes = hash_output.as_bytes();
        let mut key = [0u8; 32];
        key.copy_from_slice(&hash_bytes[..32]);
        Ok(key)
    }

    /// 解密会话（支持旧格式 base64 和新格式 AES-256-GCM）
    /// 返回 (id, SessionConfig) 元组
    fn decrypt_session(&self, saved: SavedSession) -> Result<(String, SessionConfig)> {
        // 尝试解密
        let plaintext = if let Some(nonce_str) = &saved.nonce {
            // 有 nonce 字段，尝试 AES-256-GCM 解密
            let key_bytes = self.derive_key_from_password(self.encryption_key.expose_secret())?;
            let key = Key::<Aes256Gcm>::from_slice(&key_bytes);

            // 解码 nonce 和密文
            let nonce_bytes = base64::engine::general_purpose::STANDARD
                .decode(nonce_str)
                .map_err(|e| SSHError::Crypto(format!("Failed to decode nonce: {}", e)))?;

            let ciphertext = base64::engine::general_purpose::STANDARD
                .decode(&saved.auth_method_encrypted)
                .map_err(|e| SSHError::Crypto(format!("Failed to decode ciphertext: {}", e)))?;

            // 尝试解密数据
            let nonce = Nonce::from_slice(&nonce_bytes);
            let cipher = Aes256Gcm::new(key);

            match cipher.decrypt(nonce, ciphertext.as_ref()) {
                Ok(data) => data,
                Err(_) => {
                    // 解密失败，可能是旧格式数据被错误地添加了nonce
                    // 回退到 base64 解码
                    println!("AES-GCM decryption failed, falling back to base64 for session: {}", saved.name);
                    base64::engine::general_purpose::STANDARD
                        .decode(&saved.auth_method_encrypted)
                        .map_err(|e| SSHError::Crypto(format!("Failed to decode base64: {}", e)))?
                }
            }
        } else {
            // 没有 nonce 字段，使用 base64 解码
            base64::engine::general_purpose::STANDARD
                .decode(&saved.auth_method_encrypted)
                .map_err(|e| SSHError::Crypto(format!("Failed to decode base64: {}", e)))?
        };

        // 反序列化 AuthMethod
        let auth_method = serde_json::from_slice(&plaintext)
            .map_err(|e| {
                println!("Failed to deserialize auth method for session '{}': {}", saved.name, e);
                println!("Plaintext length: {}, first 100 bytes: {:?}", plaintext.len(), &plaintext[..plaintext.len().min(100)]);
                println!("Plaintext (as string): {}", String::from_utf8_lossy(&plaintext));
                SSHError::Crypto(format!("Failed to deserialize auth method: {}", e))
            })?;

        let config = SessionConfig {
            name: saved.name,
            host: saved.host,
            port: saved.port,
            username: saved.username,
            auth_method,
            terminal_type: saved.terminal_type,
            columns: saved.columns,
            rows: saved.rows,
            strict_host_key_checking: true, // 默认启用严格的主机密钥验证
            group: saved.group,
            keep_alive_interval: 30, // 默认30秒
        };

        Ok((saved.id, config))
    }

    /// 删除存储文件
    pub fn clear(&self) -> Result<()> {
        if self.storage_path.exists() {
            fs::remove_file(&self.storage_path)
                .map_err(|e| SSHError::Storage(format!("Failed to remove storage file: {}", e)))?;
        }
        Ok(())
    }

    /// 删除单个会话配置（根据名称匹配）
    pub fn delete_session(&self, session_name: &str) -> Result<bool> {
        if !self.storage_path.exists() {
            return Ok(false);
        }

        // 加载现有会话
        let sessions = self.load_sessions()?;
        let original_count = sessions.len();

        // 过滤掉要删除的会话（访问元组的第二个元素 .1.name）
        let updated_sessions: Vec<_> = sessions
            .into_iter()
            .filter(|s| s.1.name != session_name)
            .collect();

        // 如果会话数量没变，说明没找到
        if updated_sessions.len() == original_count {
            return Ok(false);
        }

        // 保存更新后的列表
        self.save_sessions(&updated_sessions)?;

        Ok(true)
    }

    /// 保存应用配置
    pub fn save_app_config(config: &TerminalConfig, app_handle: Option<&tauri::AppHandle>) -> Result<()> {
        let storage_dir = Self::get_storage_dir(app_handle)?;

        // 确保存储目录存在
        fs::create_dir_all(&storage_dir)
            .map_err(|e| SSHError::Storage(format!("Failed to create storage directory: {}", e)))?;

        let config_path = storage_dir.join("app_config.json");

        let app_config = AppConfig {
            version: "1.0".to_string(),
            terminal_config: config.clone(),
        };

        let content = serde_json::to_string_pretty(&app_config)
            .map_err(|e| SSHError::Storage(format!("Failed to serialize app config: {}", e)))?;

        fs::write(&config_path, content)
            .map_err(|e| SSHError::Storage(format!("Failed to write app config: {}", e)))?;

        Ok(())
    }

    /// 加载应用配置
    pub fn load_app_config(app_handle: Option<&tauri::AppHandle>) -> Result<Option<TerminalConfig>> {
        let storage_dir = Self::get_storage_dir(app_handle)?;
        let config_path = storage_dir.join("app_config.json");

        if !config_path.exists() {
            // 文件不存在，创建默认配置
            let default_config = Self::get_default_config();
            Self::save_app_config(&default_config, app_handle)?;
            return Ok(Some(default_config));
        }

        let content = fs::read_to_string(&config_path)
            .map_err(|e| SSHError::Storage(format!("Failed to read app config: {}", e)))?;

        let app_config: AppConfig = serde_json::from_str(&content)
            .map_err(|e| SSHError::Storage(format!("Failed to parse app config: {}", e)))?;

        Ok(Some(app_config.terminal_config))
    }

    /// 获取默认配置
    pub fn get_default_config() -> TerminalConfig {
        TerminalConfig {
            theme_id: "github-light".to_string(),
            font_size: 20,
            font_family: "Consolas, monospace".to_string(),
            font_weight: 900,
            line_height: 1.45,
            cursor_style: "underline".to_string(),
            cursor_blink: true,
            letter_spacing: 0.5,
            padding: 16,
            scrollback: 10000,
            keep_alive_interval: 30,
            notifications_enabled: true,
            sound_effects_enabled: true,
            video_quality: "medium".to_string(),
            video_format: "webm".to_string(),
            record_microphone: false,
            record_speaker: false,
            audio_quality: "medium".to_string(),
            audio_sample_rate: 48000,
            app_theme: "system".to_string(),
        }
    }

    /// 保存 AI 配置
    pub fn save_ai_config(config: &AIConfig, app_handle: Option<&tauri::AppHandle>) -> Result<()> {
        let storage_dir = Self::get_storage_dir(app_handle)?;

        // 确保存储目录存在
        fs::create_dir_all(&storage_dir)
            .map_err(|e| SSHError::Storage(format!("Failed to create storage directory: {}", e)))?;

        let config_path = storage_dir.join("ai_config.json");

        // 创建 Storage 实例用于加密
        let storage = Storage::new(app_handle)?;

        // 加密所有 API Keys
        let mut providers_to_save = Vec::new();
        for provider in &config.providers {
            let mut provider_to_save = provider.clone();

            // 如果有明文 apiKey，加密它
            if let Some(api_key) = &provider_to_save.api_key {
                if !api_key.is_empty() {
                    match storage.encrypt_api_key(api_key) {
                        Ok((encrypted_key, nonce)) => {
                            provider_to_save.api_key_encrypted = Some(encrypted_key);
                            provider_to_save.nonce = Some(nonce);
                            provider_to_save.api_key = None; // 清空明文
                        }
                        Err(e) => {
                            tracing::error!("Failed to encrypt API key for provider '{}': {}", provider.id, e);
                            return Err(e);
                        }
                    }
                }
            }

            providers_to_save.push(provider_to_save);
        }

        let config_to_save = AIConfig {
            providers: providers_to_save,
            default_provider: config.default_provider.clone(),
            shortcuts: config.shortcuts.clone(),
        };

        let app_config = AIAppConfig {
            version: "1.0".to_string(),
            ai_config: config_to_save,
        };

        let content = serde_json::to_string_pretty(&app_config)
            .map_err(|e| SSHError::Storage(format!("Failed to serialize AI config: {}", e)))?;

        fs::write(&config_path, content)
            .map_err(|e| SSHError::Storage(format!("Failed to write AI config: {}", e)))?;

        tracing::info!("AI config saved successfully");
        Ok(())
    }

    /// 加载 AI 配置
    pub fn load_ai_config(app_handle: Option<&tauri::AppHandle>) -> Result<Option<AIConfig>> {
        let storage_dir = Self::get_storage_dir(app_handle)?;
        let config_path = storage_dir.join("ai_config.json");

        if !config_path.exists() {
            // 文件不存在，创建默认配置
            let default_config = Self::get_default_ai_config();
            Self::save_ai_config(&default_config, app_handle)?;
            return Ok(Some(default_config));
        }

        let content = fs::read_to_string(&config_path)
            .map_err(|e| SSHError::Storage(format!("Failed to read AI config: {}", e)))?;

        let app_config: AIAppConfig = serde_json::from_str(&content)
            .map_err(|e| SSHError::Storage(format!("Failed to parse AI config: {}", e)))?;

        // 创建 Storage 实例用于解密
        let storage = Storage::new(app_handle)?;

        // 解密所有 API Keys 并清除加密字段
        let mut providers_loaded = Vec::new();
        for provider in app_config.ai_config.providers {
            let mut provider_loaded = provider.clone();

            // 如果有加密的 apiKey，解密它
            if let (Some(encrypted_key), Some(nonce)) = (&provider.api_key_encrypted, &provider.nonce) {
                match storage.decrypt_api_key(encrypted_key, nonce) {
                    Ok(decrypted_key) => {
                        provider_loaded.api_key = Some(decrypted_key);
                        // 清除加密字段，不返回给前端
                        provider_loaded.api_key_encrypted = None;
                        provider_loaded.nonce = None;
                    }
                    Err(e) => {
                        tracing::error!("Failed to decrypt API key for provider '{}': {}", provider.id, e);
                        // 解密失败时继续，但保持 api_key 为 None
                        provider_loaded.api_key_encrypted = None;
                        provider_loaded.nonce = None;
                    }
                }
            } else {
                // 即使没有加密字段，也要清除它们（如果有）
                provider_loaded.api_key_encrypted = None;
                provider_loaded.nonce = None;
            }

            providers_loaded.push(provider_loaded);
        }

        let config_loaded = AIConfig {
            providers: providers_loaded,
            default_provider: app_config.ai_config.default_provider,
            shortcuts: app_config.ai_config.shortcuts,
        };

        Ok(Some(config_loaded))
    }

    /// 获取默认 AI 配置
    pub fn get_default_ai_config() -> AIConfig {
        AIConfig {
            providers: vec![
                AIProviderConfig {
                    id: "openai-default".to_string(),
                    provider_type: "openai".to_string(),
                    name: "OpenAI".to_string(),
                    api_key: None, // 明文 API Key
                    base_url: None,
                    model: "gpt-3.5-turbo".to_string(),
                    temperature: 0.7,
                    max_tokens: 2000,
                    enabled: false,
                    ..Default::default()
                },
                AIProviderConfig {
                    id: "ollama-default".to_string(),
                    provider_type: "ollama".to_string(),
                    name: "Ollama (本地)".to_string(),
                    api_key: None,
                    base_url: Some("http://localhost:11434".to_string()),
                    model: "llama3.2".to_string(),
                    temperature: 0.7,
                    max_tokens: 2000,
                    enabled: false,
                    ..Default::default()
                },
            ],
            default_provider: "openai-default".to_string(),
            shortcuts: AIShortcuts {
                explain_command: "Ctrl+Shift+A".to_string(),
                open_chat: "Ctrl+Shift+I".to_string(),
                nl_to_command: "Ctrl+Shift+N".to_string(),
            },
        }
    }

    /// 加密 API Key
    pub fn encrypt_api_key(&self, api_key: &str) -> Result<(String, String)> {
        // 从密钥字符串派生 AES-256 密钥
        let key_bytes = self.derive_key_from_password(self.encryption_key.expose_secret())?;
        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);

        // 生成随机 nonce
        let nonce_bytes: [u8; 12] = rand::random();
        let nonce = Nonce::from_slice(&nonce_bytes);

        // 加密数据
        let cipher = Aes256Gcm::new(key);
        let ciphertext = cipher
            .encrypt(nonce, api_key.as_bytes())
            .map_err(|e| SSHError::Crypto(format!("Encryption failed: {}", e)))?;

        // 编码为 base64
        let api_key_encrypted = base64::engine::general_purpose::STANDARD.encode(&ciphertext);
        let nonce_encoded = base64::engine::general_purpose::STANDARD.encode(&nonce_bytes);

        Ok((api_key_encrypted, nonce_encoded))
    }

    /// 解密 API Key
    pub fn decrypt_api_key(&self, encrypted_key: &str, nonce_str: &str) -> Result<String> {
        let key_bytes = self.derive_key_from_password(self.encryption_key.expose_secret())?;
        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);

        // 解码 nonce 和密文
        let nonce_bytes = base64::engine::general_purpose::STANDARD
            .decode(nonce_str)
            .map_err(|e| SSHError::Crypto(format!("Failed to decode nonce: {}", e)))?;

        let ciphertext = base64::engine::general_purpose::STANDARD
            .decode(encrypted_key)
            .map_err(|e| SSHError::Crypto(format!("Failed to decode ciphertext: {}", e)))?;

        // 解密数据
        let nonce = Nonce::from_slice(&nonce_bytes);
        let cipher = Aes256Gcm::new(key);

        let decrypted_data = cipher.decrypt(nonce, ciphertext.as_ref())
            .map_err(|e| SSHError::Crypto(format!("Decryption failed: {}", e)))?;

        String::from_utf8(decrypted_data)
            .map_err(|e| SSHError::Crypto(format!("Invalid UTF-8: {}", e)))
    }
}

// Note: Default trait removed because Storage now requires AppHandle
