-- categories 分类表 | SQLite | source: docs/design/db/db.md
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` TEXT NOT NULL,
  `parent_id` INTEGER,
  `sort` INTEGER NOT NULL DEFAULT 0,
  `status` TEXT NOT NULL DEFAULT 'enabled' CHECK (status IN ('enabled','disabled')),
  `erp_module` TEXT,
  `created_at` TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  `updated_at` TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
