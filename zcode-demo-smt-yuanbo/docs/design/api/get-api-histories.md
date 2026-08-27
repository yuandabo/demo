# GET /api/histories

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | GET /api/histories |
| **所属模块** | 用户行为（前台/小程序·浏览历史） |
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

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | Integer | 否 | 1 | 页码（≥1） |
| pageSize | Integer | 否 | 20 | 每页条数（1-100） |

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
        "tutorialId": 3,
        "title": "MRP 运算入门：从销售订单到采购建议",
        "summary": "讲解 MRP 运算的输入、输出与在云ERP中的操作路径。",
        "tags": ["MRP", "生产"],
        "categoryId": 5,
        "categoryName": "生产制造",
        "progress": 60,
        "isOffline": false,
        "updatedAt": "2026-08-21 09:30:00"
      },
      {
        "tutorialId": 12,
        "title": "库位管理最佳实践",
        "summary": "库位规划与盘点实操。",
        "tags": ["库存"],
        "categoryId": 4,
        "categoryName": "库存管理",
        "progress": 100,
        "isOffline": true,
        "updatedAt": "2026-08-20 19:00:00"
      }
    ],
    "total": 2,
    "page": 1,
    "pageSize": 20
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.list | Array | 按最近阅读时间倒序（histories.updated_at DESC） |
| data.list[].progress | Integer | 阅读进度百分比 0-100；从列表点击进入详情从进度处续读 |
| data.list[].isOffline | Boolean | 教程当前是否已下架不可见：true 时前端灰显标注"已下架" |
| data.list[].updatedAt | String | 最近阅读时间（yyyy-MM-dd HH:mm:ss） |
| data.total / page / pageSize | Integer | 分页元数据 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录（游客浏览不计历史） | "未登录或登录已失效" |
| 400 | 400 | page < 1 / pageSize 超出 1-100 | "查询参数不合法" |

## 业务规则

- 浏览历史按最近阅读时间倒序，每条显示阅读进度百分比（来源：PRD §7.4、AC-FN-23）
- 同一用户同一教程仅一条记录（联合主键），进度覆盖更新（来源：AC-RULE-11、db.md §2 histories）
- 游客浏览不计入历史与进度（仅计浏览量）（来源：PRD §3.4、§7.9）
- 已下架教程条目保留并标注"已下架"，点击进入由详情接口返回 404 提示页（来源：AC-RULE-04、AC-EG-10、UI-ELEM-02）
- PC 与小程序同库同数据，跨端取最新进度值（来源：AC-RULE-11、AC-FN-04）
- 进度 100% 的历史条目为"已完成"口径，用于百科达人徽章统计（来源：AC-RULE-12/13）

## 调用示例

### 正常请求

```bash
curl -X GET 'http://localhost:3000/api/histories?page=1&pageSize=20' \
  -H 'Authorization: Bearer d8e1f4a7c2b9350e'
```

### 预期响应

见上方成功响应示例。
