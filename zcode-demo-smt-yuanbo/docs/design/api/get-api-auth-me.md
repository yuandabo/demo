# GET /api/auth/me

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | GET /api/auth/me |
| **所属模块** | 认证（公共·账号） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Authorization | Bearer {token} | 是 | 需登录态 |

### 路径参数

无

### 查询参数

无

### 请求体

无

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 4,
    "username": "purchase",
    "role": "user",
    "erpRole": "purchase",
    "displayName": "采购·演示用户",
    "createdAt": "2026-08-01 09:00:00"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.id | Integer | 用户 ID |
| data.username | String | 登录名 |
| data.role | String | admin / operator / user，驱动前端功能开关与后端权限校验（AC-RULE-22/23/24） |
| data.erpRole | String \| null | ERP 角色；后台账号为 null，普通用户六选一 |
| data.displayName | String | 展示名（顶栏 / 打卡页显示） |
| data.createdAt | String | 账号创建时间（yyyy-MM-dd HH:mm:ss） |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录：未携带 token / token 已被登出作废 / token 不存在 | "未登录或登录已失效" |

## 业务规则

- 服务端查库校验 token（auth_tokens 表 JOIN users），token 不存在即 401（来源：db.md §1 实体 auth_tokens）
- 前端刷新页面后用本接口恢复登录态；游客（未登录）不调用，直接走游客口径（来源：AC-RULE-25）
- role=user 时前端读取 erpRole 驱动推荐位（GET /api/recommend?erpRole=）与消息过滤（GET /api/messages?erpRole=）（来源：PRD §7.1 / §7.10）

## 调用示例

### 正常请求

```bash
curl -X GET 'http://localhost:3000/api/auth/me' \
  -H 'Authorization: Bearer d8e1f4a7c2b9350e'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"id":4,"username":"purchase","role":"user","erpRole":"purchase","displayName":"采购·演示用户","createdAt":"2026-08-01 09:00:00"}}
```
