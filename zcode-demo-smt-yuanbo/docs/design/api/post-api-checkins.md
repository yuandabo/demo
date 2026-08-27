# POST /api/checkins

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/checkins |
| **所属模块** | 学习激励（小程序·每日打卡） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 是 | |
| Authorization | Bearer {token} | 是 | 需登录（admin/operator/user 均可） |

### 路径参数

无

### 查询参数

无

### 请求体

无（空对象 `{}` 或不发送；打卡日期取服务器本地当日）

## 响应

### 成功响应（首次打卡）

```json
{
  "code": 0,
  "message": "打卡成功",
  "data": {
    "checkinDate": "2026-08-21",
    "pointsAdded": 10,
    "totalPoints": 80,
    "streak": 5,
    "badges": ["persist"],
    "duplicated": false
  }
}
```

### 成功响应（当日重复打卡，幂等）

```json
{
  "code": 0,
  "message": "今日已打卡",
  "data": {
    "checkinDate": "2026-08-21",
    "pointsAdded": 0,
    "totalPoints": 80,
    "streak": 5,
    "badges": ["persist"],
    "duplicated": true
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.checkinDate | String | 打卡日期（yyyy-MM-dd，服务器本地时间） |
| data.pointsAdded | Integer | 本次新增积分：首次 10，重复 0 |
| data.totalPoints | Integer | 累计总积分 |
| data.streak | Integer | 当前连续打卡天数 |
| data.badges | Array | 已获得徽章：persist（坚持者，连续 7 天）/ encyclopedia（百科达人，累计完成 20 篇教程） |
| data.duplicated | Boolean | true=当日重复打卡（幂等返回当日记录，积分不再增加） |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |

## 业务规则

- 每日打卡 1 次 +10 积分；当日重复打卡无效——幂等返回当日记录（duplicated=true、pointsAdded=0），积分不再增加（来源：AC-FN-16、AC-RULE-12、PRD §7.10）
- 连续天数：昨日有打卡记录则 streak=昨日 streak+1，否则重置为 1；中断仅清连续天数，不清积分、不回收已获徽章（来源：AC-RULE-12、AC-FN-21）
- 徽章：坚持者=连续 7 天打卡；百科达人=累计完成 20 篇教程（完成=该用户阅读进度达 100%，按 histories 口径）（来源：AC-RULE-12、AC-FN-21）
- 唯一约束：checkins 表 UNIQUE(user_id, checkin_date)，日期按服务器本地时间（来源：db.md §2）
- 种子含示例打卡 5 天（来源：db.md §6）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/checkins' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer d8e1f4a7c2b9350e' \
  -d '{}'
```

### 预期响应

```json
{"code":0,"message":"打卡成功","data":{"checkinDate":"2026-08-21","pointsAdded":10,"totalPoints":80,"streak":5,"badges":["persist"],"duplicated":false}}
```
