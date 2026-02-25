// russh 后端实现 - 纯 Rust 实现，支持所有平台（包括 Android）

use crate::error::{Result, SSHError};
use crate::ssh::backend::{BackendReader, SSHBackend};
use crate::ssh::session::{AuthMethod, SessionConfig};
use async_trait::async_trait;
use russh::client;
use russh::client::{Config, Handle, Msg};
use russh::*;
use russh::{ChannelReadHalf, ChannelWriteHalf};
use russh::keys::{load_secret_key, PrivateKeyWithHashAlg};
use std::io;
use std::io::Cursor;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::Duration;
use tokio::io::{AsyncRead, ReadBuf};
use tokio::sync::mpsc;
use tracing::{debug, error, info};

// 导入 SFTP channel 包装器
use super::sftp_channel::SftpChannelStream;

/// SSH Channel 命令
///
/// 用于在后台任务中控制 SSH channel
enum ChannelCommand {
    Write(Vec<u8>),
    Resize(u16, u16),
    Disconnect,
}

/// russh 后端实现
///
/// 纯 Rust SSH 实现，基于 russh 库
pub struct RusshBackend {
    handle: Option<Handle<RusshHandler>>,
    command_sender: Option<mpsc::UnboundedSender<ChannelCommand>>,
    receiver: Option<mpsc::UnboundedReceiver<Vec<u8>>>,
    connected: bool,
}

/// russh 客户端 Handler
///
/// 实现 client::Handler trait 来处理 SSH 协议事件
pub struct RusshHandler;

impl client::Handler for RusshHandler {
    type Error = russh::Error;

    /// 验证服务器主机密钥
    ///
    /// 在生产环境中，应该实现 known_hosts 验证
    async fn check_server_key(
        &mut self,
        _server_public_key: &russh::keys::PublicKey,
    ) -> std::result::Result<bool, Self::Error> {
        // TODO: 实现完整的主机密钥验证
        // 目前暂时接受所有主机密钥（仅用于开发）
        // 生产环境应该：
        // 1. 读取 known_hosts 文件
        // 2. 比较服务器公钥
        // 3. 提示用户确认新密钥
        debug!("Accepting server host key (verification not implemented)");
        Ok(true)
    }
}

/// russh 的异步读取器
///
/// 从 mpsc channel 接收 SSH 输出数据
pub struct RusshReader {
    receiver: mpsc::UnboundedReceiver<Vec<u8>>,
    buffer: Option<Vec<u8>>,
    position: usize,
}

impl AsyncRead for RusshReader {
    fn poll_read(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut ReadBuf<'_>,
    ) -> Poll<io::Result<()>> {
        // 如果当前 buffer 还有数据，先消费
        if self.buffer.is_some() {
            let buffer_len = {
                let buffer = self.buffer.as_ref().unwrap();
                buffer.len()
            };

            if self.position < buffer_len {
                let mut temp_buffer = None;
                std::mem::swap(&mut self.buffer, &mut temp_buffer);

                if let Some(buffer) = temp_buffer {
                    let remaining = &buffer[self.position..];
                    let to_copy = std::cmp::min(remaining.len(), buf.capacity());
                    buf.put_slice(&remaining[..to_copy]);
                    self.position += to_copy;

                    if self.position >= buffer.len() {
                        self.buffer = None;
                        self.position = 0;
                    } else {
                        self.buffer = Some(buffer);
                    }
                }
                return Poll::Ready(Ok(()));
            }
        }

        // 尝试从 channel 接收新数据
        match self.receiver.poll_recv(cx) {
            Poll::Ready(Some(data)) => {
                let to_copy = std::cmp::min(data.len(), buf.capacity());
                buf.put_slice(&data[..to_copy]);
                if data.len() > to_copy {
                    self.buffer = Some(data[to_copy..].to_vec());
                    self.position = 0;
                }
                Poll::Ready(Ok(()))
            }
            Poll::Ready(None) => {
                // Channel 关闭
                debug!("RusshReader channel closed");
                Poll::Ready(Ok(()))
            }
            Poll::Pending => Poll::Pending,
        }
    }
}

impl RusshBackend {
    /// 创建新的 russh 后端实例
    pub fn new() -> Self {
        let (_command_sender, _) = mpsc::unbounded_channel::<ChannelCommand>();
        let (_output_sender, output_receiver) = mpsc::unbounded_channel::<Vec<u8>>();
        Self {
            handle: None,
            command_sender: None,
            receiver: Some(output_receiver),
            connected: false,
        }
    }

