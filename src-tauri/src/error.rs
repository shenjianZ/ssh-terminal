use thiserror::Error;

#[derive(Error, Debug)]
pub enum SSHError {
    #[error("连接失败: {0}")]
    ConnectionFailed(String),

    #[error("认证失败: {0}")]
    AuthenticationFailed(String),

    #[error("会话未找到: {0}")]
    SessionNotFound(String),

    #[error("未连接")]
    NotConnected,

    #[error("IO错误: {0}")]
    IoError(#[from] std::io::Error),

    #[error("SSH错误: {0}")]
    Ssh(String),

    #[error("配置错误: {0}")]
    Config(String),

    #[error("加密错误: {0}")]
    Crypto(String),

    #[error("存储错误: {0}")]
    Storage(String),

    #[error("超时")]
    Timeout,
}

impl serde::Serialize for SSHError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type Result<T> = std::result::Result<T, SSHError>;
