use serde::{Deserialize, Serialize};
use std::fmt;

/// 业务类型枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum BusinessType {
    #[serde(rename = "auth")]
    Auth,
    #[serde(rename = "user")]
    User,
    #[serde(rename = "cache")]
    Cache,
    #[serde(rename = "session")]
    Session,
    #[serde(rename = "rate_limit")]
    RateLimit,
}

impl BusinessType {
    pub fn prefix(self) -> &'static str {
        match self {
            BusinessType::Auth => "auth",
            BusinessType::User => "user",
            BusinessType::Cache => "cache",
            BusinessType::Session => "session",
            BusinessType::RateLimit => "rate_limit",
        }
    }
}

/// Redis 键构建器
#[derive(Debug, Clone)]
pub struct RedisKey {
    business: BusinessType,
    identifiers: Vec<String>,
}

impl RedisKey {
    pub fn new(business: BusinessType) -> Self {
        Self {
            business,
            identifiers: Vec::new(),
        }
    }

    pub fn add_identifier(mut self, id: impl Into<String>) -> Self {
        self.identifiers.push(id.into());
        self
    }

    pub fn build(&self) -> String {
        format!("{}:{}", self.business.prefix(), self.identifiers.join(":"))
    }
}

// 兼容现有格式
impl fmt::Display for RedisKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.build())
    }
}
