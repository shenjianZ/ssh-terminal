use crate::error::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// 通用文件写入命令（用于视频导出等场景）
#[tauri::command]
pub async fn fs_write_file(path: String, contents: Vec<u8>) -> std::result::Result<(), String> {
    let len = contents.len();
    fs::write(&path, contents).map_err(|e| format!("Failed to write file: {}", e))?;
    println!("[FS] Written {} bytes to {}", len, path);
    Ok(())
}

// ========== 录制文件数据结构 ==========

/// 录制事件类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RecordingEventType {
    Input,
    Output,
    Resize,
    Metadata,
}

/// 录制事件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingEvent {
    pub timestamp: i64,
    #[serde(rename = "type")]
    pub event_type: RecordingEventType,
    pub data: serde_json::Value,
}

/// 终端尺寸
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalSize {
    pub cols: u16,
    pub rows: u16,
}

/// 终端配置（用于保存录制时的样式）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalConfig {
    pub theme_id: String,
    pub font_size: u16,
    pub font_family: String,
    pub font_weight: u16,
    pub line_height: f64,
    pub cursor_style: String,
    pub cursor_blink: bool,
    pub letter_spacing: f64,
    #[serde(default = "default_video_quality")]
    pub video_quality: String,
    #[serde(default = "default_video_format")]
    pub video_format: String,
}

fn default_video_quality() -> String {
    "medium".to_string()
}

fn default_video_format() -> String {
    "webm".to_string()
}

/// 录制元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordingMetadata {
    pub start_time: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,
    pub terminal_size: TerminalSize,
    pub connection_id: String,
    pub session_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub event_count: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub terminal_config: Option<TerminalConfig>,
    /// 关联的视频文件路径（相对于 recordings 目录）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video_file: Option<String>,
}

/// 录制文件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingFile {
    pub version: String,
    pub metadata: RecordingMetadata,
    pub events: Vec<RecordingEvent>,
}

/// 录制文件列表项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordingFileItem {
    pub id: String,
    pub file_path: String,
    pub metadata: RecordingMetadata,
    pub created_at: i64,
    pub file_size: u64,
}

// ========== 辅助函数 ==========

/// 获取录制文件存储目录
fn get_recordings_dir(app: &AppHandle) -> Result<PathBuf> {
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| crate::error::SSHError::Storage(format!("Failed to get app data dir: {}", e)))?;

    let recordings_dir = app_data_dir.join("recordings");

    // 确保目录存在
    fs::create_dir_all(&recordings_dir).map_err(|e| {
        crate::error::SSHError::Storage(format!("Failed to create recordings directory: {}", e))
    })?;

    Ok(recordings_dir)
}

/// 生成默认文件名
fn generate_default_filename(session_name: &str, start_time: i64) -> String {
    let date = chrono::DateTime::from_timestamp(start_time / 1000, 0)
        .unwrap_or_else(|| chrono::Utc::now());
    let date_str = date.format("%Y-%m-%d").to_string();
    let time_str = date.format("%H-%M-%S").to_string();

    // 清理会话名称中的非法字符
    let clean_name: String = session_name
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '_' || c == '-' { c } else { '_' })
        .collect();

    format!("{}_{}_{}.json", clean_name, date_str, time_str)
}

/// 获取文件元数据（大小、修改时间）
fn get_file_metadata(path: &PathBuf) -> Result<(i64, u64)> {
    let metadata = fs::metadata(path).map_err(|e| {
        crate::error::SSHError::Storage(format!("Failed to get file metadata: {}", e))
    })?;

    let modified = metadata
        .modified()
        .map_err(|e| {
            crate::error::SSHError::Storage(format!("Failed to get file modified time: {}", e))
        })?
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| {
            crate::error::SSHError::Storage(format!("Failed to convert file time: {}", e))
        })?
        .as_millis() as i64;

    let file_size = metadata.len();

    Ok((modified, file_size))
}

/// 从文件路径加载录制文件
fn load_recording_file_from_path(path: &PathBuf) -> Result<RecordingFile> {
    let content = fs::read_to_string(path).map_err(|e| {
        crate::error::SSHError::Storage(format!("Failed to read recording file: {}", e))
    })?;

    let file: RecordingFile = serde_json::from_str(&content).map_err(|e| {
        crate::error::SSHError::Storage(format!("Failed to parse recording file: {}", e))
    })?;

    Ok(file)
}

// ========== Tauri 命令 ==========

/// 保存录制文件
#[tauri::command]
pub async fn recording_save(
    app: AppHandle,
    recording_file: RecordingFile,
    file_name: Option<String>,
) -> std::result::Result<String, String> {
    let recordings_dir = get_recordings_dir(&app).map_err(|e| e.to_string())?;

    // 生成文件名
    let filename = file_name.unwrap_or_else(|| {
        generate_default_filename(
            &recording_file.metadata.session_name,
            recording_file.metadata.start_time,
        )
    });

    let file_path = recordings_dir.join(&filename);

    // 序列化为 JSON
    let json_content = serde_json::to_string_pretty(&recording_file)
        .map_err(|e| format!("Failed to serialize recording file: {}", e))?;

    // 写入文件
    fs::write(&file_path, json_content)
        .map_err(|e| format!("Failed to write recording file: {}", e))?;

    println!(
        "[Recording] Saved recording file: {}",
        file_path.display()
    );

    Ok(file_path.to_string_lossy().to_string())
}

/// 加载录制文件
#[tauri::command]
pub async fn recording_load(
    app: AppHandle,
    file_path: String,
) -> std::result::Result<RecordingFile, String> {
    let path = PathBuf::from(&file_path);

    if !path.exists() {
        return Err(format!("Recording file not found: {}", file_path));
    }

    let file = load_recording_file_from_path(&path).map_err(|e| e.to_string())?;

    println!("[Recording] Loaded recording file: {}", file_path);

    Ok(file)
}

