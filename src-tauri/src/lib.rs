mod error;
mod commands;
mod ssh;
mod config;

use commands::session::SSHManagerState;
use ssh::manager::SSHManager;
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
            app.manage(ssh_manager as SSHManagerState);

            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // SSH会话管理命令
            commands::ssh_create_session,
            commands::ssh_create_temporary_connection,
            commands::ssh_connect,
            commands::ssh_disconnect,
            commands::ssh_list_sessions,
            commands::ssh_get_session,
            commands::ssh_delete_session,
            commands::ssh_update_session,
            // SSH终端命令
            commands::ssh_write,
            commands::ssh_resize_pty,
            commands::ssh_read_start,
            commands::ssh_read_stop,
            // 存储命令
            commands::storage_save_sessions,
            commands::storage_load_sessions,
            commands::storage_clear,
            commands::storage_delete_session,
            commands::storage_save_app_config,
            commands::storage_load_app_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
