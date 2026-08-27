# POST /api/tutorials/:id/review

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/tutorials/:id/review |
| **所属模块** | 教程（后台·审核队列·通过/驳回） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 是 | |
| Authorization | Bearer {token} | 是 | 需 admin 登录（operator 调用返回 403） |

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Integer | 是 | 教程 ID |

### 查询参数

无

### 请求体

```json
{
  "action": "approve",
  "reason": null
}
```

```json
{
  "action": "reject",
  "reason": "正文步骤缺少截图说明，请补充后重提"
}
```

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| action | String | 是 | 枚举：approve / reject | 审核动作 |
| reason | String | 条件必填 | action=reject 时必填 ≥5 字；action=approve 时忽略 | 驳回原因，作者可见 |

## 响应

### 成功响应（approve）

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 25,
    "status": "published",
    "publishedAt": "2026-08-21 16:00:00",
    "reviewerId": 1,
    "reviewedAt": "2026-08-21 16:00:00"
  }
}
```

### 成功响应（reject）

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 25,
    "status": "draft",
    "rejectReason": "正文步骤缺少截图说明，请补充后重提"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.status | String | approve→published；reject→draft |
| data.publishedAt | String | 仅 approve 返回：快照发布时间（published_at=now） |
| data.reviewerId / reviewedAt | Integer / String | 审核留痕：审核人与审核时间 |
| data.rejectReason | String | 仅 reject 返回：驳回原因原文，展示在编辑页顶部 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色为 operator 或 user（审核为管理员专属） | "无权限执行该操作" |
| 404 | 404 | 教程 id 不存在 | "教程不存在" |
| 400 | 400 | action 缺失或不在枚举内 | "action 参数不合法" |
| 400 | 400 | action=reject 且 reason 缺失 / 少于 5 字（前端阻断 + 后端校验双重校验） | "请填写至少 5 个字的驳回原因" |
| 409 | 409 | 教程当前状态非待审核（含与运营撤回并发时后到动作失效） | "该教程状态已变化，请刷新" |

## 业务规则

- 审核权限仅 admin；operator 调用返回 403 且教程状态不变化（来源：AC-FN-18、AC-RULE-23、§10 权限矩阵）
- approve：待审核→已发布；将 content / summary 拷贝至 published_content / published_summary，published_at=now 并刷新 updated_at（线上过审版本快照）；记录审核人与审核时间；前台列表与搜索的下一次请求即返回该教程（无需重启服务）（来源：db.md §3、AC-FN-08、AC-NF-04）
- reject：待审核→草稿，reason 必填 ≥5 字（双重校验）；驳回原因展示在编辑页顶部，驱动修改重提（来源：AC-FN-09、AC-RULE-19）
- 回审版驳回：若被驳回对象为曾发布教程的回审版，仅编辑版回草稿，前台继续展示线上过审版本（回审来源为已发布态时不断供；来源为已下架态按 §6 规则④维持不可见）（来源：AC-FN-19、AC-EG-15、AC-EG-18）
- 互斥约束：审核与撤回并发时后到动作失效并提示"该教程状态已变化，请刷新"；审核按钮防抖仅首次生效，一条审核留痕（来源：AC-EG-04、AC-EG-19）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/tutorials/25/review' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer f3a9c2e81b7d4f6a' \
  -d '{"action":"approve"}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"id":25,"status":"published","publishedAt":"2026-08-21 16:00:00","reviewerId":1,"reviewedAt":"2026-08-21 16:00:00"}}
```
