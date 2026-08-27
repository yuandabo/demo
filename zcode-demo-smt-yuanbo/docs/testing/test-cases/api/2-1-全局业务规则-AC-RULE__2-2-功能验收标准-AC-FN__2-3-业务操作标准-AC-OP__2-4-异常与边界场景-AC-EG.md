# 2-1-全局业务规则-AC-RULE__2-2-功能验收标准-AC-FN__2-3-业务操作标准-AC-OP__2-4-异常与边界场景-AC-EG API API 测试案例

>  | 版本 v1 | 生成日期 2026-08-23T14:01:49 | 案例类型 api

---

### API-LOGIN-001 管理员 admin 账号密码登录成功返回 DB token 与用户信息

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-001 |
| 用例描述 | 管理员 admin 账号密码登录成功返回 DB token 与用户信息 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26, AC-RULE-22, AC-OP-01 |

前置条件：
1. 种子库已初始化，后台账号 admin/123456 存在

测试步骤：
1. POST /api/auth/login，Header Content-Type: application/json
1. 请求体 {"username":"admin","password":"123456"}

预期结果：
1. HTTP 200，code=0，message=ok
1. data.token 为非空字符串（DB token，写入 auth_tokens 表）
1. data.user.role=admin，data.user.erpRole=null，data.user.displayName=平台管理员

---

### API-LOGIN-002 运营编辑 operator 账号密码登录成功

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-002 |
| 用例描述 | 运营编辑 operator 账号密码登录成功 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26, AC-RULE-23, AC-OP-01 |

前置条件：
1. 种子库已初始化，后台账号 operator/123456 存在

测试步骤：
1. POST /api/auth/login
1. 请求体 {"username":"operator","password":"123456"}

预期结果：
1. HTTP 200，code=0
1. data.user.role=operator，data.user.erpRole=null，data.user.displayName=运营编辑
1. data.token 非空，可用于后台管理态接口（status/all 管理参数）

---

### API-LOGIN-003 登录返回的 token 携带 Bearer 可直接访问管理接口

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-003 |
| 用例描述 | 登录返回的 token 携带 Bearer 可直接访问管理接口 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22, AC-EG-06 |

前置条件：
1. 已按 API-LOGIN-001 取得 admin token，记为 {adminToken}

测试步骤：
1. GET /api/categories?all=1，Header Authorization: Bearer {adminToken}

预期结果：
1. HTTP 200，code=0，返回含停用分类的全量树
1. 携带 token 即视为有效后台会话，接口不返回 401

---

### API-LOGIN-004-E01 username 缺失时登录被 400 阻断

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-004-E01 |
| 用例描述 | username 缺失时登录被 400 阻断 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26 |

前置条件：
1. 服务正常运行

测试步骤：
1. POST /api/auth/login
1. 请求体仅 {"password":"123456"}（缺失 username）

预期结果：
1. HTTP 400，code=400
1. message="请输入账号和密码"
1. 不返回 token

---

### API-LOGIN-005-E02 password 缺失时登录被 400 阻断

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-005-E02 |
| 用例描述 | password 缺失时登录被 400 阻断 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26 |

前置条件：
1. 服务正常运行

测试步骤：
1. POST /api/auth/login
1. 请求体仅 {"username":"admin"}（缺失 password）

预期结果：
1. HTTP 400，code=400
1. message="请输入账号和密码"

---

### API-LOGIN-006-E03 username 为空串或纯空白时登录被 400 阻断

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-006-E03 |
| 用例描述 | username 为空串或纯空白时登录被 400 阻断 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26 |

前置条件：
1. 服务正常运行

测试步骤：
1. POST /api/auth/login
1. 请求体 {"username":"   ","password":"123456"}（纯空白）与 {"username":"","password":"123456"}（空串）各执行一次

预期结果：
1. 两次均 HTTP 400，code=400
1. message="请输入账号和密码"（约束：长度 1-50 且不允许空白）

---

### API-LOGIN-007-E04 账号不存在返回 401 统一文案防账号枚举

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-007-E04 |
| 用例描述 | 账号不存在返回 401 统一文案防账号枚举 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26 |

前置条件：
1. 账号 admin_not_exist 不存在

测试步骤：
1. POST /api/auth/login
1. 请求体 {"username":"admin_not_exist","password":"123456"}

预期结果：
1. HTTP 401，code=401
1. message="账号或密码错误"（不区分账号不存在与密码错误）

---

### API-LOGIN-008-E05 密码错误返回 401 且文案与账号不存在完全一致

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-008-E05 |
| 用例描述 | 密码错误返回 401 且文案与账号不存在完全一致 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26 |

前置条件：
1. 账号 admin 存在，密码为 123456

测试步骤：
1. POST /api/auth/login
1. 请求体 {"username":"admin","password":"wrong123"}
1. 对比 API-LOGIN-007-E04 的 message 文案

预期结果：
1. HTTP 401，code=401
1. message="账号或密码错误"，与账号不存在场景字面完全相同（防枚举）

---

### API-LOGIN-009-E06 普通用户演示账号走后台密码登录被 403 引导走选角色登录

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-009-E06 |
| 用例描述 | 普通用户演示账号走后台密码登录被 403 引导走选角色登录 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24, AC-RULE-26 |

前置条件：
1. 种子演示账号 sales/123456（role=user）存在

测试步骤：
1. POST /api/auth/login
1. 请求体 {"username":"sales","password":"123456"}

预期结果：
1. HTTP 403，code=403
1. message="请使用选角色登录"（普通用户应走 POST /api/auth/role-login）

---

### API-LOGIN-010-E07 空请求体登录被 400 阻断

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-010-E07 |
| 用例描述 | 空请求体登录被 400 阻断 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26 |

前置条件：
1. 服务正常运行

测试步骤：
1. POST /api/auth/login
1. 请求体 {}，两个必填字段均缺失

预期结果：
1. HTTP 400，code=400
1. message="请输入账号和密码"

---

### API-LOGIN-011-B01 username 长度 50 字上边界请求不引发服务端异常

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-011-B01 |
| 用例描述 | username 长度 50 字上边界请求不引发服务端异常 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26 |

前置条件：
1. 服务正常运行

测试步骤：
1. POST /api/auth/login
1. 请求体 username 为 50 个字符（不存在的账号）、password=123456

预期结果：
1. 返回 HTTP 401（账号不存在），code=401
1. 不返回 500，服务稳定

---

### API-LOGIN-012-B02 username 长度 51 字超边界请求被稳定处理

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-012-B02 |
| 用例描述 | username 长度 51 字超边界请求被稳定处理 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26 |

前置条件：
1. 服务正常运行

测试步骤：
1. POST /api/auth/login
1. 请求体 username 为 51 个字符、password=123456

预期结果：
1. 返回 HTTP 400 或 401（按约束长度 1-50 拒绝或按不存在账号处理）
1. 不返回 500

---

### API-LOGIN-013-B03 password 长度 50/51 字边界请求不引发服务端异常

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-013-B03 |
| 用例描述 | password 长度 50/51 字边界请求不引发服务端异常 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26 |

前置条件：
1. 账号 admin 存在

测试步骤：
1. POST /api/auth/login
1. 请求体 username=admin、password 分别为 50 字与 51 字各执行一次

预期结果：
1. 均返回 HTTP 401（密码错误），code=401
1. 不返回 500

---

### API-LOGIN-014 同一账号多次登录生成多个 token 且均有效

| 项目 | 内容 |
|------|------|
| 用例ID | API-LOGIN-014 |
| 用例描述 | 同一账号多次登录生成多个 token 且均有效 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26 |

前置条件：
1. 账号 admin/123456 存在

测试步骤：
1. 连续两次 POST /api/auth/login（相同账号密码），取得 tokenA、tokenB
1. 分别用 tokenA、tokenB 调 GET /api/categories?all=1

预期结果：
1. 两次登录均 200 且 token 均非空（tokenA≠tokenB 或相同，以实现为准）
1. 两个 token 调用管理接口均返回 200（DB token 方案支持多端并存）

---

### API-RLOGIN-001 采购角色选角色快速登录成功返回 user 身份与 token

| 项目 | 内容 |
|------|------|
| 用例ID | API-RLOGIN-001 |
| 用例描述 | 采购角色选角色快速登录成功返回 user 身份与 token |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24, AC-RULE-26, AC-OP-01 |

前置条件：
1. 种子库已初始化，6 个演示账号存在

测试步骤：
1. POST /api/auth/role-login
1. 请求体 {"erpRole":"purchase"}

预期结果：
1. HTTP 200，code=0
1. data.user.role=user，data.user.erpRole=purchase，data.user.username=purchase
1. data.token 非空，可用于收藏/打卡等用户行为接口

---

### API-RLOGIN-002 六个 ERP 角色枚举逐个登录全部成功且身份字段正确

| 项目 | 内容 |
|------|------|
| 用例ID | API-RLOGIN-002 |
| 用例描述 | 六个 ERP 角色枚举逐个登录全部成功且身份字段正确 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24, AC-RULE-26, AC-FN-17, AC-OP-01 |

前置条件：
1. 种子库已初始化

测试步骤：
1. 对 erpRole 依次取 sales / purchase / produce / warehouse / manage / finance，分别 POST /api/auth/role-login

预期结果：
1. 6 次请求均 HTTP 200，code=0
1. 每次 data.user.erpRole 与请求值一致，data.user.role=user
1. token 均非空（erpRole 驱动角色推荐与消息过滤）

---

### API-RLOGIN-003-E01 erpRole 缺失时选角色登录被 400 阻断

| 项目 | 内容 |
|------|------|
| 用例ID | API-RLOGIN-003-E01 |
| 用例描述 | erpRole 缺失时选角色登录被 400 阻断 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 服务正常运行

测试步骤：
1. POST /api/auth/role-login
1. 请求体 {}（缺失 erpRole）

预期结果：
1. HTTP 400，code=400
1. message="erpRole 参数不合法"

---

### API-RLOGIN-004-E02 erpRole 为非枚举值 hr 时被 400 阻断

| 项目 | 内容 |
|------|------|
| 用例ID | API-RLOGIN-004-E02 |
| 用例描述 | erpRole 为非枚举值 hr 时被 400 阻断 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 服务正常运行

测试步骤：
1. POST /api/auth/role-login
1. 请求体 {"erpRole":"hr"}（不在 6 角色枚举内）

预期结果：
1. HTTP 400，code=400
1. message="erpRole 参数不合法"

---

### API-RLOGIN-005-E03 erpRole 为空字符串时被 400 阻断

| 项目 | 内容 |
|------|------|
| 用例ID | API-RLOGIN-005-E03 |
| 用例描述 | erpRole 为空字符串时被 400 阻断 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 服务正常运行

测试步骤：
1. POST /api/auth/role-login
1. 请求体 {"erpRole":""}

预期结果：
1. HTTP 400，code=400
1. message="erpRole 参数不合法"

---

### API-RLOGIN-006-E04 erpRole 类型错误（数字/数组）时被 400 且不引发 500

| 项目 | 内容 |
|------|------|
| 用例ID | API-RLOGIN-006-E04 |
| 用例描述 | erpRole 类型错误（数字/数组）时被 400 且不引发 500 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 服务正常运行

测试步骤：
1. POST /api/auth/role-login
1. 请求体分别 {"erpRole":123} 与 {"erpRole":["sales"]} 各执行一次

预期结果：
1. 两次均 HTTP 400，code=400
1. message="erpRole 参数不合法"，服务不崩溃

---

### API-RLOGIN-007-B01 erpRole 大小写敏感边界（SALES）被按非法枚举处理

| 项目 | 内容 |
|------|------|
| 用例ID | API-RLOGIN-007-B01 |
| 用例描述 | erpRole 大小写敏感边界（SALES）被按非法枚举处理 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 服务正常运行

测试步骤：
1. POST /api/auth/role-login
1. 请求体 {"erpRole":"SALES"}

预期结果：
1. 返回 HTTP 400 "erpRole 参数不合法"（枚举大小写敏感）；若实现做大小写归一则返回 sales 用户（标记待验证）
1. 不返回 500

---

### API-RLOGIN-008 选角色登录的 user token 调管理参数接口被 403 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-RLOGIN-008 |
| 用例描述 | 选角色登录的 user token 调管理参数接口被 403 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24, AC-RULE-25 |

前置条件：
1. 已按 API-RLOGIN-001 取得 {userToken}

测试步骤：
1. GET /api/tutorials?status=draft，Header Authorization: Bearer {userToken}

预期结果：
1. HTTP 403，code=403
1. message="无权限执行该操作"（普通用户权限边界=浏览/搜索/详情/收藏/历史/评价/打卡）

---

### API-RLOGIN-009 同一角色重复登录新 token 生效且旧 token 仍有效

| 项目 | 内容 |
|------|------|
| 用例ID | API-RLOGIN-009 |
| 用例描述 | 同一角色重复登录新 token 生效且旧 token 仍有效 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-26 |

前置条件：
1. 种子库就绪

测试步骤：
1. 两次 POST /api/auth/role-login {"erpRole":"sales"} 取得 tokenA、tokenB
1. 分别用 tokenA、tokenB 调 POST /api/checkins（或已打卡则验证 200 幂等响应）

预期结果：
1. 两次登录均 200
1. tokenA、tokenB 调用用户行为接口均 200（登录态本地保持，多端并存）

---

### API-CAT-LIST-001 无参请求返回仅启用分类的两级树结构

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-001 |
| 用例描述 | 无参请求返回仅启用分类的两级树结构 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-06, AC-FN-01, AC-RULE-17 |

前置条件：
1. 种子库已初始化（12 个启用一级分类）

测试步骤：
1. GET /api/categories（无 Header、无参数，模拟游客）

预期结果：
1. HTTP 200，code=0
1. data.list 为一级分类数组，每个节点 parentId=null
1. children 数组最多一层（本期限两级），所有节点 status=enabled（不出现 disabled）

---

