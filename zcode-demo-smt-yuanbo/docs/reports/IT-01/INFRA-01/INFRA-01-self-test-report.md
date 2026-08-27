# INFRA-01 自测报告（server 脚手架）

- **任务ID**: IT-01/INFRA-01
- **测试时间**: 2026-08-21（开发完成即验）
- **测试方式**: 三种启动模式（tsx watch / build+start / dev）× curl 断言
- **结果**: 全部 PASS——tsc 0 错误；404 JSON 信封 {"code":404,"message":"接口不存在"}；web/dist 缺失不崩溃
- **后续修复**: 静态托管路径 ../../web/dist 由 INFRA-04 修复并回归三入口 200
