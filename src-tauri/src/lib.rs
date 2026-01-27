mod error;
mod commands;
mod ssh;
mod config;
mod sftp;
mod audio;

use commands::session::SSHManagerState;
use commands::sftp::SftpManagerState;
use commands::audio::AudioCapturerState;
use ssh::manager::SSHManager;
use sftp::manager::SftpManager;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化 tracing 日志系统，关闭 russh 的调试日志
    // 使用环境变量 RUST_LOG 控制日志级别，默认关闭 russh 的调试日志
    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| {
            tracing_subscriber::EnvFilter::new("warn") // 默认只显示 WARN 及以上级别
                .add_directive("ssh_terminal=info".parse().unwrap()) // 我们的代码显示 INFO 及以上
                .add_directive("russh=off".parse().unwrap()) // 完全关闭 russh 的日志
        });
    
    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false) // 不显示模块路径
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // 初始化SSH管理器，传入AppHandle
            let ssh_manager = Arc::new(SSHManager::new(app.handle().clone()));
            app.manage(ssh_manager.clone() as SSHManagerState);

            // 初始化SFTP管理器
            let sftp_manager = Arc::new(SftpManager::new(ssh_manager));
            app.manage(sftp_manager as SftpManagerState);

            // 初始化音频捕获器状态
            let audio_capturer = commands::audio::AudioCapturerState {
                capturer: Arc::new(std::sync::Mutex::new(None)),
                audio_receiver: Arc::new(std::sync::Mutex::new(None)),
            };
            app.manage(audio_capturer);

            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Session 会话管理命令
            commands::session_create,
            commands::session_create_temp,
            commands::session_connect,
            commands::session_disconnect,
            commands::session_list,
            commands::session_get,
            commands::session_delete,
            commands::session_update,
            // Terminal 终端命令
            commands::terminal_write,
            commands::terminal_resize,
            // Storage 存储命令
            commands::storage_sessions_save,
            commands::storage_sessions_load,
            commands::storage_sessions_clear,
            commands::storage_session_delete,
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
            // 文件系统命令
            commands::fs_write_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
