CREATE EXTENSION IF NOT EXISTS ltree;

CREATE INDEX IF NOT EXISTS idx_notifications_user_not_deleted ON notifications (user_id, created_at DESC) WHERE (deleted_at IS NULL);
