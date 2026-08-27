# GET /api/messages

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | GET /api/messages |
| **所属模块** | 场景联动（消息·mock 预留） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 否 | GET 请求可省略 |
| Authorization | Bearer {token} | 否 | 可选；携带登录态且未显式传 erpRole 时按用户角色过滤 |

### 路径参数

无

### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| erpRole | String | 否 | 不分角色（带登录态则按该用户角色过滤） | 枚举：sales / purchase / produce / warehouse / manage / finance |

### 请求体

无

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 1,
        "erpRole": "manage",
        "title": "《库位管理最佳实践》修改版待审核",
        "tutorialId": 12,
        "tutorialTitle": "库位管理最佳实践",
        "isRead": 0,
        "createdAt": "2026-08-19 09:00:00"
      },
      {
        "id": 2,
        "erpRole": "manage",
        "title": "《销售订单 13 态状态说明》新教程待审核",
        "tutorialId": 25,
        "tutorialTitle": "销售订单 13 态状态说明",
        "isRead": 0,
        "createdAt": "2026-08-20 10:30:00"
      },
      {
        "id": 3,
        "erpRole": "produce",
        "title": "《扫码报工操作指南》已更新，建议重新学习",
        "tutorialId": 7,
        "tutorialTitle": "扫码报工操作指南",
        "isRead": 1,
        "createdAt": "2026-08-18 14:00:00"
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.list | Array | 消息数组，按创建时间倒序 |
| data.list[].erpRole | String | 目标 ERP 角色（消息按角色投递） |
| data.list[].tutorialId | Integer \| null | 关联教程 ID（mock 消息均关联教程，预留 null 场景） |
| data.list[].tutorialTitle | String \| null | 关联教程标题（tutorialId 为 null 时为 null） |
| data.list[].isRead | Integer | 0 未读 / 1 已读 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 400 | 400 | erpRole 不在枚举内 | "erpRole 参数不合法" |

## 业务规则

- 消息为 mock 数据：按 erp_role 投递的审批待办示例，关联教程；本接口为 PRD §7.10 消息联动预留能力（消息推送关联教程在 v1.1 迭代池，本期仅数据与接口预留）（来源：PRD §4 Out of Scope、§12 版本规划、db.md §1 实体 messages）
- 过滤优先级：显式 erpRole 参数 > 登录用户角色 > 全部（来源：PRD §7.10，工程兜底定义）
- 种子 mock 消息 3 条（审批待办关联教程）（来源：db.md §6）
- 公开接口（demo）：无登录态也可读取，用于演示消息场景

## 调用示例

### 正常请求

```bash
curl -X GET 'http://localhost:3000/api/messages?erpRole=manage'
```

### 预期响应

见上方成功响应示例（erpRole=manage 时返回 id 为 1、2 的两条）。
