// AI Provider Manager - 管理和缓存 AI Provider 实例

use super::provider::AIProvider;
use super::{OpenAIProvider, OllamaProvider};
use crate::commands::ai::AIProviderConfig;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tracing::{debug, info};

/// AI Provider 管理器
///
/// 负责缓存和复用 AI Provider 实例，避免重复创建连接
pub struct AIProviderManager {
    /// Provider 实例缓存
    /// Key: provider 配置的哈希值
    /// Value: Arc 包装的 Provider 实例（可以安全地在多个请求之间共享）
    cache: Arc<Mutex<HashMap<String, Arc<dyn AIProvider + Send + Sync>>>>,
}

impl AIProviderManager {
    /// 创建新的 AI Provider Manager
    pub fn new() -> Self {
        info!("[AIProviderManager] Initializing AI Provider Manager");
        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// 生成 provider 配置的唯一标识符
    ///
    /// 基于配置的关键参数生成哈希值，用于缓存 key
    fn generate_cache_key(config: &AIProviderConfig) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();

        // 关键参数参与哈希
        config.provider_type.hash(&mut hasher);
        config.base_url.hash(&mut hasher);
        config.model.hash(&mut hasher);

        // f32 不能直接 hash，使用 to_bits 转换为整数
        if let Some(temp) = config.temperature {
            temp.to_bits().hash(&mut hasher);
        } else {
            None::<u32>.hash(&mut hasher);
        }

        // max_tokens 可以直接 hash
        config.max_tokens.hash(&mut hasher);

        // API key 也参与哈希（不同 API key 应该是不同的实例）
        if let Some(ref key) = config.api_key {
            key.hash(&mut hasher);
        }

        format!("{}:{:x}", config.provider_type, hasher.finish())
    }

    /// 获取或创建 Provider 实例
    ///
    /// 如果缓存中存在相同配置的 Provider，则返回缓存的实例；
    /// 否则创建新实例并缓存
    ///
    /// 返回 Arc 包装的 provider，可以在多个请求之间安全共享
    pub fn get_or_create_provider(
        &self,
        config: &AIProviderConfig,
    ) -> Result<Arc<dyn AIProvider + Send + Sync>, String> {
        let cache_key = Self::generate_cache_key(config);

        // 尝试从缓存获取
        {
            let cache = self.cache.lock().map_err(|e| format!("Cache lock failed: {}", e))?;
            if let Some(provider) = cache.get(&cache_key) {
                debug!(
                    "[AIProviderManager] Cache HIT for provider: {} (model: {})",
                    config.provider_type, config.model
                );
                return Ok(Arc::clone(provider));
            }
        }

        // 缓存未命中，创建新实例
        info!(
            "[AIProviderManager] Cache MISS - Creating new provider instance: {} (model: {})",
            config.provider_type, config.model
        );

        let provider: Arc<dyn AIProvider + Send + Sync> = self.create_provider(config)?;

        // 存入缓存
        {
            let mut cache = self.cache.lock().map_err(|e| format!("Cache lock failed: {}", e))?;
            cache.insert(cache_key, Arc::clone(&provider));
            debug!(
                "[AIProviderManager] Provider cached. Cache size: {}",
                cache.len()
            );
        }

        Ok(provider)
    }

    /// 创建 Provider 实例
    fn create_provider(
        &self,
        config: &AIProviderConfig,
    ) -> Result<Arc<dyn AIProvider + Send + Sync>, String> {
        match config.provider_type.as_str() {
            "ollama" => {
                debug!("[AIProviderManager] Creating Ollama provider");
                Ok(Arc::new(OllamaProvider::new(
                    config.base_url.clone(),
                    config.model.clone(),
                    config.temperature,
                    config.max_tokens,
                )))
            }
            _ => {
                // 默认使用 OpenAI 兼容接口
                debug!(
                    "[AIProviderManager] Creating OpenAI-compatible provider: {}",
                    config.provider_type
                );
                let api_key = config
                    .api_key
                    .clone()
                    .ok_or("API key is required for this provider".to_string())?;
                Ok(Arc::new(OpenAIProvider::new(
                    api_key,
                    config.base_url.clone(),
                    config.model.clone(),
                    config.temperature,
                    config.max_tokens,
                )))
            }
        }
    }

    /// 清除所有缓存的 Provider 实例
    pub fn clear_cache(&self) {
        let mut cache = self.cache.lock().unwrap();
        let size = cache.len();
        cache.clear();
        info!(
            "[AIProviderManager] Cache cleared. Removed {} providers",
            size
        );
    }

    /// 获取缓存中的 Provider 数量
    pub fn cache_size(&self) -> usize {
        let cache = self.cache.lock().unwrap();
        cache.len()
    }

