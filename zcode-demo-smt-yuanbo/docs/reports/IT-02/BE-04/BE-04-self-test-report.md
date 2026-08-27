# BE-04 自测报告

- **任务ID**: BE-04（教程审核状态机：POST submit 提审 / withdraw 撤回 / review 审核通过+驳回）
- **测试时间**: 2026-08-21 16:33
- **测试方式**: 接口测试（Node fetch 脚本驱动真实 HTTP 调用 + sqlite 只读落库断言）
- **服务地址**: http://localhost:3000（编排层托管，测试期间未启停/未重启）
- **测试脚本**: `docs/reports/BE-04/be04-test.js`（59 项）+ `docs/reports/.tmp/be04-supplement.js`（4 项补充），共 **63 项断言，63 PASS / 0 FAIL**

## AC 验证结果

| AC 编号 | 描述 | 结果 | 备注 |
|---------|------|------|------|
| AC-FN-07 | 提审：草稿→待审核，submitCount+1，前台列表/检索不返回 | ✅ | 200 `status=pending, submitCount=1`；提审前后台 keyword 检索均 0 命中 |
| AC-FN-08 | approve：待审核→已发布，快照拷贝+审核留痕，前台下一请求即返回 | ✅ | publishedAt/reviewerId=1/reviewedAt 齐备；详情与列表下一请求即含新 content；DB 一次查询 status/published_content/published_summary/published_at/last_offline_at=NULL 全部就位 |
| AC-FN-09 | 驳回原因 <5 字 400 阻断；≥5 字驳回成功回草稿并展示原因 | ✅ | 4 字/缺失/空白填充 trim 后<5 → 400 "请填写至少 5 个字的驳回原因"；恰 5 字 → 200 draft + rejectReason 回显，管理列表可回读 |
| AC-FN-18 | operator/user 调 review → 403 且教程状态不变 | ✅ | 403 "无权限执行该操作"，状态保持 pending |
| AC-FN-19 | 回审版驳回：编辑版回草稿，前台继续展示线上过审版本 v1 | ✅ | 已发布编辑保存自动回审 pending；驳回后详情 content 仍为 v1 快照，列表持续命中 |
| AC-OP-07 | 撤回：待审核→草稿，可再次提审 | ✅ | withdraw 200 draft；第 2/3 次提审 submitCount=2/3 递增 |
| AC-EG-01 | 提审必填四项缺失阻断 | ✅ | 缺摘要+正文、仅缺正文 → 400 "请补全标题/分类/摘要/正文后再提交"，状态保持 draft（缺标题场景由创建侧必填前置拦截，同规则覆盖） |
| AC-EG-03 | 重复提审后端 409 兜底 | ✅ | pending 再 submit → 409 "该教程状态已变化，请刷新"（按钮防抖为前端职责，后端侧已验证） |
| AC-EG-04 | 审核与撤回并发互斥，后到失效 | ✅ | 先撤回后审核：review 409 终态 draft；先审核后撤回：withdraw 409 终态 published |
| AC-EG-09 | 非法迁移：草稿直接 review / 已下架直接 submit → 409 且状态不变 | ✅ | 草稿 review approve/reject 均 409 保持 draft；自建 offline 教程 submit 409 保持 offline；已发布 submit 409 |
| AC-EG-19 | 重复审核仅首次生效 | ✅ | 二次 approve → 409（仅一次状态迁移与一条留痕） |
| AC-RULE-05 | 状态机合法迁移集外一律拒绝 | ✅ | 覆盖 pending→submit、draft→review、offline→submit、published→submit、非 pending→withdraw/review 共 7 类非法迁移全 409 |
| AC-RULE-19 | 驳回原因必填 ≥5 字后端二次校验 | ✅ | 与 AC-FN-09 同链路验证（后端侧强制） |
| AC-EG-15 | 驳回回审版后前台/搜索持续命中旧版 | ✅ | 驳回后 keyword 检索仍命中，详情 content=v1 不变 |
| AC-EG-18 | 已下架编辑保存自动回审，前台保持不可见 | ✅ | offline PUT 保存 → pending；回审期间与驳回后详情均 404（reason=invisible，回审来源已下架态维持不可见） |

## 接口测试结果

| 接口 | 方法 | 状态码 | 结果 | 备注 |
|------|------|--------|------|------|
| /api/tutorials/:id/submit | POST | 200/400/401/403/404/409 | ✅ | 正向提审、必填缺失、停用分类 409、非法迁移 409、user 403、未登录 401、不存在 404、100 字标题边界通过 |
| /api/tutorials/:id/withdraw | POST | 200/401/403/404/409 | ✅ | 正向撤回、非 pending 409、互斥后到 409、user 403、404 |
| /api/tutorials/:id/review | POST | 200/400/401/403/404/409 | ✅ | approve/reject 正向、action 缺失/非法 400、reason 4/5 字边界、operator/user 403、非 pending 409（approve+reject）、重复审核 409、404 |
| 辅助：GET /api/tutorials（前台/管理口径） | GET | 200 | ✅ | 前台可见性与管理列表状态/驳回原因回读断言 |
| 辅助：GET /api/tutorials/:id | GET | 200/404 | ✅ | 快照 v1 不断供、回审来源已下架态 404 invisible |
| 辅助：PUT /api/tutorials/:id | PUT | 200 | ✅ | 已发布/已下架保存自动回审 pending（AC-FN-19/AC-EG-18 前置） |
| 落库断言（sqlite 只读） | - | - | ✅ | submit_count 累计=3；approve 快照列+last_offline_at=NULL 原子落库；reject reject_reason/reviewer_id/reviewed_at 落库；驳回后快照列不动 |

## 问题清单（如有）

| 级别 | 问题描述 | 复现步骤 |
|------|----------|----------|
| - | 无产品缺陷。测试期间 2 次脚本侧修正：① 100 字边界标题误拼 101 字（脚本 bug）；② AC-EG-18 不可见文案断言误写为"该教程已下架"，实际契约（get-api-tutorials-id.md 失败表）规定"已下架且回审来源为已下架态"应返回"该教程不存在或暂不可见"(reason=invisible)，服务端行为与契约一致 | - |

## 结论

**通过**。3 个审核状态机端点共 63 项断言全部 PASS：提审必填/留痕、撤回、approve 快照事务落库、reject ≥5 字双重校验（后端侧）、并发互斥、非法迁移全量 409、回审版驳回旧版不断供、已下架回审不可见，均按契约文案与状态语义验证通过。

## API 测试覆盖率

| API | 正向 | 参数校验 | 边界值 | 业务规则 | 异常 | 联动 |
|-----|------|----------|--------|----------|------|------|
| POST /api/tutorials/:id/submit | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /api/tutorials/:id/withdraw | ✅ | - | - | ✅ | ✅ | ✅ |
| POST /api/tutorials/:id/review | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

覆盖率: 15/18 维度 (83%；withdraw 无请求体参数故参数校验/边界值不适用)
