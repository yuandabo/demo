# 数据库设计（云ERP教程中心）

> 需求 RE00001 ｜ 数据库：SQLite（Node 25 内置 node:sqlite，零原生依赖）｜文件：`server/erp.db`（首次启动自动建库+种子，`POST /api/system/reset` 可重置）

## 1. 实体清单与去重校验

> 全新子系统（场景 A 新项目），无存量库、无公司表索引可查——4 维度去重均在"全新目录"下进行，结论：全部新增。

| # | 实体 | 来源 | 状态 | 说明 |
|---|---|---|---|---|
| 1 | users 用户 | PRD §6（账号体系） | 新增 | admin/运营/普通用户三类 + erp_role |
| 2 | auth_tokens 登录令牌 | 鉴权决策（DB token） | 新增 | localStorage↔Header 携带，服务端查库校验 |
| 3 | categories 分类 | PRD §6（分类树） | 新增 | 两级、排序、启停用、模块映射 |
| 4 | tutorials 教程 | PRD §6（核心实体） | 新增 | 四态状态机 + **published_content 线上过审版本快照**（落实 PRD §6 前台可见性规则：可见=存在快照且未被下架） |
| 5 | favorites 收藏关系 | PRD §6 | 新增 | 联合主键（用户,教程），三端同库 |
| 6 | histories 浏览历史 | PRD §6（含进度） | 新增 | 联合主键，progress 覆盖更新 |
| 7 | feedbacks 反馈记录 | PRD §6（评价+留言） | 新增 | 每篇每人一条可改（联合主键） |
| 8 | messages 消息（mock） | PRD §7.10 消息联动预留 | 新增 | 按 erp_role 投递的审批待办示例，关联教程 |
| 9 | checkins 打卡记录 | PRD §7.10 学习打卡 | 新增 | 每日一 unique（用户,日期），积分/连续天数 |

## 2. 新增表 DDL（SQLite 方言，db.js 幂等执行 CREATE IF NOT EXISTS）

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','operator','user')),
  erp_role TEXT,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  sort INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'enabled' CHECK (status IN ('enabled','disabled')),
  erp_module TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS tutorials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  video_url TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','published','offline')),
  is_top INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 100,
  view_count INTEGER NOT NULL DEFAULT 0,
  fav_count INTEGER NOT NULL DEFAULT 0,
  helpful_yes INTEGER NOT NULL DEFAULT 0,
  helpful_no INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  reject_reason TEXT,
  submit_count INTEGER NOT NULL DEFAULT 0,
  author_id INTEGER NOT NULL,
  reviewer_id INTEGER,
  reviewed_at TEXT,
  published_content TEXT,
  published_summary TEXT,
  published_at TEXT,
  last_offline_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_tutorials_status ON tutorials(status);
CREATE INDEX IF NOT EXISTS idx_tutorials_category ON tutorials(category_id);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL,
  tutorial_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (user_id, tutorial_id)
);

CREATE TABLE IF NOT EXISTS histories (
  user_id INTEGER NOT NULL,
  tutorial_id INTEGER NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (user_id, tutorial_id)
);

CREATE TABLE IF NOT EXISTS feedbacks (
  user_id INTEGER NOT NULL,
  tutorial_id INTEGER NOT NULL,
  helpful INTEGER NOT NULL CHECK (helpful IN (0,1)),
  comment TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (user_id, tutorial_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  erp_role TEXT NOT NULL,
  title TEXT NOT NULL,
  tutorial_id INTEGER,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  checkin_date TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  streak INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  UNIQUE (user_id, checkin_date)
);
```

## 3. 关键设计说明

| 点 | 说明 |
|---|---|
| published_content / published_summary / published_at | **线上过审版本快照**：审核通过时把 content/summary 拷贝至此三列并更新 updated_at；前台/小程序/搜索只读快照列。可见性判定：`published_content IS NOT NULL AND status != 'offline'`（回审等待/驳回/撤回期间旧版持续在线——PRD §6 规则②④的直接实现）；下架教程编辑回审（来源 offline）过审前 status='pending' ≠ 'published'，但规则④要求不可见→补充条件：回审来源为 offline 时需 status='published' 才可见，用 `last_offline_at` 派生列实现（见偏差说明 3） |
| last_offline_at | 下架动作时间戳（§2 DDL 已含该列）；可见性最终式：`published_content IS NOT NULL AND (status='published' OR (status IN ('pending','draft') AND last_offline_at IS NULL))`；重新发布/过审时清空 |
| submit_count | 提审次数，驱动审核队列"修改版 v2+"标识（UI-ELEM-09 兜底定义） |
| tags | JSON 数组文本（SQLite 无数组类型），应用层序列化/反序列化，≤5 个（AC-RULE-18） |
| 计数列冗余 | view/fav/helpful_yes/no/share 为冗余计数，写路径单事务更新，读路径免聚合（demo 数据量亦可实时聚合，保留冗余以对齐 PRD §7.9 口径与复制清零语义） |

## 4. 规范偏差说明（供 db-migration 校验豁免）

| # | 公司规范要求 | 本方案采用 | 理由 |
|---|---|---|---|
| 1 | MySQL utf8mb4 DDL | SQLite 方言 | 技术决策已锁定 node:SQLite（Node 内置零依赖）；CHARSET/ENGINE 子句不适用 |
| 2 | 必备 id/biz_key/create_time/update_time/is_deleted/deleted_time | id/created_at/updated_at，无 biz_key、无软删 | demo 单库无跨服务幂等键诉求；教程生命周期用状态机管控（已发布/已下架禁删，PRD §7.6），纯草稿物理删除 |
| 3 | 关联字段 {含义}_biz_key | 直接 INTEGER 外键 | 单库 JOIN，无分库分表演进预期（demo 交付边界） |
| 4 | 金额 DECIMAL(18,2) | 无金额字段 | 本需求无金额 |

## 5. 现有表变更清单

无（全新库）。本次需求无历史数据兼容需求。

## 6. 种子数据

- 12 分类（8 模块 + 新手入门/最佳实践/常见问题/开放平台；erp_module 枚举与 categories API 契约一致：sales/project/file/produce/purchase/inventory/hrFinance/system，CHANGE-2）
- 18 篇已发布教程（分布 3/2/1/3/3/2/1/0/1/1/1/0）+ 3 待审核（含 1 篇 v2 修改版）+ 2 草稿（1 篇带驳回原因）+ 1 已下架；**前台可见口径 = 19 篇**（18 发布 + 1 篇回审旧版在线，CHANGE-5）；内容取材云ERP业务知识（6 大能力/订单 7 环节/MRP/扫码报工/库位/13 态等）
- 账号：admin/123456、operator/123456、6 个角色演示用户（sales/purchase/produce/warehouse/manage/finance，密码 123456）
- mock 消息 3 条（审批待办关联教程）、示例打卡 5 天