/// 列出所有录制文件
#[tauri::command]
pub async fn recording_list(
    app: AppHandle,
) -> std::result::Result<Vec<RecordingFileItem>, String> {
    let recordings_dir = get_recordings_dir(&app).map_err(|e| e.to_string())?;

    let mut items = Vec::new();

    let entries = fs::read_dir(&recordings_dir)
        .map_err(|e| format!("Failed to read recordings directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        // 只处理 .json 文件
        if path.extension().and_then(|s| s.to_str()) != Some("json") {
            continue;
        }

        // 读取录制文件
        let recording_file = match load_recording_file_from_path(&path) {
            Ok(file) => file,
            Err(e) => {
                eprintln!(
                    "[Recording] Failed to load recording file {}: {}",
                    path.display(),
                    e
                );
                continue;
            }
        };

        // 获取文件元数据
        let (modified, file_size) = get_file_metadata(&path).map_err(|e| e.to_string())?;

        // 创建列表项
        let item = RecordingFileItem {
            id: path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_string(),
            file_path: path.to_string_lossy().to_string(),
            metadata: recording_file.metadata,
            created_at: modified,
            file_size,
        };

        items.push(item);
    }

    // 按创建时间倒序排列
    items.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    println!("[Recording] Listed {} recording files", items.len());

    Ok(items)
}

/// 删除录制文件
#[tauri::command]
pub async fn recording_delete(
    app: AppHandle,
    file_id: String,
) -> std::result::Result<(), String> {
    let recordings_dir = get_recordings_dir(&app).map_err(|e| e.to_string())?;

    // 查找 JSON 文件
    let json_path = recordings_dir.join(format!("{}.json", file_id));

    if !json_path.exists() {
        return Err(format!("Recording file not found: {}", file_id));
    }

    // 加载录制文件以查找关联的视频文件
    if let Ok(recording_file) = load_recording_file_from_path(&json_path) {
        if let Some(video_file) = recording_file.metadata.video_file {
            let video_path = recordings_dir.join(&video_file);
            if video_path.exists() {
                let _ = fs::remove_file(&video_path);
                println!("[Recording] Deleted video file: {}", video_file);
            }
        }
    }

    // 删除 JSON 文件
    fs::remove_file(&json_path)
        .map_err(|e| format!("Failed to delete recording file: {}", e))?;

    println!("[Recording] Deleted recording file: {}", file_id);

    Ok(())
}

/// 保存视频文件（Blob 数据）到磁盘
#[tauri::command]
pub async fn recording_save_video(
    app: AppHandle,
    recording_id: String,
    video_data: Vec<u8>,
    file_extension: String,
) -> std::result::Result<String, String> {
    let recordings_dir = get_recordings_dir(&app).map_err(|e| e.to_string())?;

    // 生成视频文件名
    let video_filename = format!("{}.{}", recording_id, file_extension);
    let video_path = recordings_dir.join(&video_filename);

    // 写入视频数据
    fs::write(&video_path, video_data)
        .map_err(|e| format!("Failed to write video file: {}", e))?;

    println!(
        "[Recording] Saved video file: {} ({} bytes)",
        video_path.display(),
        video_path.metadata().map(|m| m.len()).unwrap_or(0)
    );

    // 返回相对于 recordings 目录的路径
    Ok(video_filename)
}

/// 加载视频文件数据
#[tauri::command]
pub async fn recording_load_video(
    app: AppHandle,
    video_filename: String,
) -> std::result::Result<Vec<u8>, String> {
    let recordings_dir = get_recordings_dir(&app).map_err(|e| e.to_string())?;
    let video_path = recordings_dir.join(&video_filename);

    if !video_path.exists() {
        return Err(format!("Video file not found: {}", video_filename));
    }

    let video_data = fs::read(&video_path)
        .map_err(|e| format!("Failed to read video file: {}", e))?;

    println!(
        "[Recording] Loaded video file: {} ({} bytes)",
        video_filename,
        video_data.len()
    );

    Ok(video_data)
}

/// 更新录制文件元数据
#[tauri::command]
pub async fn recording_update_metadata(
    app: AppHandle,
    file_id: String,
    metadata: serde_json::Value,
) -> std::result::Result<(), String> {
    let recordings_dir = get_recordings_dir(&app).map_err(|e| e.to_string())?;
    let file_path = recordings_dir.join(format!("{}.json", file_id));

    if !file_path.exists() {
        return Err(format!("Recording file not found: {}", file_id));
    }

    // 加载录制文件
    let mut recording_file = load_recording_file_from_path(&file_path).map_err(|e| e.to_string())?;

    // 更新元数据
    if let Some(session_name) = metadata.get("sessionName").and_then(|v| v.as_str()) {
        recording_file.metadata.session_name = session_name.to_string();
    }

    if let Some(description) = metadata.get("description").and_then(|v| v.as_str()) {
        recording_file.metadata.description = Some(description.to_string());
    }

    if let Some(tags) = metadata.get("tags").and_then(|v| v.as_array()) {
        recording_file.metadata.tags = tags
            .iter()
            .filter_map(|v| v.as_str().map(|s| s.to_string()))
            .collect();
    }

    // 序列化为 JSON
    let json_content = serde_json::to_string_pretty(&recording_file)
        .map_err(|e| format!("Failed to serialize recording file: {}", e))?;

    // 写入文件
    fs::write(&file_path, json_content)
        .map_err(|e| format!("Failed to write recording file: {}", e))?;

    println!("[Recording] Updated metadata for recording file: {}", file_id);

    Ok(())
}
