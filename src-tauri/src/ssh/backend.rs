use crate::error::Result;
use async_trait::async_trait;
use tokio::io::AsyncRead;

#[allow(unused_imports)]
use std::any::Any;

/// SSH 后端统一抽象 trait
///
/// 所有 SSH 实现必须实现此 trait，以提供统一的接口
#[async_trait]
pub trait SSHBackend: Send {
    /// 连接到 SSH 服务器
    ///
    /// # 参数
    /// - `config`: SSH 会话配置
    async fn connect(&mut self, config: &crate::ssh::session::SessionConfig) -> Result<()>;

    /// 写入数据到 SSH 会话
    ///
    /// # 参数
    /// - `data`: 要写入的字节数据
    async fn write(&mut self, data: &[u8]) -> Result<()>;

    /// 调整终端大小（PTY）
    ///
    /// # 参数
    /// - `rows`: 行数
    /// - `cols`: 列数
    async fn resize(&mut self, rows: u16, cols: u16) -> Result<()>;

    /// 断开 SSH 连接
    async fn disconnect(&mut self) -> Result<()>;

    /// 获取读取器（用于读取 SSH 输出）
    ///
    /// 返回一个异步读取器，可以读取 SSH 服务器的输出
    fn reader(&mut self) -> Result<Box<dyn BackendReader + Send>>;

    /// 获取 Any 引用，用于安全的 downcasting
    ///
    /// 实现时应该返回 `self`
    fn as_any(&self) -> &dyn std::any::Any;

    /// 打开 SFTP 子系统 channel（异步版本）
    ///
    /// 默认实现返回不支持错误，只有支持 SFTP 的 backend 需要实现此方法
    ///
    /// # 返回
    /// 实现了 AsyncRead + AsyncWrite 的 channel stream
    async fn open_sftp_channel_async(&mut self) -> Result<Box<dyn SftpStream>> {
        Err(crate::error::SSHError::NotSupported("SFTP not supported by this backend".to_string()))
    }

    /// 打开 SFTP 子系统 channel（同步版本，已废弃）
    ///
    /// 默认实现返回不支持错误，只有支持 SFTP 的 backend 需要实现此方法
    ///
    /// # 返回
    /// 实现了 AsyncRead + AsyncWrite 的 channel stream
    #[deprecated(note = "Use open_sftp_channel_async instead")]
    fn open_sftp_channel(&mut self) -> Result<Box<dyn SftpStream>> {
        Err(crate::error::SSHError::NotSupported("SFTP not supported by this backend".to_string()))
    }
}

/// SFTP Stream trait
///
/// 用于 SFTP 子系统的数据流，需要支持读写
pub trait SftpStream: AsyncRead + tokio::io::AsyncWrite + Send + Sync + Unpin {
    /// as any conversion for downcasting
    fn as_any_mut(&mut self) -> &mut dyn std::any::Any;
}


/// 异步读取器 trait
///
/// 用于从 SSH 会话读取数据
pub trait BackendReader: AsyncRead + Send + Unpin {
    /// as any conversion for downcasting
    fn as_any(&self) -> &dyn std::any::Any;
}

// 为实现 AsyncRead 的类型提供默认的 as_any 实现
impl<T: AsyncRead + Send + Unpin + 'static> BackendReader for T {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
}