### API-CAT-LIST-002 一级分类共 12 个且构成符合 8 大模块+4 通用分类

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-002 |
| 用例描述 | 一级分类共 12 个且构成符合 8 大模块+4 通用分类 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-01, AC-RULE-17, AC-OP-01 |

前置条件：
1. 种子库按 PRD §7.1 初始化

测试步骤：
1. GET /api/categories
1. 统计 data.list 中 parentId=null 的节点数量与名称

预期结果：
1. 一级分类共 12 个
1. 包含 8 大模块（销售管理/项目管理/文件管理/生产制造/采购管理/库存管理/人事财务/系统设置对应映射）与 新手入门/最佳实践/常见问题/开放平台

---

### API-CAT-LIST-003 withCount=1 返回角标计数且一级汇总含子分类

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-003 |
| 用例描述 | withCount=1 返回角标计数且一级汇总含子分类 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-17, AC-FN-01 |

前置条件：
1. 种子库就绪，存在带子分类且有教程的分类

测试步骤：
1. GET /api/categories?withCount=1

预期结果：
1. HTTP 200，每个分类节点含 tutorialCount 字段
1. 一级分类 tutorialCount = 本分类直接教程数 + 子分类教程数（前台可见口径汇总）
1. 二级分类 tutorialCount = 本分类直接计数
1. 计数仅统计前台可见教程（存在线上过审版本且未下架）

---

### API-CAT-LIST-004 0 篇教程的分类角标计数返回 0（前端显示待补充）

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-004 |
| 用例描述 | 0 篇教程的分类角标计数返回 0（前端显示待补充） |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-17, AC-OP-08 |

前置条件：
1. 存在一个启用且下无前台可见教程的分类（种子或后台预置）

测试步骤：
1. GET /api/categories?withCount=1
1. 定位该分类节点

预期结果：
1. HTTP 200，该节点 tutorialCount=0（前端渲染为"待补充"角标）

---

### API-CAT-LIST-005 同级分类按 sort 字段升序返回

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-005 |
| 用例描述 | 同级分类按 sort 字段升序返回 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-17 |

前置条件：
1. 种子库就绪

测试步骤：
1. GET /api/categories
1. 遍历 data.list 与各 children，校验同级 sort 序列

预期结果：
1. HTTP 200，同级节点按 sort 升序排列（影响前台宫格与列表顺序）

---

### API-CAT-LIST-006 admin 携 all=1 返回含停用分类的全量树

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-006 |
| 用例描述 | admin 携 all=1 返回含停用分类的全量树 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-07, AC-RULE-22 |

前置条件：
1. 已取得 {adminToken}
1. 系统中存在至少 1 个停用分类（后台停用操作，接口不在本批判次）

测试步骤：
1. GET /api/categories?all=1，Header Authorization: Bearer {adminToken}

预期结果：
1. HTTP 200，data.list 含 status=disabled 的分类节点
1. 启用与停用分类均返回（管理全量口径）

---

### API-CAT-LIST-007-E01 all=1 未登录请求被 401 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-007-E01 |
| 用例描述 | all=1 未登录请求被 401 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-06, AC-RULE-22 |

前置条件：
1. 不携带任何 Authorization 头

测试步骤：
1. GET /api/categories?all=1

预期结果：
1. HTTP 401，code=401
1. message="未登录或登录已失效"，不返回任何分类数据

---

### API-CAT-LIST-008-E02 all=1 运营编辑请求被 403 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-008-E02 |
| 用例描述 | all=1 运营编辑请求被 403 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-23 |

前置条件：
1. 已取得 {operatorToken}（operator/123456 登录）

测试步骤：
1. GET /api/categories?all=1，Header Authorization: Bearer {operatorToken}

预期结果：
1. HTTP 403，code=403
1. message="无权限执行该操作"（分类树管理为管理员专属）

---

### API-CAT-LIST-009-E03 all=1 普通用户请求被 403 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-009-E03 |
| 用例描述 | all=1 普通用户请求被 403 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 已取得 {userToken}（role-login purchase）

测试步骤：
1. GET /api/categories?all=1，Header Authorization: Bearer {userToken}

预期结果：
1. HTTP 403，code=403
1. message="无权限执行该操作"

---

### API-CAT-LIST-010-B01 withCount 传非 0/1 值时请求稳定处理

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-010-B01 |
| 用例描述 | withCount 传非 0/1 值时请求稳定处理 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-06 |

前置条件：
1. 服务正常运行

测试步骤：
1. GET /api/categories?withCount=2

预期结果：
1. HTTP 200（按无计数处理或视为 1，行为标记待验证）
1. 不返回 500，树结构正常返回

---

### API-CAT-LIST-011 伪造 token 访问管理参数被 401 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-011 |
| 用例描述 | 伪造 token 访问管理参数被 401 拒绝 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-06 |

前置条件：
1. 构造无效 token "invalid-token-abc"

测试步骤：
1. GET /api/categories?all=1，Header Authorization: Bearer invalid-token-abc

预期结果：
1. HTTP 401，code=401
1. message="未登录或登录已失效"

---

### API-CAT-LIST-012 停用分类不出现在前台分类树

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-012 |
| 用例描述 | 停用分类不出现在前台分类树 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-07, AC-EG-14, AC-OP-09 |

前置条件：
1. 分类 X 已由管理员停用（后台停用操作，接口不在本批判次），X 下存在已发布教程

测试步骤：
1. GET /api/categories（游客无参）
1. GET /api/categories?all=1（{adminToken}）

预期结果：
1. 无参请求：data.list 不含 X（前台宫格与筛选树隐藏）
1. all=1 请求：含 X 且 status=disabled（数据未丢失）

---

### API-CAT-LIST-013 erpModule 模块映射字段值域校验

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-LIST-013 |
| 用例描述 | erpModule 模块映射字段值域校验 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-16, AC-OP-04 |

前置条件：
1. 种子库就绪（8 大模块分类有映射，通用分类无映射）

测试步骤：
1. GET /api/categories
1. 遍历所有节点的 erpModule 字段

预期结果：
1. HTTP 200
1. erpModule 取值 ∈ {sales, project, file, produce, purchase, inventory, hrFinance, system, null}
1. 模块映射正确驱动角色推荐命中集（如采购角色映射采购管理+库存管理）

---

### API-TUT-LIST-001 游客默认请求返回前台可见池教程列表与分页元数据

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-001 |
| 用例描述 | 游客默认请求返回前台可见池教程列表与分页元数据 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-01, AC-RULE-03, AC-RULE-25 |

前置条件：
1. 种子库就绪，存在多篇已发布教程

测试步骤：
1. GET /api/tutorials（无 Header、无参数）

预期结果：
1. HTTP 200，code=0，data.list 非空
1. data.page=1，data.pageSize=10，data.total≥1
1. list 中每条含 id/title/summary/tags/categoryId/categoryName/isTop/sort/viewCount/favCount/helpfulYes/helpfulNo/shareCount/publishedAt/updatedAt 字段
1. 结果全部属于前台可见池（无纯草稿/首次待审核/已下架教程）

---

### API-TUT-LIST-002 分页翻页结果无重叠且 total 一致

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-002 |
| 用例描述 | 分页翻页结果无重叠且 total 一致 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-01 |

前置条件：
1. 种子库中前台可见教程 ≥6 篇

测试步骤：
1. GET /api/tutorials?page=1&pageSize=5
1. GET /api/tutorials?page=2&pageSize=5

预期结果：
1. 两次均 HTTP 200
1. 两页 list 的 id 集合无交集，合计 ≤ total
1. 两次 data.total 相等，page/pageSize 正确回显

---

### API-TUT-LIST-003-B01 pageSize=100 上边界请求正常返回

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-003-B01 |
| 用例描述 | pageSize=100 上边界请求正常返回 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-01 |

前置条件：
1. 种子库就绪

测试步骤：
1. GET /api/tutorials?page=1&pageSize=100

预期结果：
1. HTTP 200，code=0
1. data.pageSize=100，list 条数 ≤100（超出总数时为实际总数）

---

### API-TUT-LIST-004-E01 pageSize=101 超上限被 400 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-004-E01 |
| 用例描述 | pageSize=101 超上限被 400 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-01 |

前置条件：
1. 服务正常运行

测试步骤：
1. GET /api/tutorials?page=1&pageSize=101

预期结果：
1. HTTP 400，code=400
1. message="查询参数不合法"（约束 1-100）

---

### API-TUT-LIST-005-E02 pageSize=0 下越界被 400 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-005-E02 |
| 用例描述 | pageSize=0 下越界被 400 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-01 |

前置条件：
1. 服务正常运行

测试步骤：
1. GET /api/tutorials?page=1&pageSize=0

预期结果：
1. HTTP 400，code=400
1. message="查询参数不合法"

---

### API-TUT-LIST-006-E03 page=0 下越界被 400 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-006-E03 |
| 用例描述 | page=0 下越界被 400 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-01 |

前置条件：
1. 服务正常运行

测试步骤：
1. GET /api/tutorials?page=0&pageSize=10

预期结果：
1. HTTP 400，code=400
1. message="查询参数不合法"（约束 page≥1）

---

### API-TUT-LIST-007-E04 page=-1 负数被 400 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-007-E04 |
| 用例描述 | page=-1 负数被 400 拒绝 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-01 |

前置条件：
1. 服务正常运行

测试步骤：
1. GET /api/tutorials?page=-1&pageSize=10

预期结果：
1. HTTP 400，code=400
1. message="查询参数不合法"

---

### API-TUT-LIST-008-B02 page 超最大页返回空列表且 total 不变

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-008-B02 |
| 用例描述 | page 超最大页返回空列表且 total 不变 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-01 |

前置条件：
1. 已知 data.total（先 GET /api/tutorials 采集）

测试步骤：
1. GET /api/tutorials?page=9999&pageSize=10

预期结果：
1. HTTP 200，code=0
1. data.list=[]，data.total 与第一页一致

---

### API-TUT-LIST-009 关键词命中标题字段返回匹配教程

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-009 |
| 用例描述 | 关键词命中标题字段返回匹配教程 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-02, AC-FN-24 |

前置条件：
1. 种子库存在标题含 MRP 的已发布教程

测试步骤：
1. GET /api/tutorials?keyword=MRP&page=1&pageSize=10

预期结果：
1. HTTP 200，total≥1
1. list 中每条 title 含关键词 MRP（或摘要/标签命中）
1. 响应耗时 <1000ms

---

### API-TUT-LIST-010 关键词命中摘要字段返回匹配教程

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-010 |
| 用例描述 | 关键词命中摘要字段返回匹配教程 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-02 |

前置条件：
1. 种子库存在摘要含特定词（如 运算）但标题不含的已发布教程

测试步骤：
1. GET /api/tutorials?keyword=运算

预期结果：
1. HTTP 200，返回的教程 summary 含关键词
1. 标题不含该关键词的教程也可因摘要命中而返回

---

### API-TUT-LIST-011 关键词命中标签字段返回匹配教程

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-011 |
| 用例描述 | 关键词命中标签字段返回匹配教程 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-02 |

前置条件：
1. 种子库存在标签含 BOM 的已发布教程

测试步骤：
1. GET /api/tutorials?keyword=BOM

预期结果：
1. HTTP 200，返回教程的 tags 数组含 BOM

---

### API-TUT-LIST-012 PRD 验收关键词"算料"搜索 1 秒内返回

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-012 |
| 用例描述 | PRD 验收关键词"算料"搜索 1 秒内返回 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-02, AC-FN-24 |

前置条件：
1. 种子库就绪（含标题/摘要/标签带"算料"的教程）

测试步骤：
1. GET /api/tutorials?keyword=算料
1. 记录响应耗时

预期结果：
1. HTTP 200，code=0
1. 响应耗时 <1000ms（AC-NF-01 P95<1s 的单次抽样）
1. 命中结果均含该关键词于标题/摘要/标签任一字段

---

### API-TUT-LIST-013 关键词无结果返回空列表与 total=0

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-013 |
| 用例描述 | 关键词无结果返回空列表与 total=0 |
| 优先级 | P0 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-02, AC-EG-12 |

前置条件：
1. 种子库就绪

测试步骤：
1. GET /api/tutorials?keyword=绝不存在的关键词xyzq99

预期结果：
1. HTTP 200，code=0
1. data.list=[]，data.total=0（前端据此渲染空态引导，页面不报错不白屏）

---

### API-TUT-LIST-014-B03 超长关键词（1000 字）请求不引发 500

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-014-B03 |
| 用例描述 | 超长关键词（1000 字）请求不引发 500 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-02 |

前置条件：
1. 服务正常运行

测试步骤：
1. GET /api/tutorials?keyword={1000 个汉字拼接}

预期结果：
1. HTTP 200 返回空结果或 HTTP 400 参数不合法（二者其一）
1. 不返回 500，服务稳定

---

### API-TUT-LIST-015 关键词含 SQL 通配符与特殊字符不引发异常

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-015 |
| 用例描述 | 关键词含 SQL 通配符与特殊字符不引发异常 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-02 |

前置条件：
1. 服务正常运行

测试步骤：
1. GET /api/tutorials?keyword=%'_;--（URL 编码后发送）

预期结果：
1. HTTP 200 或 400（按普通字符处理或参数拒绝）
1. 不返回 500、不返回数据库错误信息（防注入健壮性）

---

### API-TUT-LIST-016 categoryId 筛选命中该分类及其子分类

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-016 |
| 用例描述 | categoryId 筛选命中该分类及其子分类 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-01, AC-FN-24, AC-RULE-06 |

前置条件：
1. 分类 A(id=1) 下有子分类 A1，A 与 A1 下均有前台可见教程

测试步骤：
1. GET /api/tutorials?categoryId=1

预期结果：
1. HTTP 200，返回教程的 categoryId ∈ {1, A1 的 id}
1. 不返回其他分类教程

---

### API-TUT-LIST-017 tag 单值精确筛选返回含该标签的教程

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-017 |
| 用例描述 | tag 单值精确筛选返回含该标签的教程 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-02 |

前置条件：
1. 种子库存在带 MRP 标签的教程

