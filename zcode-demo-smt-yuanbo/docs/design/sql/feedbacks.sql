-- feedbacks 反馈记录表 | SQLite | source: docs/design/db/db.md
CREATE TABLE IF NOT EXISTS `feedbacks` (
  `user_id` INTEGER NOT NULL,
  `tutorial_id` INTEGER NOT NULL,
  `helpful` INTEGER NOT NULL CHECK (helpful IN (0,1)),
  `comment` TEXT,
  `updated_at` TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (user_id, tutorial_id)
);
