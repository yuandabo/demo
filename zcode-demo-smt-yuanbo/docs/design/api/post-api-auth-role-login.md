# POST /api/auth/role-login

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/auth/role-login |
| **所属模块** | 认证（公共·账号） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 是 | |

### 路径参数

无

### 查询参数

无

### 请求体

```json
{
  "erpRole": "purchase"
}
```

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| erpRole | String | 是 | 枚举：sales / purchase / produce / warehouse / manage / finance | ERP 角色标识，对应 6 个演示账号 |

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "d8e1f4a7c2b9350e",
    "user": {
      "id": 4,
      "username": "purchase",
      "role": "user",
      "erpRole": "purchase",
      "displayName": "采购·演示用户"
    }
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.token | String | DB token，后续请求放 `Authorization: Bearer {token}` |
| data.user.role | String | 固定为 user（普通用户） |
| data.user.erpRole | String | 与请求 erpRole 一致，驱动角色推荐（GET /api/recommend）与消息过滤（GET /api/messages） |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 400 | 400 | erpRole 缺失或不在枚举内 | "erpRole 参数不合法" |
| 401 | 401 | 对应角色演示账号不存在（种子未初始化） | "账号或密码错误" |

## 业务规则

- 前台 / 小程序登录采用选角色快速登录：销售 / 采购 / 生产 / 仓库 / 管理 / 财务 6 个演示账号，登录态本地保持（来源：PRD §7.11、AC-RULE-24 / AC-RULE-26）
- 返回该角色演示用户的 token 与用户信息，role=user；该用户权限边界=浏览 / 搜索 / 详情 / 收藏 / 历史 / 评价 / 打卡（来源：AC-RULE-24）
- 演示账号用户名与 erpRole 同名（sales / purchase / produce / warehouse / manage / finance），密码统一 123456（来源：db.md §6）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/auth/role-login' \
  -H 'Content-Type: application/json' \
  -d '{"erpRole":"sales"}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"token":"a2c7e9f1b4d83605","user":{"id":3,"username":"sales","role":"user","erpRole":"sales","displayName":"销售·演示用户"}}}
```
