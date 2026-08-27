# GET /api/tutorials/:id

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | GET /api/tutorials/:id |
| **所属模块** | 教程（前台·详情页 / 小程序·详情） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 否 | GET 请求可省略 |
| Authorization | Bearer {token} | 否 | 可选；携带登录态时额外返回 my* 个性化字段 |

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Integer | 是 | 教程 ID |

### 查询参数

无

### 请求体

无

## 响应

### 成功响应

> 仅前台可见教程返回 200；可见性判定见业务规则。

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 3,
    "title": "MRP 运算入门：从销售订单到采购建议",
    "summary": "讲解 MRP 运算的输入、输出与在云ERP中的操作路径。",
    "content": "<h2>一、MRP 是什么</h2><p>……</p><ol><li>维护 BOM</li><li>运行运算</li></ol>",
    "videoUrl": "https://cdn.example.com/mrp-intro.mp4",
    "tags": ["MRP", "生产"],
    "categoryId": 5,
    "categoryName": "生产制造",
    "isTop": 1,
    "sort": 100,
    "viewCount": 329,
    "favCount": 41,
    "helpfulYes": 36,
    "helpfulNo": 2,
    "shareCount": 12,
    "publishedAt": "2026-08-15 10:20:00",
    "updatedAt": "2026-08-18 09:00:00",
    "prev": { "id": 2, "title": "采购订单创建与审批" },
    "next": { "id": 7, "title": "扫码报工操作指南" },
    "related": [
      { "id": 7, "title": "扫码报工操作指南", "summary": "……", "viewCount": 256 },
      { "id": 8, "title": "生产工单流转", "summary": "……", "viewCount": 198 },
      { "id": 9, "title": "BOM 维护手册", "summary": "……", "viewCount": 173 },
      { "id": 10, "title": "委外加工处理", "summary": "……", "viewCount": 120 }
    ],
    "myFavorite": true,
    "myFeedback": 1,
    "myProgress": 60
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.content | String | 图文正文，读线上过审版本快照 published_content（回审/驳回/撤回期间旧版不断供） |
| data.summary | String | 读线上过审版本摘要 published_summary |
| data.viewCount | Integer | 返回值已含本次浏览 +1（含游客） |
| data.prev / data.next | Object \| null | 同分类前台可见池内按列表排序（isTop DESC → sort ASC → updated_at DESC）的相邻上一篇/下一篇，无则 null（前端按钮置灰） |
| data.related | Array | 同分类前台可见教程 4 篇（排除本篇，浏览量倒序），不足 4 篇取实际 |
| data.myFavorite | Boolean \| null | 当前登录用户是否已收藏；未登录为 null |
| data.myFeedback | Integer \| null | 当前登录用户评价（1 有帮助 / 0 没帮助）；未评价或未登录为 null |
| data.myProgress | Integer \| null | 当前登录用户阅读进度 0-100；无记录或未登录为 null |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 404 | 404 | 教程不存在，或纯草稿 / 首次待审核 / 已下架且回审来源为已下架态等任何不可见情形（AC-RULE-02 兜底） | "该教程不存在或暂不可见" |
| 404 | 404 | 教程已下架（存在线上过审版本但当前不可见）；data 携带提示页数据 | "该教程已下架" |

已下架分支响应示例：

```json
{
  "code": 404,
  "message": "该教程已下架",
  "data": {
    "reason": "offline",
    "related": [
      { "id": 7, "title": "扫码报工操作指南", "summary": "……", "viewCount": 256 },
      { "id": 8, "title": "生产工单流转", "summary": "……", "viewCount": 198 }
    ]
  }
}
```

## 业务规则

- 可见性判定：`published_content IS NOT NULL AND (status='published' OR (status IN ('pending','draft') AND last_offline_at IS NULL))`；读 published_content / published_summary 快照列（来源：db.md §3、PRD §6 前台可见性规则①②④⑤）
- 每次成功打开详情 view_count +1，不去重、含游客（来源：AC-RULE-08、PRD §3.4）
- 不可见时返回 404 提示页数据：从未过审教程文案"该教程不存在或暂不可见"（AC-RULE-02 兜底）；已下架文案"该教程已下架"并附同分类可见教程推荐，正文不可见（来源：AC-FN-20、AC-EG-10）
- 上下篇=同分类内按排序取相邻教程（来源：PRD §7.3、UI-IXD-05）
- 关联推荐=同分类前台可见教程 4 篇排除本篇（来源：PRD §7.3 关联推荐、UI-IXD-16）
- 携带登录态时返回收藏 / 评价 / 进度个性化字段，支撑按钮选中态与"继续阅读"（来源：PRD §7.3、AC-FN-04/25）
- 富文本正文渲染前做脚本剥离防注入（前端渲染层执行，来源：AC-NF-04）

## 调用示例

### 正常请求

```bash
curl -X GET 'http://localhost:3000/api/tutorials/3' \
  -H 'Authorization: Bearer d8e1f4a7c2b9350e'
```

### 预期响应

见上方成功响应示例（viewCount 已 +1，my* 字段按登录用户返回）。


## 补充契约（评审修复：管理口径参数，CHANGE-7/10）

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| all | 1 | 否 | 管理口径（admin/operator）：返回**当前编辑值**（content/summary 工作列，非快照），不计浏览量，prev/next 为 null。用于后台编辑器（#/tutorial/edit/:id）与审核队列卡片/查看全文弹窗取数。公开口径无此参数时按可见性规则返回快照。 |
