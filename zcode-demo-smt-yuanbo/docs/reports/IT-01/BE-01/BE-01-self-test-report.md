# BE-01 自测报告（IT-01 · 认证 4 端点 + DB token 鉴权）

- **任务ID**: IT-01/BE-01（POST /api/auth/login、/role-login、/logout，GET /api/auth/me，authRequired/requireRole）
- **测试时间**: 2026-08-21 16:2x–16:3x（服务 http://localhost:3000，ts 进程）
- **测试方式**: curl/node 脚本（be01-selftest.mjs）+ sqlite 只读查库断言
- **AC 验证**: AC-RULE-22/23/24/25/26 全部 **pass（6/6）**，断言 36/36 PASS
  - 8 账号全可登录（admin/operator 走 login；sales/purchase/produce/warehouse/manage/finance 走 role-login，erpRole 回显正确）
  - 400 文案逐字（缺参/空串/纯空白/类型/51 字符边界）；错密码与不存在账号 401 文案一致（防枚举）；角色账号走 login → 403"请使用选角色登录"
  - me 六字段；logout 删 auth_tokens 行、同 token 401；无/伪造/非 Bearer → 401
  - DB 实证 token 落库/删除；authRequired 覆盖业务路由（stats/favorites 探针 401）
  - 重启会话保持：以 DB 证据等价替代（token 持久化 + 每请求查库）；真实重启验证由编排层终验
- **失败详情**: 无
- **备注**: 本报告为目录重构后依据测试 Agent 结论补写（原文件被跨迭代同名覆盖，脚本 be01-selftest.mjs 存活于原目录）