    /// 列出所有缓存的 Provider key
    pub fn list_cached_providers(&self) -> Vec<String> {
        let cache = self.cache.lock().unwrap();
        cache.keys().cloned().collect()
    }

    /// 批量移除多个 Provider 实例
    ///
    /// 用于配置热重载场景：当配置更新时，清除所有受影响的 Provider 缓存
    pub fn remove_providers(&self, configs: &[AIProviderConfig]) {
        let mut cache = self.cache.lock().unwrap();
        let mut removed_count = 0;

        for config in configs {
            let cache_key = Self::generate_cache_key(config);
            if cache.remove(&cache_key).is_some() {
                removed_count += 1;
                debug!(
                    "[AIProviderManager] Removed provider: {} (model: {})",
                    config.provider_type, config.model
                );
            }
        }

        if removed_count > 0 {
            info!(
                "[AIProviderManager] Batch removed {} providers from cache. Remaining: {}",
                removed_count,
                cache.len()
            );
        }
    }

    /// 智能热重载：根据新配置清除对应的旧缓存
    ///
    /// 比较新旧配置，只清除发生变化的 Provider，保留未变更的 Provider
    pub fn hot_reload(
        &self,
        old_configs: &[AIProviderConfig],
        new_configs: &[AIProviderConfig],
    ) -> Result<usize, String> {
        use std::collections::HashSet;

        // 生成旧配置和新配置的缓存 key 集合
        let old_keys: HashSet<String> = old_configs
            .iter()
            .map(|c| Self::generate_cache_key(c))
            .collect();

        let new_keys: HashSet<String> = new_configs
            .iter()
            .map(|c| Self::generate_cache_key(c))
            .collect();

        // 找出需要删除的 keys（在旧配置中但不在新配置中，或者配置已变更）
        let keys_to_remove: Vec<String> = old_keys
            .difference(&new_keys)
            .cloned()
            .collect();

        // 同时也要检查配置内容变更的（相同的 provider 但参数不同）
        let mut changed_configs = Vec::new();
        for old_config in old_configs {
            // 查找是否有相同 provider 类型的配置
            let has_match = new_configs.iter().any(|new_config| {
                old_config.provider_type == new_config.provider_type
                    && old_config.model == new_config.model
                    && Self::generate_cache_key(old_config) == Self::generate_cache_key(new_config)
            });

            if !has_match {
                changed_configs.push(old_config.clone());
            }
        }

        // 移除变更的配置
        if !changed_configs.is_empty() {
            self.remove_providers(&changed_configs);
        }

        // 移除不再存在的配置
        if !keys_to_remove.is_empty() {
            let mut cache = self.cache.lock().map_err(|e| e.to_string())?;
            for key in &keys_to_remove {
                if cache.remove(key).is_some() {
                    debug!("[AIProviderManager] Hot reload: removed stale provider with key: {}", key);
                }
            }
        }

        let total_removed = keys_to_remove.len() + changed_configs.len();

        if total_removed > 0 {
            info!(
                "[AIProviderManager] Hot reload completed: Removed {} providers, {} providers remain cached",
                total_removed,
                self.cache_size()
            );
        } else {
            info!("[AIProviderManager] Hot reload: No providers needed to be removed");
        }

        Ok(total_removed)
    }
}

impl Default for AIProviderManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_key_generation() {
        let config1 = AIProviderConfig {
            provider_type: "openai".to_string(),
            api_key: Some("sk-test123".to_string()),
            base_url: Some("https://api.openai.com/v1".to_string()),
            model: "gpt-4".to_string(),
            temperature: Some(0.7),
            max_tokens: Some(2000),
        };

        let config2 = AIProviderConfig {
            provider_type: "openai".to_string(),
            api_key: Some("sk-test123".to_string()),
            base_url: Some("https://api.openai.com/v1".to_string()),
            model: "gpt-4".to_string(),
            temperature: Some(0.7),
            max_tokens: Some(2000),
        };

        let config3 = AIProviderConfig {
            provider_type: "openai".to_string(),
            api_key: Some("sk-different".to_string()),
            base_url: Some("https://api.openai.com/v1".to_string()),
            model: "gpt-4".to_string(),
            temperature: Some(0.7),
            max_tokens: Some(2000),
        };

        let key1 = AIProviderManager::generate_cache_key(&config1);
        let key2 = AIProviderManager::generate_cache_key(&config2);
        let key3 = AIProviderManager::generate_cache_key(&config3);

        // 相同配置应该生成相同的 key
        assert_eq!(key1, key2);
        // 不同配置应该生成不同的 key
        assert_ne!(key1, key3);
    }

    #[test]
    fn test_cache_size() {
        let manager = AIProviderManager::new();
        assert_eq!(manager.cache_size(), 0);
        assert!(manager.list_cached_providers().is_empty());

        manager.clear_cache();
        assert_eq!(manager.cache_size(), 0);
    }
}