测试步骤：
1. GET /api/tutorials?tag=MRP

预期结果：
1. HTTP 200，返回教程的 tags 均含 MRP

---

### API-TUT-LIST-018 tag 逗号分隔多值按交集过滤

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-018 |
| 用例描述 | tag 逗号分隔多值按交集过滤 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-02 |

前置条件：
1. 存在同时含 MRP 与 BOM 标签的教程，也存在仅含 MRP 的教程

测试步骤：
1. GET /api/tutorials?tag=MRP,BOM

预期结果：
1. HTTP 200
1. 返回教程的 tags 同时包含 MRP 与 BOM（交集语义）
1. 仅含 MRP 单标签的教程不返回

---

### API-TUT-LIST-019 tag 无命中返回空列表

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-019 |
| 用例描述 | tag 无命中返回空列表 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-02 |

前置条件：
1. 种子库就绪

测试步骤：
1. GET /api/tutorials?tag=不存在的标签xyz

预期结果：
1. HTTP 200，data.list=[]，data.total=0

---

### API-TUT-LIST-020 sort=latest 按置顶优先→排序值→更新时间倒序返回

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-020 |
| 用例描述 | sort=latest 按置顶优先→排序值→更新时间倒序返回 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-17, AC-FN-22 |

前置条件：
1. 种子库含置顶与非置顶教程

测试步骤：
1. GET /api/tutorials?sort=latest&pageSize=6

预期结果：
1. HTTP 200
1. 排序为 isTop DESC → sort ASC → updatedAt DESC（最近更新区块口径）
1. 结果均属前台可见池

---

### API-TUT-LIST-021 sort=hot 按置顶优先→浏览量倒序返回

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-021 |
| 用例描述 | sort=hot 按置顶优先→浏览量倒序返回 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-17, AC-FN-22 |

前置条件：
1. 种子库含不同浏览量的已发布教程

测试步骤：
1. GET /api/tutorials?sort=hot&pageSize=6

预期结果：
1. HTTP 200
1. 排序为 isTop DESC → viewCount DESC（热门教程区块口径）
1. 非置顶部分 viewCount 单调不增

---

### API-TUT-LIST-022-E05 sort 传非法值时请求稳定处理

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-022-E05 |
| 用例描述 | sort 传非法值时请求稳定处理 |
| 优先级 | P2 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-17 |

前置条件：
1. 服务正常运行

测试步骤：
1. GET /api/tutorials?sort=unknown

预期结果：
1. HTTP 400 "查询参数不合法" 或 200 回退默认 latest（标记待验证）
1. 不返回 500

---

### API-TUT-LIST-023 top=1 仅返回置顶教程

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-023 |
| 用例描述 | top=1 仅返回置顶教程 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-17 |

前置条件：
1. 种子库存在 isTop=1 的教程

测试步骤：
1. GET /api/tutorials?top=1

预期结果：
1. HTTP 200，list 中每条 isTop=1
1. 非置顶教程不返回

---

### API-TUT-LIST-024 默认排序综合断言：置顶最前→sort 升序→更新时间倒序

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-024 |
| 用例描述 | 默认排序综合断言：置顶最前→sort 升序→更新时间倒序 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-17, AC-FN-22 |

前置条件：
1. 种子库含置顶+非置顶、sort 值不同、更新时间不同的教程

测试步骤：
1. GET /api/tutorials?pageSize=20（不传 sort）
1. 遍历 list 校验排序序列

预期结果：
1. HTTP 200
1. 所有 isTop=1 的条目排在 isTop=0 之前
1. 同置顶级别内按 sort 升序，sort 相同时按 updatedAt 倒序

---

### API-TUT-LIST-025 admin all=1 返回全状态列表与扩展管理字段

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-025 |
| 用例描述 | admin all=1 返回全状态列表与扩展管理字段 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22, AC-RULE-23 |

前置条件：
1. 已取得 {adminToken}
1. 系统内存在草稿/待审核/已发布/已下架四态教程（种子或流程预置）

测试步骤：
1. GET /api/tutorials?all=1，Header Authorization: Bearer {adminToken}

预期结果：
1. HTTP 200，返回教程覆盖四态（status ∈ draft/pending/published/offline）
1. 每条含扩展字段：status、rejectReason、submitCount、authorId、authorName、hasOnlineVersion、lastOfflineAt、createdAt
1. 草稿且被驳回过的教程 rejectReason 非空

---

### API-TUT-LIST-026 operator status=draft 筛选返回草稿列表（运营可用管理参数）

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-026 |
| 用例描述 | operator status=draft 筛选返回草稿列表（运营可用管理参数） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-23, AC-OP-05 |

前置条件：
1. 已取得 {operatorToken}
1. 存在草稿教程

测试步骤：
1. GET /api/tutorials?status=draft，Header Authorization: Bearer {operatorToken}

预期结果：
1. HTTP 200，list 每条 status=draft
1. operator 可访问管理口径（看板只读+内容管理范围）

---

### API-TUT-LIST-027-E06 status 管理参数未登录被 401 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-027-E06 |
| 用例描述 | status 管理参数未登录被 401 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-06, AC-RULE-22 |

前置条件：
1. 不携带 Authorization 头

测试步骤：
1. GET /api/tutorials?status=pending

预期结果：
1. HTTP 401，code=401
1. message="未登录或登录已失效"，不返回任何管理数据

---

### API-TUT-LIST-028-E07 status 管理参数普通用户被 403 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-028-E07 |
| 用例描述 | status 管理参数普通用户被 403 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 已取得 {userToken}

测试步骤：
1. GET /api/tutorials?all=1，Header Authorization: Bearer {userToken}

预期结果：
1. HTTP 403，code=403
1. message="无权限执行该操作"

---

### API-TUT-LIST-029-E08 status 传非枚举值被 400 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-029-E08 |
| 用例描述 | status 传非枚举值被 400 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 已取得 {adminToken}

测试步骤：
1. GET /api/tutorials?status=xyz，Header Authorization: Bearer {adminToken}

预期结果：
1. HTTP 400，code=400
1. message="查询参数不合法"（枚举 draft/pending/published/offline）

---

### API-TUT-LIST-030 all=1 与 status 同时传时以 status 为准

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-030 |
| 用例描述 | all=1 与 status 同时传时以 status 为准 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 已取得 {adminToken}
1. 系统存在非 pending 状态教程

测试步骤：
1. GET /api/tutorials?all=1&status=pending，Header Authorization: Bearer {adminToken}

预期结果：
1. HTTP 200，list 每条 status=pending（等价于仅按 status 过滤）
1. 不返回 draft/published/offline 状态教程（互斥以 status 为准）

---

### API-TUT-LIST-031 首次提审的教程在前台列表与搜索均不可见

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-031 |
| 用例描述 | 首次提审的教程在前台列表与搜索均不可见 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-02, AC-FN-07 |

前置条件：
1. 教程 T 从未通过审核（无线上过审版本），已由运营提审，当前 status=pending（提审接口不在本批判次，后台预置）
1. T 的标题含独有关键词 K1

测试步骤：
1. GET /api/tutorials（无参）
1. GET /api/tutorials?keyword=K1

预期结果：
1. 两次均 HTTP 200
1. 无参列表不含 T 的 id
1. keyword=K1 结果 total=0（首次待审核在前台/搜索均不可见）

---

### API-TUT-LIST-032 已发布教程编辑回审期间列表仍返回且摘要为旧版快照

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-032 |
| 用例描述 | 已发布教程编辑回审期间列表仍返回且摘要为旧版快照 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-02, AC-FN-10, AC-RULE-03 |

前置条件：
1. 教程 T 已发布（线上版 v1，summary=S1），运营编辑保存后 status=pending（回审，接口不在本批判次）
1. 编辑态摘要已改为 S2

测试步骤：
1. GET /api/tutorials?keyword={T 标题关键词}

预期结果：
1. HTTP 200，结果含 T（回审期间旧版在线计入前台可见池）
1. T 的 summary=S1（公开口径读 published_summary 快照，非编辑值 S2）

---

### API-TUT-LIST-033 回审版被驳回后列表与搜索持续命中旧版

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-033 |
| 用例描述 | 回审版被驳回后列表与搜索持续命中旧版 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-19, AC-EG-15 |

前置条件：
1. 承接 API-TUT-LIST-032 场景：T 处于回审 pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"reject","reason":"内容需要补充截图说明"}
1. GET /api/tutorials?keyword={T 标题关键词}

预期结果：
1. 第一步返回 HTTP 200，status=draft（编辑版回草稿）
1. 第二步 HTTP 200 仍返回 T，summary=S1（旧版不断供，列表与搜索持续可命中）

---

### API-TUT-LIST-034 下架后前台列表与关键词搜索均不返回该教程

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-034 |
| 用例描述 | 下架后前台列表与关键词搜索均不返回该教程 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-04, AC-OP-03, AC-FN-20 |

前置条件：
1. 教程 T 状态=published 且前台可见
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {adminToken}，请求体 {}
1. GET /api/tutorials（无参）
1. GET /api/tutorials?keyword={T 标题关键词}

预期结果：
1. 下架返回 HTTP 200，status=offline
1. 两次 GET 均不含 T（三端下一请求即不返回，已下架不进前台可见池）

---

### API-TUT-LIST-035 停用分类下教程不被关键词搜索命中

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-035 |
| 用例描述 | 停用分类下教程不被关键词搜索命中 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-07, AC-EG-14 |

前置条件：
1. 分类 X 已停用，X 下存在已发布教程 T（标题含独有关键词 K2）

测试步骤：
1. GET /api/tutorials?keyword=K2
1. GET /api/tutorials?categoryId={X}

预期结果：
1. keyword=K2 返回 total=0（检索范围排除停用分类内容）
1. categoryId 筛选不返回 T（前台列表池与搜索同口径）

---

### API-TUT-LIST-036 审核通过后前台列表下一次请求即返回该教程

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-036 |
| 用例描述 | 审核通过后前台列表下一次请求即返回该教程 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-08 |

前置条件：
1. 教程 T 为首次待审核状态
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"approve"}
1. 立即 GET /api/tutorials?keyword={T 标题关键词}（不重启服务、不重新登录）

预期结果：
1. 审核返回 HTTP 200，status=published
1. 列表请求立即返回 T（total≥1，无需重启服务、无需重新登录）

---

### API-TUT-LIST-037 重新发布后前台列表下一次请求即恢复可见

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-037 |
| 用例描述 | 重新发布后前台列表下一次请求即恢复可见 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-11 |

前置条件：
1. 教程 T 状态=offline
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/republish，Authorization: Bearer {adminToken}，请求体 {}
1. 立即 GET /api/tutorials?keyword={T 标题关键词}

预期结果：
1. 重发布返回 HTTP 200，status=published
1. 列表请求立即返回 T（即时恢复可见）

---

### API-TUT-LIST-038 收藏动作后列表收藏计数联动一致

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-038 |
| 用例描述 | 收藏动作后列表收藏计数联动一致 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-09, AC-FN-15 |

前置条件：
1. 教程 T 已发布，收藏前 GET /api/tutorials 采集 favCount=F0
1. 已取得 {userToken}

测试步骤：
1. POST /api/favorites/{T}，Authorization: Bearer {userToken}，请求体 {}
1. GET /api/tutorials?keyword={T 标题关键词} 读取 T 的 favCount

预期结果：
1. 收藏返回 HTTP 200，data.favCount=F0+1
1. 列表中 T 的 favCount 与收藏接口回传值一致（当前有效收藏数口径）

---

### API-TUT-LIST-039 游客与登录普通用户前台列表口径一致

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-039 |
| 用例描述 | 游客与登录普通用户前台列表口径一致 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-25, AC-FN-22 |

前置条件：
1. 已取得 {userToken}

测试步骤：
1. GET /api/tutorials?pageSize=50（无 Header）
1. GET /api/tutorials?pageSize=50，Authorization: Bearer {userToken}

预期结果：
1. 两次均 HTTP 200
1. 两次 data.total 相等且 list 的 id 集合一致（游客与普通用户共用前台口径，个性化数据不进列表）

---

### API-TUT-LIST-040-B04 关键词前后带空格时的命中行为稳定

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-LIST-040-B04 |
| 用例描述 | 关键词前后带空格时的命中行为稳定 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-02 |

前置条件：
1. 种子库存在标题含 MRP 的教程

测试步骤：
1. GET /api/tutorials?keyword=%20MRP%20（前后各一空格）

预期结果：
1. HTTP 200：trim 后命中（total≥1）或按原样不命中（total=0），行为标记待验证
1. 不返回 500

---

### API-TUT-DETAIL-001 已发布教程详情返回完整字段与线上过审版快照

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-001 |
| 用例描述 | 已发布教程详情返回完整字段与线上过审版快照 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-01, AC-RULE-03 |

前置条件：
1. 教程 T 状态=published，存在线上过审版本

测试步骤：
1. GET /api/tutorials/{T}（无登录 Header，模拟游客）

预期结果：
1. HTTP 200，code=0
1. data 含 title/summary/content/videoUrl/tags/categoryId/categoryName/isTop/sort/viewCount/favCount/helpfulYes/helpfulNo/shareCount/publishedAt/updatedAt/prev/next/related 字段
1. content 非空（读 published_content 快照列）

---

### API-TUT-DETAIL-002 每次成功打开详情浏览量 +1 且不去重

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-002 |
| 用例描述 | 每次成功打开详情浏览量 +1 且不去重 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-08 |

前置条件：
1. 教程 T 已发布

测试步骤：
1. GET /api/tutorials/{T} 记录返回的 viewCount=V1
1. 再次 GET /api/tutorials/{T} 记录 viewCount=V2

预期结果：
1. 两次均 HTTP 200
1. V2=V1+1（返回值已含本次浏览，同一用户重复打开也计数）

---

### API-TUT-DETAIL-003 游客打开详情同样计入浏览量

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-003 |
| 用例描述 | 游客打开详情同样计入浏览量 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-08, AC-RULE-25 |

