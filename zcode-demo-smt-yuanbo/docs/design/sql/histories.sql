-- histories 浏览历史表 | SQLite | source: docs/design/db/db.md
CREATE TABLE IF NOT EXISTS `histories` (
  `user_id` INTEGER NOT NULL,
  `tutorial_id` INTEGER NOT NULL,
  `progress` INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  `updated_at` TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (user_id, tutorial_id)
);
