# POST /api/favorites/:tutorialId

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/favorites/:tutorialId |
| **所属模块** | 用户行为（前台/小程序·收藏） |
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

无（空对象 `{}` 或不发送）

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "tutorialId": 3,
    "favorited": true,
    "favCount": 42
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.favorited | Boolean | 固定 true（重复收藏幂等返回 true，不重复计数） |
| data.favCount | Integer | 收藏后教程当前有效收藏数（fav_count 联动 +1 后的值；重复请求不再增加） |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录（游客点击收藏 → 前端弹出选角色登录，登录后回到原页面原位置继续操作） | "未登录或登录已失效" |
| 404 | 404 | 教程不存在或当前不可见（纯草稿 / 首次待审核 / 已下架） | "该教程不存在或暂不可见" |

## 业务规则

- 收藏需登录；游客触发时前端引导选角色登录，登录后回原位且收藏成功（收藏计数 +1，按钮切换为已收藏态）（来源：AC-FN-03、AC-RULE-25）
- 同一用户同一教程唯一（favorites 联合主键 user_id+tutorial_id）；重复收藏幂等：返回成功且 fav_count 不重复增加（来源：PRD §6 收藏关系、db.md §2、AC-RULE-09）
- fav_count 联动：收藏成功 +1，为当前有效收藏数口径；取消收藏即减 1（来源：AC-RULE-09）
- PC 与小程序同库同数据，任一端操作另一端刷新可见（来源：PRD §7.10、AC-FN-15）
- 仅可收藏前台可见教程；已下架教程不可新增收藏（404），历史收藏保留下架标注（来源：AC-RULE-02/04）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/favorites/3' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer d8e1f4a7c2b9350e' \
  -d '{}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"tutorialId":3,"favorited":true,"favCount":42}}
```
