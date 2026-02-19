use axum::{
    body::{Body, Bytes, to_bytes},
    extract::Request,
    middleware::Next,
    response::Response,
};
use std::time::Instant;

/// Request ID 标记
#[derive(Clone)]
pub struct RequestId(pub String);

/// 截断长字符串（超过50字符用"....."代替）
fn truncate_string(s: &str, max_len: usize) -> String {
    if s.len() > max_len {
        format!("{}.....", &s[..max_len])
    } else {
        s.to_string()
    }
}

/// 美化JSON并截断字段值
fn prettify_json_with_truncation(json_str: &str) -> String {
    match serde_json::from_str::<serde_json::Value>(json_str) {
        Ok(mut value) => {
            // 递归截断所有字符串值
            truncate_json_values(&mut value, 50);
            // 美化输出
            serde_json::to_string_pretty(&value).unwrap_or_else(|_| json_str.to_string())
        }
        Err(_) => {
            // 如果不是JSON，直接截断
            truncate_string(json_str, 50)
        }
    }
}

/// 递归截断JSON中的所有字符串值
fn truncate_json_values(value: &mut serde_json::Value, max_len: usize) {
    match value {
        serde_json::Value::String(s) => {
            *s = truncate_string(s, max_len);
        }
        serde_json::Value::Array(arr) => {
            for item in arr {
                truncate_json_values(item, max_len);
            }
        }
        serde_json::Value::Object(obj) => {
            for (_, v) in obj.iter_mut() {
                truncate_json_values(v, max_len);
            }
        }
        _ => {}
    }
}

/// 请求日志中间件
pub async fn request_logging_middleware(
    mut req: Request<Body>,
    next: Next,
) -> Response {
    let start = Instant::now();

    // 提取请求信息
    let method = req.method().clone();
    let path = req.uri().path().to_string();
    let query = req.uri().query().map(|s| s.to_string());

    // 生成请求 ID
    let request_id = uuid::Uuid::new_v4().to_string();

    // 将 request_id 存储到请求扩展中
    req.extensions_mut().insert(RequestId(request_id.clone()));

    // 第1条日志：请求开始
    let separator = "=".repeat(80);
    let header = format!("{} {}", method, path);

    tracing::info!("{}", separator);
    tracing::info!("{}", header);
    tracing::info!("{}", separator);

    let format = time::format_description::parse(
    "[year]-[month]-[day] [hour]:[minute]:[second].[subsecond digits:3]"
).unwrap();
let now_beijing = time::OffsetDateTime::now_utc()
    .to_offset(time::UtcOffset::from_hms(8, 0, 0).unwrap())
    .format(&format)
    .unwrap();
    let query_str = query.as_deref().unwrap_or("无");
    tracing::info!(
        "[{}] 📥 查询参数: {} | 时间: {}",
        request_id,
        query_str,
        now_beijing
    );

    // 1️⃣ 提取请求体（使用 axum 的 to_bytes）
    // 注意：to_bytes 需要 Body 的所有权，所以我们需要先取出 body
    let (parts, body) = req.into_parts();
    let body_bytes: Bytes = match to_bytes(body, usize::MAX).await {
        Ok(bytes) => bytes,
        Err(_) => Bytes::new(),
    };
    let body_str = String::from_utf8_lossy(&body_bytes).to_string();

    // 2️⃣ 打印请求体
    if !body_str.is_empty() {
        let prettified_body = prettify_json_with_truncation(&body_str);
        tracing::info!("[{}] 🔧 请求体参数:\n{}", request_id, prettified_body);
    }

    // 3️⃣ ❗关键：重新构建请求，把 body 放回去
    let new_req = Request::from_parts(parts, Body::from(body_bytes));

    // 4️⃣ 调用下一个处理器
    let response = next.run(new_req).await;

    // 第3条日志：请求完成
    let duration = start.elapsed();
    let status = response.status();
    tracing::info!(
        "[{}] ✅ 状态码: {} | 耗时: {}ms",
        request_id,
        status.as_u16(),
        duration.as_millis()
    );

    tracing::info!("{}", separator);

    response
}

/// 请求日志辅助工具
pub fn log_info<T: std::fmt::Debug>(request_id: &RequestId, label: &str, data: T) {
    let data_str = format!("{:?}", data);
    let truncated = if data_str.len() > 300 {
        format!("{}...", &data_str[..300])
    } else {
        data_str
    };

    tracing::info!("[{}] 🔧 {} | {}", request_id.0, label, truncated);
}