前置条件：
1. 教程 T 已发布

测试步骤：
1. GET /api/tutorials/{T}（无 Authorization）记录 viewCount=V1
1. GET /api/tutorials/{T}（无 Authorization）记录 viewCount=V2

预期结果：
1. 两次均 HTTP 200
1. V2=V1+1（含游客打开，不去重）

---

### API-TUT-DETAIL-004 未登录请求 my 个性化字段均为 null

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-004 |
| 用例描述 | 未登录请求 my 个性化字段均为 null |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-25 |

前置条件：
1. 教程 T 已发布

测试步骤：
1. GET /api/tutorials/{T}（无 Authorization）

预期结果：
1. HTTP 200
1. data.myFavorite=null，data.myFeedback=null，data.myProgress=null

---

### API-TUT-DETAIL-005 登录用户详情返回收藏/评价/进度个性化字段

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-005 |
| 用例描述 | 登录用户详情返回收藏/评价/进度个性化字段 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-04, AC-FN-25, AC-RULE-11, AC-RULE-15 |

前置条件：
1. 用户 U 已登录（{userToken}）
1. U 已收藏教程 T、已评价"有帮助"（myFeedback 应为 1）、阅读进度 60%（收藏/评价/进度写入接口不在本批判次，经前端行为或种子预置）

测试步骤：
1. GET /api/tutorials/{T}，Authorization: Bearer {userToken}

预期结果：
1. HTTP 200
1. data.myFavorite=true
1. data.myFeedback=1（1=有帮助，与小程序共用同一条评价记录）
1. data.myProgress=60（0-100 整数，跨端取最新值）

---

### API-TUT-DETAIL-006 prev/next 为同分类相邻可见教程且边界为 null

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-006 |
| 用例描述 | prev/next 为同分类相邻可见教程且边界为 null |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-03 |

前置条件：
1. 分类 C 下有多篇前台可见教程，已知按 isTop DESC→sort ASC→updatedAt DESC 的排列顺序

测试步骤：
1. GET /api/tutorials/{首篇id} 读取 prev
1. GET /api/tutorials/{中间篇id} 读取 prev 与 next
1. GET /api/tutorials/{末篇id} 读取 next

预期结果：
1. 三次均 HTTP 200
1. 中间篇 prev/next 指向排列中的相邻教程（同分类）
1. 首篇 prev=null 或末篇 next=null（无相邻时为 null，前端按钮置灰）

---

### API-TUT-DETAIL-007 related 为同分类可见教程 4 篇排除本篇按浏览量倒序

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-007 |
| 用例描述 | related 为同分类可见教程 4 篇排除本篇按浏览量倒序 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-20, AC-RULE-03 |

前置条件：
1. 分类 C 下除 T 外存在 ≥4 篇前台可见教程

测试步骤：
1. GET /api/tutorials/{T}

预期结果：
1. HTTP 200
1. data.related 长度=4（不足 4 篇时为实际数量）
1. related 不含 T 的 id，全部属于 T 的同分类且前台可见，按 viewCount 倒序

---

### API-TUT-DETAIL-008-E01 不存在的教程 id 返回 404 通用文案

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-008-E01 |
| 用例描述 | 不存在的教程 id 返回 404 通用文案 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-02 |

前置条件：
1. id=999999 的教程不存在

测试步骤：
1. GET /api/tutorials/999999

预期结果：
1. HTTP 404，code=404
1. message="该教程不存在或暂不可见"

---

### API-TUT-DETAIL-009-E02 纯草稿教程直达详情返回 404 不可见

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-009-E02 |
| 用例描述 | 纯草稿教程直达详情返回 404 不可见 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-01, AC-RULE-02 |

前置条件：
1. 教程 T 为纯草稿（从未提审或被驳回且无线上过审版本），仅作者后台可见

测试步骤：
1. GET /api/tutorials/{T}（分别以无 Header、{adminToken}、{userToken} 三种身份请求）

预期结果：
1. 三次均 HTTP 404，code=404
1. message="该教程不存在或暂不可见"（公开口径对任何身份都不放开草稿）

---

### API-TUT-DETAIL-010-E03 首次待审核教程直达详情返回 404 不可见

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-010-E03 |
| 用例描述 | 首次待审核教程直达详情返回 404 不可见 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-02, AC-FN-07 |

前置条件：
1. 教程 T 无线上过审版本且 status=pending

测试步骤：
1. GET /api/tutorials/{T}

预期结果：
1. HTTP 404，code=404
1. message="该教程不存在或暂不可见"（AC-RULE-02 兜底定义的直达表现）

---

### API-TUT-DETAIL-011-E04 已下架教程直达详情返回 404 并附同类推荐数据

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-011-E04 |
| 用例描述 | 已下架教程直达详情返回 404 并附同类推荐数据 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-20, AC-EG-10, AC-RULE-04 |

前置条件：
1. 教程 T 存在线上过审版本但已被下架（status=offline）
1. T 的同分类下存在其他已发布教程

测试步骤：
1. GET /api/tutorials/{T}

预期结果：
1. HTTP 404，code=404，message="该教程已下架"
1. data.reason=offline
1. data.related 为同分类可见教程推荐（正文 content 不可见）

---

### API-TUT-DETAIL-012-B01 id 为非数字字符串时请求稳定处理

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-012-B01 |
| 用例描述 | id 为非数字字符串时请求稳定处理 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-02 |

前置条件：
1. 服务正常运行

测试步骤：
1. GET /api/tutorials/abc

预期结果：
1. HTTP 404 或 400（按路由/参数解析规则）
1. 不返回 500

---

### API-TUT-DETAIL-013-B02 id 为 0 或负数时返回 404

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-013-B02 |
| 用例描述 | id 为 0 或负数时返回 404 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-02 |

前置条件：
1. 服务正常运行

测试步骤：
1. GET /api/tutorials/0 与 GET /api/tutorials/-1 各执行一次

预期结果：
1. 两次均 HTTP 404
1. message="该教程不存在或暂不可见"或等价 404 文案

---

### API-TUT-DETAIL-014 回审等待期间详情展示旧版 v1 快照

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-014 |
| 用例描述 | 回审等待期间详情展示旧版 v1 快照 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-10, AC-RULE-02 |

前置条件：
1. 教程 T 已发布（线上 v1，content=C1），运营编辑保存 v2 后 status=pending（编辑保存接口不在本批判次）

测试步骤：
1. GET /api/tutorials/{T}

预期结果：
1. HTTP 200（回审期间旧版在线不断供）
1. data.content=C1（published_content 快照，非编辑值 C2）

---

### API-TUT-DETAIL-015 回审版被驳回后详情仍 200 展示旧版 v1

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-015 |
| 用例描述 | 回审版被驳回后详情仍 200 展示旧版 v1 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-19, AC-EG-15 |

前置条件：
1. 承接 API-TUT-DETAIL-014 场景（T 回审 pending）
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"reject","reason":"正文步骤缺少截图说明"}
1. GET /api/tutorials/{T}

预期结果：
1. 驳回返回 HTTP 200，status=draft（仅编辑版回草稿）
1. 详情仍 HTTP 200 且 content=C1（前台持续展示线上过审版本，正文内容不变）

---

### API-TUT-DETAIL-016-E05 已下架来源的回审教程详情维持 404 不可见

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-016-E05 |
| 用例描述 | 已下架来源的回审教程详情维持 404 不可见 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-18, AC-RULE-05 |

前置条件：
1. 教程 T 曾发布后下架（status=offline），运营编辑保存后 status=pending（已下架→待审核迁移，编辑接口不在本批判次）

测试步骤：
1. GET /api/tutorials/{T}

预期结果：
1. HTTP 404
1. message="该教程已下架"或"该教程不存在或暂不可见"（回审来源为已下架态，维持不可见，防止下架被编辑动作意外解除）

---

### API-TUT-DETAIL-017-E06 已下架来源回审版被驳回后详情仍 404

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-017-E06 |
| 用例描述 | 已下架来源回审版被驳回后详情仍 404 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-18, AC-RULE-02 |

前置条件：
1. 承接 API-TUT-DETAIL-016 场景（T 已下架来源回审 pending）
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"reject","reason":"内容仍需补充完善"}
1. GET /api/tutorials/{T}

预期结果：
1. 驳回返回 HTTP 200，status=draft
1. 详情仍 HTTP 404（回审版驳回回落草稿但来源为已下架态，需重新提审并再次通过才恢复可见）

---

### API-TUT-DETAIL-018 停用分类下已发布教程经直达链接仍可访问

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-018 |
| 用例描述 | 停用分类下已发布教程经直达链接仍可访问 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-07, AC-EG-14 |

前置条件：
1. 分类 X 已停用，X 下教程 T 为已发布状态

测试步骤：
1. GET /api/tutorials/{T}

预期结果：
1. HTTP 200（停用分类仅隐藏导航与搜索入口，其下已发布教程仍可经收藏/历史/直达链接访问正文）
1. content 正常返回

---

### API-TUT-DETAIL-019 all=1 管理口径返回当前编辑值且不计浏览量

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-019 |
| 用例描述 | all=1 管理口径返回当前编辑值且不计浏览量 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22, AC-FN-10 |

前置条件：
1. 教程 T 处于回审 pending（编辑值 v2=C2，线上快照 v1=C1）
1. 已取得 {adminToken}

测试步骤：
1. GET /api/tutorials/{T}?all=1，Authorization: Bearer {adminToken}，连续两次请求记录 viewCount

预期结果：
1. HTTP 200
1. data.content=C2（读 content/summary 工作列当前编辑值，非快照 C1）
1. 两次 viewCount 相同（管理口径不计浏览量）
1. data.prev=null 且 data.next=null

---

### API-TUT-DETAIL-020 operator 使用 all=1 管理口径查看编辑值

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-020 |
| 用例描述 | operator 使用 all=1 管理口径查看编辑值 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-23 |

前置条件：
1. 教程 T 为草稿（含编辑内容）
1. 已取得 {operatorToken}

测试步骤：
1. GET /api/tutorials/{T}?all=1，Authorization: Bearer {operatorToken}

预期结果：
1. HTTP 200，返回草稿当前编辑值 content
1. 运营编辑可用管理口径取数（后台编辑器/审核卡片数据源）

---

### API-TUT-DETAIL-021-E07 all=1 未登录请求被 401 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-021-E07 |
| 用例描述 | all=1 未登录请求被 401 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-06 |

前置条件：
1. 不携带 Authorization 头

测试步骤：
1. GET /api/tutorials/{已发布教程id}?all=1

预期结果：
1. HTTP 401，code=401
1. message="未登录或登录已失效"（all=1 为管理口径参数，需登录）

---

### API-TUT-DETAIL-022-E08 all=1 普通用户请求被 403 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-022-E08 |
| 用例描述 | all=1 普通用户请求被 403 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 已取得 {userToken}

测试步骤：
1. GET /api/tutorials/{已发布教程id}?all=1，Authorization: Bearer {userToken}

预期结果：
1. HTTP 403，code=403
1. message="无权限执行该操作"

---

### API-TUT-DETAIL-023 重新发布后详情恢复 200 且不再返回已下架提示

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-023 |
| 用例描述 | 重新发布后详情恢复 200 且不再返回已下架提示 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-11, AC-RULE-04 |

前置条件：
1. 教程 T 状态=offline
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/republish，Authorization: Bearer {adminToken}，请求体 {}
1. GET /api/tutorials/{T}

预期结果：
1. 重发布返回 HTTP 200，status=published
1. 详情返回 HTTP 200，content 为线上过审版本（不再 404）

---

### API-TUT-DETAIL-024 审核通过后详情展示新版快照（首次发布=编辑值）

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-024 |
| 用例描述 | 审核通过后详情展示新版快照（首次发布=编辑值） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-08, AC-RULE-02 |

前置条件：
1. 教程 T 首次待审核，编辑 content=C2
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"approve"}
1. GET /api/tutorials/{T}

预期结果：
1. 审核返回 HTTP 200（content/summary 拷贝至 published_* 快照列）
1. 详情 HTTP 200，data.content=C2（公开口径与快照一致）

---

### API-TUT-DETAIL-025 复制生成的副本直达详情返回 404

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-025 |
| 用例描述 | 复制生成的副本直达详情返回 404 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-01, AC-RULE-14, AC-FN-12 |

前置条件：
1. 已取得 {operatorToken}
1. 源教程 T 存在

测试步骤：
1. POST /api/tutorials/{T}/copy，Authorization: Bearer {operatorToken}，请求体 {}，记录新 id N
1. GET /api/tutorials/{N}

预期结果：
1. 复制返回 HTTP 200，data.status=draft（无 published_content 快照）
1. 详情返回 HTTP 404，message="该教程不存在或暂不可见"（纯草稿不可见）

---

### API-TUT-DETAIL-026 视频外链字段按契约返回 mp4 直链或 null

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-026 |
| 用例描述 | 视频外链字段按契约返回 mp4 直链或 null |
| 优先级 | P2 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-02 |

前置条件：
1. 种子库存在带 videoUrl 与不带 videoUrl 的已发布教程各一篇

测试步骤：
1. GET /api/tutorials/{带视频教程id} 与 GET /api/tutorials/{无视频教程id} 各一次

预期结果：
1. 两次均 HTTP 200
1. 前者 data.videoUrl 为 mp4 直链字符串（失效时前端渲染占位图与"视频暂不可用，可先阅读图文步骤"提示）
1. 后者 data.videoUrl=null

---

### API-TUT-DETAIL-027 有帮助/没帮助计数字段返回（有帮助率数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-TUT-DETAIL-027 |
| 用例描述 | 有帮助/没帮助计数字段返回（有帮助率数据源） |
| 优先级 | P2 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-10 |

前置条件：
1. 教程 T 已产生评价数据（helpfulYes=Y，helpfulNo=N）

测试步骤：
1. GET /api/tutorials/{T}

预期结果：
1. HTTP 200
1. data.helpfulYes=Y，data.helpfulNo=N（有帮助率=Y÷(Y+N)、没帮助占比=N÷(Y+N) 的原始数据源，两项互补）

