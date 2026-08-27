# POST /api/tutorials/:id/copy

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/tutorials/:id/copy |
| **所属模块** | 教程（后台·教程管理·复制） |
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
| id | Integer | 是 | 源教程 ID（任意状态） |

### 查询参数

无

### 请求体

无（空对象 `{}` 或不发送）

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 26,
    "title": "MRP 运算入门：从销售订单到采购建议（副本）",
    "status": "draft",
    "viewCount": 0,
    "favCount": 0,
    "helpfulYes": 0,
    "helpfulNo": 0,
    "shareCount": 0,
    "createdAt": "2026-08-21 18:00:00"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.id | Integer | 新教程 ID（新记录） |
| data.title | String | 新标题 = 源标题 + "（副本）"；超长时源标题截断至 96 字再拼接 |
| data.status | String | 固定 draft（新草稿，不进前台与审核队列） |
| data.viewCount 等 | Integer | 浏览 / 收藏 / 有帮助 / 没帮助 / 分享计数全部为 0 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色为 user | "无权限执行该操作" |
| 404 | 404 | 源教程 id 不存在 | "教程不存在" |

## 业务规则

- 复制：源教程任意状态（草稿 / 待审核 / 已发布 / 已下架）→ 生成新草稿；源教程状态与计数不变（来源：PRD §7.6、AC-FN-12）
- 新草稿标题 = 源标题 + "（副本）"（4 字后缀）；源标题 + 4 字后缀 ≤100 字不截断，超过 100 字时源标题截断至 96 字再拼接（96+4=100）（来源：AC-RULE-14）
- 计数清零：浏览量 / 收藏量 / 有帮助数 / 没帮助数 / 分享数 / 提审次数（submit_count）均为 0；分享数一并清零（来源：AC-RULE-14、AC-FN-12）
- 新记录不携带线上过审版本快照（published_content 为空，纯草稿不可见）、驳回原因清空；作者为当前操作人（来源：db.md §3、AC-RULE-01）
- 复制后可编辑再提审，走正常审核流（来源：PRD §7.6）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/tutorials/3/copy' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer b7e2d9f4a1c80356' \
  -d '{}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"id":26,"title":"MRP 运算入门：从销售订单到采购建议（副本）","status":"draft","viewCount":0,"favCount":0,"helpfulYes":0,"helpfulNo":0,"shareCount":0,"createdAt":"2026-08-21 18:00:00"}}
```
