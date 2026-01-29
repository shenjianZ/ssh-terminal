use crate::error::{Result, SSHError};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use dirs::home_dir;

/// 快捷键配置存储结构
#[derive(Debug, Serialize, Deserialize)]
pub struct KeybindingsStorage {
    pub version: String,
    pub keybindings: KeybindingsData,
}

/// 快捷键数据
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct KeybindingsData {
    pub keybindings: std::collections::HashMap<String, KeyCombination>,
    pub presets: Vec<KeybindingPreset>,
}

/// 快捷键组合
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct KeyCombination {
    pub ctrl: bool,
    pub alt: bool,
    pub shift: bool,
    pub key: String,
}

/// 快捷键预设
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct KeybindingPreset {
    pub id: String,
    pub name: String,
    pub description: String,
    pub keybindings: std::collections::HashMap<String, KeyCombination>,
}

/// 快捷键存储管理器
pub struct KeybindingsStorageManager {
    storage_path: PathBuf,
}

impl KeybindingsStorageManager {
    /// 创建新的快捷键存储管理器
    pub fn new() -> Result<Self> {
        let storage_dir = Self::get_storage_dir()?;

        // 确保存储目录存在
        fs::create_dir_all(&storage_dir)
            .map_err(|e| SSHError::Storage(format!("Failed to create storage directory: {}", e)))?;

        let storage_path = storage_dir.join("shortcuts.json");

        Ok(Self { storage_path })
    }

    /// 获取存储目录
    fn get_storage_dir() -> Result<PathBuf> {
        let home = home_dir()
            .ok_or_else(|| SSHError::Storage("Failed to get home directory".to_string()))?;

        // Windows: C:\Users\{username}\.tauri-terminal
        let config_dir = home.join(".tauri-terminal");

        Ok(config_dir)
    }

    /// 加载快捷键配置
    pub fn load_keybindings(&self) -> Result<KeybindingsData> {
        if !self.storage_path.exists() {
            // 如果文件不存在，创建默认配置并保存
            println!("Keybindings file not found, creating default configuration");
            let default_data = Self::get_default_keybindings();
            self.save_keybindings(&default_data)?;
            return Ok(default_data);
        }

        let content = fs::read_to_string(&self.storage_path)
            .map_err(|e| SSHError::Storage(format!("Failed to read keybindings file: {}", e)))?;

        let storage: KeybindingsStorage = serde_json::from_str(&content)
            .map_err(|e| SSHError::Storage(format!("Failed to parse keybindings file: {}", e)))?;

        println!("Loaded {} keybindings from storage", storage.keybindings.keybindings.len());
        Ok(storage.keybindings)
    }

    /// 保存快捷键配置
    pub fn save_keybindings(&self, data: &KeybindingsData) -> Result<()> {
        let storage = KeybindingsStorage {
            version: "1.0".to_string(),
            keybindings: data.clone(),
        };

        let content = serde_json::to_string_pretty(&storage)
            .map_err(|e| SSHError::Storage(format!("Failed to serialize keybindings: {}", e)))?;

        fs::write(&self.storage_path, content)
            .map_err(|e| SSHError::Storage(format!("Failed to write keybindings file: {}", e)))?;

        println!("Saved {} keybindings to storage", data.keybindings.len());
        Ok(())
    }

    /// 获取默认快捷键配置
    pub fn get_default_keybindings() -> KeybindingsData {
        // VSCode 风格的默认配置
        let mut keybindings = std::collections::HashMap::new();

        // 全局快捷键
        keybindings.insert("global.newConnection".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "KeyN".to_string(),
        });
        keybindings.insert("global.openSettings".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "Comma".to_string(),
        });
        keybindings.insert("global.toggleSidebar".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "KeyB".to_string(),
        });

        // 终端快捷键
        keybindings.insert("terminal.newTab".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "KeyT".to_string(),
        });
        keybindings.insert("terminal.closeTab".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "KeyW".to_string(),
        });
        keybindings.insert("terminal.nextTab".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "Tab".to_string(),
        });
        keybindings.insert("terminal.previousTab".to_string(), KeyCombination {
            ctrl: true, alt: true, shift: false, key: "Tab".to_string(),
        });
        keybindings.insert("terminal.find".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "KeyF".to_string(),
        });
        keybindings.insert("terminal.clear".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "KeyL".to_string(),
        });
        keybindings.insert("terminal.paste".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "KeyV".to_string(),
        });
        keybindings.insert("terminal.zoomIn".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "Equal".to_string(),
        });
        keybindings.insert("terminal.zoomOut".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "Minus".to_string(),
        });
        keybindings.insert("terminal.zoomReset".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "Digit0".to_string(),
        });
        keybindings.insert("terminal.openNLToCmd".to_string(), KeyCombination {
            ctrl: false, alt: false, shift: true, key: "Digit3".to_string(), // Shift+#
        });
        keybindings.insert("terminal.explainCommand".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: true, key: "KeyE".to_string(), // Ctrl+Shift+E
        });
        keybindings.insert("terminal.analyzeError".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: true, key: "KeyA".to_string(), // Ctrl+Shift+A
        });
        keybindings.insert("terminal.openAIChat".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: true, key: "KeyI".to_string(), // Ctrl+Shift+I
        });

        // SFTP 快捷键
        keybindings.insert("sftp.upload".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "KeyU".to_string(),
        });
        keybindings.insert("sftp.download".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "KeyD".to_string(),
        });
        keybindings.insert("sftp.refresh".to_string(), KeyCombination {
            ctrl: false, alt: false, shift: false, key: "F5".to_string(),
        });

        // 会话管理快捷键
        keybindings.insert("session.quickConnect".to_string(), KeyCombination {
            ctrl: true, alt: false, shift: false, key: "KeyK".to_string(),
        });

        // 默认预设
        let presets = vec![
            KeybindingPreset {
                id: "vscode".to_string(),
                name: "VSCode 风格".to_string(),
                description: "类似 VSCode 的快捷键布局".to_string(),
                keybindings: keybindings.clone(),
            },
            KeybindingPreset {
                id: "terminal".to_string(),
                name: "Terminal 风格".to_string(),
                description: "类似 iTerm2/Terminal.app 的快捷键布局".to_string(),
                keybindings: {
                    let mut kb = keybindings.clone();
                    kb.insert("terminal.clear".to_string(), KeyCombination {
                        ctrl: true, alt: false, shift: false, key: "KeyK".to_string(),
                    });
                    kb
                },
            },
            KeybindingPreset {
                id: "vim".to_string(),
                name: "Vim 风格".to_string(),
                description: "为 Vim 用户优化的快捷键布局".to_string(),
                keybindings: {
                    let mut kb = keybindings.clone();
                    kb.insert("terminal.paste".to_string(), KeyCombination {
                        ctrl: true, alt: false, shift: false, key: "KeyP".to_string(),
                    });
                    kb.insert("terminal.find".to_string(), KeyCombination {
                        ctrl: true, alt: false, shift: false, key: "Slash".to_string(),
                    });
                    kb
                },
            },
        ];

        KeybindingsData {
            keybindings,
            presets,
        }
    }
}