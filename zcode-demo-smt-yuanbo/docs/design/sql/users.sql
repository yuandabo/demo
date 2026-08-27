-- users 用户表 | SQLite | source: docs/design/db/db.md
CREATE TABLE IF NOT EXISTS `users` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `username` TEXT NOT NULL UNIQUE,
  `password` TEXT NOT NULL,
  `role` TEXT NOT NULL CHECK (role IN ('admin','operator','user')),
  `erp_role` TEXT,
  `display_name` TEXT NOT NULL,
  `created_at` TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
