# POST /api/tutorials/:id/withdraw

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/tutorials/:id/withdraw |
| **所属模块** | 教程（后台·教程管理·撤回） |
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

无（空对象 `{}` 或不发送）

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 25,
    "status": "draft"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.status | String | 草稿；审核队列中该条目移除，可继续编辑后重新提审 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色为 user | "无权限执行该操作" |
| 404 | 404 | 教程 id 不存在 | "教程不存在" |
| 409 | 409 | 教程当前状态非待审核（含与管理员审核动作并发时后到失效） | "该教程状态已变化，请刷新" |

## 业务规则

- 撤回：待审核→草稿，审核队列中该条目移除，可继续编辑后重新提审（来源：AC-OP-07、AC-RULE-05）
- 若该教程存在线上过审版本且回审来源为已发布态，撤回后前台继续展示该版本不断供（来源：AC-OP-07、AC-FN-19；回审来源为已下架态维持不可见，AC-EG-18）
- 互斥约束：运营撤回与管理员审核动作互斥，后到动作失效并提示"该教程状态已变化，请刷新"，状态仅按先到动作流转（来源：PRD §7.7、AC-EG-04）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/tutorials/25/withdraw' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer b7e2d9f4a1c80356' \
  -d '{}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"id":25,"status":"draft"}}
```
