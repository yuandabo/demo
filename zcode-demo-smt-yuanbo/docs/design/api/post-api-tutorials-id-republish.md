# POST /api/tutorials/:id/republish

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/tutorials/:id/republish |
| **所属模块** | 教程（后台·教程管理·重新发布） |
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

无（空对象 `{}` 或不发送）

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 12,
    "status": "published",
    "viewCount": 402,
    "favCount": 66
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.status | String | 已发布；不进入审核队列、无待审核中间态 |
| data.viewCount / favCount | Integer | 浏览 / 收藏计数沿用下架前数值（延续，不重置） |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色为 operator 或 user（重新发布为管理员专属） | "无权限执行该操作" |
| 404 | 404 | 教程 id 不存在 | "教程不存在" |
| 409 | 409 | 教程当前状态非已下架（仅 offline 可重新发布） | "该教程状态已变化，请刷新" |

## 业务规则

- 重新发布：已下架→已发布，内容未变不重审、不进入审核队列（来源：PRD §3.5、AC-RULE-05、AC-FN-11）
- 清除 last_offline_at（置 NULL），恢复可见性判定（来源：db.md §3）
- 浏览 / 收藏计数延续下架前数值（仅复制清零，本操作不清零）（来源：AC-FN-11、AC-RULE-14）
- 前台下一次请求即返回该教程，即时恢复可见（来源：AC-FN-11）
- 管理员专属操作；与"内容已变"的恢复路径区分：已下架教程编辑保存会自动回审（PUT /api/tutorials/:id），过审前维持不可见（来源：AC-EG-18）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/tutorials/12/republish' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer f3a9c2e81b7d4f6a' \
  -d '{}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"id":12,"status":"published","viewCount":402,"favCount":66}}
```
