# POST /api/auth/logout

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/auth/logout |
| **所属模块** | 认证（公共·账号） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 是 | |
| Authorization | Bearer {token} | 是 | 需登录态 |

### 路径参数

无

### 查询参数

无

### 请求体

无（空对象 `{}` 或不发送）

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "已退出登录",
  "data": null
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data | null | 登出无业务数据返回；token 已从 auth_tokens 表删除，前端同时清除 localStorage |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未携带 token、token 不存在或已失效 | "未登录或登录已失效" |

## 业务规则

- 登出即作废 token：从 auth_tokens 表删除当前 token，后续携带该 token 的请求返回 401（来源：db.md §1 实体 auth_tokens）
- 前端登出后清除本地登录态（localStorage 中的 token 与用户信息），回到游客口径（来源：AC-RULE-25 游守权限边界）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/auth/logout' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer f3a9c2e81b7d4f6a'
```

### 预期响应

```json
{"code":0,"message":"已退出登录","data":null}
```
