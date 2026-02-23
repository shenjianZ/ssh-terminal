mod error;
mod commands;
mod ssh;
mod config;
mod sftp;
mod audio;
mod ai;
mod database;
mod models;
mod services;
mod utils;
mod types;

use commands::session::SSHManagerState;
use commands::sftp::SftpManagerState;
use commands::auth::ApiClientStateWrapper;
use ssh::manager::SSHManager;
use sftp::manager::SftpManager;
use std::sync::Arc;
use tauri::Manager;

use crate::database::repositories::{UserAuthRepository, AppSettingsRepository};
use crate::services::{ApiClient, CryptoService};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化 tracing 日志系统，使用北京时间
    // 使用环境变量 RUST_LOG 控制日志级别，默认关闭 russh 的调试日志
    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| {
            tracing_subscriber::EnvFilter::new("warn") // 默认只显示 WARN 及以上级别
                .add_directive("ssh_terminal=info".parse().unwrap()) // 我们的代码显示 INFO 及以上
                .add_directive("russh=off".parse().unwrap()) // 完全关闭 russh 的日志
        });

    // 配置北京时间（UTC+8）
    let offset = time::UtcOffset::from_hms(8, 0, 0).unwrap();
    let format = time::format_description::parse(
        "[year]-[month]-[day] [hour]:[minute]:[second]"
    ).unwrap();
    let timer = tracing_subscriber::fmt::time::OffsetTime::new(offset, format);

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false) // 不显示模块路径
        .with_timer(timer) // 使用北京时间
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // 初始化数据库连接池
            let db_pool = database::init_db_pool()
                .map_err(|e| {
                    tracing::error!("Failed to initialize database: {}", e);
                    e
                })?;

            // 克隆 db_pool 供后续使用
            let db_pool_for_init = db_pool.clone();

            app.manage(db_pool);

            // 初始化 API Client 状态（全局单例）
            let api_client_state = Arc::new(commands::auth::ApiClientState::new());
            app.manage(api_client_state.clone() as ApiClientStateWrapper);

            // 在应用启动时初始化 API Client
            // 1. 获取服务器地址（如果为空，使用默认值）
            let app_settings_repo = AppSettingsRepository::new(db_pool_for_init.clone());
            let server_url = match app_settings_repo.get_server_url() {
                Ok(url) => url,
                Err(_) => {
                    tracing::warn!("Server URL not configured, using default: http://localhost:3000");
                    "http://localhost:3000".to_string()
                }
            };

            // 2. 检查是否有当前用户登录
            let user_auth_repo = UserAuthRepository::new(db_pool_for_init.clone());
            if let Some(current_user) = user_auth_repo.find_current().ok().flatten() {
                tracing::info!("Found current user, initializing API client");
                tracing::info!("  - user_id: {}", current_user.user_id);
                tracing::info!("  - has_refresh_token: {}", current_user.refresh_token_encrypted.is_some());
                tracing::info!("  - device_id: {}", current_user.device_id);

                // 获取语言设置
                let language = app_settings_repo.get_language().ok();

                // 3. 创建并初始化 ApiClient
                match ApiClient::new(server_url.clone(), language) {
                    Ok(client) => {
                        // 4. 解密并设置 access_token
                        match CryptoService::decrypt_token(
                            &current_user.access_token_encrypted,
                            &current_user.device_id
                        ) {
                            Ok(token) => {
                                client.set_token(token);

                                // 5. 设置 refresh_token_encrypted（用于后续 token 刷新）
                                if let Some(refresh_token) = &current_user.refresh_token_encrypted {
                                    client.set_refresh_token(refresh_token.clone());
                                    tracing::info!("Refresh token set from database");
                                } else {
                                    tracing::warn!("No refresh token found in database, auto-refresh will not work");
                                }

                                // 6. 设置 device_id（用于 token 加密解密）
                                client.set_device_id(current_user.device_id.clone());

                                // 7. 初始化 token 刷新回调
                                client.init_token_refresh_callback(
                                    db_pool_for_init.clone(),
                                    current_user.user_id.clone(),
                                    current_user.device_id.clone(),
                                    {
                                        let api_client_state_clone = api_client_state.clone();
                                        move || api_client_state_clone.get_client()
                                    }
                                );

                                api_client_state.set_client(client);
                                tracing::info!("API client initialized successfully");
                            }
                            Err(e) => {
                                tracing::error!("Failed to decrypt token: {}, clearing current user state", e);
                                // 解密失败时清除当前用户登录状态，避免用户看到不一致的状态
                                let _ = user_auth_repo.clear_current();
                            }
                        }
                    }
                    Err(e) => {
                        tracing::error!("Failed to create API client: {}, clearing current user state", e);
                        // 创建 client 失败时也清除当前用户登录状态
                        let _ = user_auth_repo.clear_current();
                    }
                }
            } else {
                tracing::info!("No current user found, skipping API client initialization");
            }

            // 初始化SSH管理器，传入AppHandle
            let ssh_manager = Arc::new(SSHManager::new(app.handle().clone()));
            app.manage(ssh_manager.clone() as SSHManagerState);

            // 初始化SFTP管理器
            let sftp_manager = Arc::new(SftpManager::new(ssh_manager));
            app.manage(sftp_manager as SftpManagerState);

            // 初始化音频捕获器状态
            let audio_capturer = commands::audio::AudioCapturerState {
                capturer: Arc::new(std::sync::Mutex::new(None)),
            };
            app.manage(audio_capturer);

            // 初始化 AI Manager 状态
            let ai_manager = commands::ai::AIManagerState::new();
            app.manage(ai_manager);

            // 开发模式下自动打开开发者工具
            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Session 会话管理命令
            commands::session_create,
            commands::session_create_temp,
            commands::session_create_with_id,
            commands::session_connect,
            commands::session_disconnect,
            commands::session_list,
            commands::session_get,
            commands::session_delete,
            commands::session_update,
            // 数据库 SSH Session 命令
            commands::db_ssh_session_create,
            commands::db_ssh_session_update,
            commands::db_ssh_session_delete,
            commands::db_ssh_session_list,
            commands::db_ssh_session_get_by_id,
            commands::db_ssh_session_migrate_to_user,
            // Terminal 终端命令
            commands::terminal_write,
            commands::terminal_resize,
            // Storage 存储命令
            commands::storage_sessions_save,
            commands::storage_sessions_load,
            commands::storage_sessions_clear,
            commands::storage_session_delete,
            commands::storage_session_create,
            commands::storage_session_update,
            commands::storage_config_save,
            commands::storage_config_load,
            commands::storage_config_get_default,
            commands::storage_keybindings_save,
            commands::storage_keybindings_load,
            commands::storage_keybindings_import,
            commands::storage_keybindings_reset,
            // SFTP 文件管理命令
            commands::sftp_list_dir,
            commands::sftp_create_dir,
            commands::sftp_remove_file,
            commands::sftp_remove_dir,
            commands::sftp_rename,
            commands::sftp_chmod,
            commands::sftp_read_file,
            commands::sftp_write_file,
            commands::sftp_download_file,
            commands::sftp_upload_file,
            commands::sftp_upload_directory,
            commands::sftp_cancel_upload,
            commands::local_list_dir,
            commands::local_home_dir,
            commands::local_available_drives,
            commands::local_drive_root,
            // Recording 录制命令
            commands::recording_save,
            commands::recording_load,
            commands::recording_list,
            commands::recording_delete,
            commands::recording_update_metadata,
            commands::recording_save_video,
            commands::recording_load_video,
            // Audio 音频命令
            commands::audio_start_capturing,
            commands::audio_stop_capturing,
            commands::audio_list_devices,
            commands::audio_check_support,
            // AI 命令
            commands::ai_chat,
            commands::ai_chat_stream,
            commands::ai_explain_command,
            commands::ai_generate_command,
            commands::ai_analyze_error,
            commands::ai_test_connection,
            commands::ai_clear_cache,
            commands::ai_get_cache_info,
            commands::ai_hot_reload,
            // AI 对话历史命令
            commands::ai_history::ai_history_list,
            commands::ai_history::ai_history_get,
            commands::ai_history::ai_history_save,
            commands::ai_history::ai_history_delete,
            commands::ai_history::ai_history_toggle_archive,
            commands::ai_history::ai_history_update_title,
            commands::ai_history::ai_history_export,
            commands::ai_history::ai_history_list_by_server,
            commands::ai_history::ai_history_list_by_server_id,
            commands::ai_history::ai_history_update_connection_status,
            // AI 配置存储命令
            commands::storage_ai_config_save,
            commands::storage_ai_config_load,
            commands::storage_ai_config_get_default,
            // 文件系统命令
            commands::fs_write_file,
            // 认证命令
            commands::auth_login,
            commands::auth_register,
            commands::auth_logout,
            commands::auth_get_current_user,
            commands::auth_list_accounts,
            commands::auth_switch_account,
            commands::auth_refresh_token,
            commands::auth_auto_login,
            commands::auth_has_current_user,
            commands::auth_delete_account,
            commands::auth_send_verify_code,
            // 同步命令
            commands::sync_now,
            commands::sync_get_status,
            commands::sync_resolve_conflict,
            // 用户资料命令
            commands::user_profile_get,
            commands::user_profile_update,
            commands::user_profile_sync,
            // 应用设置命令
            commands::app_settings_get_server_url,
            commands::app_settings_set_server_url,
            commands::app_settings_get_auto_sync_enabled,
            commands::app_settings_set_auto_sync_enabled,
            commands::app_settings_get_sync_interval,
            commands::app_settings_set_sync_interval,
            commands::app_settings_get_language,
            commands::app_settings_set_language,
            commands::app_settings_get_all,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
