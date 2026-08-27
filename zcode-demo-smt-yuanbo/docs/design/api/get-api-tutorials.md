# GET /api/tutorials

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | GET /api/tutorials |
| **所属模块** | 教程（前台·浏览检索 / 后台·教程管理列表） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 否 | GET 请求可省略 |
| Authorization | Bearer {token} | 视场景 | 使用管理参数（status / all）时必填（admin/operator） |

### 路径参数

无

### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| categoryId | Integer | 否 | - | 分类筛选，命中该分类及其子分类 |
| keyword | String | 否 | - | 关键词，命中标题 / 摘要 / 标签三字段任一即返回；仅在前台可见池中命中 |
| tag | String | 否 | - | 标签精确筛选 |
| top | Integer | 否 | - | top=1 仅返回置顶教程 |
| status | String | 否 | - | 管理参数：draft / pending / published / offline，需登录 admin/operator |
| all | Integer | 否 | - | 管理参数：all=1 返回全状态（后台列表），需登录 admin/operator；与 status 互斥，同时传以 status 为准 |
| page | Integer | 否 | 1 | 页码（≥1） |
| pageSize | Integer | 否 | 10 | 每页条数（1-100） |

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
        "id": 3,
        "title": "MRP 运算入门：从销售订单到采购建议",
        "summary": "讲解 MRP 运算的输入、输出与在云ERP中的操作路径。",
        "tags": ["MRP", "生产"],
        "videoUrl": null,
        "categoryId": 5,
        "categoryName": "生产制造",
        "isTop": 1,
        "sort": 100,
        "viewCount": 328,
        "favCount": 41,
        "helpfulYes": 36,
        "helpfulNo": 2,
        "shareCount": 12,
        "publishedAt": "2026-08-15 10:20:00",
        "updatedAt": "2026-08-18 09:00:00"
      }
    ],
    "total": 24,
    "page": 1,
    "pageSize": 10
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.list | Array | 教程卡片数组；排序固定：置顶优先（isTop DESC）→ sort ASC → updated_at DESC |
| data.list[].summary | String | 公开口径读线上过审版本摘要 published_summary（无快照回退 summary）；管理口径读当前编辑值 |
| data.list[].tags | Array | 标签数组（≤5），JSON 数组反序列化 |
| data.list[].videoUrl | String \| null | mp4 直链 |
| data.list[].isTop / sort | Integer / Integer | 置顶标记与排序值 |
| data.list[].viewCount 等 | Integer | 浏览 / 收藏 / 有帮助 / 没帮助 / 分享计数 |
| data.total / page / pageSize | Integer | 分页元数据 |
| （管理参数时额外字段）status | String | draft / pending / published / offline |
| （管理参数时额外字段）rejectReason | String \| null | 最近一次驳回原因（草稿且被驳回过时非空） |
| （管理参数时额外字段）submitCount | Integer | 累计提审次数（审核队列 v2+ 修改版标识依据） |
| （管理参数时额外字段）authorId / authorName | Integer / String | 作者信息 |
| （管理参数时额外字段）hasOnlineVersion | Boolean | 是否存在线上过审版本（published_content 非空），删除保护判定依据 |
| （管理参数时额外字段）lastOfflineAt | String \| null | 最近一次下架时间（可见性判定派生列） |
| （管理参数时额外字段）createdAt | String | 创建时间 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 使用 status / all 管理参数但未登录 | "未登录或登录已失效" |
| 403 | 403 | 使用管理参数但登录角色为 user | "无权限执行该操作" |
| 400 | 400 | status 不在枚举内 / page < 1 / pageSize 超出 1-100 | "查询参数不合法" |

## 业务规则

- 前台可见池（无管理参数时）：`published_content IS NOT NULL AND (status='published' OR (status IN ('pending','draft') AND last_offline_at IS NULL))`——已发布回审期间旧版在线计入；已下架不返回（来源：db.md §3、PRD §6 前台可见性规则）
- 关键词检索范围=存在线上过审版本且未被下架的教程（含回审等待/驳回/撤回期间的旧版）；纯草稿、首次待审核、已下架、停用分类下的内容不命中；命中标题/摘要/标签即返回，1s 内响应（来源：PRD §7.2、AC-RULE-02/07、AC-EG-14、AC-NF-01）
- 排序：置顶优先 → sort → updated_at DESC；置顶教程带"置顶"角标排最前（来源：AC-RULE-17、UI-ELEM-01）
- 管理参数（status / all）返回全状态与驳回原因列，供后台列表"按状态/分类/关键词筛选"使用；仅 admin / operator 可用（来源：PRD §7.6/§7.7、AC-RULE-22/23）
- 游客与普通用户共用前台口径（来源：AC-RULE-25）

## 调用示例

### 正常请求

```bash
curl -X GET 'http://localhost:3000/api/tutorials?keyword=MRP&page=1&pageSize=10'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"list":[{"id":3,"title":"MRP 运算入门：从销售订单到采购建议","summary":"讲解 MRP 运算的输入、输出与在云ERP中的操作路径。","tags":["MRP","生产"],"videoUrl":null,"categoryId":5,"categoryName":"生产制造","isTop":1,"sort":100,"viewCount":328,"favCount":41,"helpfulYes":36,"helpfulNo":2,"shareCount":12,"publishedAt":"2026-08-15 10:20:00","updatedAt":"2026-08-18 09:00:00"}],"total":1,"page":1,"pageSize":10}}
```

### 管理态请求示例

```bash
curl -X GET 'http://localhost:3000/api/tutorials?all=1&status=pending' \
  -H 'Authorization: Bearer b7e2d9f4a1c80356'
```


## 补充契约（评审修复：首页区块取数与标签多选）

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| sort | string | 否 | `latest`（默认，isTop DESC→sort ASC→updated_at DESC）；`hot`（isTop DESC→view_count DESC）；`latest`/`hot` 均限定前台可见池且常配 pageSize=6 用于首页"最近更新/热门教程"区块（AC-RULE-17，AC-FN-22） |
| tag | string | 否 | **逗号分隔多值**（如 `tag=MRP,BOM`），多值按**交集**过滤（命中教程须同时含所有给出标签），单值时等价精确匹配（PRD §7.2，UI-IXD-02） |
