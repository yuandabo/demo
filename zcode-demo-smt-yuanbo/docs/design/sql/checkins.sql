-- checkins 打卡记录表 | SQLite | source: docs/design/db/db.md
CREATE TABLE IF NOT EXISTS `checkins` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `user_id` INTEGER NOT NULL,
  `checkin_date` TEXT NOT NULL,
  `points` INTEGER NOT NULL DEFAULT 10,
  `streak` INTEGER NOT NULL DEFAULT 1,
  `created_at` TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  UNIQUE (user_id, checkin_date)
);
