-- favorites 收藏关系表 | SQLite | source: docs/design/db/db.md
CREATE TABLE IF NOT EXISTS `favorites` (
  `user_id` INTEGER NOT NULL,
  `tutorial_id` INTEGER NOT NULL,
  `created_at` TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (user_id, tutorial_id)
);
