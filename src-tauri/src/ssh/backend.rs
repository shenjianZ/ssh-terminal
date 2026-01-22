use crate::error::Result;
use async_trait::async_trait;
use tokio::io::AsyncRead;

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
