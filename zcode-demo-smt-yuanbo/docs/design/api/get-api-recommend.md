# GET /api/recommend

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | GET /api/recommend |
| **所属模块** | 场景联动（前台/小程序首页·角色推荐位） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 否 | GET 请求可省略 |
| Authorization | Bearer {token} | 否 | 可选；未登录走全站口径 |

### 路径参数

无

### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| erpRole | String | 否 | 全站口径 | 枚举：sales / purchase / produce / warehouse / manage / finance；传入后按角色模块映射命中集取数 |

### 请求体

无

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "source": "role",
    "erpRole": "purchase",
    "list": [
      {
        "id": 11,
        "title": "采购订单创建与审批",
        "summary": "从请购到采购订单的完整操作路径。",
        "tags": ["采购"],
        "categoryId": 2,
        "categoryName": "采购管理",
        "viewCount": 287,
        "favCount": 33,
        "publishedAt": "2026-08-12 10:00:00"
      },
      {
        "id": 15,
        "title": "安全库存与补货点设置",
        "summary": "库存补货策略配置。",
        "tags": ["库存"],
        "categoryId": 4,
        "categoryName": "库存管理",
        "viewCount": 210,
        "favCount": 25,
        "publishedAt": "2026-08-13 09:00:00"
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.source | String | role（按角色映射命中集）/ global（全站） |
| data.erpRole | String \| null | 生效的角色；全站口径为 null |
| data.list | Array | 推荐教程卡片，按浏览量倒序 Top6；命中集不足 6 条时返回实际数量 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 400 | 400 | erpRole 不在枚举内 | "erpRole 参数不合法" |

## 业务规则

- 取数口径=前台可见性规则（启用分类 + 存在线上过审版本 + 未下架，回审期间按旧版数据参与排序）（来源：AC-RULE-16、PRD §6）
- 已登录（或显式传 erpRole）：按角色匹配分类模块映射，取命中集内已发布教程浏览量 Top6；未登录：全站已发布教程浏览量 Top6；命中集不足 6 条时展示实际数量（来源：AC-RULE-16、AC-FN-17/22）
- 角色-模块映射：销售→销售管理；采购→采购管理、库存管理；生产→生产制造、项目管理；仓库→库存管理；财务→人事财务、销售管理；管理→全部 8 模块（来源：PRD §7.1）
- 推荐位候选集在发布 / 下架 / 分类停用后的下一次加载即更新（来源：AC-FN-08、AC-EG-14）
- 公开接口：游客可访问（未登录推荐全站 Top6）（来源：AC-RULE-25、AC-FN-22）

## 调用示例

### 正常请求

```bash
curl -X GET 'http://localhost:3000/api/recommend?erpRole=purchase'
```

### 预期响应

见上方成功响应示例（list 实际返回 ≤6 条，示例截断展示 2 条）。
