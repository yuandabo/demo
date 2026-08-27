---
iteration: IT-06
task-id: DOCF-01
task-name: "文档对齐（前端变更）"
role: 前端
depends-on: "无"
acceptance-criteria: []  # 文档对齐探针任务，无 AC 可分配（对齐结果由 change-log 承载，见 /zcode:doc-reconcile）
---

# DOCF-01 - 文档对齐（前端变更）

## 对齐基线

| 文档 | 路径 |
|------|------|
| PRD | ../../prd/PRD.md |
| AC | ../../ac.md |
| tech-design | ../../design/tech-design.md |

## 变更来源

- change-log: 各迭代任务执行产出的 change-log 记录（开发阶段由 /zcode:backend、/zcode:frontend 触发本探针任务后回填）
- 变更条目: 前端侧 BE/INFRA 或 FE 任务实施中与设计文档的偏差记录

## 说明

本任务为存在性探针（phase dev=done），创建即生效：backend/frontend 流程 Phase 3 检测到本任务时触发文档对齐，把实施偏差沉淀到 change-log，对齐结果供 /zcode:doc-reconcile 汇总为变更包。
