use crate::error::{Result, SSHError};
use crate::ssh::backend::{BackendReader, SSHBackend};
use crate::ssh::session::SessionConfig;
use async_trait::async_trait;
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, Child, PtySize};
use std::io::Read;
use tokio::io::AsyncRead;

/// 系统 SSH 后端实现
///
/// 直接调用系统的 ssh 命令，使用 portable-pty 提供伪终端支持
/// 这是最稳定和成熟的方案，适用于桌面平台（Windows、macOS、Linux）
pub struct SystemSSHBackend {
    pty_pair: Option<Box<dyn MasterPty + Send>>,
    pty_writer: Option<Box<dyn std::io::Write + Send>>,
    child: Option<Box<dyn Child + Send>>,
    master_reader: Option<Box<dyn Read + Send>>,
}

/// 系统 SSH 的读取器包装器
pub struct SystemSSHReader {
    inner: Option<Box<dyn Read + Send>>,
}

impl AsyncRead for SystemSSHReader {
    fn poll_read(
        mut self: std::pin::Pin<&mut Self>,
        _cx: &mut std::task::Context<'_>,
        buf: &mut tokio::io::ReadBuf<'_>,
    ) -> std::task::Poll<std::io::Result<()>> {
        if let Some(ref mut reader) = self.inner {
            let mut buffer = vec![0u8; buf.capacity()];
            match reader.read(&mut buffer) {
                Ok(n) if n > 0 => {
                    buf.put_slice(&buffer[..n]);
                    std::task::Poll::Ready(Ok(()))
                }
                Ok(_) => std::task::Poll::Ready(Ok(())),
                Err(e) => std::task::Poll::Ready(Err(e)),
            }
        } else {
            std::task::Poll::Ready(Ok(()))
        }
    }
}

impl SystemSSHBackend {
    /// 创建新的系统 SSH 后端实例
    pub fn new() -> Self {
        Self {
            pty_pair: None,
            pty_writer: None,
            child: None,
            master_reader: None,
        }
    }
}

impl Default for SystemSSHBackend {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl SSHBackend for SystemSSHBackend {
    async fn connect(&mut self, config: &SessionConfig) -> Result<()> {
        // 构建 SSH 命令
        let pty_system = native_pty_system();
        let rows = config.rows.unwrap_or(24);
        let cols = config.columns.unwrap_or(80);

        let pty_size = PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        };

        // 创建 PTY
        let pty_pair = pty_system
            .openpty(pty_size)
            .map_err(|e| SSHError::ConnectionFailed(e.to_string()))?;

        // 构建 SSH 命令
        let mut cmd = CommandBuilder::new("ssh");
        cmd.arg("-p");
        cmd.arg(config.port.to_string());

        // 根据配置设置主机密钥验证
        if config.strict_host_key_checking {
            cmd.arg("-o");
            cmd.arg("StrictHostKeyChecking=no");
            cmd.arg("-o");
            cmd.arg("UserKnownHostsFile=~/.ssh/tauri_terminal_known_hosts");
            cmd.arg("-o");
            cmd.arg("VerifyHostKeyDNS=yes");
        } else {
            cmd.arg("-o");
            cmd.arg("StrictHostKeyChecking=no");
            cmd.arg("-o");
            cmd.arg("UserKnownHostsFile=/dev/null");
        }

        // 设置心跳间隔，保持连接活跃
        if config.keep_alive_interval > 0 {
            cmd.arg("-o");
            cmd.arg(format!("ServerAliveInterval={}", config.keep_alive_interval));
            cmd.arg("-o");
            cmd.arg("ServerAliveCountMax=3");
        }

        cmd.arg(format!("{}@{}", config.username, config.host));

        // 设置终端类型
        if let Some(ref term) = config.terminal_type {
            cmd.env("TERM", term);
        } else {
            cmd.env("TERM", "xterm-256color");
        }

        // 启动 SSH 进程
        let child = pty_pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| SSHError::ConnectionFailed(e.to_string()))?;

        // 保存 PTY 和子进程
        let writer = pty_pair
            .master
            .take_writer()
            .map_err(|e| SSHError::ConnectionFailed(e.to_string()))?;

        self.pty_writer = Some(writer);
        self.child = Some(child);

        // 克隆 reader
        let reader = pty_pair
            .master
            .try_clone_reader()
            .map_err(|e| SSHError::ConnectionFailed(e.to_string()))?;

        self.pty_pair = Some(pty_pair.master);
        self.master_reader = Some(reader);

        Ok(())
    }

    async fn write(&mut self, data: &[u8]) -> Result<()> {
        if let Some(ref mut writer) = self.pty_writer {
            writer
                .write_all(data)
                .map_err(SSHError::IoError)?;
            writer
                .flush()
                .map_err(SSHError::IoError)?;
            Ok(())
        } else {
            Err(SSHError::NotConnected)
        }
    }

    async fn resize(&mut self, rows: u16, cols: u16) -> Result<()> {
        if let Some(ref master) = self.pty_pair {
            master
                .resize(PtySize {
                    rows,
                    cols,
                    pixel_width: 0,
                    pixel_height: 0,
                })
                .map_err(|e| {
                    SSHError::IoError(std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))
                })?;
            Ok(())
        } else {
            Err(SSHError::NotConnected)
        }
    }

    async fn disconnect(&mut self) -> Result<()> {
        // 关闭子进程
        if let Some(ref mut child) = self.child {
            let _ = child.kill();
        }
        self.child = None;
        self.pty_pair = None;
        self.pty_writer = None;
        self.master_reader = None;
        Ok(())
    }

    fn reader(&mut self) -> Result<Box<dyn BackendReader + Send>> {
        if let Some(reader) = self.master_reader.take() {
            Ok(Box::new(SystemSSHReader { inner: Some(reader) }))
        } else {
            Err(SSHError::NotConnected)
        }
    }
}
