# DELETE /api/favorites/:tutorialId

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | DELETE /api/favorites/:tutorialId |
| **所属模块** | 用户行为（前台/小程序·取消收藏） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 否 | |
| Authorization | Bearer {token} | 是 | 需登录（admin/operator/user 均可） |

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tutorialId | Integer | 是 | 教程 ID |

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
    "tutorialId": 3,
    "favorited": false,
    "favCount": 40
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.favorited | Boolean | 固定 false（未收藏时重复取消为幂等成功，计数不变） |
| data.favCount | Integer | 取消后教程当前有效收藏数（fav_count 联动 -1 后的值；幂等请求不重复扣减） |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 404 | 404 | tutorialId 指向的教程不存在 | "教程不存在" |

## 业务规则

- 取消收藏：删除 favorites 记录，fav_count 联动 -1；收藏量口径=当前有效收藏数，取消即减 1（来源：AC-RULE-09、PRD §7.9）
- 幂等：未收藏状态下重复调用返回成功（favorited=false），计数不变（工程兜底定义，PRD 未明示）
- 取消收藏不限制教程可见性：已下架教程的收藏也可取消（isOffline 条目从收藏列表移除）（来源：PRD §7.4）
- PC 与小程序同库同数据，任一端操作另一端刷新可见（来源：AC-FN-15）
- 需登录态；游客访问返回 401（来源：AC-RULE-25）

## 调用示例

### 正常请求

```bash
curl -X DELETE 'http://localhost:3000/api/favorites/3' \
  -H 'Authorization: Bearer d8e1f4a7c2b9350e'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"tutorialId":3,"favorited":false,"favCount":40}}
```
