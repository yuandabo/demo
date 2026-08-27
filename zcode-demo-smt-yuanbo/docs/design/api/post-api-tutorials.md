# POST /api/tutorials

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/tutorials |
| **所属模块** | 教程（后台·教程编辑器） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 是 | |
| Authorization | Bearer {token} | 是 | 需 admin / operator 登录 |

### 路径参数

无

### 查询参数

无

### 请求体

```json
{
  "title": "销售订单 13 态状态说明",
  "categoryId": 1,
  "summary": "逐条讲解销售订单从创建到完结的 13 个状态与跳转条件。",
  "content": "<h2>一、状态总览</h2><p>……</p>",
  "videoUrl": null,
  "tags": ["销售订单", "状态"]
}
```

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| title | String | 是 | 必填 ≤100 字 | 标题，列表与搜索主展示 |
| categoryId | Integer | 是 | 须为存在的启用分类 | 所属分类（唯一归属） |
| summary | String | 否 | ≤200 字 | 摘要；草稿允许空（落库空字符串），提审时必须非空 |
| content | String | 否 | 富文本 HTML | 图文正文；草稿允许空（落库空字符串），提审时必须非空 |
| videoUrl | String | 否 | mp4 直链 URL | 视频外链，详情页视频区渲染，失效给占位提示 |
| tags | Array&lt;String&gt; | 否 | ≤5 个 | 标签；默认 []，应用层 JSON 序列化存储 |

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 25,
    "title": "销售订单 13 态状态说明",
    "categoryId": 1,
    "status": "draft",
    "createdAt": "2026-08-21 14:00:00",
    "updatedAt": "2026-08-21 14:00:00"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.id | Integer | 新教程 ID |
| data.status | String | 固定 draft（新建即草稿，不进前台与审核队列） |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色为 user | "无权限执行该操作" |
| 400 | 400 | title 缺失 / 空白 | "请填写标题" |
| 400 | 400 | 标题 >100 字 / 摘要 >200 字 / 标签 >5 个（保存草稿同样阻断） | "标题不超过 100 字 / 摘要不超过 200 字 / 标签最多 5 个" |
| 404 | 404 | categoryId 指向的分类不存在 | "所属分类不存在" |
| 409 | 409 | categoryId 指向停用分类 | "所属分类已停用，请选择启用的分类" |

## 业务规则

- 新建教程仅 admin / operator 可用，创建即草稿（status=draft），仅作者后台可见，不进前台与审核队列（来源：PRD §7.6、AC-OP-05、AC-RULE-01）
- 必填与长度：标题必填 ≤100 字；所属分类必填（仅启用节点，唯一归属）；摘要必填 ≤200 字；图文正文必填（富文本）；标签可选 ≤5 个；视频外链可选——草稿阶段允许摘要/正文为空反复保存，必填完整性在提审时校验；长度越界保存草稿与提审均阻断（来源：AC-RULE-18、AC-OP-05、AC-EG-01）
- 富文本能力边界：标题 / 加粗 / 列表 / 图片 URL / 视频外链五类；正文入库前做脚本剥离防注入（来源：PRD §13 开放问题 1、AC-NF-04）
- 视频外链失效不阻断保存，详情页加载失败给占位提示"视频暂不可用，可先阅读图文步骤"（来源：AC-EG-02）
- 作者 author_id=当前登录用户；审核人 / 审核时间为空（来源：PRD §6 教程字段）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/tutorials' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer b7e2d9f4a1c80356' \
  -d '{"title":"销售订单 13 态状态说明","categoryId":1,"summary":"逐条讲解销售订单从创建到完结的 13 个状态与跳转条件。","content":"<h2>一、状态总览</h2><p>……</p>","videoUrl":null,"tags":["销售订单","状态"]}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"id":25,"title":"销售订单 13 态状态说明","categoryId":1,"status":"draft","createdAt":"2026-08-21 14:00:00","updatedAt":"2026-08-21 14:00:00"}}
```
