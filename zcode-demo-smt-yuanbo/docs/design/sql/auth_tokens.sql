-- auth_tokens 登录令牌表 | SQLite | source: docs/design/db/db.md
CREATE TABLE IF NOT EXISTS `auth_tokens` (
  `token` TEXT PRIMARY KEY,
  `user_id` INTEGER NOT NULL,
  `created_at` TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
