# GET /api/stats/coverage

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | GET /api/stats/coverage |
| **所属模块** | 统计（后台·覆盖度统计） |
| **版本** | v1 |

## 请求

### Headers

| Header | 值 | 必填 | 说明 |
|--------|----|------|------|
| Content-Type | application/json | 否 | GET 请求可省略 |
| Authorization | Bearer {token} | 是 | 需 admin / operator 登录（operator 只读） |

### 路径参数

无

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
    "matrix": [
      {
        "categoryId": 1,
        "name": "销售管理",
        "parentId": null,
        "erpModule": "sales",
        "tutorialCount": 3,
        "isBlank": false
      },
      {
        "categoryId": 8,
        "name": "系统设置",
        "parentId": null,
        "erpModule": "system",
        "tutorialCount": 0,
        "isBlank": true
      },
      {
        "categoryId": 13,
        "name": "销售订单",
        "parentId": 1,
        "erpModule": "sales",
        "tutorialCount": 2,
        "isBlank": false
      }
    ],
    "modules": [
      { "erpModule": "sales", "moduleName": "销售管理", "categoryCount": 2, "tutorialCount": 5, "isBlank": false },
      { "erpModule": "system", "moduleName": "系统设置", "categoryCount": 1, "tutorialCount": 0, "isBlank": true }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.matrix | Array | 已启用分类 × 已发布（前台可见）教程数矩阵；含一、二级分类，按 sort 升序 |
| data.matrix[].tutorialCount | Integer | 该分类（一级含子分类汇总）前台可见教程数 |
| data.matrix[].isBlank | Boolean | tutorialCount=0 时 true（前端标"空白区"） |
| data.modules | Array | 按模块映射聚合：{ erpModule, moduleName, categoryCount, tutorialCount, isBlank } |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色为 user | "无权限执行该操作" |

## 业务规则

- 覆盖度统计：已启用分类 × 已发布教程数矩阵；0 篇分类标"空白区"；按模块映射聚合出模块级覆盖数（来源：PRD §7.9、AC-FN-14、UI-ELEM-04）
- "已发布教程数"按前台可见口径统计（回审期间旧版在线计入；停用分类不入矩阵）（来源：AC-RULE-08、AC-RULE-06/07）
- 覆盖度用于内容体系治理：定位空白区、规划内容补齐（目标=每模块至少 1 篇已发布教程）（来源：PRD §1.2、§1.3）
- 空库时 matrix / modules 返回空数组，前端展示空态引导（来源：AC-EG-12）

## 调用示例

### 正常请求

```bash
curl -X GET 'http://localhost:3000/api/stats/coverage' \
  -H 'Authorization: Bearer f3a9c2e81b7d4f6a'
```

### 预期响应

见上方成功响应示例（matrix 实际返回全部启用分类，示例截断展示 3 条）。
