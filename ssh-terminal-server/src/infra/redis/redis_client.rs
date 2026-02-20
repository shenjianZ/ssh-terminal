use super::redis_key::RedisKey;
use redis::aio::MultiplexedConnection;
use redis::{AsyncCommands, Client};
use serde::Serialize;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::warn;

/// Redis 客户端（支持自动重连）
#[derive(Clone)]
pub struct RedisClient {
    client: Client,
    conn: Arc<Mutex<MultiplexedConnection>>,
}

impl RedisClient {
    /// 创建新的 Redis 客户端
    pub async fn new(url: &str) -> redis::RedisResult<Self> {
        let client = Client::open(url)?;
        let conn = client.get_multiplexed_async_connection().await?;
        Ok(Self {
            client,
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    /// 重建连接
    async fn reconnect(&self) -> redis::RedisResult<()> {
        match self.client.get_multiplexed_async_connection().await {
            Ok(new_conn) => {
                *self.conn.lock().await = new_conn;
                tracing::info!("Redis 连接已重新建立");
                Ok(())
            }
            Err(e) => {
                warn!("Redis 重连失败: {}", e);
                Err(e)
            }
        }
    }

    /// 设置字符串值
    pub async fn set(&self, k: &str, v: &str) -> redis::RedisResult<()> {
        let mut conn = self.conn.lock().await;
        let result: redis::RedisResult<()> = conn.set(k, v).await;
        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                if self.is_connection_error(&e) {
                    drop(conn);
                    self.reconnect().await?;
                    let mut conn = self.conn.lock().await;
                    conn.set(k, v).await
                } else {
                    Err(e)
                }
            }
        }
    }

    /// 获取字符串值
    pub async fn get(&self, k: &str) -> redis::RedisResult<Option<String>> {
        let mut conn = self.conn.lock().await;
        let result: redis::RedisResult<Option<String>> = conn.get(k).await;
        match result {
            Ok(result) => Ok(result),
            Err(e) => {
                if self.is_connection_error(&e) {
                    drop(conn);
                    self.reconnect().await?;
                    let mut conn = self.conn.lock().await;
                    conn.get(k).await
                } else {
                    Err(e)
                }
            }
        }
    }

    /// 设置字符串值并指定过期时间（秒）
    pub async fn set_ex(&self, k: &str, v: &str, seconds: u64) -> redis::RedisResult<()> {
        let mut conn = self.conn.lock().await;
        let result: redis::RedisResult<()> = conn.set_ex(k, v, seconds).await;
        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                if self.is_connection_error(&e) {
                    drop(conn);
                    self.reconnect().await?;
                    let mut conn = self.conn.lock().await;
                    conn.set_ex(k, v, seconds).await
                } else {
                    Err(e)
                }
            }
        }
    }

    /// 删除键
    pub async fn del(&self, k: &str) -> redis::RedisResult<()> {
        let mut conn = self.conn.lock().await;
        let result: redis::RedisResult<()> = conn.del(k).await;
        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                if self.is_connection_error(&e) {
                    drop(conn);
                    self.reconnect().await?;
                    let mut conn = self.conn.lock().await;
                    conn.del(k).await
                } else {
                    Err(e)
                }
            }
        }
    }

    /// 设置键的过期时间（秒）
    pub async fn expire(&self, k: &str, seconds: u64) -> redis::RedisResult<()> {
        let mut conn = self.conn.lock().await;
        let result: redis::RedisResult<()> = conn.expire(k, seconds as i64).await;
        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                if self.is_connection_error(&e) {
                    drop(conn);
                    self.reconnect().await?;
                    let mut conn = self.conn.lock().await;
                    conn.expire(k, seconds as i64).await
                } else {
                    Err(e)
                }
            }
        }
    }

    /// 使用 RedisKey 设置 JSON 值
    pub async fn set_key<T: Serialize>(
        &self,
        key: &RedisKey,
        value: &T,
    ) -> redis::RedisResult<()> {
        let json = serde_json::to_string(value).map_err(|e| {
            redis::RedisError::from((
                redis::ErrorKind::TypeError,
                "JSON serialization failed",
                e.to_string(),
            ))
        })?;
        let key_str = key.build();
        let mut conn = self.conn.lock().await;
        let result: redis::RedisResult<()> = conn.set(key_str.clone(), json.clone()).await;
        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                if self.is_connection_error(&e) {
                    drop(conn);
                    self.reconnect().await?;
                    let mut conn = self.conn.lock().await;
                    conn.set(key_str, json).await
                } else {
                    Err(e)
                }
            }
        }
    }

    /// 使用 RedisKey 设置 JSON 值并指定过期时间（秒）
    pub async fn set_key_ex<T: Serialize>(
        &self,
        key: &RedisKey,
        value: &T,
        expiration_seconds: u64,
    ) -> redis::RedisResult<()> {
        let json = serde_json::to_string(value).map_err(|e| {
            redis::RedisError::from((
                redis::ErrorKind::TypeError,
                "JSON serialization failed",
                e.to_string(),
            ))
        })?;
        let key_str = key.build();
        let mut conn = self.conn.lock().await;
        let result: redis::RedisResult<()> = conn.set_ex(key_str.clone(), json.clone(), expiration_seconds).await;
        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                if self.is_connection_error(&e) {
                    drop(conn);
                    self.reconnect().await?;
                    let mut conn = self.conn.lock().await;
                    conn.set_ex(key_str, json, expiration_seconds).await
                } else {
                    Err(e)
                }
            }
        }
    }

    /// 使用 RedisKey 获取字符串值
    pub async fn get_key(&self, key: &RedisKey) -> redis::RedisResult<Option<String>> {
        let key_str = key.build();
        let mut conn = self.conn.lock().await;
        let result: redis::RedisResult<Option<String>> = conn.get(key_str.clone()).await;
        match result {
            Ok(result) => Ok(result),
            Err(e) => {
                if self.is_connection_error(&e) {
                    drop(conn);
                    self.reconnect().await?;
                    let mut conn = self.conn.lock().await;
                    conn.get(key_str).await
                } else {
                    Err(e)
                }
            }
        }
    }

    /// 使用 RedisKey 获取并反序列化 JSON 值
    pub async fn get_key_json<T: for<'de> serde::Deserialize<'de>>(
        &self,
        key: &RedisKey,
    ) -> redis::RedisResult<Option<T>> {
        let key_str = key.build();
        let mut conn = self.conn.lock().await;
        let json: Option<String> = match conn.get(key_str.clone()).await {
            Ok(result) => result,
            Err(e) => {
                if self.is_connection_error(&e) {
                    drop(conn);
                    self.reconnect().await?;
                    let mut conn = self.conn.lock().await;
                    conn.get(key_str).await?
                } else {
                    return Err(e);
                }
            }
        };
        match json {
            Some(data) => {
                let value = serde_json::from_str(&data).map_err(|e| {
                    redis::RedisError::from((
                        redis::ErrorKind::TypeError,
                        "JSON deserialization failed",
                        e.to_string(),
                    ))
                })?;
                Ok(Some(value))
            }
            None => Ok(None),
        }
    }

    /// 使用 RedisKey 删除键
    pub async fn delete_key(&self, key: &RedisKey) -> redis::RedisResult<()> {
        let key_str = key.build();
        let mut conn = self.conn.lock().await;
        let result: redis::RedisResult<()> = conn.del(key_str.clone()).await;
        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                if self.is_connection_error(&e) {
                    drop(conn);
                    self.reconnect().await?;
                    let mut conn = self.conn.lock().await;
                    conn.del(key_str).await
                } else {
                    Err(e)
                }
            }
        }
    }

    /// 使用 RedisKey 检查键是否存在
    pub async fn exists_key(&self, key: &RedisKey) -> redis::RedisResult<bool> {
        let key_str = key.build();
        let mut conn = self.conn.lock().await;
        let result: redis::RedisResult<bool> = conn.exists(key_str.clone()).await;
        match result {
            Ok(result) => Ok(result),
            Err(e) => {
                if self.is_connection_error(&e) {
                    drop(conn);
                    self.reconnect().await?;
                    let mut conn = self.conn.lock().await;
                    conn.exists(key_str).await
                } else {
                    Err(e)
                }
            }
        }
    }

    /// 使用 RedisKey 设置键的过期时间（秒）
    pub async fn expire_key(&self, key: &RedisKey, seconds: u64) -> redis::RedisResult<()> {
        let key_str = key.build();
        let mut conn = self.conn.lock().await;
        let result: redis::RedisResult<()> = conn.expire(key_str.clone(), seconds as i64).await;
        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                if self.is_connection_error(&e) {
                    drop(conn);
                    self.reconnect().await?;
                    let mut conn = self.conn.lock().await;
                    conn.expire(key_str, seconds as i64).await
                } else {
                    Err(e)
                }
            }
        }
    }

    /// 检查是否是连接错误
    fn is_connection_error(&self, e: &redis::RedisError) -> bool {
        let err_msg = e.to_string();
        err_msg.contains("broken pipe")
            || err_msg.contains("connection closed")
            || err_msg.contains("Connection reset")
    }
}
