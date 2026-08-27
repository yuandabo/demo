# PUT /api/categories/:id

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | PUT /api/categories/:id |
| **所属模块** | 分类（后台·目录管理） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 是 | |
| Authorization | Bearer {token} | 是 | 需 admin 登录 |

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Integer | 是 | 分类 ID |

### 查询参数

无

### 请求体

```json
{
  "name": "销售订单管理",
  "parentId": 1,
  "sort": 3,
  "status": "enabled",
  "erpModule": "sales"
}
```

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| name | String | 否 | 长度 1-50，不允许空白 | 分类名称（不传不改） |
| parentId | Integer | 否 | 须为存在的一级分类，不允许指向自身或其子分类 | 调整父分类（null=调整为一级） |
| sort | Integer | 否 | 0-9999 | 同级排序值（拖拽排序或数值调整共用本字段） |
| status | String | 否 | enabled / disabled | 启用 / 停用状态切换 |
| erpModule | String | 否 | 枚举：sales/project/file/produce/purchase/inventory/hrFinance/system；null=解除映射 | ERP 模块映射维护 |

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 13,
    "name": "销售订单管理",
    "parentId": 1,
    "sort": 3,
    "status": "enabled",
    "erpModule": "sales",
    "updatedAt": "2026-08-21 11:00:00"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.updatedAt | String | 更新时间，保存成功即刷新 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色非 admin | "无权限执行该操作" |
| 404 | 404 | 分类 id 不存在 | "分类不存在" |
| 400 | 400 | name 空白 / 超过 50 字；status、erpModule 枚举非法 | "分类名称不能为空且不超过 50 字" |
| 400 | 400 | parentId 指向自身或其子孙分类（防环） | "不允许将分类移动到自身或其子分类下" |
| 400 | 400 | parentId 指向二级分类（限两级） | "本期限两级分类，父分类必须为一级分类" |

## 业务规则

- 分类编辑（名称/父分类/排序）与启停用、模块映射维护共用本接口，均为 admin 专属（来源：PRD §7.8、AC-RULE-22）
- 修改分类绑定的 ERP 模块保存后，角色推荐位（AC-RULE-16 命中集）与 ERP 内嵌入口按新映射在下次加载时生效（来源：AC-OP-04）
- 停用分类：前台宫格与筛选树隐藏、推荐与内嵌入口命中集排除、关键词搜索不返回该分类下教程；其下已发布教程仍可经收藏/历史/直达链接访问；重新启用即恢复（来源：AC-RULE-07、AC-OP-09、AC-EG-14）
- 同级排序值调整后，前台宫格与列表顺序同步变化（来源：PRD §7.8、UI-IXD-12）

## 调用示例

### 正常请求

```bash
curl -X PUT 'http://localhost:3000/api/categories/2' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer f3a9c2e81b7d4f6a' \
  -d '{"erpModule":"purchase","sort":2}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"id":2,"name":"采购管理","parentId":null,"sort":2,"status":"enabled","erpModule":"purchase","updatedAt":"2026-08-21 11:02:00"}}
```
