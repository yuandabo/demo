# POST /api/system/reset

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/system/reset |
| **所属模块** | 系统（demo·种子重置） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 是 | |
| Authorization | Bearer {token} | 是 | 需 admin 登录 |

### 路径参数

无

### 查询参数

无

### 请求体

无（空对象 `{}` 或不发送；二次确认由前端承载）

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "重置成功",
  "data": {
    "categories": 12,
    "tutorials": 24,
    "users": 8,
    "messages": 3,
    "checkins": 5
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.categories | Integer | 重建后分类数（12 启用一级分类） |
| data.tutorials | Integer | 重建后教程数（18 已发布 + 3 待审核 + 2 草稿 + 1 已下架 = 24） |
| data.users | Integer | 重建后用户数（admin + operator + 6 角色演示用户 = 8） |
| data.messages | Integer | 重建后 mock 消息数（3 条审批待办） |
| data.checkins | Integer | 重建后示例打卡记录数（5 天） |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色非 admin（operator/user） | "无权限执行该操作" |
| 500 | 500 | 重置过程数据库异常（事务回滚，数据保持原状） | "重置失败，请重试" |

## 业务规则

- 重置=清空并重建种子数据：12 分类 + 24 篇教程 + 演示账号 + mock 消息 + 示例打卡；可重复执行不产生脏数据（来源：db.md §6、AC-OP-01、AC-NF-06）
- 重置后所有 auth_tokens 作废，已登录用户需重新登录（demo 行为，与登出作废同机制；来源：db.md §1 实体 auth_tokens）
- 首次启动自动建库+种子，本接口用于演示过程中恢复初始态（来源：db.md 文档头）
- admin 专属操作；demo 用途接口，生产环境不部署（来源：PRD §4 交付边界）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/system/reset' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer f3a9c2e81b7d4f6a' \
  -d '{}'
```

### 预期响应

```json
{"code":0,"message":"重置成功","data":{"categories":12,"tutorials":24,"users":8,"messages":3,"checkins":5}}
```
