// 桌面平台 PTY 实现（使用 portable-pty）
// 这个文件为未来扩展预留，当前实现在 system_ssh.rs 中

/// 桌面平台 PTY 封装
///
/// 使用 portable-pty 库提供完整的 PTY 支持
#[allow(dead_code)]
pub struct DesktopPTY {
    // TODO: 封装 portable-pty 的实现
    _phantom: std::marker::PhantomData<()>,
}

impl DesktopPTY {
    pub fn new() -> Self {
        Self {
            _phantom: std::marker::PhantomData,
        }
    }
}
