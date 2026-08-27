# GET /api/checkins

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | GET /api/checkins |
| **所属模块** | 学习激励（小程序·打卡页/徽章墙） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 否 | GET 请求可省略 |
| Authorization | Bearer {token} | 是 | 需登录（admin/operator/user 均可） |

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
    "todayChecked": true,
    "totalPoints": 80,
    "streak": 5,
    "bestStreak": 6,
    "completedTutorials": 12,
    "badges": ["persist"],
    "weekCalendar": [
      { "date": "2026-08-17", "isChecked": true },
      { "date": "2026-08-18", "isChecked": true },
      { "date": "2026-08-19", "isChecked": true },
      { "date": "2026-08-20", "isChecked": true },
      { "date": "2026-08-21", "isChecked": true },
      { "date": "2026-08-22", "isChecked": false },
      { "date": "2026-08-23", "isChecked": false }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.todayChecked | Boolean | 当日是否已打卡 |
| data.totalPoints | Integer | 累计总积分 |
| data.streak | Integer | 当前连续打卡天数 |
| data.bestStreak | Integer | 历史最长连续天数（工程兜底定义，供徽章墙展示） |
| data.completedTutorials | Integer | 累计完成教程数（进度 100% 的历史条数） |
| data.badges | Array | 已获得徽章：persist（坚持者）/ encyclopedia（百科达人，completedTutorials ≥ 20 时获得） |
| data.weekCalendar | Array | 本周日历（周一至周日 7 天）：{ date, isChecked }，未来日期 isChecked=false |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |

## 业务规则

- 打卡状态用于打卡页与徽章墙：积分 / 连续天数 / 徽章 / 本周日历（来源：PRD §7.10、AC-FN-16）
- 徽章判定：坚持者=连续 7 天打卡；百科达人=累计完成 20 篇教程（完成=阅读进度 100%）（来源：AC-RULE-12、AC-FN-21）
- 中断仅清连续天数，不清积分、不回收已获徽章（来源：AC-RULE-12、AC-FN-21）
- weekCalendar 覆盖本周一至周日 7 天，日期按服务器本地时间（来源：PRD §7.10，工程兜底定义）
- completedTutorials 口径=进度 100% 历史条数，同完成率分子（来源：AC-RULE-13）

## 调用示例

### 正常请求

```bash
curl -X GET 'http://localhost:3000/api/checkins' \
  -H 'Authorization: Bearer d8e1f4a7c2b9350e'
```

### 预期响应

见上方成功响应示例。
