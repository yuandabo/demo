# POST /api/categories

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | POST /api/categories |
| **所属模块** | 分类（后台·目录管理） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 是 | |
| Authorization | Bearer {token} | 是 | 需 admin 登录 |

### 路径参数

无

### 查询参数

无

### 请求体

```json
{
  "name": "销售订单",
  "parentId": 1,
  "sort": 2,
  "erpModule": "sales",
  "status": "enabled"
}
```

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| name | String | 是 | 长度 1-50，不允许空白 | 分类名称 |
| parentId | Integer | 否 | 须为存在的一级分类；不传为一级分类 | 父分类 ID（null=一级） |
| sort | Integer | 否 | 0-9999，默认 0 | 同级排序值，升序 |
| erpModule | String | 否 | 枚举：sales/project/file/produce/purchase/inventory/hrFinance/system；默认 null | ERP 模块映射（8 选 1 或不限） |
| status | String | 否 | enabled / disabled，默认 enabled | 初始状态（新增即启用，来源：分类状态机） |

## 响应

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 14,
    "name": "销售订单",
    "parentId": 1,
    "sort": 2,
    "status": "enabled",
    "erpModule": "sales",
    "createdAt": "2026-08-21 10:30:00"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.id | Integer | 新分类 ID |
| data.status | String | 新增后状态（默认 enabled） |
| data.createdAt | String | 创建时间（yyyy-MM-dd HH:mm:ss） |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色非 admin（operator/user） | "无权限执行该操作" |
| 400 | 400 | name 缺失 / 空白 / 超过 50 字 | "分类名称不能为空且不超过 50 字" |
| 400 | 400 | parentId 指向二级分类（本期限两级，不允许建三级） | "本期限两级分类，父分类必须为一级分类" |
| 400 | 400 | erpModule 不在枚举内 | "erpModule 参数不合法" |
| 404 | 404 | parentId 指向的分类不存在 | "父分类不存在" |

## 业务规则

- 分类新增为管理员专属操作；新增后初始状态=启用（来源：PRD §3.5 分类状态机、§7.8、AC-RULE-22）
- 本期限两级：parentId 只能是一级分类，新增二级子分类不进入首页宫格，仅出现在筛选树（来源：AC-OP-08）
- 新增一级分类保存后，前台分类宫格与筛选树可见该分类，角标显示"待补充"（0 篇教程），且可被教程选择为归属（来源：AC-OP-08）
- erpModule 模块映射驱动角色推荐位与 ERP 内嵌入口命中集（来源：PRD §7.8、AC-OP-04）

## 调用示例

### 正常请求

```bash
curl -X POST 'http://localhost:3000/api/categories' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer f3a9c2e81b7d4f6a' \
  -d '{"name":"报表中心","parentId":null,"sort":13,"erpModule":null}'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"id":15,"name":"报表中心","parentId":null,"sort":13,"status":"enabled","erpModule":null,"createdAt":"2026-08-21 10:31:00"}}
```
