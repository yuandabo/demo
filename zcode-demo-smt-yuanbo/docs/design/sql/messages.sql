-- messages 消息表 | SQLite | source: docs/design/db/db.md
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `erp_role` TEXT NOT NULL,
  `title` TEXT NOT NULL,
  `tutorial_id` INTEGER,
  `is_read` INTEGER NOT NULL DEFAULT 0,
  `created_at` TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
