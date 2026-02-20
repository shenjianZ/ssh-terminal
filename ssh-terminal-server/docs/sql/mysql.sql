-- ============================================
-- MySQL 自动化初始化脚本
-- ============================================
-- 此文件会在服务器启动时自动执行
-- 创建内容：索引
-- ============================================

-- ============================================
-- 索引定义
-- ============================================

-- 用户资料表索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted ON user_profiles(deleted_at);

-- SSH 会话表索引
CREATE INDEX IF NOT EXISTS idx_ssh_sessions_user_id ON ssh_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ssh_sessions_group ON ssh_sessions(group_name);
CREATE INDEX IF NOT EXISTS idx_ssh_sessions_deleted ON ssh_sessions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_ssh_sessions_server_ver ON ssh_sessions(server_ver);

-- ============================================
-- 注意事项
-- ============================================
-- 1. MySQL 使用 ON UPDATE CURRENT_TIMESTAMP 自动更新时间戳，已在表定义中
-- 2. server_ver 字段在应用层（Repository）中自动递增
-- 3. 无需创建触发器
