use crate::config::KeybindingsStorageManager;
use crate::error::Result;

/// 保存快捷键配置
#[tauri::command]
pub async fn storage_keybindings_save(
    keybindings: std::collections::HashMap<String, crate::config::keybindings::KeyCombination>,
    presets: Vec<crate::config::keybindings::KeybindingPreset>,
) -> Result<()> {
    let manager = KeybindingsStorageManager::new()?;

    let data = crate::config::keybindings::KeybindingsData {
        keybindings,
        presets,
    };

    manager.save_keybindings(&data)?;
    Ok(())
}

/// 加载快捷键配置
#[tauri::command]
pub async fn storage_keybindings_load() -> std::result::Result<crate::config::keybindings::KeybindingsData, String> {
    let manager = KeybindingsStorageManager::new().map_err(|e| e.to_string())?;
    let data = manager.load_keybindings().map_err(|e| e.to_string())?;
    Ok(data)
}

/// 导入快捷键配置
#[tauri::command]
pub async fn storage_keybindings_import(
    json_string: String,
) -> std::result::Result<(), String> {
    let manager = KeybindingsStorageManager::new().map_err(|e| e.to_string())?;

    // 解析导入的 JSON
    let value: serde_json::Value = serde_json::from_str(&json_string)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    // 验证版本
    let version = value.get("version")
        .and_then(|v| v.as_str())
        .ok_or("Missing version field")?;

    if version != "1.0" {
        return Err(format!("Unsupported version: {}", version));
    }

    // 解析 keybindings
    let keybindings: std::collections::HashMap<String, crate::config::keybindings::KeyCombination> =
        serde_json::from_value(value.get("keybindings")
            .ok_or("Missing keybindings field")?
            .clone())
        .map_err(|e| format!("Failed to parse keybindings: {}", e))?;

    // 解析 presets（可选）
    let presets = if let Some(presets_value) = value.get("presets") {
        serde_json::from_value(presets_value.clone())
            .map_err(|e| format!("Failed to parse presets: {}", e))?
    } else {
        Vec::new()
    };

    // 保存导入的配置
    let data = crate::config::keybindings::KeybindingsData {
        keybindings,
        presets,
    };

    manager.save_keybindings(&data).map_err(|e| e.to_string())?;

    println!("[Keybindings] Imported configuration successfully");
    Ok(())
}

/// 重置为默认配置
#[tauri::command]
pub async fn storage_keybindings_reset() -> std::result::Result<(), String> {
    let manager = KeybindingsStorageManager::new().map_err(|e| e.to_string())?;

    // 获取默认配置
    let default_data = crate::config::keybindings::KeybindingsStorageManager::get_default_keybindings();

    // 保存默认配置
    manager.save_keybindings(&default_data).map_err(|e| e.to_string())?;

    println!("[Keybindings] Reset to default configuration");
    Ok(())
}