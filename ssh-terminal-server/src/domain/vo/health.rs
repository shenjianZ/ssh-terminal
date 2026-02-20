use serde::Serialize;

/// 健康检查结果
#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct HealthCheckResult {
    pub status: String,
}

impl HealthCheckResult {
    pub fn ok() -> Self {
        Self {
            status: "ok".to_string(),
        }
    }

    pub fn unavailable() -> Self {
        Self {
            status: "unavailable".to_string(),
        }
    }
}

/// 服务器信息
#[derive(Debug, Serialize)]
pub struct ServerInfoResult {
    pub name: String,
    pub version: String,
    pub status: String,
    pub timestamp: i64,
}

impl ServerInfoResult {
    pub fn new() -> Self {
        Self {
            name: "ssh-terminal-server".to_string(),
            version: "1.0".to_string(),
            status: "running".to_string(),
            timestamp: chrono::Utc::now().timestamp(),
        }
    }
}
