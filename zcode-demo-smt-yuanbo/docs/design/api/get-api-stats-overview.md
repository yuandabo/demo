# GET /api/stats/overview

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | GET /api/stats/overview |
| **所属模块** | 统计（后台·统计看板·总览） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 否 | GET 请求可省略 |
| Authorization | Bearer {token} | 是 | 需 admin / operator 登录（operator 只读） |

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
    "publishedCount": 18,
    "totalViewCount": 4823,
    "totalFavCount": 512,
    "avgHelpfulRate": 92.4,
    "topViewed": [
      { "id": 3, "title": "MRP 运算入门：从销售订单到采购建议", "viewCount": 329 },
      { "id": 7, "title": "扫码报工操作指南", "viewCount": 256 },
      { "id": 8, "title": "生产工单流转", "viewCount": 198 },
      { "id": 10, "title": "一笔订单怎么跑通：订单全流程 7 环节", "viewCount": 175 }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.publishedCount | Integer | 已发布教程数（前台可见口径） |
| data.totalViewCount | Integer | 总浏览量（前台可见口径教程的 view_count 汇总） |
| data.totalFavCount | Integer | 总收藏量（当前有效收藏数汇总） |
| data.avgHelpfulRate | Number \| null | 平均有帮助率（百分比保留 1 位小数）；零反馈教程不计入分母；全部零反馈时为 null（前端显示"—"） |
| data.topViewed | Array | 浏览量 Top10：{ id, title, viewCount }，按 viewCount 倒序 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色为 user（看板为 admin/operator 专属，operator 只读） | "无权限执行该操作" |

## 业务规则

- 总览 4 指标卡：已发布教程数 / 总浏览量 / 总收藏量 / 平均有帮助率 + 浏览量 Top10 条形图（来源：PRD §7.9、AC-FN-14）
- 口径=前台可见口径：已下架教程历史计数不计入（与列表可对账）；回审期间旧版在线计入（来源：AC-RULE-08）
- 浏览量=打开详情次数（不去重，含游客）；收藏量=当前有效收藏数（来源：AC-RULE-08/09）
- 平均有帮助率=有帮助÷(有帮助+没帮助) 按教程算术后平均；零反馈（分母为 0）教程显示"—"且不计入平均有帮助率（来源：AC-RULE-10）
- 分享行为本期仅数据留存，不上看板卡片（来源：PRD §7.9）
- 空库时返回 0 / null / 空数组，前端展示空态引导"暂无数据"（来源：AC-EG-12）

## 调用示例

### 正常请求

```bash
curl -X GET 'http://localhost:3000/api/stats/overview' \
  -H 'Authorization: Bearer f3a9c2e81b7d4f6a'
```

### 预期响应

见上方成功响应示例（topViewed 实际返回 10 条，示例截断展示 4 条）。
