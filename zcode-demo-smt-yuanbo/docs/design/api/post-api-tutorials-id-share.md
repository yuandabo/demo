# POST /api/tutorials/:id/share · 分享打点

## 基本信息
- 方法路径：POST /api/tutorials/:id/share
- 权限：公开（含游客，分享动作不要求登录）
- 说明：每次分享动作 share_count +1（不去重，与浏览量同口径）；本期仅数据留存不上看板（PRD §7.9）

## 请求
路径参数：tutorialId（integer，必填）。无请求体。

## 响应
成功 code=0，data：`{ "shareCount": 188 }`

## 失败场景
| HTTP | code | message | 场景 |
|---|---|---|---|
| 404 | 40404 | 该教程不存在或暂不可见 | 教程不存在或不在前台可见池（可见性规则 db.md §3） |

## 业务规则
- 仅对前台可见教程计数（不可见教程分享链接本就打不开）
- 幂等口径：按动作计数，每次调用 +1（AC-RULE-08 同思路，看板不展示该指标）
- 来源：PRD §6 分享数字段写入方；复制教程时清零（AC-RULE-14）

## curl
```bash
curl -X POST http://localhost:3000/api/tutorials/2/share
```
