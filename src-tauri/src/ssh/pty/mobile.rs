// 移动平台简化 PTY 实现
// 这个文件为未来扩展预留

/// 移动平台简化 PTY
///
/// 由于移动平台的 PTY 支持有限，这是一个简化实现
/// 不使用真实 PTY，而是通过 SSH channel 的 stdin/stdout 模拟
pub struct MobilePTY {
    // TODO: 实现移动平台的简化 PTY
    _phantom: std::marker::PhantomData<()>,
}

impl MobilePTY {
    pub fn new() -> Self {
        Self {
            _phantom: std::marker::PhantomData,
        }
    }
}
