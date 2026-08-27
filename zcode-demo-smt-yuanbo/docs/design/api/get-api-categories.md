# GET /api/categories

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | GET /api/categories |
| **所属模块** | 分类（后台·目录管理 / 前台·分类树） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 否 | GET 请求可省略 |
| Authorization | Bearer {token} | 视场景 | 仅使用管理参数 `all=1` 时必填（admin） |

### 路径参数

无

### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| withCount | Integer | 否 | 不返回计数 | withCount=1 时每个分类附带 tutorialCount（前台可见教程数角标） |
| all | Integer | 否 | 仅启用分类 | 管理参数：all=1 返回含停用分类的全量树，需 admin 登录 |

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
        "id": 1,
        "name": "销售管理",
        "parentId": null,
        "sort": 1,
        "status": "enabled",
        "erpModule": "sales",
        "tutorialCount": 3,
        "children": [
          {
            "id": 13,
            "name": "销售订单",
            "parentId": 1,
            "sort": 1,
            "status": "enabled",
            "erpModule": "sales",
            "tutorialCount": 2,
            "children": []
          }
        ]
      },
      {
        "id": 9,
        "name": "新手入门",
        "parentId": null,
        "sort": 9,
        "status": "enabled",
        "erpModule": null,
        "tutorialCount": 1,
        "children": []
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.list | Array | 一级分类数组（parentId=null），两级树结构 |
| data.list[].id | Integer | 分类 ID |
| data.list[].name | String | 分类名称 |
| data.list[].parentId | Integer \| null | 父分类 ID，一级为 null（本期限两级） |
| data.list[].sort | Integer | 同级排序值，升序（影响前台宫格与列表顺序） |
| data.list[].status | String | enabled / disabled；非 admin 调用仅返回 enabled |
| data.list[].erpModule | String \| null | ERP 模块映射：sales/project/file/produce/purchase/inventory/hrFinance/system，未映射为 null |
| data.list[].tutorialCount | Integer | 仅 withCount=1 返回；该分类（一级含其子分类汇总，二级为本分类直接计数）前台可见教程数；0 篇前端显示"待补充" |
| data.list[].children | Array | 二级子分类数组，结构同上，最多一层 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 使用 all=1 但未登录 | "未登录或登录已失效" |
| 403 | 403 | 使用 all=1 但登录角色非 admin（operator/user） | "无权限执行该操作" |

## 业务规则

- 分类树为本期限两级结构（新增二级子分类不进入首页宫格，仅出现在筛选树）（来源：PRD §7.8、AC-OP-08）
- 前台口径仅返回启用分类；停用分类前台宫格与筛选树隐藏、推荐与内嵌入口命中集排除、搜索不命中其下教程，但其下已发布教程仍可经收藏/历史/直达链接访问（来源：AC-RULE-06/07、AC-EG-14）
- 角标计数 tutorialCount 按前台可见口径统计（存在线上过审版本且未被下架），回审期间旧版在线计入；0 篇显示"待补充"（来源：PRD §7.1、AC-RULE-17、UI-ELEM-05）
- all=1 管理参数仅 admin 可用（分类树管理为管理员专属，来源：AC-RULE-22、§10 权限矩阵）
- 一级分类共 12 个：8 大模块 + 新手入门/最佳实践/常见问题/开放平台（来源：PRD §7.1、db.md §6）

## 调用示例

### 正常请求

```bash
curl -X GET 'http://localhost:3000/api/categories?withCount=1'
```

### 预期响应

```json
{"code":0,"message":"ok","data":{"list":[{"id":1,"name":"销售管理","parentId":null,"sort":1,"status":"enabled","erpModule":"sales","tutorialCount":3,"children":[{"id":13,"name":"销售订单","parentId":1,"sort":1,"status":"enabled","erpModule":"sales","tutorialCount":2,"children":[]}]},{"id":9,"name":"新手入门","parentId":null,"sort":9,"status":"enabled","erpModule":null,"tutorialCount":1,"children":[]}]}}
```
