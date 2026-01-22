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

    // 保留PTY相关字段以兼容
    pub pty_pair: Arc<Mutex<Option<Box<dyn portable_pty::MasterPty + Send>>>>,
    pub pty_writer: Arc<Mutex<Option<Box<dyn std::io::Write + Send>>>>,
    pub child: Arc<Mutex<Option<Box<dyn portable_pty::Child + Send>>>>,
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
        }
    }
}
