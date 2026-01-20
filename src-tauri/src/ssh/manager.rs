use crate::error::{Result, SSHError};
use crate::ssh::session::{SSHSession, SessionConfig, SessionStatus};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use tauri::{AppHandle, Emitter};
use std::io::Read;

// 常量定义
const DEFAULT_ROWS: u16 = 24;
const DEFAULT_COLS: u16 = 80;
const PASSWORD_INPUT_DELAY_SECS: u64 = 1;
const READ_RETRY_DELAY_MS: u64 = 100;
const BUFFER_SIZE: usize = 8192;

#[derive(Clone)]
pub struct SSHManager {
    sessions: Arc<RwLock<HashMap<String, SSHSession>>>,
    app_handle: AppHandle,
}

impl SSHManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
            app_handle,
        }
    }

    pub async fn create_session(&self, config: SessionConfig) -> Result<String> {
        let id = uuid::Uuid::new_v4().to_string();
        let session = SSHSession::new(id.clone(), config);

        {
            let mut sessions = self.sessions.write().await;
            sessions.insert(id.clone(), session);
        }

        Ok(id)
    }

    pub async fn get_session(&self, id: &str) -> Result<SSHSession> {
        let sessions = self.sessions.read().await;
        sessions
            .get(id)
            .cloned()
            .ok_or_else(|| SSHError::SessionNotFound(id.to_string()))
    }

    pub async fn list_sessions(&self) -> Vec<crate::ssh::session::SessionInfo> {
        let sessions = self.sessions.read().await;
        let mut infos = Vec::new();

        for session in sessions.values() {
            infos.push(session.info().await);
        }

        infos
    }

    pub async fn delete_session(&self, id: &str) -> Result<()> {
        println!("正在删除会话: {}", id);
        let mut sessions = self.sessions.write().await;
        let removed = sessions
            .remove(id)
            .ok_or_else(|| SSHError::SessionNotFound(id.to_string()))?;
        println!("会话删除成功: {} ({})", id, removed.config.name);
        Ok(())
    }

    pub async fn connect_session(&self, id: &str) -> Result<()> {
        let session = self.get_session(id).await?;
        session.set_status(SessionStatus::Connecting).await;

        println!("Starting SSH connection for session: {}", id);

        // 提取密码（如果有的话）
        let password = if let crate::ssh::session::AuthMethod::Password { password } = &session.config.auth_method {
            Some(password.clone())
        } else {
            None
        };

        // 构建 SSH 命令
        let pty_system = native_pty_system();
        let rows = session.config.rows.unwrap_or(DEFAULT_ROWS);
        let cols = session.config.columns.unwrap_or(DEFAULT_COLS);

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
        cmd.arg(session.config.port.to_string());

        // 根据配置设置主机密钥验证
        if session.config.strict_host_key_checking {
            // 启用严格的主机密钥验证，使用no模式让SSH输出提示
            // 前端会检测提示并弹出对话框让用户确认
            cmd.arg("-o"); cmd.arg("StrictHostKeyChecking=no");
            cmd.arg("-o"); cmd.arg("UserKnownHostsFile=~/.ssh/tauri_terminal_known_hosts");
            cmd.arg("-o"); cmd.arg("VerifyHostKeyDNS=yes");
        } else {
            // 开发环境或测试环境可以禁用（不推荐生产环境使用）
            cmd.arg("-o"); cmd.arg("StrictHostKeyChecking=no");
            cmd.arg("-o"); cmd.arg("UserKnownHostsFile=/dev/null");
        }

        cmd.arg(format!("{}@{}", session.config.username, session.config.host));

        // 设置终端类型
        if let Some(ref term) = session.config.terminal_type {
            cmd.env("TERM", term);
        } else {
            cmd.env("TERM", "xterm-256color");
        }

        println!("SSH command: ssh -p {} {}@{}",
            session.config.port,
            session.config.username,
            session.config.host
        );

        // 启动 SSH 进程
        let child = pty_pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| SSHError::ConnectionFailed(e.to_string()))?;

        println!("SSH process started successfully");

        // 保存 PTY writer 和子进程
        {
            let writer = pty_pair.master.take_writer()
                .map_err(|e| SSHError::ConnectionFailed(e.to_string()))?;

            let mut pty_writer_guard = session.pty_writer.lock().await;
            *pty_writer_guard = Some(writer);

            let mut pty_pair_guard = session.pty_pair.lock().await;
            *pty_pair_guard = Some(pty_pair.master);
        }

        {
            let mut child_guard = session.child.lock().await;
            *child_guard = Some(child);
        }

        session.set_status(SessionStatus::Connected).await;

        // 设置连接时间
        {
            let mut connected_at = session.connected_at.lock().await;
            *connected_at = Some(chrono::Utc::now());
        } // 释放锁

        println!("Starting PTY reader for session: {}", id);

        // 启动 PTY 读取器
        self.start_reader(id.to_string(), session.clone());

        // 如果有密码，自动输入
        if let Some(pwd) = password {
            println!("Auto-sending password for session: {}", id);
            let session_clone = session.clone();
            tokio::spawn(async move {
                // 等待一段时间让 SSH 服务器发送密码提示
                tokio::time::sleep(tokio::time::Duration::from_secs(PASSWORD_INPUT_DELAY_SECS)).await;

                // 获取 PTY writer 并写入密码
                let mut writer_guard = session_clone.pty_writer.lock().await;
                if let Some(ref mut writer) = *writer_guard {
                    let password_with_newline = format!("{}\n", pwd);
                    if let Err(e) = writer.write_all(password_with_newline.as_bytes()) {
                        eprintln!("Failed to write password: {}", e);
                    } else {
                        let _ = writer.flush();
                        println!("Password sent successfully");
                    }
                }
            });
        }

        Ok(())
    }

    fn start_reader(&self, session_id: String, session: SSHSession) {
        let app_handle = self.app_handle.clone();

        println!("Starting reader task for session: {}", session_id);

        tokio::spawn(async move {
            let mut buffer = [0u8; BUFFER_SIZE];
            let mut read_count = 0;

            loop {
                // 获取 PTY reader
                let pty_pair = session.pty_pair.lock().await;
                if pty_pair.is_none() {
                    println!("PTY is None, stopping reader for session: {}", session_id);
                    break; // 会话已断开
                }

                let reader = {
                    if let Some(ref master) = *pty_pair {
                        master.try_clone_reader()
                    } else {
                        break;
                    }
                };

                drop(pty_pair); // 释放锁

                if let Ok(mut reader) = reader {
                    match reader.read(&mut buffer) {
                        Ok(n) if n > 0 => {
                            read_count += 1;
                            let data = buffer[..n].to_vec();
                            let text = String::from_utf8_lossy(&data);
                            println!("Read {} bytes (read #{}): {:?}", n, read_count, text);

                            // 发送事件到前端
                            let event_name = format!("ssh-output-{}", session_id);
                            if let Err(e) = app_handle.emit(&event_name, data) {
                                eprintln!("Failed to emit event {}: {}", event_name, e);
                            }
                        }
                        Ok(_) => {
                            // EOF，连接关闭
                            println!("EOF received, stopping reader for session: {}", session_id);
                            break;
                        }
                        Err(e) => {
                            // 读取错误，等待一小段时间后重试
                            eprintln!("Read error for session {}: {}", session_id, e);
                            tokio::time::sleep(tokio::time::Duration::from_millis(READ_RETRY_DELAY_MS)).await;
                        }
                    }
                } else {
                    println!("Failed to clone reader, stopping for session: {}", session_id);
                    break;
                }
            }

            println!("Reader task ended for session: {}", session_id);
        });
    }

    pub async fn disconnect_session(&self, id: &str) -> Result<()> {
        let session = self.get_session(id).await?;

        // 关闭 PTY 和子进程
        {
            let mut child_guard = session.child.lock().await;
            if let Some(ref mut child) = *child_guard {
                let _ = child.kill();
            }
            *child_guard = None;
        }

        {
            let mut pty_pair_guard = session.pty_pair.lock().await;
            *pty_pair_guard = None;
        }

        session
            .set_status(SessionStatus::Disconnected)
            .await;

        // 清除连接时间
        let mut connected_at = session.connected_at.lock().await;
        *connected_at = None;

        Ok(())
    }

    pub async fn write_to_session(&self, id: &str, data: Vec<u8>) -> Result<()> {
        let session = self.get_session(id).await?;
        session.write(data).await
    }

    pub async fn resize_session(&self, id: &str, rows: u16, cols: u16) -> Result<()> {
        let session = self.get_session(id).await?;
        session.resize(rows, cols).await
    }

    pub async fn get_all_session_configs(&self) -> Vec<SessionConfig> {
        let sessions = self.sessions.read().await;
        sessions.values().map(|s| s.config.clone()).collect()
    }
}