---

### API-REVIEW-001 管理员通过待审核教程：状态变已发布并留痕审核人与时间

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-001 |
| 用例描述 | 管理员通过待审核教程：状态变已发布并留痕审核人与时间 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-08, AC-RULE-05, AC-RULE-22 |

前置条件：
1. 教程 T status=pending（首次或回审）
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"approve"}

预期结果：
1. HTTP 200，code=0
1. data.status=published
1. data.publishedAt 与 data.reviewedAt 为合法时间字符串，data.reviewerId=admin 用户 id（审核留痕）

---

### API-REVIEW-002 通过后前台列表与详情下一次请求即返回该教程

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-002 |
| 用例描述 | 通过后前台列表与详情下一次请求即返回该教程 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-08 |

前置条件：
1. 教程 T 为首次待审核（此前前台不可见）
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"approve"}
1. GET /api/tutorials?keyword={T 标题关键词}
1. GET /api/tutorials/{T}

预期结果：
1. 审核 HTTP 200 status=published
1. 列表请求返回 T（无需重启服务、无需重新登录）
1. 详情请求 HTTP 200

---

### API-REVIEW-003 驳回待审核教程（原因 ≥5 字）：回草稿并返回原因原文

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-003 |
| 用例描述 | 驳回待审核教程（原因 ≥5 字）：回草稿并返回原因原文 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-09, AC-RULE-19, AC-RULE-05 |

前置条件：
1. 教程 T status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"reject","reason":"正文步骤缺少截图说明，请补充后重提"}

预期结果：
1. HTTP 200，code=0
1. data.status=draft（待审核→草稿）
1. data.rejectReason 与请求 reason 完全一致（展示在编辑页顶部）

---

### API-REVIEW-004 驳回后管理列表回显驳回原因与草稿状态

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-004 |
| 用例描述 | 驳回后管理列表回显驳回原因与草稿状态 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-09, AC-RULE-19 |

前置条件：
1. 承接 API-REVIEW-003（T 已被驳回）
1. 已取得 {adminToken}

测试步骤：
1. GET /api/tutorials?status=draft，Authorization: Bearer {adminToken}
1. 定位 T 条目

预期结果：
1. HTTP 200，T 的 status=draft
1. T 的 rejectReason=驳回原因原文（草稿且被驳回过时非空，驱动运营修改重提）

---

### API-REVIEW-005-E01 未登录调用审核接口被 401 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-005-E01 |
| 用例描述 | 未登录调用审核接口被 401 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-06 |

前置条件：
1. 不携带 Authorization 头
1. 存在待审核教程

测试步骤：
1. POST /api/tutorials/{T}/review，请求体 {"action":"approve"}

预期结果：
1. HTTP 401，code=401
1. message="未登录或登录已失效"，教程状态不变化

---

### API-REVIEW-006-E02 运营编辑调用审核通过被 403 拒绝且状态不变

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-006-E02 |
| 用例描述 | 运营编辑调用审核通过被 403 拒绝且状态不变 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-18, AC-RULE-23 |

前置条件：
1. 教程 T status=pending
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {operatorToken}，请求体 {"action":"approve"}
1. GET /api/tutorials?status=pending，Authorization: Bearer {adminToken} 校验 T 状态

预期结果：
1. 第一步 HTTP 403，code=403，message="无权限执行该操作"（审核为管理员专属）
1. 第二步 T 仍在 pending 列表（教程状态不发生变化）

---

### API-REVIEW-007-E03 运营编辑调用审核驳回同样被 403 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-007-E03 |
| 用例描述 | 运营编辑调用审核驳回同样被 403 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-18, AC-RULE-23 |

前置条件：
1. 教程 T status=pending
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {operatorToken}，请求体 {"action":"reject","reason":"正文步骤缺少截图说明"}

预期结果：
1. HTTP 403，code=403
1. message="无权限执行该操作"（驳回同属审核动作，运营无权限）

---

### API-REVIEW-008-E04 普通用户调用审核接口被 403 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-008-E04 |
| 用例描述 | 普通用户调用审核接口被 403 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 教程 T status=pending
1. 已取得 {userToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {userToken}，请求体 {"action":"approve"}

预期结果：
1. HTTP 403，code=403
1. message="无权限执行该操作"

---

### API-REVIEW-009-E05 审核不存在的教程 id 返回 404

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-009-E05 |
| 用例描述 | 审核不存在的教程 id 返回 404 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/999999/review，Authorization: Bearer {adminToken}，请求体 {"action":"approve"}

预期结果：
1. HTTP 404，code=404
1. message="教程不存在"

---

### API-REVIEW-010-E06 action 缺失被 400 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-010-E06 |
| 用例描述 | action 缺失被 400 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 教程 T status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {}（缺失 action）

预期结果：
1. HTTP 400，code=400
1. message="action 参数不合法"

---

### API-REVIEW-011-E07 action 传非枚举值 publish 被 400 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-011-E07 |
| 用例描述 | action 传非枚举值 publish 被 400 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22, AC-RULE-05 |

前置条件：
1. 教程 T status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"publish"}

预期结果：
1. HTTP 400，code=400
1. message="action 参数不合法"（枚举仅 approve/reject）

---

### API-REVIEW-012-E08 驳回原因缺失被 400 双重校验拦截

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-012-E08 |
| 用例描述 | 驳回原因缺失被 400 双重校验拦截 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-09, AC-RULE-19 |

前置条件：
1. 教程 T status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"reject"}（不带 reason）

预期结果：
1. HTTP 400，code=400
1. message="请填写至少 5 个字的驳回原因"（后端校验兜底，前端阻断为第一重）
1. 教程状态仍为 pending（不回草稿）

---

### API-REVIEW-013-E09 驳回原因仅 4 字被 400 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-013-E09 |
| 用例描述 | 驳回原因仅 4 字被 400 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-09, AC-RULE-19 |

前置条件：
1. 教程 T status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"reject","reason":"补截图"}（4 字）

预期结果：
1. HTTP 400，code=400
1. message="请填写至少 5 个字的驳回原因"（≥5 字约束的下边界外）

---

### API-REVIEW-014-B01 驳回原因恰 5 字通过校验驳回成功

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-014-B01 |
| 用例描述 | 驳回原因恰 5 字通过校验驳回成功 |
| 优先级 | P0 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-19, AC-FN-09 |

前置条件：
1. 教程 T status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"reject","reason":"请补充截图"}（恰 5 字）

预期结果：
1. HTTP 200，code=0
1. data.status=draft，data.rejectReason=请补充截图（边界值含等于 5 字）

---

### API-REVIEW-015-B02 驳回原因超长文本（500 字）行为稳定

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-015-B02 |
| 用例描述 | 驳回原因超长文本（500 字）行为稳定 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-19 |

前置条件：
1. 教程 T status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"reject","reason":"{500 字文本}"}

预期结果：
1. HTTP 200 全文保存或 400 拒绝（PRD 未设上限，标记待验证）
1. 不返回 500

---

### API-REVIEW-016 对已发布教程执行通过被 409 拒绝且状态不变

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-016 |
| 用例描述 | 对已发布教程执行通过被 409 拒绝且状态不变 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-05, AC-EG-04 |

前置条件：
1. 教程 T status=published
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"approve"}
1. GET /api/tutorials?all=1 校验 T 状态

预期结果：
1. 第一步 HTTP 409，code=409，message="该教程状态已变化，请刷新"（仅 pending 可审核）
1. 第二步 T 仍为 published（非法迁移被拒绝）

---

### API-REVIEW-017 对草稿教程执行驳回被 409 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-017 |
| 用例描述 | 对草稿教程执行驳回被 409 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-05 |

前置条件：
1. 教程 T status=draft
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"reject","reason":"正文步骤缺少截图说明"}

预期结果：
1. HTTP 409，code=409
1. message="该教程状态已变化，请刷新"，教程仍为草稿

---

### API-REVIEW-018 草稿直接通过（草稿→已发布非法迁移）被 409 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-018 |
| 用例描述 | 草稿直接通过（草稿→已发布非法迁移）被 409 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-09, AC-RULE-05 |

前置条件：
1. 教程 T status=draft（未经过提审）
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"approve"}
1. GET /api/tutorials?status=draft 校验 T 仍在草稿列表

预期结果：
1. 第一步 HTTP 409 "该教程状态已变化，请刷新"（绕过前端直接调用也被后端拒绝）
1. 第二步 T 状态保持 draft 不变

---

### API-REVIEW-019 已下架教程直接通过被 409 拒绝（恢复须走重新发布或编辑回审）

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-019 |
| 用例描述 | 已下架教程直接通过被 409 拒绝（恢复须走重新发布或编辑回审） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-05, AC-EG-09 |

前置条件：
1. 教程 T status=offline
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"approve"}

预期结果：
1. HTTP 409，code=409
1. message="该教程状态已变化，请刷新"（offline→published 不在合法迁移集，内容未变应走 POST /republish）

---

### API-REVIEW-020 连续快速两次通过：仅首次生效第二次 409（审核防抖）

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-020 |
| 用例描述 | 连续快速两次通过：仅首次生效第二次 409（审核防抖） |
| 优先级 | P0 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-19, AC-EG-04 |

前置条件：
1. 教程 T status=pending
1. 已取得 {adminToken}

测试步骤：
1. 立即连续两次 POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"approve"}（模拟按钮防抖失效/连点）

预期结果：
1. 第一次 HTTP 200 status=published
1. 第二次 HTTP 409 "该教程状态已变化，请刷新"（仅一次状态迁移与一条审核留痕）

---

### API-REVIEW-021 通过后紧接驳回：后到动作 409 失效（审核互斥）

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-021 |
| 用例描述 | 通过后紧接驳回：后到动作 409 失效（审核互斥） |
| 优先级 | P0 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-04, AC-EG-19 |

前置条件：
1. 教程 T status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review 请求体 {"action":"approve"}
1. 紧接 POST /api/tutorials/{T}/review 请求体 {"action":"reject","reason":"正文步骤缺少截图说明"}

预期结果：
1. 第一次 HTTP 200 status=published
1. 第二次 HTTP 409 "该教程状态已变化，请刷新"（后到动作失效，状态仅按先到动作流转）

---

### API-REVIEW-022 回审版通过后前台替换为新版快照

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-022 |
| 用例描述 | 回审版通过后前台替换为新版快照 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-10, AC-RULE-02 |

前置条件：
1. 教程 T 线上版 v1（content=C1），编辑 v2（content=C2）保存后 status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"approve"}
1. GET /api/tutorials/{T}

预期结果：
1. 审核 HTTP 200 status=published（快照刷新为 v2）
1. 详情 data.content=C2（过审后前台替换为新版本）

---

### API-REVIEW-023 已发布来源回审版驳回：编辑版回草稿且前台三口径旧版不断供

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-023 |
| 用例描述 | 已发布来源回审版驳回：编辑版回草稿且前台三口径旧版不断供 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-19, AC-EG-15 |

前置条件：
1. 教程 T 线上版 v1（title 关键词 K），编辑 v2 保存后 status=pending（回审来源为已发布态）
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"reject","reason":"新版内容需要补充截图说明"}
1. GET /api/tutorials/{T}（详情）
1. GET /api/tutorials?keyword=K（列表与搜索）

预期结果：
1. 驳回 HTTP 200，data.status=draft（仅编辑版回草稿）
1. 详情仍 HTTP 200 且 content=C1（正文内容不变）
1. keyword=K 仍命中 T（列表与搜索持续可命中旧版）

---

### API-REVIEW-024 已下架来源回审版驳回后维持不可见

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-024 |
| 用例描述 | 已下架来源回审版驳回后维持不可见 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-18, AC-RULE-02 |

前置条件：
1. 教程 T 曾下架（last_offline_at 非空），编辑保存后 status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"reject","reason":"内容仍需补充完善细节"}
1. GET /api/tutorials/{T}

预期结果：
1. 驳回 HTTP 200，data.status=draft
1. 详情 HTTP 404（回审来源为已下架态，驳回回落草稿后维持不可见，须重新提审并再次通过）

---

### API-REVIEW-025 approve 携带 reason 字段时被忽略正常发布

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-025 |
| 用例描述 | approve 携带 reason 字段时被忽略正常发布 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 教程 T status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/review，Authorization: Bearer {adminToken}，请求体 {"action":"approve","reason":"多余字段"}

预期结果：
1. HTTP 200，data.status=published
1. reason 被忽略，响应不含 rejectReason 或其为 null（approve 时 reason 字段无副作用）

---

### API-REVIEW-026-E10 教程 id 为非数字时请求稳定处理

| 项目 | 内容 |
|------|------|
| 用例ID | API-REVIEW-026-E10 |
| 用例描述 | 教程 id 为非数字时请求稳定处理 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/abc/review，Authorization: Bearer {adminToken}，请求体 {"action":"approve"}

预期结果：
1. HTTP 404 或 400（按路由/参数解析规则）
1. 不返回 500

---

### API-OFFLINE-001 管理员下架已发布教程成功并返回下架时间戳

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-001 |
| 用例描述 | 管理员下架已发布教程成功并返回下架时间戳 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-OP-03, AC-RULE-05, AC-RULE-22 |

前置条件：
1. 教程 T status=published
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {adminToken}，请求体 {}

预期结果：
1. HTTP 200，code=0
1. data.status=offline
1. data.lastOfflineAt 为合法时间字符串（操作留痕，last_offline_at=now）

---

### API-OFFLINE-002 下架后前台列表下一请求即不返回该教程

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-002 |
| 用例描述 | 下架后前台列表下一请求即不返回该教程 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-OP-03, AC-FN-20 |

前置条件：
1. 教程 T status=published 且在前台列表中
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {adminToken}，请求体 {}
1. 立即 GET /api/tutorials?keyword={T 标题关键词}

预期结果：
1. 下架 HTTP 200 status=offline
1. 列表请求 total=0 不含 T（前台下一请求即不返回，推荐同口径由列表池派生）

