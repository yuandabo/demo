# GET /api/stats/feedback

> 此文档为前后端共享的接口契约，任何变更需同步通知前后端开发者。

## 基本信息

| 字段 | 内容 |
|------|------|
| **接口路径** | GET /api/stats/feedback |
| **所属模块** | 统计（后台·反馈分析·没帮助优先清单） |
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
    "list": [
      {
        "tutorialId": 14,
        "title": "库存盘点快速入门",
        "helpfulYes": 4,
        "helpfulNo": 9,
        "notHelpfulRate": 69.2,
        "isRed": true,
        "comments": [
          {
            "userId": 5,
            "displayName": "仓库·演示用户",
            "comment": "盘点差异处理那一步讲错了，实际要先审核盘点单",
            "updatedAt": "2026-08-20 15:20:00"
          }
        ]
      },
      {
        "tutorialId": 3,
        "title": "MRP 运算入门：从销售订单到采购建议",
        "helpfulYes": 35,
        "helpfulNo": 3,
        "notHelpfulRate": 7.9,
        "isRed": false,
        "comments": []
      },
      {
        "tutorialId": 18,
        "title": "开放平台接入指引",
        "helpfulYes": 0,
        "helpfulNo": 0,
        "notHelpfulRate": null,
        "isRed": false,
        "comments": []
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data.list | Array | 按没帮助占比倒序（notHelpfulRate DESC，null 条目排最后） |
| data.list[].notHelpfulRate | Number \| null | 没帮助占比=没帮助÷(有帮助+没帮助)，百分比保留 1 位小数；零反馈为 null（前端显示"—"） |
| data.list[].isRed | Boolean | notHelpfulRate > 50% 时 true（条目标红）；null 计 false 不参与标红 |
| data.list[].comments | Array | 留言明细：{ userId, displayName, comment, updatedAt }，仅此处（后台）可见 |

### 失败场景

| HTTP 状态码 | code | 触发条件 | message 示例 |
|-------------|------|----------|--------------|
| 401 | 401 | 未登录 | "未登录或登录已失效" |
| 403 | 403 | 登录角色为 user | "无权限执行该操作" |

## 业务规则

- 反馈分析按"没帮助占比"倒序列出教程，占比 >50% 标红（没帮助优先清单），支持展开查看留言明细（来源：PRD §7.9、AC-FN-14、UI-ELEM-03）
- 没帮助占比=没帮助数÷(有帮助数+没帮助数)；有帮助率与之互补（和为 100%）；零反馈（分母为 0）教程两项均显示"—"，不参与 >50% 标红判定（来源：AC-RULE-10）
- 留言仅后台反馈分析可见，前台不展示（来源：AC-RULE-20）
- 统计口径为前台可见教程；零反馈条目保留在清单尾部供内容治理参考（工程兜底定义，PRD 未明示排序位置）
- 清单驱动管理员定位劣质教程，编辑回审后替换线上版本（来源：PRD §1A 闭环）

## 调用示例

### 正常请求

```bash
curl -X GET 'http://localhost:3000/api/stats/feedback' \
  -H 'Authorization: Bearer f3a9c2e81b7d4f6a'
```

### 预期响应

见上方成功响应示例。
