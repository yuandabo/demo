-- tutorials 教程表 | SQLite | source: docs/design/db/db.md
CREATE TABLE IF NOT EXISTS `tutorials` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `title` TEXT NOT NULL,
  `category_id` INTEGER NOT NULL,
  `summary` TEXT NOT NULL,
  `content` TEXT NOT NULL,
  `video_url` TEXT,
  `tags` TEXT NOT NULL DEFAULT '[]',
  `status` TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','published','offline')),
  `is_top` INTEGER NOT NULL DEFAULT 0,
  `sort` INTEGER NOT NULL DEFAULT 100,
  `view_count` INTEGER NOT NULL DEFAULT 0,
  `fav_count` INTEGER NOT NULL DEFAULT 0,
  `helpful_yes` INTEGER NOT NULL DEFAULT 0,
  `helpful_no` INTEGER NOT NULL DEFAULT 0,
  `share_count` INTEGER NOT NULL DEFAULT 0,
  `reject_reason` TEXT,
  `submit_count` INTEGER NOT NULL DEFAULT 0,
  `author_id` INTEGER NOT NULL,
  `reviewer_id` INTEGER,
  `reviewed_at` TEXT,
  `published_content` TEXT,
  `published_summary` TEXT,
  `published_at` TEXT,
  `last_offline_at` TEXT,
  `created_at` TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  `updated_at` TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS `idx_tutorials_status` ON `tutorials`(`status`);
CREATE INDEX IF NOT EXISTS `idx_tutorials_category` ON `tutorials`(`category_id`);
