use crate::error::{Result, SSHError};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::io::Write;
use tokio::sync::Mutex;
use portable_pty::PtySize;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SessionConfig {
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth_method: AuthMethod,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub terminal_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub columns: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rows: Option<u16>,
    /// 是否需要持久化保存到存储
    #[serde(default)]
    pub persist: bool,
    /// 是否启用严格的主机密钥验证
    #[serde(default = "default_strict_host_key_checking")]
    pub strict_host_key_checking: bool,
}

fn default_strict_host_key_checking() -> bool {
    true // 默认启用严格的主机密钥验证
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum AuthMethod {
    Password { password: String },
    PublicKey { private_key_path: String, passphrase: Option<String> },
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    Disconnected,
    Connecting,
    Connected,
    Error(String),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SessionInfo {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub status: SessionStatus,
    pub connected_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Clone)]
pub struct SSHSession {
    pub id: String,
    pub config: SessionConfig,
    pub status: Arc<Mutex<SessionStatus>>,
    pub connected_at: Arc<Mutex<Option<chrono::DateTime<chrono::Utc>>>>,
    pub pty_pair: Arc<Mutex<Option<Box<dyn portable_pty::MasterPty + Send>>>>,
    pub pty_writer: Arc<Mutex<Option<Box<dyn std::io::Write + Send>>>>,
    pub child: Arc<Mutex<Option<Box<dyn portable_pty::Child + Send>>>>,
}

impl SSHSession {
    pub fn new(id: String, config: SessionConfig) -> Self {
        Self {
            id,
            config,
            status: Arc::new(Mutex::new(SessionStatus::Disconnected)),
            connected_at: Arc::new(Mutex::new(None)),
            pty_pair: Arc::new(Mutex::new(None)),
            pty_writer: Arc::new(Mutex::new(None)),
            child: Arc::new(Mutex::new(None)),
        }
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub async fn status(&self) -> SessionStatus {
        self.status.lock().await.clone()
    }

    pub async fn set_status(&self, status: SessionStatus) {
        *self.status.lock().await = status;
    }

    pub async fn info(&self) -> SessionInfo {
        let status = self.status().await;
        let connected_at = *self.connected_at.lock().await;
        SessionInfo {
            id: self.id.clone(),
            name: self.config.name.clone(),
            host: self.config.host.clone(),
            port: self.config.port,
            username: self.config.username.clone(),
            status,
            connected_at,
        }
    }

    pub async fn write(&self, data: Vec<u8>) -> Result<()> {
        let mut writer = self.pty_writer.lock().await;
        if let Some(ref mut w) = *writer {
            w.write_all(&data)
                .map_err(SSHError::IoError)?;
            w.flush()
                .map_err(SSHError::IoError)?;
            Ok(())
        } else {
            Err(SSHError::NotConnected)
        }
    }

    pub async fn resize(&self, rows: u16, cols: u16) -> Result<()> {
        let pty_pair = self.pty_pair.lock().await;
        if let Some(ref master) = *pty_pair {
            master.resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            }).map_err(|e| SSHError::IoError(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())))?;
            Ok(())
        } else {
            Err(SSHError::NotConnected)
        }
    }
}
