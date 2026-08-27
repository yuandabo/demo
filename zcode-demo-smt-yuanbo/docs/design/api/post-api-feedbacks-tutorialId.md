# POST /api/feedbacks/:tutorialId

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/feedbacks/:tutorialId |
| **所属模块** | 用户行为（前台/小程序·教程评价） |
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
  "helpful": 1,
  "comment": null
}
```

```json
{
  "helpful": 0,
  "comment": "步骤三的截图和实际界面不一致，按说明找不到入口"
}
```

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| helpful | Integer | 是 | 枚举 0 / 1 | 1=有帮助，0=没帮助（二选一，可修改切换） |
| comment | String | 否 | ≤200 字 | 反馈留言（选填）；评价"没帮助"时前端展开留言框；仅后台反馈分析可见 |

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "tutorialId": 3,
    "helpful": 0,
    "helpfulYes": 35,
    "helpfulNo": 3
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.helpful | Integer | 当前生效的评价值 |
| data.helpfulYes / helpfulNo | Integer | 联动后的教程有帮助 / 没帮助计数 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录（游客点击评价 → 前端弹出选角色登录并提示"登录后即可收藏/评价"） | "未登录或登录已失效" |
| 400 | 400 | helpful 缺失或非 0/1 | "helpful 必须为 0 或 1" |
| 400 | 400 | comment 超过 200 字 | "留言不超过 200 字" |
| 404 | 404 | 教程不存在或当前不可见 | "该教程不存在或暂不可见" |

## 业务规则

- 评价 upsert：每篇教程每人仅一条反馈记录（feedbacks 联合主键），可在有帮助 / 没帮助之间修改切换（来源：AC-RULE-15、PRD §7.3、db.md §2）
- 计数联动：helpful 变更时旧值 -1、新值 +1（如"有帮助"改"没帮助"：helpful_yes-1、helpful_no+1）；helpful 不变仅修改留言时计数不动（来源：AC-FN-05、AC-RULE-15）
- 留言选填 ≤200 字，仅后台反馈分析可见，前台不展示；入库前做长度限制（来源：AC-RULE-20、PRD §10 敏感信息处理）
- 评价数据回流反馈分析看板（GET /api/stats/feedback），驱动"没帮助"优先清单（来源：PRD §1A 闭环）
- PC 与小程序共用同一评价记录，一端改评另一端刷新即同步（来源：AC-FN-25）
- 游客评价触发登录引导，登录后回原页面且该次评价被记录（来源：AC-EG-07）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/feedbacks/3' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer d8e1f4a7c2b9350e' \
  -d '{"helpful":0,"comment":"步骤三的截图和实际界面不一致，按说明找不到入口"}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"tutorialId":3,"helpful":0,"helpfulYes":35,"helpfulNo":3}}
```
