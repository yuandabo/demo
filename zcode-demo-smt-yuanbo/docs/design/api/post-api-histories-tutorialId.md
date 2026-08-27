# POST /api/histories/:tutorialId

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/histories/:tutorialId |
| **所属模块** | 用户行为（前台/小程序·阅读进度保存） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 是 | |
| Authorization | Bearer {token} | 是 | 需登录（admin/operator/user 均可） |

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tutorialId | Integer | 是 | 教程 ID |

### 查询参数

无

### 请求体

```json
{
  "progress": 60
}
```

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| progress | Integer | 是 | 0-100 整数 | 阅读进度百分比（按滚动位置计算） |

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "tutorialId": 3,
    "progress": 60,
    "updatedAt": "2026-08-21 09:30:00"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.progress | Integer | 保存后的进度值（upsert 覆盖） |
| data.updatedAt | String | 最近阅读时间刷新为当前时间 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录（游客阅读不保存进度，前端不调用本接口） | "未登录或登录已失效" |
| 400 | 400 | progress 缺失 / 非整数 / 超出 0-100 | "progress 必须为 0-100 的整数" |
| 404 | 404 | 教程不存在或当前不可见 | "该教程不存在或暂不可见" |

## 业务规则

- upsert 语义：同一用户同一教程仅一条历史记录，进度覆盖更新（histories 联合主键），跨端取最新值（来源：AC-RULE-11、AC-FN-23、db.md §2）
- 进度按滚动位置自动保存（前端节流调用），再次进入弹"继续阅读"提示定位（来源：PRD §7.3、AC-FN-04）
- 保存失败时前端静默重试一次，仍失败保留本地最近值不打断阅读；下次进入回退最近成功保存值（AC-EG-17，前端行为约定，接口幂等可支撑重试）
- progress=100 视为完成该教程，计入百科达人徽章（累计完成 20 篇）与完成率口径（来源：AC-RULE-12/13）
- 仅可对前台可见教程保存进度（不可见教程 404）（来源：AC-RULE-02）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/histories/3' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer d8e1f4a7c2b9350e' \
  -d '{"progress":60}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"tutorialId":3,"progress":60,"updatedAt":"2026-08-21 09:30:00"}}
```