    /// 获取 SSH Handle 的引用
    ///
    /// 用于创建额外的 channel（如 SFTP）
    #[allow(dead_code)]
    pub fn get_handle(&self) -> Option<&Handle<RusshHandler>> {
        self.handle.as_ref()
    }

    /// 创建 russh 客户端配置
    ///
    /// 根据最佳实践配置算法偏好、超时等参数
    fn create_config(config: &SessionConfig) -> Config {
        let mut russh_config = Config {
            // 流控制设置（与 russh-info.md 推荐值一致）
            window_size: 2097152,     // 2MB 窗口
            maximum_packet_size: 32768, // 32KB 最大包

            // 使用默认的算法偏好（russh 会选择安全的默认值）
            ..Default::default()
        };

        // 配置心跳间隔（keepalive）
        // 0 表示禁用，否则使用用户配置的间隔（秒）
        if config.keep_alive_interval > 0 {
            russh_config.keepalive_interval = Some(Duration::from_secs(config.keep_alive_interval));
            // 设置最大心跳次数，超过后断开连接
            // 默认 3 次，即 3 次心跳无响应后断开
            russh_config.keepalive_max = 3;

            tracing::info!(
                "SSH keepalive enabled: interval={}s, max=3",
                config.keep_alive_interval
            );
        } else {
            tracing::info!("SSH keepalive disabled (interval=0)");
        }

        russh_config
    }

    /// 启动 SSH 会话管理任务
    ///
    /// 从 SSH channel 读取数据并处理命令
    fn start_session_loop(
        mut read_half: ChannelReadHalf,
        write_half: ChannelWriteHalf<Msg>,
        output_sender: mpsc::UnboundedSender<Vec<u8>>,
        mut command_receiver: mpsc::UnboundedReceiver<ChannelCommand>,
    ) {
        tokio::spawn(async move {
            debug!("Starting SSH session loop");
            loop {
                tokio::select! {
                    // 处理来自 SSH 服务器的数据
                    msg = read_half.wait() => {
                        match msg {
                            Some(ChannelMsg::Data { data }) => {
                                // 直接发送 CryptoVec 的数据
                                // data: &CryptoVec
                                let data_vec = data.to_vec();
                                println!("[russh] SSH→Channel: {} bytes", data_vec.len());
                                println!("[russh] Raw bytes: {:?}", &data_vec[..data_vec.len().min(50)]);
                                let text = String::from_utf8_lossy(&data_vec);
                                println!("[russh] Text: {}", text);

                                // 发送数据到输出 channel
                                if let Err(e) = output_sender.send(data_vec) {
                                    error!("Failed to send data to output: {}", e);
                                    break;
                                }
                            }
                            Some(ChannelMsg::ExitStatus { exit_status }) => {
                                info!("Remote command exited with status: {}", exit_status);
                                break;
                            }
                            Some(ChannelMsg::Eof) => {
                                debug!("Received EOF from server");
                                // 继续等待，可能还有数据
                            }
                            Some(ChannelMsg::Close) => {
                                debug!("Channel closed by server");
                                break;
                            }
                            Some(ChannelMsg::WindowAdjusted { .. }) => {
                                debug!("Window adjusted");
                            }
                            Some(_) => {
                                // 处理所有其他可能的 ChannelMsg 类型（non-exhaustive）
                                debug!("Received other channel message");
                            }
                            None => {
                                debug!("Channel wait returned None, connection closed");
                                break;
                            }
                        }
                    }
                    // 处理来自前端的命令
                    cmd = command_receiver.recv() => {
                        match cmd {
                            Some(ChannelCommand::Write(data)) => {
                                // 写入数据到 SSH channel
                                debug!("Writing {} bytes to SSH channel", data.len());
                                // 使用 Cursor 将 Vec<u8> 转换为 AsyncRead
                                let mut cursor = Cursor::new(data);
                                if let Err(e) = write_half.data(&mut cursor).await {
                                    error!("Failed to write data to SSH channel: {}", e);
                                    break;
                                }
                            }
                            Some(ChannelCommand::Resize(rows, cols)) => {
                                // 调整终端大小
                                debug!("Resizing terminal to {}x{}", cols, rows);
                                // window_change 需要 4 个参数：col_width, row_height, pix_width, pix_height
                                if let Err(e) = write_half.window_change(cols as u32, rows as u32, 0, 0).await {
                                    error!("Failed to resize terminal: {}", e);
                                }
                            }
                            Some(ChannelCommand::Disconnect) => {
                                debug!("Disconnect command received");
                                break;
                            }
                            None => {
                                debug!("Command channel closed");
                                break;
                            }
                        }
                    }
                }
            }
            debug!("Session loop ended");
        });
    }

