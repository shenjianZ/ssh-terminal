use thiserror::Error;

/// Redis 错误类型
#[derive(Error, Debug)]
pub enum RedisError {
    #[error("Redis 连接失败: {0}")]
    ConnectionError(#[from] redis::RedisError),

    #[error("Redis 序列化失败: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Redis 数据不存在: {key}")]
    NotFound { key: String },

    #[error("Redis 操作失败: {message}")]
    OperationError { message: String },

    #[error("Failed to create redis pool: {0}")]
    PoolCreation(#[from] deadpool_redis::CreatePoolError),
}
