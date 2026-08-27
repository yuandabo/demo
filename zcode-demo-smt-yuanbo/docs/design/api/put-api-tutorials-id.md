# PUT /api/tutorials/:id

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | PUT /api/tutorials/:id |
| **所属模块** | 教程（后台·教程编辑器·保存编辑） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 是 | |
| Authorization | Bearer {token} | 是 | 需 admin / operator 登录 |

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Integer | 是 | 教程 ID |

### 查询参数

无

### 请求体

```json
{
  "title": "销售订单 13 态状态说明（v2）",
  "categoryId": 1,
  "summary": "补充了驳回后重开状态的说明。",
  "content": "<h2>一、状态总览</h2><p>……（新版正文）</p>",
  "videoUrl": null,
  "tags": ["销售订单", "状态"],
  "baseUpdatedAt": "2026-08-18 09:00:00"
}
```

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| title | String | 否 | ≤100 字，不允许空白 | 不传不改 |
| categoryId | Integer | 否 | 须为存在的启用分类 | 调整所属分类 |
| summary | String | 否 | ≤200 字 | 摘要 |
| content | String | 否 | 富文本 HTML | 图文正文 |
| videoUrl | String | 否 | mp4 直链 URL；传 null 清除外链 | 视频外链 |
| tags | Array&lt;String&gt; | 否 | ≤5 个 | 标签 |
| baseUpdatedAt | String | 否 | yyyy-MM-dd HH:mm:ss | 乐观锁：编辑器加载时的 updatedAt；不匹配返回 409 |

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 3,
    "status": "pending",
    "updatedAt": "2026-08-21 15:10:00"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.status | String | 保存后的状态：草稿保存仍 draft；已发布/已下架保存后自动回审 pending |
| data.updatedAt | String | updated_at 已刷新；线上快照列（published_content 等）不变 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色为 user | "无权限执行该操作" |
| 404 | 404 | 教程 id 不存在 | "教程不存在" |
| 400 | 400 | 长度越界（标题 >100 / 摘要 >200 / 标签 >5） | "标题不超过 100 字 / 摘要不超过 200 字 / 标签最多 5 个" |
| 404 | 404 | categoryId 指向的分类不存在 | "所属分类不存在" |
| 409 | 409 | categoryId 指向停用分类 | "所属分类已停用，请选择启用的分类" |
| 409 | 409 | baseUpdatedAt 与库中 updated_at 不一致（他人已先保存） | "他人已保存新版本，请刷新后合并" |

## 业务规则

- 保存语义按当前状态分流：草稿→仍草稿（可反复保存覆盖，必填完整性仅提审时校验）；已发布/已下架→自动回审 status=pending（编辑回审：不提供"保存为草稿"语义，任何保存即回审）；待审核→内容覆盖更新、状态保持 pending（工程兜底定义，PRD 未明示）（来源：PRD §7.6、AC-OP-05、AC-FN-10、AC-EG-18）
- 编辑回审期间前台持续展示线上过审版本（快照列不动，旧版不断供），过审后新版替换（来源：PRD §7.6、AC-FN-10、db.md §3）
- 已下架教程编辑保存→进入待审核并出现在审核队列，前台维持不可见，过审后恢复可见（来源：AC-EG-18、AC-RULE-05）
- 保存成功刷新 updated_at（"最近更新"区块依据，来源：PRD §6 教程字段）
- 运营可编辑任意教程（不受归属限制）；并发编辑冲突用 baseUpdatedAt 乐观锁拦截，后保存者收到覆盖告知（来源：AC-RULE-23、AC-EG-05）
- 编辑器每 30 秒前端自动保存草稿（调用本接口），崩溃恢复由前端承载（来源：PRD §9、AC-EG-16）

## 调用示例

### 正常请求

```bash
curl -X PUT 'http://localhost:3000/api/tutorials/3' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer b7e2d9f4a1c80356' \
  -d '{"title":"MRP 运算入门：从销售订单到采购建议（v2）","summary":"新增运算参数说明。","content":"<h2>一、MRP 是什么</h2><p>……（新版）</p>","tags":["MRP","生产","补货"],"baseUpdatedAt":"2026-08-18 09:00:00"}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"id":3,"status":"pending","updatedAt":"2026-08-21 15:10:00"}}
```
