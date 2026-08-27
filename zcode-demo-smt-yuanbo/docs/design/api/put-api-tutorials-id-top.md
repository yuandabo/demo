# PUT /api/tutorials/:id/top

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | PUT /api/tutorials/:id/top |
| **所属模块** | 教程（后台·目录管理·置顶/排序） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 是 | |
| Authorization | Bearer {token} | 是 | 需 admin / operator 登录 |

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Integer | 是 | 教程 ID |

### 查询参数

无

### 请求体

```json
{
  "isTop": 1,
  "sort": 50
}
```

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| isTop | Integer | 是 | 枚举 0 / 1 | 置顶开关：1 置顶（仅已发布教程可置顶）；0 取消置顶 |
| sort | Integer | 否 | 0-9999，默认保持原值 | 排序值；置顶优先级之后按此值升序 |

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 3,
    "isTop": 1,
    "sort": 50,
    "status": "published"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.isTop / sort | Integer | 保存后的置顶标记与排序值 |
| data.status | String | 教程当前状态（回显） |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色为 user | "无权限执行该操作" |
| 404 | 404 | 教程 id 不存在 | "教程不存在" |
| 400 | 400 | isTop 缺失或非 0/1；sort 超出 0-9999 | "isTop 必须为 0 或 1" |
| 409 | 409 | isTop=1 且教程状态非已发布（仅已发布可置顶） | "仅已发布教程可置顶" |

## 业务规则

- 置顶与排序调整影响前台列表与上下篇顺序：列表排序=置顶优先（isTop DESC）→ sort ASC → updated_at DESC；置顶教程带"置顶"角标排最前（来源：PRD §7.6、AC-RULE-17、UI-ELEM-01）
- 仅已发布教程可置顶（isTop=1 时校验 status=published）；取消置顶与调整 sort 值不限状态（后台列表用途）（来源：PRD §7.6）
- sort 默认值 100，同级数值升序（来源：db.md §2 tutorials.sort）
- admin / operator 均可操作（后台目录管理内教程排序，来源：§10 权限矩阵"教程新建/编辑/复制/撤回"同级管理能力）

## 调用示例

### 正常请求

```bash
curl -X PUT 'http://localhost:3000/api/tutorials/3/top' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer f3a9c2e81b7d4f6a' \
  -d '{"isTop":1,"sort":50}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"id":3,"isTop":1,"sort":50,"status":"published"}}
```
