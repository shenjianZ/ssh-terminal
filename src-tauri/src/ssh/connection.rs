use crate::ssh::backend::{SSHBackend, BackendReader};
use crate::ssh::session::{SessionConfig, SessionStatus, SessionInfo};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::{DateTime, Utc};

/// 连接实例信息（用于前端显示）
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ConnectionInfo {
    pub id: String,
    pub session_id: String,  // 关联的session配置ID
    pub name: String,
    pub status: SessionStatus,
    pub connected_at: Option<DateTime<Utc>>,
}

/// 实际的SSH连接实例
#[derive(Clone)]
pub struct ConnectionInstance {
    pub id: String,
    pub session_id: String,  // 关联的session配置ID
    pub config: SessionConfig,  // 保存配置副本
    pub status: Arc<Mutex<SessionStatus>>,
    pub connected_at: Arc<Mutex<Option<DateTime<Utc>>>>,

    // 后端连接
    pub backend: Arc<Mutex<Option<Box<dyn SSHBackend>>>>,
    pub backend_reader: Arc<Mutex<Option<Box<dyn BackendReader + Send>>>>,

    // 保留PTY相关字段以兼容（移动端使用 Send + Sync 类型）
    #[cfg(not(target_os = "android"))]
    pub pty_pair: Arc<Mutex<Option<Box<dyn portable_pty::MasterPty + Send>>>>,
    #[cfg(target_os = "android")]
    pub pty_pair: Arc<Mutex<Option<Box<dyn std::any::Any + Send + Sync>>>>,

    #[cfg(not(target_os = "android"))]
    pub pty_writer: Arc<Mutex<Option<Box<dyn std::io::Write + Send>>>>,
    #[cfg(target_os = "android")]
    pub pty_writer: Arc<Mutex<Option<Box<dyn std::any::Any + Send + Sync>>>>,

    #[cfg(not(target_os = "android"))]
    pub child: Arc<Mutex<Option<Box<dyn portable_pty::Child + Send>>>>,
    #[cfg(target_os = "android")]
    pub child: Arc<Mutex<Option<Box<dyn std::any::Any + Send + Sync>>>>,
}

impl ConnectionInstance {
    pub fn new(id: String, session_id: String, config: SessionConfig) -> Self {
        Self {
            id,
            session_id,
            config,
            status: Arc::new(Mutex::new(SessionStatus::Disconnected)),
            connected_at: Arc::new(Mutex::new(None)),
            backend: Arc::new(Mutex::new(None)),
            backend_reader: Arc::new(Mutex::new(None)),
            #[cfg(not(target_os = "android"))]
            pty_pair: Arc::new(Mutex::new(None)),
            #[cfg(target_os = "android")]
            pty_pair: Arc::new(Mutex::new(None)),
            #[cfg(not(target_os = "android"))]
            pty_writer: Arc::new(Mutex::new(None)),
            #[cfg(target_os = "android")]
            pty_writer: Arc::new(Mutex::new(None)),
            #[cfg(not(target_os = "android"))]
            child: Arc::new(Mutex::new(None)),
            #[cfg(target_os = "android")]
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

    pub async fn info(&self) -> ConnectionInfo {
        ConnectionInfo {
            id: self.id.clone(),
            session_id: self.session_id.clone(),
            name: self.config.name.clone(),
            status: self.status().await,
            connected_at: *self.connected_at.lock().await,
        }
    }

    /// 返回SessionInfo（用于兼容旧API）
    pub async fn session_info(&self) -> SessionInfo {
        SessionInfo {
            id: self.id.clone(),
            name: self.config.name.clone(),
            host: self.config.host.clone(),
            port: self.config.port,
            username: self.config.username.clone(),
            status: self.status().await,
            connected_at: *self.connected_at.lock().await,
            group: self.config.group.clone(),
            connection_session_id: Some(self.session_id.clone()),
            connection_id: Some(self.id.clone()),
        }
    }

    /// 创建 SFTP 客户端
    ///
    /// 此方法使用 Any trait 安全地 downcast backend
    pub async fn create_sftp_client(&self) -> crate::error::Result<crate::sftp::client::SftpClient> {
        use crate::ssh::backends::russh::RusshBackend;

        let backend_guard = self.backend.lock().await;
        let backend = backend_guard.as_ref()
            .ok_or(crate::error::SSHError::NotConnected)?;

        // 使用 as_any() 和 downcast_ref() 进行安全的类型转换
        let russh_backend = backend.as_any()
            .downcast_ref::<RusshBackend>()
            .ok_or(crate::error::SSHError::NotSupported("SFTP only supported with RusshBackend".to_string()))?;

        russh_backend.create_sftp_client_direct().await
    }
}
