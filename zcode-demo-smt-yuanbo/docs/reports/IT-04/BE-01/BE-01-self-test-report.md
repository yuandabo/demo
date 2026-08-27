# BE-01 自测报告（IT-04 · 收藏管理 3 端点）

- **任务ID**: IT-04/BE-01（POST/DELETE /api/favorites/:tutorialId、GET /api/favorites）
- **测试时间**: 2026-08-21 16:36 前后
- **测试方式**: curl + sqlite 主键/计数对账，22/22 断言
- **AC 验证**: AC-FN-03/15/20、AC-RULE-09、AC-EG-10 全部 **pass**
  - fav_count 187→188→187→188 联动与幂等；无 token 三接口 401（AC-FN-03）
  - 下架 #5 后列表 isOffline=true 且仍可取消（AC-FN-20/AC-EG-10）
  - sales/purchase 同库隔离；page/pageSize 400 校验与 1/100 边界
- **失败详情**: 无（首轮 2 项受并行 reset 干扰误报，无干扰窗口重跑全过）
- **备注**: 目录重构后补写（原文件被跨迭代同名覆盖）
