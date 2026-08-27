# BE-02 自测报告（IT-02 · 教程查询 3 端点 + share 打点）

- **任务ID**: IT-02/BE-02（GET /api/tutorials、GET /api/tutorials/:id、POST /api/tutorials/:id/share）
- **测试时间**: 2026-08-21 16:39 前后
- **测试方式**: node 脚本（selftest-be02.mjs）+ sqlite 对账，65/65 断言
- **AC 验证**: **pass（6/6）**
  - 公开池 total=19（18 发布 + #19 回审旧版在线）；草稿/首次待审/已下架排除
  - keyword 三字段命中各 1 例；tag 多值交集（报工,扫码→#2；MRP,BOM→空）；latest/hot 排序 + 置顶最前
  - 管理态 all=1 四态齐全 + 扩展列；status 优先 all；401/403 门卫
  - 详情：#19 读旧版快照；prev/next/related 正确；#24 → 404 offline+related；游客浏览 +2；share 游客 +2、不可见 404/40404
  - 停用分类 keyword 不命中、直达详情 200（AC-RULE-07 联动）
- **失败详情**: 无（首轮 8 项为脚本断言取值错误，修正后全过，无产品缺陷）
- **备注**: 目录重构后补写（原文件被后完成的 IT-04/BE-02 覆盖）
