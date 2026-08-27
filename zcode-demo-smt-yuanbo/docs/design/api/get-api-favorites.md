# GET /api/favorites

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | GET /api/favorites |
| **所属模块** | 用户行为（前台/小程序·我的收藏） |
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
        "isOffline": false,
        "viewCount": 329,
        "favCount": 41,
        "publishedAt": "2026-08-15 10:20:00",
        "updatedAt": "2026-08-18 09:00:00",
        "favoritedAt": "2026-08-20 08:30:00"
      },
      {
        "tutorialId": 12,
        "title": "库位管理最佳实践",
        "summary": "库位规划与盘点实操。",
        "tags": ["库存"],
        "categoryId": 4,
        "categoryName": "库存管理",
        "isOffline": true,
        "viewCount": 402,
        "favCount": 66,
        "publishedAt": "2026-08-10 09:00:00",
        "updatedAt": "2026-08-17 11:00:00",
        "favoritedAt": "2026-08-19 20:15:00"
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
| data.list | Array | 按收藏时间倒序（favoritedAt DESC） |
| data.list[].isOffline | Boolean | 教程当前是否不可见（已下架口径）：true 时前端灰显并标注"已下架"，不可进入正文 |
| data.list[].favoritedAt | String | 收藏时间（yyyy-MM-dd HH:mm:ss） |
| data.total / page / pageSize | Integer | 分页元数据 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录（游客先引导选角色登录） | "未登录或登录已失效" |
| 400 | 400 | page < 1 / pageSize 超出 1-100 | "查询参数不合法" |

## 业务规则

- 收藏列表按收藏时间倒序（来源：PRD §7.4）
- 已下架教程保留在收藏列表中，isOffline=true 供前端灰显标注"已下架"且不可进入正文（进入详情由 GET /api/tutorials/:id 返回 404 提示页）（来源：PRD §7.4、AC-RULE-04、AC-FN-20、UI-ELEM-02）
- PC 与小程序共用同一数据源，任一端收藏另一端刷新可见（来源：PRD §7.10、AC-FN-15）
- 需登录态；游客访问返回 401，前端弹出选角色登录后回原位（来源：AC-RULE-25、AC-FN-03）

## 调用示例

### 正常请求

```bash
curl -X GET 'http://localhost:3000/api/favorites?page=1&pageSize=20' \
  -H 'Authorization: Bearer d8e1f4a7c2b9350e'
```

### 预期响应

见上方成功响应示例。
