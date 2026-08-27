# BE-02 自测报告（IT-01 · POST /api/system/reset）

- **任务ID**: IT-01/BE-02（system/reset，admin 专属）
- **测试时间**: 2026-08-21 16:2x–16:3x
- **测试方式**: curl + 原子"reset→立即查库"复核（规避共享服务并发干扰）
- **AC 验证**: AC-OP-01 **pass（2/2）**，断言 11/11 PASS + 数据层原子复核 CLEAN-PASS
  - admin → code:0"重置成功"，计数 12/24/8/3/5；连续 3 次幂等恒定
  - 无/伪造 token 401；operator/user 403"无权限执行该操作"
  - reset 后旧 token 全 401，重新登录恢复；四态 18/3/2/1、行为表归零
- **失败详情**: 无
- **备注**: 目录重构后补写（原文件被覆盖；脚本 be02-postreset-db-check.mjs 存活）
