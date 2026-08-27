# POST /api/auth/login

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/auth/login |
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
  "username": "admin",
  "password": "123456"
}
```

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| username | String | 是 | 长度 1-50，不允许空白 | 登录账号（admin / operator 两类后台角色） |
| password | String | 是 | 长度 1-50 | 密码明文（demo 传输，生产环境走 HTTPS） |

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "f3a9c2e81b7d4f6a",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "erpRole": null,
      "displayName": "平台管理员"
    }
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.token | String | DB token（写入 auth_tokens 表），前端存 localStorage，后续请求放 `Authorization: Bearer {token}` |
| data.user.id | Integer | 用户 ID |
| data.user.username | String | 登录名 |
| data.user.role | String | admin / operator / user |
| data.user.erpRole | String \| null | ERP 角色（sales/purchase/produce/warehouse/manage/finance），后台账号为 null |
| data.user.displayName | String | 展示名 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 400 | 400 | username 或 password 缺失 / 为空 | "请输入账号和密码" |
| 401 | 401 | 账号不存在或密码错误（统一文案，不区分具体原因） | "账号或密码错误" |
| 403 | 403 | 账号为普通用户（role=user，应走 POST /api/auth/role-login） | "请使用选角色登录" |

## 业务规则

- 后台登录采用账号密码，仅 admin / operator 两类角色；普通用户走选角色快速登录（来源：PRD §7.11、AC-RULE-26）
- 账号或密码错误时统一提示"账号或密码错误"，不区分"账号不存在"与"密码错误"，防账号枚举（来源：PRD §7.11）
- 登录成功生成 token 写入 auth_tokens 表（DB token 方案：localStorage 持有 + Header 携带 + 服务端查库校验），logout / system/reset 前持续有效（来源：db.md §1 实体 auth_tokens）
- 种子账号：admin/123456、operator/123456（来源：db.md §6）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"operator","password":"123456"}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"token":"b7e2d9f4a1c80356","user":{"id":2,"username":"operator","role":"operator","erpRole":null,"displayName":"运营编辑"}}}
```