    /// 直接创建 SFTP 客户端
    ///
    /// 这是一个特定于 RusshBackend 的方法，用于直接创建 SFTP 客户端
    /// 绕过了 trait object 的限制
    pub async fn create_sftp_client_direct(&self) -> Result<crate::sftp::client::SftpClient> {
        if !self.connected {
            return Err(SSHError::NotConnected);
        }

        let handle = self.handle.as_ref()
            .ok_or(SSHError::NotConnected)?;

        debug!("Creating SFTP client directly from russh handle");

        // 使用 SftpChannelStream 打开 channel
        let stream = SftpChannelStream::open(handle).await?;

        // 直接使用 SftpChannelStream 创建 SFTP session
        let session = russh_sftp::client::SftpSession::new(stream)
            .await
            .map_err(|e| SSHError::Ssh(format!("Failed to create SFTP session: {}", e)))?;

        debug!("SFTP client created successfully");

        Ok(crate::sftp::client::SftpClient::from_session(session))
    }
}

impl Default for RusshBackend {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl SSHBackend for RusshBackend {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    async fn connect(&mut self, config: &SessionConfig) -> Result<()> {
        info!(
            "Connecting to {}:{} as {}",
            config.host, config.port, config.username
        );

        // 创建输出 channel
        let (output_sender, output_receiver) = mpsc::unbounded_channel();
        self.receiver = Some(output_receiver);

        // 创建命令 channel
        let (command_sender, command_receiver) = mpsc::unbounded_channel();
        self.command_sender = Some(command_sender);

        // 创建 russh 配置
        let russh_config = std::sync::Arc::new(Self::create_config(config));

        // 创建 handler
        let handler = RusshHandler;

        // 建立连接
        let mut handle = client::connect(
            russh_config,
            (config.host.as_str(), config.port),
            handler,
        )
        .await
        .map_err(|e| SSHError::ConnectionFailed(format!("Failed to connect: {}", e)))?;

        // 根据认证方式进行认证
        match &config.auth_method {
            AuthMethod::Password { password } => {
                info!("Authenticating with password for user: {}", config.username);
                let auth_result = handle
                    .authenticate_password(&config.username, password)
                    .await
                    .map_err(|e| {
                        error!("Password authentication error for user {}: {}", config.username, e);
                        SSHError::AuthenticationFailed(format!("密码认证错误: {}", e))
                    })?;

                if !auth_result.success() {
                    error!("Password authentication failed for user: {}", config.username);
                    return Err(SSHError::AuthenticationFailed(
                        format!("密码认证失败: 用户名或密码错误 (user: {})", config.username),
                    ));
                }
                info!("Password authentication successful for user: {}", config.username);
            }
            AuthMethod::PublicKey {
                private_key_path,
                passphrase,
            } => {
                info!("Authenticating with public key for user: {}, key path: {}", config.username, private_key_path);
                let key_pair = load_secret_key(private_key_path, passphrase.as_deref()).map_err(
                    |e| {
                        error!("Failed to load private key from {}: {}", private_key_path, e);
                        SSHError::AuthenticationFailed(format!("无法加载私钥文件 '{}': {}", private_key_path, e))
                    },
                )?;

                // 统一使用 PrivateKeyWithHashAlg 包装
                // 参考 russh-info.md 中的最佳实践
                let key_with_hash = if key_pair.algorithm().is_rsa() {
                    // 获取服务器支持的 RSA 哈希算法
                    let best_hash = handle
                        .best_supported_rsa_hash()
                        .await
                        .map_err(|e| {
                            error!("Failed to get supported RSA hash: {}", e);
                            SSHError::AuthenticationFailed(format!(
                                "无法获取服务器支持的 RSA 哈希算法: {}",
                                e
                            ))
                        })?
                        .flatten();

                    if let Some(hash) = best_hash {
                        info!("Using RSA key with {:?} hash", hash);
                    } else {
                        info!("Using RSA key");
                    }
                    PrivateKeyWithHashAlg::new(
                        std::sync::Arc::new(key_pair),
                        best_hash,
                    )
                } else {
                    info!("Using {:?} key", key_pair.algorithm());
                    PrivateKeyWithHashAlg::new(
                        std::sync::Arc::new(key_pair),
                        None,
                    )
                };

                info!("Attempting public key authentication...");
                let auth_result = handle
                    .authenticate_publickey(&config.username, key_with_hash)
                    .await
                    .map_err(|e| {
                        error!("Public key authentication error for user {}: {}", config.username, e);
                        SSHError::AuthenticationFailed(format!(
                            "公钥认证错误: {}",
                            e
                        ))
                    })?;

                if !auth_result.success() {
                    error!("Public key authentication failed for user: {}", config.username);
                    error!("Possible reasons: 1) Public key not authorized on server, 2) Private key doesn't match public key, 3) Wrong user");
                    return Err(SSHError::AuthenticationFailed(
                        format!("公钥认证失败 (user: {})\n可能原因:\n1. 服务器上未授权此公钥（检查 ~/.ssh/authorized_keys）\n2. 私钥与公钥不匹配\n3. 用户名错误", config.username),
                    ));
                }
                info!("Public key authentication successful for user: {}", config.username);
            }
        }

