# BE-05 自测报告

- **任务ID**: BE-05（教程上下架与复制置顶：offline / republish / copy / top）
- **测试时间**: 2026-08-21 16:36
- **测试方式**: 接口测试（Node fetch 脚本驱动真实 HTTP 调用 + sqlite 只读落库断言）
- **服务地址**: http://localhost:3000（编排层托管，测试期间未启停/未重启）
- **测试脚本**: `docs/reports/BE-05/be05-test.js`，共 **60 项断言，60 PASS / 0 FAIL**

## AC 验证结果

| AC 编号 | 描述 | 结果 | 备注 |
|---------|------|------|------|
| AC-OP-03 | 下架：published→offline，留痕 last_offline_at，三端下一请求不可见，计数保留 | ✅ | 200 `status=offline, lastOfflineAt` 非空；前台列表/keyword 下一请求 0 命中；直达详情 404 "该教程已下架"（reason=offline，附同类推荐善后数据）；view=3/fav=1 下架前后一致 |
| AC-FN-11 | 重发布：offline→published 不重审无中间态，计数延续，前台即时恢复 | ✅ | 200 直达 published（无 pending 中间态）；viewCount/favCount 与下架前一致；前台列表下一请求命中；DB last_offline_at=NULL |
| AC-FN-12 | 复制：任意状态→新草稿（标题+（副本）、六类计数 0、快照/驳回原因清空、源不变） | ✅ | 种子 id=3 复制：标题=源+"（副本）"、view/fav/helpfulYes/helpfulNo/share 全 0、submit_count=0、published_content/published_summary/published_at/reject_reason 均 NULL、author_id=2（复制操作人）、is_top=0/sort=100 缺省；源状态与计数不变；pending/draft 源均可复制；admin/operator 均放行 |
| AC-RULE-04 | 已下架可见性派生列 last_offline_at | ✅ | 下架落库 NOT NULL、重发布置 NULL 全链路验证 |
| AC-RULE-14 | 复制标题规则与计数清零 | ✅ | 源 96 字 → 新标题 100 字不截断；源 97 字 → 截断至 96 再拼接恰 100 字；六类计数（含 share/submit_count）全 0 |

## 接口测试结果

| 接口 | 方法 | 状态码 | 结果 | 备注 |
|------|------|--------|------|------|
| /api/tutorials/:id/offline | POST | 200/401/403/404/409 | ✅ | 正向下架+留痕；operator/user 403；pending/draft/offline 再下架 409 且状态不变；401/404 |
| /api/tutorials/:id/republish | POST | 200/401/403/404/409 | ✅ | 正向重发布计数延续；published 重发布 409 且状态不变；operator/user 403；401/404 |
| /api/tutorials/:id/copy | POST | 200/401/403/404 | ✅ | 正向（种子+pending+draft 源）；96/97 字标题边界；user 403；401/404；admin/operator 双角色放行 |
| /api/tutorials/:id/top | PUT | 200/400/401/403/404/409 | ✅ | 已发布置顶 200 且前台列表第一位；draft/pending/offline 置顶 409 "仅已发布教程可置顶"；取消置顶与调 sort 在 draft 放行；isTop 缺失/2/字符串、sort -1/10000 → 400；sort 0/9999 边界合法；user 403；401/404 |
| 辅助：GET /api/tutorials（前台/管理口径） | GET | 200 | ✅ | 下架不可见/重发布恢复/置顶排序第一位/新草稿不可见断言 |
| 辅助：GET /api/tutorials/:id | GET | 200/404 | ✅ | 下架 404 "该教程已下架"+同类推荐；重发布恢复 200 |
| 辅助：POST /api/favorites/:tutorialId | POST | 200 | ✅ | 构造 favCount 非零以验证计数延续 |
| 落库断言（sqlite 只读） | - | - | ✅ | offline→republish 链路 last_offline_at NOT NULL→NULL、status offline→published；copy 新记录全列断言；top is_top/sort 落库 |

## 权限矩阵验证

| 端点 | admin | operator | user | 未登录 |
|------|-------|----------|------|--------|
| POST /:id/offline | 200 | 403 | 403 | 401 |
| POST /:id/republish | 200 | 403 | 403 | 401 |
| POST /:id/copy | 200 | 200 | 403 | 401 |
| PUT /:id/top | 200 | 200 | 403 | 401 |

## 问题清单（如有）

| 级别 | 问题描述 | 复现步骤 |
|------|----------|----------|
| - | 无。全部断言一次通过，无产品缺陷 | - |

## 结论

**通过**。4 个生命周期端点共 60 项断言全部 PASS：下架/重发布的状态机约束与计数延续、复制的标题截断边界与全量清零、置顶的"仅已发布"限制与 sort 边界、三级权限矩阵、sqlite 落库持久化均按契约验证通过。

## API 测试覆盖率

| API | 正向 | 参数校验 | 边界值 | 业务规则 | 异常 | 联动 |
|-----|------|----------|--------|----------|------|------|
| POST /api/tutorials/:id/offline | ✅ | - | - | ✅ | ✅ | ✅ |
| POST /api/tutorials/:id/republish | ✅ | - | - | ✅ | ✅ | ✅ |
| POST /api/tutorials/:id/copy | ✅ | - | ✅ | ✅ | ✅ | ✅ |
| PUT /api/tutorials/:id/top | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

覆盖率: 17/24 维度 (71%；offline/republish/copy 无请求体参数，参数校验维度不适用，无参接口边界值仅体现在路径 id —— 已由 404 用例覆盖)