---

### API-OFFLINE-003 下架后关键词搜索不命中该教程

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-003 |
| 用例描述 | 下架后关键词搜索不命中该教程 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-OP-03, AC-RULE-04 |

前置条件：
1. 教程 T status=published，标题含独有关键词 K
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {adminToken}，请求体 {}
1. GET /api/tutorials?keyword=K

预期结果：
1. 下架 HTTP 200
1. 搜索 total=0（已下架教程不进检索范围）

---

### API-OFFLINE-004 下架后直达详情返回 404 已下架提示与同类推荐

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-004 |
| 用例描述 | 下架后直达详情返回 404 已下架提示与同类推荐 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-20, AC-EG-10 |

前置条件：
1. 教程 T status=published，同分类下有其他已发布教程
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {adminToken}，请求体 {}
1. GET /api/tutorials/{T}

预期结果：
1. 下架 HTTP 200
1. 详情 HTTP 404，message="该教程已下架"，data.reason=offline，data.related 非空（同分类已发布教程推荐），正文不可见

---

### API-OFFLINE-005 下架后教程不可新增收藏（404）

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-005 |
| 用例描述 | 下架后教程不可新增收藏（404） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-20, AC-RULE-04 |

前置条件：
1. 教程 T status=published
1. 已取得 {adminToken} 与 {userToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {adminToken}，请求体 {}
1. POST /api/favorites/{T}，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. 下架 HTTP 200
1. 收藏 HTTP 404，message="该教程不存在或暂不可见"（仅可收藏前台可见教程；历史收藏保留下架标注）

---

### API-OFFLINE-006 下架后浏览与收藏计数保留不清零

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-006 |
| 用例描述 | 下架后浏览与收藏计数保留不清零 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-04, AC-FN-11 |

前置条件：
1. 教程 T status=published，采集 all=1 口径 viewCount=V、favCount=F
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {adminToken}，请求体 {}
1. GET /api/tutorials?all=1，Authorization: Bearer {adminToken} 读取 T 的计数

预期结果：
1. 下架 HTTP 200
1. 下架后 viewCount=V、favCount=F（计数保留延续至重新发布，仅复制清零）

---

### API-OFFLINE-007-E01 未登录调用下架接口被 401 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-007-E01 |
| 用例描述 | 未登录调用下架接口被 401 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-06 |

前置条件：
1. 不携带 Authorization 头
1. 存在已发布教程

测试步骤：
1. POST /api/tutorials/{T}/offline，请求体 {}

预期结果：
1. HTTP 401，code=401
1. message="未登录或登录已失效"，教程状态不变化

---

### API-OFFLINE-008-E02 运营编辑调用下架接口被 403 拒绝且状态不变

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-008-E02 |
| 用例描述 | 运营编辑调用下架接口被 403 拒绝且状态不变 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-23 |

前置条件：
1. 教程 T status=published
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {operatorToken}，请求体 {}
1. GET /api/tutorials?all=1（{adminToken}）校验 T 状态

预期结果：
1. 第一步 HTTP 403，code=403，message="无权限执行该操作"（下架为管理员专属）
1. 第二步 T 仍为 published

---

### API-OFFLINE-009-E03 普通用户调用下架接口被 403 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-009-E03 |
| 用例描述 | 普通用户调用下架接口被 403 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 教程 T status=published
1. 已取得 {userToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. HTTP 403，code=403
1. message="无权限执行该操作"

---

### API-OFFLINE-010-E04 下架不存在的教程 id 返回 404

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-010-E04 |
| 用例描述 | 下架不存在的教程 id 返回 404 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/999999/offline，Authorization: Bearer {adminToken}，请求体 {}

预期结果：
1. HTTP 404，code=404
1. message="教程不存在"

---

### API-OFFLINE-011-E05 对草稿教程下架被 409 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-011-E05 |
| 用例描述 | 对草稿教程下架被 409 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-05 |

前置条件：
1. 教程 T status=draft
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {adminToken}，请求体 {}

预期结果：
1. HTTP 409，code=409
1. message="该教程状态已变化，请刷新"（仅 published 可下架），教程仍为草稿

---

### API-OFFLINE-012-E06 对待审核教程下架被 409 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-012-E06 |
| 用例描述 | 对待审核教程下架被 409 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-05 |

前置条件：
1. 教程 T status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {adminToken}，请求体 {}

预期结果：
1. HTTP 409，code=409
1. message="该教程状态已变化，请刷新"，教程仍为待审核

---

### API-OFFLINE-013-E07 重复下架（已下架再下架）被 409 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-013-E07 |
| 用例描述 | 重复下架（已下架再下架）被 409 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-05 |

前置条件：
1. 教程 T status=offline
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {adminToken}，请求体 {}

预期结果：
1. HTTP 409，code=409
1. message="该教程状态已变化，请刷新"，lastOfflineAt 不被重复刷新

---

### API-OFFLINE-014-B01 请求体为空对象或不发送均下架成功

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-014-B01 |
| 用例描述 | 请求体为空对象或不发送均下架成功 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-OP-03 |

前置条件：
1. 两篇已发布教程 T1、T2
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T1}/offline，请求体 {}
1. POST /api/tutorials/{T2}/offline，不发送请求体

预期结果：
1. 两次均 HTTP 200，status=offline（二次确认由前端承载，接口不依赖请求体）

---

### API-OFFLINE-015-E08 教程 id 为非数字时请求稳定处理

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-015-E08 |
| 用例描述 | 教程 id 为非数字时请求稳定处理 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/abc/offline，Authorization: Bearer {adminToken}，请求体 {}

预期结果：
1. HTTP 404 或 400
1. 不返回 500

---

### API-OFFLINE-016 下架与重新发布状态机循环往复均成功

| 项目 | 内容 |
|------|------|
| 用例ID | API-OFFLINE-016 |
| 用例描述 | 下架与重新发布状态机循环往复均成功 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-05, AC-FN-11 |

前置条件：
1. 教程 T status=published
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/offline → POST /api/tutorials/{T}/republish → POST /api/tutorials/{T}/offline，依次执行（均携带 {adminToken}，请求体 {}）

预期结果：
1. 三次均 HTTP 200
1. 状态序列 offline → published → offline，lastOfflineAt 每次下架刷新
1. 循环操作不产生脏状态（合法迁移集内往返）

---

### API-REPUBLISH-001 重新发布已下架教程成功且计数沿用下架前数值

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-001 |
| 用例描述 | 重新发布已下架教程成功且计数沿用下架前数值 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-11, AC-RULE-05 |

前置条件：
1. 教程 T status=published，采集 viewCount=V、favCount=F（GET /api/tutorials/{T} 或 all=1）
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/offline，Authorization: Bearer {adminToken}，请求体 {}
1. POST /api/tutorials/{T}/republish，Authorization: Bearer {adminToken}，请求体 {}

预期结果：
1. 第一步 HTTP 200 status=offline
1. 第二步 HTTP 200 status=published，data.viewCount=V，data.favCount=F（计数延续，仅复制清零）

---

### API-REPUBLISH-002 重新发布一键恢复不进入审核队列无待审核中间态

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-002 |
| 用例描述 | 重新发布一键恢复不进入审核队列无待审核中间态 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-11 |

前置条件：
1. 教程 T status=offline
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/republish，Authorization: Bearer {adminToken}，请求体 {}
1. 立即 GET /api/tutorials?status=pending（{adminToken}）确认队列无 T

预期结果：
1. 第一步响应直接 data.status=published（同步返回终态，无 pending 中间态、不重审）
1. 第二步 pending 队列不含 T

---

### API-REPUBLISH-003 重新发布后前台列表下一请求即恢复可见

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-003 |
| 用例描述 | 重新发布后前台列表下一请求即恢复可见 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-11 |

前置条件：
1. 教程 T status=offline，标题含独有关键词 K
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/republish，Authorization: Bearer {adminToken}，请求体 {}
1. 立即 GET /api/tutorials?keyword=K

预期结果：
1. 重发布 HTTP 200 status=published
1. 列表请求返回 T（前台即时恢复可见）

---

### API-REPUBLISH-004 重新发布后详情恢复 200 且不再返回已下架提示

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-004 |
| 用例描述 | 重新发布后详情恢复 200 且不再返回已下架提示 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-11, AC-RULE-04 |

前置条件：
1. 教程 T status=offline（此前详情为 404 已下架）
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/republish，Authorization: Bearer {adminToken}，请求体 {}
1. GET /api/tutorials/{T}

预期结果：
1. 重发布 HTTP 200（last_offline_at 置 NULL，可见性判定恢复）
1. 详情 HTTP 200，返回线上过审版本正文（非 404）

---

### API-REPUBLISH-005 重新发布后教程可再次被收藏

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-005 |
| 用例描述 | 重新发布后教程可再次被收藏 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-11 |

前置条件：
1. 教程 T status=offline
1. 已取得 {adminToken} 与 {userToken}

测试步骤：
1. POST /api/tutorials/{T}/republish，Authorization: Bearer {adminToken}，请求体 {}
1. POST /api/favorites/{T}，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. 重发布 HTTP 200
1. 收藏 HTTP 200，favorited=true，favCount 较重发布前值 +1（恢复可见即可交互）

---

### API-REPUBLISH-006-E01 未登录调用重新发布被 401 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-006-E01 |
| 用例描述 | 未登录调用重新发布被 401 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-06 |

前置条件：
1. 不携带 Authorization 头
1. 存在已下架教程

测试步骤：
1. POST /api/tutorials/{T}/republish，请求体 {}

预期结果：
1. HTTP 401，code=401
1. message="未登录或登录已失效"，教程状态不变化

---

### API-REPUBLISH-007-E02 运营编辑调用重新发布被 403 拒绝且状态不变

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-007-E02 |
| 用例描述 | 运营编辑调用重新发布被 403 拒绝且状态不变 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-23 |

前置条件：
1. 教程 T status=offline
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{T}/republish，Authorization: Bearer {operatorToken}，请求体 {}
1. GET /api/tutorials?all=1（{adminToken}）校验 T 状态

预期结果：
1. 第一步 HTTP 403，code=403，message="无权限执行该操作"（重新发布为管理员专属）
1. 第二步 T 仍为 offline

---

### API-REPUBLISH-008-E03 普通用户调用重新发布被 403 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-008-E03 |
| 用例描述 | 普通用户调用重新发布被 403 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 教程 T status=offline
1. 已取得 {userToken}

测试步骤：
1. POST /api/tutorials/{T}/republish，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. HTTP 403，code=403
1. message="无权限执行该操作"

---

### API-REPUBLISH-009-E04 重新发布不存在的教程 id 返回 404

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-009-E04 |
| 用例描述 | 重新发布不存在的教程 id 返回 404 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/999999/republish，Authorization: Bearer {adminToken}，请求体 {}

预期结果：
1. HTTP 404，code=404
1. message="教程不存在"

---

### API-REPUBLISH-010-E05 对已发布教程直接重新发布被 409 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-010-E05 |
| 用例描述 | 对已发布教程直接重新发布被 409 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-05 |

前置条件：
1. 教程 T status=published
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/republish，Authorization: Bearer {adminToken}，请求体 {}

预期结果：
1. HTTP 409，code=409
1. message="该教程状态已变化，请刷新"（仅 offline 可重新发布），教程仍为 published

---

### API-REPUBLISH-011-E06 对草稿教程重新发布被 409 拒绝（草稿→已发布非法）

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-011-E06 |
| 用例描述 | 对草稿教程重新发布被 409 拒绝（草稿→已发布非法） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-05, AC-EG-09 |

前置条件：
1. 教程 T status=draft（从未通过审核）
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/republish，Authorization: Bearer {adminToken}，请求体 {}
1. GET /api/tutorials?status=draft（{adminToken}）确认 T 仍在

预期结果：
1. 第一步 HTTP 409 "该教程状态已变化，请刷新"（草稿无线上过审版本，不存在"未变内容一键恢复"语义）
1. 第二步 T 仍为 draft，前台保持不可见

---

### API-REPUBLISH-012-E07 对待审核教程重新发布被 409 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-012-E07 |
| 用例描述 | 对待审核教程重新发布被 409 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-05 |

前置条件：
1. 教程 T status=pending
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/{T}/republish，Authorization: Bearer {adminToken}，请求体 {}

预期结果：
1. HTTP 409，code=409
1. message="该教程状态已变化，请刷新"，教程仍为 pending

---

### API-REPUBLISH-013 教程 id 为非数字时请求稳定处理

| 项目 | 内容 |
|------|------|
| 用例ID | API-REPUBLISH-013 |
| 用例描述 | 教程 id 为非数字时请求稳定处理 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 已取得 {adminToken}

测试步骤：
1. POST /api/tutorials/abc/republish，Authorization: Bearer {adminToken}，请求体 {}

预期结果：
1. HTTP 404 或 400
1. 不返回 500

---

### API-COPY-001 复制已发布教程生成新草稿且标题追加（副本）计数全清零

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-001 |
| 用例描述 | 复制已发布教程生成新草稿且标题追加（副本）计数全清零 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-12, AC-RULE-14, AC-RULE-01 |

前置条件：
1. 已发布教程 T（title=X，viewCount/favCount/helpfulYes/helpfulNo/shareCount 均 >0）
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{T}/copy，Authorization: Bearer {operatorToken}，请求体 {}

预期结果：
1. HTTP 200，data.id 为新 ID（≠T）
1. data.title = X + "（副本）"
1. data.status=draft
1. data.viewCount=0，favCount=0，helpfulYes=0，helpfulNo=0，shareCount=0（含分享数一并清零）

---

### API-COPY-002 复制草稿源教程成功生成新草稿

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-002 |
| 用例描述 | 复制草稿源教程成功生成新草稿 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-12 |

前置条件：
1. 草稿教程 T 存在
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{T}/copy，Authorization: Bearer {operatorToken}，请求体 {}

预期结果：
1. HTTP 200，data.status=draft，data.title=源标题+（副本）
1. 源教程不受影响仍为草稿

---

### API-COPY-003 复制待审核源教程成功且源教程不受影响

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-003 |
| 用例描述 | 复制待审核源教程成功且源教程不受影响 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-12 |

前置条件：
1. 教程 T status=pending
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{T}/copy，Authorization: Bearer {operatorToken}，请求体 {}
1. GET /api/tutorials?status=pending（{adminToken}）确认源仍待审

预期结果：
1. 复制 HTTP 200，新副本 status=draft
1. 源教程仍为 pending（复制不改变源状态）

---

### API-COPY-004 复制已下架源教程成功生成新草稿

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-004 |
| 用例描述 | 复制已下架源教程成功生成新草稿 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-12 |

前置条件：
1. 教程 T status=offline
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{T}/copy，Authorization: Bearer {operatorToken}，请求体 {}

预期结果：
1. HTTP 200，data.status=draft（源为任意状态均可复制）
1. 源教程仍为 offline

---

### API-COPY-005 复制后源教程状态与计数保持不变

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-005 |
| 用例描述 | 复制后源教程状态与计数保持不变 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-12 |

前置条件：
1. 已发布教程 T，先经 GET /api/tutorials?all=1（{adminToken}）采集源状态与计数快照 S0
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{T}/copy，Authorization: Bearer {operatorToken}，请求体 {}
1. 再次 GET /api/tutorials?all=1（{adminToken}）采集 T 的状态与计数

预期结果：
1. 复制 HTTP 200
1. 复制前后 T 的 status 与 viewCount/favCount/helpfulYes/helpfulNo/shareCount 与 S0 完全一致（源不变）

---

### API-COPY-006 副本为纯草稿：前台列表不出现且直达详情 404

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-006 |
| 用例描述 | 副本为纯草稿：前台列表不出现且直达详情 404 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-01, AC-RULE-02, AC-FN-12 |

前置条件：
1. 承接 API-COPY-001 已生成副本 N（标题含独有关键词 K）

测试步骤：
1. GET /api/tutorials?keyword=K
1. GET /api/tutorials/{N}

预期结果：
1. 列表 total=0（纯草稿不进前台与搜索）
1. 详情 HTTP 404，message="该教程不存在或暂不可见"

---

### API-COPY-007 副本管理字段：无线上版本、提审次数 0、驳回原因清空、作者为操作人

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-007 |
| 用例描述 | 副本管理字段：无线上版本、提审次数 0、驳回原因清空、作者为操作人 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-14, AC-OP-06 |

前置条件：
1. 源教程 T 曾被驳回过（rejectReason 非空、submitCount ≥1）
1. 已取得 {operatorToken}（操作人=运营编辑）

测试步骤：
1. POST /api/tutorials/{T}/copy，Authorization: Bearer {operatorToken}，请求体 {}
1. GET /api/tutorials?status=draft（{adminToken}）定位副本条目

预期结果：
1. 复制 HTTP 200
1. 副本 hasOnlineVersion=false（删除保护判定依据：纯草稿才可删）
1. 副本 submitCount=0、rejectReason=null、authorName=运营编辑（作者为当前操作人）

---

### API-COPY-008-B01 源标题 96 字时副本标题为 96+4=100 字不截断

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-008-B01 |
| 用例描述 | 源标题 96 字时副本标题为 96+4=100 字不截断 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-14, AC-RULE-18 |

前置条件：
1. 存在标题恰 96 字的已发布教程 T96（后台预置，创建接口不在本批判次）
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{T96}/copy，Authorization: Bearer {operatorToken}，请求体 {}

预期结果：
1. HTTP 200
1. data.title 长度=100（96 字源标题 + 4 字后缀"（副本）"，≤100 上限内不截断）

---

### API-COPY-009-B02 源标题 97 字时截断源标题至 96 字再拼接后缀

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-009-B02 |
| 用例描述 | 源标题 97 字时截断源标题至 96 字再拼接后缀 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-14, AC-RULE-18 |

前置条件：
1. 存在标题恰 97 字的已发布教程 T97（后台预置）
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{T97}/copy，Authorization: Bearer {operatorToken}，请求体 {}

预期结果：
1. HTTP 200
1. data.title = 源标题前 96 字 + "（副本）"，总长 100（超 100 字时截断规则兜底）

---

### API-COPY-010-B03 源标题 100 字上限时副本仍截断至 96 字拼接

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-010-B03 |
| 用例描述 | 源标题 100 字上限时副本仍截断至 96 字拼接 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-14, AC-RULE-18 |

前置条件：
1. 存在标题恰 100 字（字段上限）的已发布教程 T100（后台预置）
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{T100}/copy，Authorization: Bearer {operatorToken}，请求体 {}

预期结果：
1. HTTP 200
1. data.title 长度=100（源标题截断至 96 字 + 4 字后缀，不超 AC-RULE-18 上限）

---

### API-COPY-011 副本再复制时后缀叠加并按上限截断

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-011 |
| 用例描述 | 副本再复制时后缀叠加并按上限截断 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-14 |

前置条件：
1. 已生成副本 N（标题=源+（副本））
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/{N}/copy，Authorization: Bearer {operatorToken}，请求体 {}

预期结果：
1. HTTP 200，新副本标题 = N 标题 + "（副本）"；若超 100 字则按 96 字截断规则处理
1. data.status=draft，计数为 0

---

### API-COPY-012-E01 未登录调用复制接口被 401 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-012-E01 |
| 用例描述 | 未登录调用复制接口被 401 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-23 |

前置条件：
1. 不携带 Authorization 头
1. 存在任意状态教程

测试步骤：
1. POST /api/tutorials/{T}/copy，请求体 {}

预期结果：
1. HTTP 401，code=401
1. message="未登录或登录已失效"，不生成副本

---

### API-COPY-013-E02 普通用户调用复制接口被 403 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-013-E02 |
| 用例描述 | 普通用户调用复制接口被 403 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 已取得 {userToken}
1. 存在已发布教程

测试步骤：
1. POST /api/tutorials/{T}/copy，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. HTTP 403，code=403
1. message="无权限执行该操作"（复制为运营/管理员能力，普通用户无权限）

---

### API-COPY-014-E03 复制不存在的教程 id 返回 404

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-014-E03 |
| 用例描述 | 复制不存在的教程 id 返回 404 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-12 |

前置条件：
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/999999/copy，Authorization: Bearer {operatorToken}，请求体 {}

预期结果：
1. HTTP 404，code=404
1. message="教程不存在"

---

### API-COPY-015 管理员复制教程同样被允许

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-015 |
| 用例描述 | 管理员复制教程同样被允许 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 已取得 {adminToken}
1. 存在已发布教程

测试步骤：
1. POST /api/tutorials/{T}/copy，Authorization: Bearer {adminToken}，请求体 {}

预期结果：
1. HTTP 200，data.status=draft（admin/operator 均可复制）
1. 副本 authorName=平台管理员

---

### API-COPY-016-E04 教程 id 为非数字时请求稳定处理

| 项目 | 内容 |
|------|------|
| 用例ID | API-COPY-016-E04 |
| 用例描述 | 教程 id 为非数字时请求稳定处理 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-12 |

前置条件：
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/tutorials/abc/copy，Authorization: Bearer {operatorToken}，请求体 {}

预期结果：
1. HTTP 404 或 400
1. 不返回 500

---

### API-FAV-001 登录用户收藏已发布教程成功且计数 +1

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-001 |
| 用例描述 | 登录用户收藏已发布教程成功且计数 +1 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-03, AC-RULE-09 |

前置条件：
1. 教程 T 已发布，先经 GET /api/tutorials 采集 favCount=F0
1. 已取得 {userToken}

测试步骤：
1. POST /api/favorites/{T}，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. HTTP 200，code=0
1. data.tutorialId=T，data.favorited=true
1. data.favCount=F0+1（当前有效收藏数联动 +1）

---

### API-FAV-002 同一用户重复收藏幂等返回且计数不再增加

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-002 |
| 用例描述 | 同一用户重复收藏幂等返回且计数不再增加 |
| 优先级 | P0 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-09, AC-FN-03 |

前置条件：
1. 用户 U（{userToken}）已收藏教程 T，当前 favCount=F1

测试步骤：
1. 再次 POST /api/favorites/{T}，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. HTTP 200，code=0（幂等成功）
1. data.favorited=true
1. data.favCount=F1（不重复计数，favorites 联合主键 user_id+tutorial_id）

---

### API-FAV-003 不同用户先后收藏同一教程计数逐次累加

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-003 |
| 用例描述 | 不同用户先后收藏同一教程计数逐次累加 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-09, AC-FN-15 |

前置条件：
1. 教程 T 已发布且 favCount=F0
1. 已取得 {userToken}（采购）与 {salesToken}（销售）

测试步骤：
1. POST /api/favorites/{T}，Authorization: Bearer {userToken}
1. POST /api/favorites/{T}，Authorization: Bearer {salesToken}

预期结果：
1. 第一次 HTTP 200，favCount=F0+1
1. 第二次 HTTP 200，favCount=F0+2（不同用户各自计一条有效收藏）

---

### API-FAV-004 收藏接口回传统计与教程列表 favCount 一致

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-004 |
| 用例描述 | 收藏接口回传统计与教程列表 favCount 一致 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-09, AC-FN-15 |

前置条件：
1. 教程 T 已发布
1. 已取得 {userToken}

测试步骤：
1. POST /api/favorites/{T}，Authorization: Bearer {userToken}，记录返回 favCount
1. GET /api/tutorials?keyword={T 标题关键词} 读取 T 的 favCount

预期结果：
1. 两次 HTTP 200
1. 列表字段 favCount 与收藏接口回传值完全一致（同一数据源，任一端操作另一端刷新可见）

---

### API-FAV-005 后台角色 token 亦可收藏（互动行为不限普通用户）

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-005 |
| 用例描述 | 后台角色 token 亦可收藏（互动行为不限普通用户） |
| 优先级 | P2 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22, AC-RULE-23 |

前置条件：
1. 教程 T 已发布
1. 已取得 {adminToken} 与 {operatorToken}

测试步骤：
1. POST /api/favorites/{T}，Authorization: Bearer {adminToken}
1. POST /api/favorites/{T}，Authorization: Bearer {operatorToken}

预期结果：
1. 两次均 HTTP 200，favorited=true（接口契约：admin/operator/user 登录均可收藏）

---

### API-FAV-006-E01 游客未登录收藏被 401 拒绝（前端引导选角色登录）

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-006-E01 |
| 用例描述 | 游客未登录收藏被 401 拒绝（前端引导选角色登录） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-03, AC-EG-07, AC-RULE-25 |

前置条件：
1. 不携带 Authorization 头
1. 教程 T 已发布

测试步骤：
1. POST /api/favorites/{T}，请求体 {}

预期结果：
1. HTTP 401，code=401
1. message="未登录或登录已失效"（前端据此弹出选角色登录，登录后回原页面原位置继续操作）

---

### API-FAV-007-E02 收藏不存在的教程返回 404 不可见文案

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-007-E02 |
| 用例描述 | 收藏不存在的教程返回 404 不可见文案 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-02 |

前置条件：
1. 已取得 {userToken}

测试步骤：
1. POST /api/favorites/999999，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. HTTP 404，code=404
1. message="该教程不存在或暂不可见"

---

### API-FAV-008-E03 收藏纯草稿教程被 404 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-008-E03 |
| 用例描述 | 收藏纯草稿教程被 404 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-01, AC-RULE-02 |

前置条件：
1. 教程 T 为纯草稿（无线上过审版本）
1. 已取得 {userToken}

测试步骤：
1. POST /api/favorites/{T}，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. HTTP 404，code=404
1. message="该教程不存在或暂不可见"（仅可收藏前台可见教程）

---

### API-FAV-009-E04 收藏首次待审核教程被 404 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-009-E04 |
| 用例描述 | 收藏首次待审核教程被 404 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-02, AC-FN-07 |

前置条件：
1. 教程 T 无线上过审版本且 status=pending
1. 已取得 {userToken}

测试步骤：
1. POST /api/favorites/{T}，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. HTTP 404，code=404
1. message="该教程不存在或暂不可见"

---

### API-FAV-010-E05 收藏已下架教程被 404 拒绝（不可新增收藏）

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-010-E05 |
| 用例描述 | 收藏已下架教程被 404 拒绝（不可新增收藏） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-04, AC-FN-20 |

前置条件：
1. 教程 T status=offline（存在历史收藏用户，其收藏列表保留下架标注）
1. 已取得 {userToken}（该用户此前未收藏 T）

测试步骤：
1. POST /api/favorites/{T}，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. HTTP 404，code=404
1. message="该教程不存在或暂不可见"（已下架教程不可新增收藏）

---

### API-FAV-011 同账号跨端重复收藏仅一条有效（PC 与小程序同库）

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-011 |
| 用例描述 | 同账号跨端重复收藏仅一条有效（PC 与小程序同库） |
| 优先级 | P0 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-15 |

前置条件：
1. 用户 U 已收藏教程 T（favCount=F1）
1. 再次以 U 的 token 模拟小程序端重复请求

测试步骤：
1. POST /api/favorites/{T}，Authorization: Bearer {U 的 token}，请求体 {}（模拟另一端发起）

预期结果：
1. HTTP 200，favorited=true，favCount=F1（同库同数据，同一用户同一教程唯一，两端不产生重复记录）

---

### API-FAV-012-B01 tutorialId 为非数字/0/负数时请求稳定处理

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-012-B01 |
| 用例描述 | tutorialId 为非数字/0/负数时请求稳定处理 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-09 |

前置条件：
1. 已取得 {userToken}

测试步骤：
1. 分别 POST /api/favorites/abc、/api/favorites/0、/api/favorites/-1，Authorization: Bearer {userToken}

预期结果：
1. 三次均 HTTP 404 或 400
1. 不返回 500

---

### API-FAV-013 回审期间旧版在线的教程仍可被收藏

| 项目 | 内容 |
|------|------|
| 用例ID | API-FAV-013 |
| 用例描述 | 回审期间旧版在线的教程仍可被收藏 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-02, AC-FN-10 |

前置条件：
1. 教程 T 存在线上过审版本且当前 status=pending（已发布来源编辑回审，前台旧版在线）
1. 已取得 {userToken}

测试步骤：
1. POST /api/favorites/{T}，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. HTTP 200，favorited=true（回审期间旧版在线计入前台可见池，可正常交互）

---

### API-CHECKIN-001 当日首次打卡成功加 10 积分并返回连续天数

| 项目 | 内容 |
|------|------|
| 用例ID | API-CHECKIN-001 |
| 用例描述 | 当日首次打卡成功加 10 积分并返回连续天数 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-16, AC-RULE-12 |

前置条件：
1. 用户 U（{userToken}）当日未打卡，此前累计积分 P0、昨日已打卡（streak=S）

测试步骤：
1. POST /api/checkins，Authorization: Bearer {userToken}，请求体 {}

预期结果：
1. HTTP 200，message=打卡成功
1. data.pointsAdded=10，data.totalPoints=P0+10
1. data.streak=S+1（昨日有记录则连续+1）
1. data.duplicated=false，data.checkinDate=服务器本地当日 yyyy-MM-dd

---

### API-CHECKIN-002 当日重复打卡幂等返回且积分不再增加

| 项目 | 内容 |
|------|------|
| 用例ID | API-CHECKIN-002 |
| 用例描述 | 当日重复打卡幂等返回且积分不再增加 |
| 优先级 | P0 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-16, AC-RULE-12 |

前置条件：
1. 用户 U 当日已打卡成功（totalPoints=P1，streak=S1）

测试步骤：
1. 再次 POST /api/checkins，Authorization: Bearer {userToken}，请求体 {}（模拟当日重复点击）

预期结果：
1. HTTP 200，message=今日已打卡
1. data.duplicated=true，data.pointsAdded=0
1. data.totalPoints=P1，data.streak=S1（均与首次打卡后一致，积分不再增加）

---

### API-CHECKIN-003 连续打卡 streak 逐日递增（种子含连续打卡记录）

| 项目 | 内容 |
|------|------|
| 用例ID | API-CHECKIN-003 |
| 用例描述 | 连续打卡 streak 逐日递增（种子含连续打卡记录） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-12 |

前置条件：
1. 种子库含示例连续打卡 5 天的用户 U（db.md §6：种子含打卡 5 天）

测试步骤：
1. POST /api/checkins，Authorization: Bearer {U 的 token}，请求体 {}

预期结果：
1. HTTP 200
1. data.streak=昨日连续天数+1（连续规则：昨日有打卡记录则 +1）
1. data.pointsAdded=10（当日首次）

---

### API-CHECKIN-004 连续 7 天打卡达成后返回坚持者徽章 persist

| 项目 | 内容 |
|------|------|
| 用例ID | API-CHECKIN-004 |
| 用例描述 | 连续 7 天打卡达成后返回坚持者徽章 persist |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-16, AC-RULE-12 |

前置条件：
1. 用户 U 已连续打卡 6 天（第 6 天为昨日）

测试步骤：
1. POST /api/checkins，Authorization: Bearer {U 的 token}，请求体 {}（第 7 天打卡）

预期结果：
1. HTTP 200，data.streak=7
1. data.badges 数组含 "persist"（坚持者徽章=连续 7 天打卡）

---

### API-CHECKIN-005 中断后打卡连续天数重置为 1 但积分与徽章保留

| 项目 | 内容 |
|------|------|
| 用例ID | API-CHECKIN-005 |
| 用例描述 | 中断后打卡连续天数重置为 1 但积分与徽章保留 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-12, AC-FN-21 |

前置条件：
1. 用户 U 昨日及更早均无打卡（中断），此前 totalPoints=P1 且已获 badges=["persist"]

测试步骤：
1. POST /api/checkins，Authorization: Bearer {U 的 token}，请求体 {}

预期结果：
1. HTTP 200，data.streak=1（中断清连续天数）
1. data.totalPoints=P1+10（积分不清零，仅新增当日 10 分）
1. data.badges 仍含 persist（中断不回收已获徽章）

---

### API-CHECKIN-006 累计完成 20 篇教程的用户打卡返回百科达人徽章

| 项目 | 内容 |
|------|------|
| 用例ID | API-CHECKIN-006 |
| 用例描述 | 累计完成 20 篇教程的用户打卡返回百科达人徽章 |
| 优先级 | P2 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-21, AC-RULE-12 |

前置条件：
1. 用户 U 在 histories 中已有 20 篇教程阅读进度达 100%（完成口径，种子或前端行为预置）

测试步骤：
1. POST /api/checkins，Authorization: Bearer {U 的 token}，请求体 {}

预期结果：
1. HTTP 200
1. data.badges 数组含 "encyclopedia"（百科达人=累计完成 20 篇）

---

### API-CHECKIN-007-E01 未登录打卡被 401 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-CHECKIN-007-E01 |
| 用例描述 | 未登录打卡被 401 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-25 |

前置条件：
1. 不携带 Authorization 头

测试步骤：
1. POST /api/checkins，请求体 {}

预期结果：
1. HTTP 401，code=401
1. message="未登录或登录已失效"，不产生打卡记录

---

### API-CHECKIN-008 打卡日期按服务器本地当日返回 yyyy-MM-dd

| 项目 | 内容 |
|------|------|
| 用例ID | API-CHECKIN-008 |
| 用例描述 | 打卡日期按服务器本地当日返回 yyyy-MM-dd |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-12 |

前置条件：
1. 已取得 {userToken}

测试步骤：
1. POST /api/checkins，Authorization: Bearer {userToken}，请求体 {}
1. 校验 data.checkinDate 与服务器本地当前日期一致

预期结果：
1. HTTP 200
1. data.checkinDate 符合 yyyy-MM-dd 格式且等于服务器本地当日（UNIQUE(user_id, checkin_date) 约束依据）

---

### API-CHECKIN-009 同日并发两次打卡仅一次加积分（净增 10）

| 项目 | 内容 |
|------|------|
| 用例ID | API-CHECKIN-009 |
| 用例描述 | 同日并发两次打卡仅一次加积分（净增 10） |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-16 |

前置条件：
1. 用户 U 当日尚未打卡，totalPoints=P0
1. 可并发发起两个请求（或极短间隔连发）

测试步骤：
1. 近乎同时发起两个 POST /api/checkins，Authorization: Bearer {userToken}，请求体 {}
1. 校验两次响应的 totalPoints

预期结果：
1. 两次均 HTTP 200（其一 pointsAdded=10 duplicated=false，另一 pointsAdded=0 duplicated=true，顺序不限）
1. 两次 totalPoints 相同且=P0+10（净增 10，无重复计分）

---

### API-CHECKIN-010-B01 请求体携带无关字段被忽略打卡成功

| 项目 | 内容 |
|------|------|
| 用例ID | API-CHECKIN-010-B01 |
| 用例描述 | 请求体携带无关字段被忽略打卡成功 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-12 |

前置条件：
1. 已取得 {userToken}

测试步骤：
1. POST /api/checkins，Authorization: Bearer {userToken}，请求体 {"foo":"bar"}

预期结果：
1. HTTP 200 正常打卡（无关字段忽略）或 400 严格拒绝（标记待验证）
1. 不返回 500

---

### API-CHECKIN-011 后台角色 token 打卡同样成功（契约：登录即可打卡）

| 项目 | 内容 |
|------|------|
| 用例ID | API-CHECKIN-011 |
| 用例描述 | 后台角色 token 打卡同样成功（契约：登录即可打卡） |
| 优先级 | P2 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 已取得 {operatorToken}

测试步骤：
1. POST /api/checkins，Authorization: Bearer {operatorToken}，请求体 {}

预期结果：
1. HTTP 200，code=0（接口契约：admin/operator/user 登录均可）
1. pointsAdded=10（首次）或 duplicated=true（当日已打过）

---

### API-CAT-DEL-001 删除空分类成功并从分类树移除

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-DEL-001 |
| 用例描述 | 删除空分类成功并从分类树移除 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-06, AC-RULE-22, AC-OP-08 |

前置条件：
1. 存在一个既无子分类也无任何状态教程的启用分类 X（后台新增预置，新增接口不在本批判次）
1. 已取得 {adminToken}

测试步骤：
1. DELETE /api/categories/{X}，Authorization: Bearer {adminToken}
1. GET /api/categories?all=1（{adminToken}）确认 X 不在树中

预期结果：
1. 第一步 HTTP 200，code=0，message=已删除，data=null
1. 第二步树中无 X 节点（分类从后台分类树移除）

---

### API-CAT-DEL-002-E01 未登录删除分类被 401 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-DEL-002-E01 |
| 用例描述 | 未登录删除分类被 401 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-EG-06 |

前置条件：
1. 不携带 Authorization 头
1. 存在可删除的空分类

测试步骤：
1. DELETE /api/categories/{X}

预期结果：
1. HTTP 401，code=401
1. message="未登录或登录已失效"，分类不被删除

---

### API-CAT-DEL-003-E02 运营编辑删除分类被 403 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-DEL-003-E02 |
| 用例描述 | 运营编辑删除分类被 403 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-23 |

前置条件：
1. 已取得 {operatorToken}
1. 存在任意分类

测试步骤：
1. DELETE /api/categories/{id}，Authorization: Bearer {operatorToken}

预期结果：
1. HTTP 403，code=403
1. message="无权限执行该操作"（分类树管理为管理员专属）

---

### API-CAT-DEL-004-E03 普通用户删除分类被 403 拒绝

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-DEL-004-E03 |
| 用例描述 | 普通用户删除分类被 403 拒绝 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-24 |

前置条件：
1. 已取得 {userToken}

测试步骤：
1. DELETE /api/categories/{id}，Authorization: Bearer {userToken}

预期结果：
1. HTTP 403，code=403
1. message="无权限执行该操作"

---

### API-CAT-DEL-005-E04 删除不存在的分类返回 404

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-DEL-005-E04 |
| 用例描述 | 删除不存在的分类返回 404 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 已取得 {adminToken}

测试步骤：
1. DELETE /api/categories/999999，Authorization: Bearer {adminToken}

预期结果：
1. HTTP 404，code=404
1. message="分类不存在"

---

### API-CAT-DEL-006-E05 分类下存在已发布教程时删除被 409 阻断并提示移走

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-DEL-006-E05 |
| 用例描述 | 分类下存在已发布教程时删除被 409 阻断并提示移走 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-13, AC-RULE-06 |

前置条件：
1. 分类 X 下存在 N（≥1）篇已发布教程
1. 已取得 {adminToken}

测试步骤：
1. DELETE /api/categories/{X}，Authorization: Bearer {adminToken}
1. GET /api/categories?all=1（{adminToken}）确认 X 仍存在

预期结果：
1. 第一步 HTTP 409，code=409，message="该分类下还有 {N} 篇教程，请先移走"
1. 第二步分类树中 X 仍存在（删除保护生效）

---

### API-CAT-DEL-007-E06 分类下存在草稿/待审核/已下架教程同样阻断删除

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-DEL-007-E06 |
| 用例描述 | 分类下存在草稿/待审核/已下架教程同样阻断删除 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-13 |

前置条件：
1. 分类 X 下仅存在非已发布状态教程（草稿/待审核/已下架任意组合，后台预置）
1. 已取得 {adminToken}

测试步骤：
1. DELETE /api/categories/{X}，Authorization: Bearer {adminToken}

预期结果：
1. HTTP 409，code=409
1. message="该分类下还有 {N} 篇教程，请先移走"（保护口径=任意状态教程均计数，非仅已发布）

---

### API-CAT-DEL-008-E07 教程挂在子分类下时删除父分类被 409 阻断（含子分类计数）

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-DEL-008-E07 |
| 用例描述 | 教程挂在子分类下时删除父分类被 409 阻断（含子分类计数） |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-13 |

前置条件：
1. 父分类 P 下无直接教程，但其子分类 C 下存在教程
1. 已取得 {adminToken}

测试步骤：
1. DELETE /api/categories/{P}，Authorization: Bearer {adminToken}

预期结果：
1. HTTP 409，code=409
1. message="该分类下还有 {N} 篇教程，请先移走"（计数含其子分类下教程，防止树悬挂）

---

### API-CAT-DEL-009-E08 分类下存在子分类时删除被 409 阻断

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-DEL-009-E08 |
| 用例描述 | 分类下存在子分类时删除被 409 阻断 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-FN-13 |

前置条件：
1. 父分类 P 下存在子分类 C（C 下无教程）
1. 已取得 {adminToken}

测试步骤：
1. DELETE /api/categories/{P}，Authorization: Bearer {adminToken}

预期结果：
1. HTTP 409，code=409
1. message="该分类下存在子分类，请先处理"（工程兜底定义，防止孤儿节点）

---

### API-CAT-DEL-010 重复删除已删除的分类返回 404

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-DEL-010 |
| 用例描述 | 重复删除已删除的分类返回 404 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-06 |

前置条件：
1. 分类 X 已被成功删除（承接 API-CAT-DEL-001）
1. 已取得 {adminToken}

测试步骤：
1. 再次 DELETE /api/categories/{X}，Authorization: Bearer {adminToken}

预期结果：
1. HTTP 404，code=404
1. message="分类不存在"（幂等删除语义为拒绝）

---

### API-CAT-DEL-011-B01 分类 id 为非数字/0/负数时请求稳定处理

| 项目 | 内容 |
|------|------|
| 用例ID | API-CAT-DEL-011-B01 |
| 用例描述 | 分类 id 为非数字/0/负数时请求稳定处理 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-22 |

前置条件：
1. 已取得 {adminToken}

测试步骤：
1. 分别 DELETE /api/categories/abc、/api/categories/0、/api/categories/-1，Authorization: Bearer {adminToken}

预期结果：
1. 三次均 HTTP 404 或 400
1. 不返回 500

---
