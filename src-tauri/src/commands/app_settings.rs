use tauri::State;

use crate::database::repositories::AppSettingsRepository;
use crate::database::repositories::app_settings_repository::AppSettings;
use crate::database::DbPool;

/// 获取服务器地址
#[tauri::command]
pub async fn app_settings_get_server_url(
    pool: State<'_, DbPool>,
) -> Result<String, String> {
    let repo = AppSettingsRepository::new(pool.inner().clone());
    repo.get_server_url().map_err(|e| e.to_string())
}

/// 设置服务器地址
#[tauri::command]
pub async fn app_settings_set_server_url(
    server_url: String,
    pool: State<'_, DbPool>,
) -> Result<(), String> {
    let repo = AppSettingsRepository::new(pool.inner().clone());
    repo.set_server_url(&server_url).map_err(|e| e.to_string())
}

/// 获取自动同步是否启用
#[tauri::command]
pub async fn app_settings_get_auto_sync_enabled(
    pool: State<'_, DbPool>,
) -> Result<bool, String> {
    let repo = AppSettingsRepository::new(pool.inner().clone());
    repo.get_auto_sync_enabled().map_err(|e| e.to_string())
}

/// 设置自动同步是否启用
#[tauri::command]
pub async fn app_settings_set_auto_sync_enabled(
    enabled: bool,
    pool: State<'_, DbPool>,
) -> Result<(), String> {
    let repo = AppSettingsRepository::new(pool.inner().clone());
    repo.set_auto_sync_enabled(enabled).map_err(|e| e.to_string())
}

/// 获取同步间隔（分钟）
#[tauri::command]
pub async fn app_settings_get_sync_interval(
    pool: State<'_, DbPool>,
) -> Result<i64, String> {
    let repo = AppSettingsRepository::new(pool.inner().clone());
    repo.get_sync_interval().map_err(|e| e.to_string())
}

/// 设置同步间隔（分钟）
#[tauri::command]
pub async fn app_settings_set_sync_interval(
    interval: i64,
    pool: State<'_, DbPool>,
) -> Result<(), String> {
    let repo = AppSettingsRepository::new(pool.inner().clone());
    repo.set_sync_interval(interval).map_err(|e| e.to_string())
}

/// 获取语言设置
#[tauri::command]
pub async fn app_settings_get_language(
    pool: State<'_, DbPool>,
) -> Result<String, String> {
    let repo = AppSettingsRepository::new(pool.inner().clone());
    repo.get_language().map_err(|e| e.to_string())
}

/// 设置语言
#[tauri::command]
pub async fn app_settings_set_language(
    language: String,
    pool: State<'_, DbPool>,
    api_client_state: State<'_, crate::commands::auth::ApiClientStateWrapper>,
) -> Result<(), String> {
    let repo = AppSettingsRepository::new(pool.inner().clone());
    repo.set_language(&language).map_err(|e| e.to_string())?;

    // 更新 ApiClient 的语言设置
    if let Ok(client) = api_client_state.get_client() {
        client.set_language(language.clone());
        tracing::info!("Updated ApiClient language to: {}", language);
    }

    Ok(())
}

/// 获取所有应用设置
#[tauri::command]
pub async fn app_settings_get_all(
    pool: State<'_, DbPool>,
) -> Result<AppSettings, String> {
    let repo = AppSettingsRepository::new(pool.inner().clone());
    repo.get_all().map_err(|e| e.to_string())
}
