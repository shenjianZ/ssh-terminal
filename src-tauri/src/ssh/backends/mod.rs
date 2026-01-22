// 后端模块声明
pub mod system_ssh;
pub mod russh;

// 所有平台默认使用 russh（纯 Rust 实现）
pub use russh::RusshBackend as DefaultBackend;