        // 打开 session channel
        debug!("Opening session channel");
        let channel = handle
            .channel_open_session()
            .await
            .map_err(|e| SSHError::ConnectionFailed(format!("Failed to open channel: {}", e)))?;

        // 请求 PTY
        let rows = config.rows.unwrap_or(24);
        let cols = config.columns.unwrap_or(80);
        let term = config.terminal_type.as_deref().unwrap_or("xterm-256color");
        let pixel_width = 0;
        let pixel_height = 0;
        let modes: &[(russh::Pty, u32)] = &[];

        debug!(
            "Requesting PTY: {}x{}, terminal type: {}",
            cols, rows, term
        );
        channel
            .request_pty(
                true,
                term,
                cols as u32,
                rows as u32,
                pixel_width,
                pixel_height,
                modes,
            )
            .await
            .map_err(|e| SSHError::ConnectionFailed(format!("Failed to request PTY: {}", e)))?;

        // 启动 shell
        debug!("Requesting shell");
        channel
            .request_shell(true)
            .await
            .map_err(|e| SSHError::ConnectionFailed(format!("Failed to request shell: {}", e)))?;

        // 分割 channel 为读写两半
        let (read_half, write_half) = channel.split();

        // 启动会话管理循环
        Self::start_session_loop(read_half, write_half, output_sender, command_receiver);

        self.handle = Some(handle);
        self.connected = true;
        info!("SSH connection established successfully");
        Ok(())
    }

    async fn write(&mut self, data: &[u8]) -> Result<()> {
        if !self.connected {
            return Err(SSHError::NotConnected);
        }

        if let Some(ref sender) = self.command_sender {
            sender
                .send(ChannelCommand::Write(data.to_vec()))
                .map_err(|e| SSHError::IoError(io::Error::new(io::ErrorKind::Other, e)))?;
            Ok(())
        } else {
            Err(SSHError::NotConnected)
        }
    }

    async fn resize(&mut self, rows: u16, cols: u16) -> Result<()> {
        if !self.connected {
            return Err(SSHError::NotConnected);
        }

        if let Some(ref sender) = self.command_sender {
            sender
                .send(ChannelCommand::Resize(rows, cols))
                .map_err(|e| SSHError::IoError(io::Error::new(io::ErrorKind::Other, e)))?;
            Ok(())
        } else {
            Err(SSHError::NotConnected)
        }
    }

    async fn disconnect(&mut self) -> Result<()> {
        if let Some(ref sender) = self.command_sender {
            let _ = sender.send(ChannelCommand::Disconnect);
        }

        if let Some(handle) = self.handle.take() {
            info!("Disconnecting SSH session");
            handle
                .disconnect(Disconnect::ByApplication, "", "English")
                .await
                .map_err(|e| {
                    error!("Failed to disconnect: {}", e);
                    SSHError::IoError(io::Error::new(io::ErrorKind::Other, e.to_string()))
                })?;
        }

        self.connected = false;
        info!("SSH session disconnected");
        Ok(())
    }

    fn reader(&mut self) -> Result<Box<dyn BackendReader + Send>> {
        if let Some(receiver) = self.receiver.take() {
            let reader = RusshReader {
                receiver,
                buffer: None,
                position: 0,
            };
            Ok(Box::new(reader))
        } else {
            Err(SSHError::NotConnected)
        }
    }
}
