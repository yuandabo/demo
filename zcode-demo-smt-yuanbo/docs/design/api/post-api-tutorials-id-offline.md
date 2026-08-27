# POST /api/tutorials/:id/offline

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/tutorials/:id/offline |
| **所属模块** | 教程（后台·教程管理·下架） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 是 | |
| Authorization | Bearer {token} | 是 | 需 admin 登录 |

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Integer | 是 | 教程 ID |

### 查询参数

无

### 请求体

无（空对象 `{}` 或不发送；二次确认由前端承载）

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 12,
    "status": "offline",
    "lastOfflineAt": "2026-08-21 17:00:00"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.status | String | 已下架；三端下一次请求即不返回该教程 |
| data.lastOfflineAt | String | 下架动作时间戳（last_offline_at=now），可见性判定派生列 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色为 operator 或 user（下架为管理员专属） | "无权限执行该操作" |
| 404 | 404 | 教程 id 不存在 | "教程不存在" |
| 409 | 409 | 教程当前状态非已发布（仅 published 可下架） | "该教程状态已变化，请刷新" |

## 业务规则

- 下架：已发布→已下架，last_offline_at=now；二次确认与操作留痕（操作人 / 操作时间）（来源：PRD §7.6、AC-OP-03、AC-RULE-05、db.md §3）
- 下架后前台列表 / 搜索 / 推荐 / 小程序下一请求即不返回该教程（来源：AC-OP-03）
- 已下架教程在收藏夹与浏览历史中灰显并标注"已下架"，不可进入正文；直达详情页返回 404 提示"该教程已下架"并给同类推荐（善后见收藏 / 历史 / 详情接口）（来源：AC-RULE-04、AC-FN-20、AC-EG-10）
- 浏览 / 收藏计数保留（延续至重新发布，仅复制清零）（来源：AC-FN-11、AC-RULE-14）
- 下架后恢复上线的两条路径：内容未变→重新发布（POST /republish 不重审）；内容已变→编辑保存自动回审（来源：PRD §3.5、AC-EG-18）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/tutorials/12/offline' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer f3a9c2e81b7d4f6a' \
  -d '{}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"id":12,"status":"offline","lastOfflineAt":"2026-08-21 17:00:00"}}
```
