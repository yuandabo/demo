# 2-5-非功能需求-AC-NF__3-1-交互类-UI-IXD__3-2-样式类-UI-ELEM API API 测试案例

>  | 版本 v1 | 生成日期 2026-08-23T14:16:01+08:00 | 案例类型 api

---

### API-NF-LOGIN-001 管理员 admin 账号密码登录成功返回 DB token 与用户信息（后台鉴权链路入口）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LOGIN-001 |
| 用例描述 | 管理员 admin 账号密码登录成功返回 DB token 与用户信息（后台鉴权链路入口） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

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

### API-NF-LOGIN-002 运营编辑 operator 账号密码登录成功返回 operator 角色 token

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LOGIN-002 |
| 用例描述 | 运营编辑 operator 账号密码登录成功返回 operator 角色 token |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 种子库已初始化，后台账号 operator/123456 存在

测试步骤：
1. POST /api/auth/login，请求体 {"username":"operator","password":"123456"}

预期结果：
1. HTTP 200，code=0
1. data.token 非空；data.user.role=operator，data.user.erpRole=null，data.user.displayName=运营编辑

---

### API-NF-LOGIN-003-E01 username 或 password 缺失/为空时登录返回 400 请输入账号和密码

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LOGIN-003-E01 |
| 用例描述 | username 或 password 缺失/为空时登录返回 400 请输入账号和密码 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 服务正常启动

测试步骤：
1. POST /api/auth/login，请求体 {}（两字段均缺失）
1. POST /api/auth/login，请求体 {"password":"123456"}（缺 username）
1. POST /api/auth/login，请求体 {"username":"admin"}（缺 password）
1. POST /api/auth/login，请求体 {"username":"","password":"123456"}（username 空串）

预期结果：
1. 四个请求均返回 HTTP 400，code=400
1. message 均为「请输入账号和密码」
1. 不返回 token，不产生登录态

---

### API-NF-LOGIN-004 密码错误登录返回 401 统一文案 账号或密码错误

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LOGIN-004 |
| 用例描述 | 密码错误登录返回 401 统一文案 账号或密码错误 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 后台账号 admin 存在

测试步骤：
1. POST /api/auth/login，请求体 {"username":"admin","password":"wrong999"}

预期结果：
1. HTTP 401，code=401，message=「账号或密码错误」
1. 不区分提示具体原因，不返回 data.token

---

### API-NF-LOGIN-005 账号不存在与密码错误返回完全一致的 401 文案（防账号枚举）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LOGIN-005 |
| 用例描述 | 账号不存在与密码错误返回完全一致的 401 文案（防账号枚举） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 账号 nosuchuser999 在系统中不存在

测试步骤：
1. POST /api/auth/login，请求体 {"username":"nosuchuser999","password":"123456"}
1. 对比 API-NF-LOGIN-004（存在账号+错误密码）的响应 message 与响应时间量级

预期结果：
1. HTTP 401，code=401，message=「账号或密码错误」
1. 与密码错误场景的 message 逐字一致，无「账号不存在」类差异化泄露

---

### API-NF-LOGIN-006-E02 普通用户账号（role=user）走后台账号密码登录返回 403 请使用选角色登录

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LOGIN-006-E02 |
| 用例描述 | 普通用户账号（role=user）走后台账号密码登录返回 403 请使用选角色登录 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 种子含 6 个前台演示角色账号（role=user，取销售演示账号及正确密码）

测试步骤：
1. POST /api/auth/login，请求体 {"username":"<前台演示账号>","password":"<正确密码>"}

预期结果：
1. HTTP 403，code=403，message=「请使用选角色登录」
1. 不返回 token，引导普通用户走 POST /api/auth/role-login

---

### API-NF-LOGIN-007-B01 username 长度达上限 50 字符仍通过格式校验（按 401 账号不存在处理而非 400）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LOGIN-007-B01 |
| 用例描述 | username 长度达上限 50 字符仍通过格式校验（按 401 账号不存在处理而非 400） |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 服务正常启动

测试步骤：
1. 构造 50 个字符的 username（如 'a'*50）
1. POST /api/auth/login，请求体 {"username":"<50字符>","password":"123456"}

预期结果：
1. 不因长度校验返回 400
1. 返回 HTTP 401「账号或密码错误」（账号不存在路径），证明 1-50 长度上界为合法格式

---

### API-NF-LOGIN-008-B02 password 长度达上限 50 字符仍通过格式校验（401 而非 400）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LOGIN-008-B02 |
| 用例描述 | password 长度达上限 50 字符仍通过格式校验（401 而非 400） |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 后台账号 admin 存在

测试步骤：
1. POST /api/auth/login，请求体 {"username":"admin","password":"<50字符>"}

预期结果：
1. 不因长度校验返回 400
1. 返回 HTTP 401「账号或密码错误」（密码错误路径），证明 password 1-50 长度上界为合法格式

---

### API-NF-LOGIN-009-E03 username 为纯空白字符返回 400（约束：不允许空白）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LOGIN-009-E03 |
| 用例描述 | username 为纯空白字符返回 400（约束：不允许空白） |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 服务正常启动

测试步骤：
1. POST /api/auth/login，请求体 {"username":"   ","password":"123456"}（3 个空格）

预期结果：
1. HTTP 400，code=400，message=「请输入账号和密码」
1. 空白字符串与空值同等拒绝

---

### API-NF-LOGIN-010 连续两次登录生成的 token 均可通过管理参数鉴权（token 持续有效至 logout/reset）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LOGIN-010 |
| 用例描述 | 连续两次登录生成的 token 均可通过管理参数鉴权（token 持续有效至 logout/reset） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 后台账号 admin 存在，未执行 logout 与 system/reset

测试步骤：
1. POST /api/auth/login（admin）获取 token1
1. POST /api/auth/login（admin）获取 token2
1. GET /api/tutorials?all=1 携带 Authorization: Bearer token1
1. GET /api/tutorials?all=1 携带 Authorization: Bearer token2

预期结果：
1. 两次登录均 200，token1 与 token2 均为非空字符串
1. 两次管理参数请求均返回 HTTP 200，code=0
1. 登录-鉴权链路完整可用，token 在 logout/reset 前持续有效

---

### API-NF-LIST-001 游客无参请求前台教程列表返回默认分页数据（公开可达、无需登录）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-001 |
| 用例描述 | 游客无参请求前台教程列表返回默认分页数据（公开可达、无需登录） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-15 |

前置条件：
1. 种子库已初始化，存在已发布教程

测试步骤：
1. GET /api/tutorials（不携带任何参数与 Authorization）

预期结果：
1. HTTP 200，code=0，游客可访问（全局入口数据源）
1. data.page=1，data.pageSize=10，data.total≥1
1. list 元素含 title/summary/tags/videoUrl/categoryId/categoryName/isTop/sort/viewCount/favCount/helpfulYes/helpfulNo/shareCount/publishedAt/updatedAt 字段

---

### API-NF-LIST-002 关键词命中标题的搜索 1s 内返回（P95 性能契约单次验证）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-002 |
| 用例描述 | 关键词命中标题的搜索 1s 内返回（P95 性能契约单次验证） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-01 |

前置条件：
1. 种子库存在标题含 MRP 的已发布教程

测试步骤：
1. GET /api/tutorials?keyword=MRP，记录响应耗时
1. 断言响应内容与耗时

预期结果：
1. HTTP 200，code=0，命中标题含 MRP 的教程
1. 单次响应耗时 <1000ms（P95<1s 契约的抽样）
1. 仅前台可见池内教程命中

---

### API-NF-LIST-003 关键词命中摘要字段的搜索 1s 内返回

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-003 |
| 用例描述 | 关键词命中摘要字段的搜索 1s 内返回 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-01 |

前置条件：
1. 存在摘要含特定词（如「运算」）的已发布教程，标题与标签不含该词

测试步骤：
1. GET /api/tutorials?keyword=<摘要特征词>，记录响应耗时

预期结果：
1. HTTP 200，返回摘要命中该词的教程
1. 响应耗时 <1000ms
1. 命中范围含标题/摘要/标签三字段任一

---

### API-NF-LIST-004 关键词命中标签字段的搜索 1s 内返回

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-004 |
| 用例描述 | 关键词命中标签字段的搜索 1s 内返回 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-01 |

前置条件：
1. 存在标签含特定词（如「生产」）的已发布教程

测试步骤：
1. GET /api/tutorials?tag=生产 确认目标教程存在
1. GET /api/tutorials?keyword=生产，记录响应耗时

预期结果：
1. HTTP 200，返回标签命中该词的教程
1. 响应耗时 <1000ms

---

### API-NF-LIST-005 中文关键词「算料」检索 1s 内返回命中列表

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-005 |
| 用例描述 | 中文关键词「算料」检索 1s 内返回命中列表 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-01 |

前置条件：
1. 种子库存在标题/摘要/标签含「算料」的已发布教程（如算料相关教程）

测试步骤：
1. GET /api/tutorials?keyword=算料（URL 编码），记录响应耗时

预期结果：
1. HTTP 200，返回命中「算料」的教程列表
1. 响应耗时 <1000ms，中文检索无编码问题

---

### API-NF-LIST-006 关键词无命中时返回空列表与 total=0（空态引导数据源），耗时 <1s

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-006 |
| 用例描述 | 关键词无命中时返回空列表与 total=0（空态引导数据源），耗时 <1s |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-01 |

前置条件：
1. 关键词 zzzz不存在的词 在任何已发布教程三字段中均不出现

测试步骤：
1. GET /api/tutorials?keyword=zzzz不存在的词，记录响应耗时

预期结果：
1. HTTP 200，code=0
1. data.list=[]，data.total=0
1. 响应耗时 <1000ms，空结果不报错

---

### API-NF-LIST-007-E01 关键词携带 SQL 注入串不引发异常且不泄露全量数据

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-007-E01 |
| 用例描述 | 关键词携带 SQL 注入串不引发异常且不泄露全量数据 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 服务正常启动，存在已发布教程

测试步骤：
1. GET /api/tutorials?keyword=' OR '1'='1
1. GET /api/tutorials?keyword='; DROP TABLE tutorials;--

预期结果：
1. 两个请求均不返回 500，不抛数据库错误
1. 返回空结果或按字面量精确匹配的结果，total 不等于全站教程总数（未因注入放大命中集）
1. 数据库表结构未被破坏，后续正常请求可用

---

### API-NF-LIST-008-E02 关键词携带 LIKE 通配符（% 与 _）按安全语义处理不报错

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-008-E02 |
| 用例描述 | 关键词携带 LIKE 通配符（% 与 _）按安全语义处理不报错 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 服务正常启动

测试步骤：
1. GET /api/tutorials?keyword=%
1. GET /api/tutorials?keyword=___

预期结果：
1. 均返回 HTTP 200，不 500
1. 通配符按字面量处理或转义（不得把 % 当通配符返回全量，total 不异常放大；具体语义登记实测结果，若实现为字面匹配则 total=0）

---

### API-NF-LIST-009-B01 关键词超长（1000 字符）搜索不引发 500 且 1s 内返回

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-009-B01 |
| 用例描述 | 关键词超长（1000 字符）搜索不引发 500 且 1s 内返回 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-01 |

前置条件：
1. 服务正常启动

测试步骤：
1. 构造 1000 字符关键词
1. GET /api/tutorials?keyword=<1000字符>，记录响应耗时

预期结果：
1. 不返回 500
1. 返回空结果或正常结果，响应耗时 <1000ms

---

### API-NF-LIST-010 categoryId 筛选命中该分类及其子分类的全部教程（点击宫格/树节点后的列表联动数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-010 |
| 用例描述 | categoryId 筛选命中该分类及其子分类的全部教程（点击宫格/树节点后的列表联动数据源） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-01 |

前置条件：
1. 分类 A（一级）存在子分类 A1，A 与 A1 下均有已发布教程

测试步骤：
1. GET /api/categories 获取分类 A 的 id
1. GET /api/tutorials?categoryId=<A的id>

预期结果：
1. HTTP 200，返回教程的 categoryId 均属于 A 或 A1（命中该分类及其子分类）
1. 不含其他分类教程

---

### API-NF-LIST-011 categoryId 为不存在的 ID 时返回空列表不报错

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-011 |
| 用例描述 | categoryId 为不存在的 ID 时返回空列表不报错 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-01 |

前置条件：
1. 分类 ID 999999 不存在

测试步骤：
1. GET /api/tutorials?categoryId=999999

预期结果：
1. HTTP 200，code=0
1. data.list=[]，data.total=0

---

### API-NF-LIST-012-B02 categoryId 传入非数字（abc）不引发 500

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-012-B02 |
| 用例描述 | categoryId 传入非数字（abc）不引发 500 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-01 |

前置条件：
1. 服务正常启动

测试步骤：
1. GET /api/tutorials?categoryId=abc

预期结果：
1. 不返回 500
1. 返回 400「查询参数不合法」或空列表（两种实现均可接受，登记实测行为，待验证）

---

### API-NF-LIST-013 tag 单值精确筛选仅返回含该标签的教程

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-013 |
| 用例描述 | tag 单值精确筛选仅返回含该标签的教程 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-02 |

前置条件：
1. 存在标签 MRP 的已发布教程与其他无该标签教程

测试步骤：
1. GET /api/tutorials?tag=MRP

预期结果：
1. HTTP 200，返回的每个教程 tags 数组均包含 MRP
1. 不含无该标签的教程

---

### API-NF-LIST-014 tag 多值逗号分隔按交集过滤（同时含全部给出标签）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-014 |
| 用例描述 | tag 多值逗号分隔按交集过滤（同时含全部给出标签） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-02 |

前置条件：
1. 存在同时含 MRP 与 BOM 两标签的教程，也存在仅含 MRP 的教程

测试步骤：
1. GET /api/tutorials?tag=MRP,BOM

预期结果：
1. HTTP 200，返回教程的 tags 同时包含 MRP 与 BOM
1. 仅含 MRP 单标签的教程不返回（交集语义而非并集）

---

### API-NF-LIST-015 tag 多值中包含不存在标签时交集为空返回 total=0

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-015 |
| 用例描述 | tag 多值中包含不存在标签时交集为空返回 total=0 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-02 |

前置条件：
1. 标签 NOTEXIST 在任何教程上均不存在

测试步骤：
1. GET /api/tutorials?tag=MRP,NOTEXIST

预期结果：
1. HTTP 200，data.list=[]，data.total=0（交集语义下不可能命中）

---

### API-NF-LIST-016-B03 tag 传 5 个标签（教程标签上限）的交集筛选正常处理不报错

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-016-B03 |
| 用例描述 | tag 传 5 个标签（教程标签上限）的交集筛选正常处理不报错 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-02 |

前置条件：
1. 存在一个含 5 个标签的已发布教程

测试步骤：
1. GET /api/tutorials?tag=<该教程5个标签逗号拼接>
1. GET /api/tutorials?tag=<其中任4个标签>

预期结果：
1. 两个请求均 HTTP 200 不 500
1. 第一请求命中该教程；第二请求命中含这 4 个标签的教程（含该 5 标签教程）

---

### API-NF-LIST-017 top=1 仅返回置顶教程（置顶角标数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-017 |
| 用例描述 | top=1 仅返回置顶教程（置顶角标数据源） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-01 |

前置条件：
1. 存在 isTop=1 的已发布教程，也存在非置顶教程

测试步骤：
1. GET /api/tutorials?top=1

预期结果：
1. HTTP 200，返回 list 内所有教程 isTop=1
1. 非置顶教程不返回

---

### API-NF-LIST-018 列表排序为置顶优先 → sort 升序 → 更新时间倒序（置顶教程带角标排最前）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-018 |
| 用例描述 | 列表排序为置顶优先 → sort 升序 → 更新时间倒序（置顶教程带角标排最前） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-01 |

前置条件：
1. 同分类或全站列表中存在置顶与多级 sort 值的已发布教程

测试步骤：
1. GET /api/tutorials?pageSize=100
1. 按 isTop/sort/updatedAt 三键校验 list 顺序

预期结果：
1. HTTP 200，list 顺序满足：isTop=1 的教程整体排在 isTop=0 之前（置顶最前，对应置顶角标展示）
1. 同 isTop 组内按 sort 升序
1. sort 相同时按 updatedAt 倒序

---

### API-NF-LIST-019 种子规模契约验证：前台列表 total 落在 16~20 且重复请求计数一致

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-019 |
| 用例描述 | 种子规模契约验证：前台列表 total 落在 16~20 且重复请求计数一致 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-06 |

前置条件：
1. 刚执行完种子初始化（未增删教程，无其他用例污染数据）

测试步骤：
1. GET /api/tutorials（无参），记录 total
1. 再次 GET /api/tutorials，对比两次 total

预期结果：
1. 第一次 total 为 16~20（种子已发布教程数契约）
1. 两次 total 完全一致（重复请求不产生脏数据/重复计数，可重复初始化交付口径的存量表现）

---

### API-NF-LIST-020 审核通过后前台列表下一次请求立即包含新教程（无缓存延迟，支撑小程序下拉刷新拿最新数据）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-020 |
| 用例描述 | 审核通过后前台列表下一次请求立即包含新教程（无缓存延迟，支撑小程序下拉刷新拿最新数据） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-13 |

前置条件：
1. 存在一篇首次待审核教程 T（尚未过审，前台不可见）；admin 已登录

测试步骤：
1. GET /api/tutorials?keyword=<T标题特征词>，确认未命中
1. POST /api/tutorials/<T的id>/review，body {"action":"approve"}，Bearer admin token
1. 立即再次 GET /api/tutorials?keyword=<T标题特征词>

预期结果：
1. 第一次搜索 total=0
1. 审核通过返回 200
1. 第二次搜索立即命中 T（同一数据源即时生效，无需重启服务或重新登录）

---

### API-NF-LIST-021 admin 使用 status=pending 管理参数返回待审核教程及后台扩展字段（审核队列数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-021 |
| 用例描述 | admin 使用 status=pending 管理参数返回待审核教程及后台扩展字段（审核队列数据源） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 已登录；存在待审核教程

测试步骤：
1. GET /api/tutorials?status=pending，Authorization: Bearer <admin token>

预期结果：
1. HTTP 200，返回教程均为待审核状态
1. list 元素含管理扩展字段：status/rejectReason/submitCount/authorId/authorName/hasOnlineVersion/lastOfflineAt/createdAt

---

### API-NF-LIST-022 admin 使用 all=1 返回全状态教程（后台教程列表四态全展示）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-022 |
| 用例描述 | admin 使用 all=1 返回全状态教程（后台教程列表四态全展示） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 已登录；库中存在草稿/待审核/已发布/已下架四种状态教程

测试步骤：
1. GET /api/tutorials?all=1，Bearer <admin token>
1. GET /api/tutorials（无管理参数）对比 total

预期结果：
1. HTTP 200，返回 list 覆盖 draft/pending/published/offline 四种 status
1. all=1 的 total 大于前台可见池 total（含草稿与已下架）

---

### API-NF-LIST-023 status=draft/published/offline 三种筛选各自仅返回对应状态教程

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-023 |
| 用例描述 | status=draft/published/offline 三种筛选各自仅返回对应状态教程 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 已登录；四态教程齐备

测试步骤：
1. GET /api/tutorials?status=draft，Bearer <admin token>
1. GET /api/tutorials?status=published，Bearer <admin token>
1. GET /api/tutorials?status=offline，Bearer <admin token>

预期结果：
1. 三个请求均 HTTP 200
1. 每个请求返回的 list 中所有元素 status 与请求参数一致

---

### API-NF-LIST-024 后台列表复合筛选 status+categoryId+keyword 组合条件同时生效

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-024 |
| 用例描述 | 后台列表复合筛选 status+categoryId+keyword 组合条件同时生效 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 已登录；某分类下存在标题含特征词的已发布教程与草稿教程

测试步骤：
1. GET /api/tutorials?status=published&categoryId=<分类id>&keyword=<特征词>，Bearer <admin token>

预期结果：
1. HTTP 200，返回教程同时满足：status=published、属于该分类（含子分类）、三字段任一命中关键词
1. 同分类同关键词的草稿教程不返回

---

### API-NF-LIST-025-E03 未登录使用 status 管理参数返回 401（后台接口鉴权全覆盖）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-025-E03 |
| 用例描述 | 未登录使用 status 管理参数返回 401（后台接口鉴权全覆盖） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 不携带任何登录态

测试步骤：
1. GET /api/tutorials?status=pending（无 Authorization）

预期结果：
1. HTTP 401，code=401，message=「未登录或登录已失效」
1. 不返回任何教程数据

---

### API-NF-LIST-026-E04 未登录使用 all=1 管理参数返回 401

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-026-E04 |
| 用例描述 | 未登录使用 all=1 管理参数返回 401 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 不携带任何登录态

测试步骤：
1. GET /api/tutorials?all=1（无 Authorization）

预期结果：
1. HTTP 401，code=401，message=「未登录或登录已失效」
1. 草稿/已下架等非公开数据不泄露

---

### API-NF-LIST-027-E05 user 角色登录后使用管理参数返回 403 无权限执行该操作

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-027-E05 |
| 用例描述 | user 角色登录后使用管理参数返回 403 无权限执行该操作 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 普通用户（role=user）已通过选角色登录获得 token

测试步骤：
1. GET /api/tutorials?status=pending，Authorization: Bearer <user token>

预期结果：
1. HTTP 403，code=403，message=「无权限执行该操作」
1. 不返回管理口径数据

---

### API-NF-LIST-028 status 传枚举外非法值返回 400 查询参数不合法

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-028 |
| 用例描述 | status 传枚举外非法值返回 400 查询参数不合法 |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 已登录

测试步骤：
1. GET /api/tutorials?status=invalid，Bearer <admin token>

预期结果：
1. HTTP 400，code=400，message=「查询参数不合法」

---

### API-NF-LIST-029-B04 page=0 低于下界返回 400 查询参数不合法（page 须 ≥1）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-029-B04 |
| 用例描述 | page=0 低于下界返回 400 查询参数不合法（page 须 ≥1） |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. 无特殊前置

测试步骤：
1. GET /api/tutorials?page=0

预期结果：
1. HTTP 400，code=400，message=「查询参数不合法」

---

### API-NF-LIST-030-B05 pageSize 上界 100 与越界 101 的边界行为（1-100 区间校验）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-030-B05 |
| 用例描述 | pageSize 上界 100 与越界 101 的边界行为（1-100 区间校验） |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. 前台可见教程数不少于 1 篇

测试步骤：
1. GET /api/tutorials?pageSize=100
1. GET /api/tutorials?pageSize=101
1. GET /api/tutorials?pageSize=1

预期结果：
1. pageSize=100 返回 HTTP 200，data.pageSize=100（上界合法）
1. pageSize=101 返回 HTTP 400「查询参数不合法」（越界拒绝）
1. pageSize=1 返回 HTTP 200，list 长度=1（下界合法）

---

### API-NF-LIST-031-B06 page 超过最大页返回空列表不报错（越界空页）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-031-B06 |
| 用例描述 | page 超过最大页返回空列表不报错（越界空页） |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. 前台可见教程 total 为已知值 N（如 20）

测试步骤：
1. GET /api/tutorials?page=9999

预期结果：
1. HTTP 200，code=0
1. data.list=[]，data.total 仍为 N（total 不随页码变化）

---

### API-NF-LIST-032 status 与 all 同时传参时以 status 为准（互斥规则）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-032 |
| 用例描述 | status 与 all 同时传参时以 status 为准（互斥规则） |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 已登录；存在非 pending 状态教程

测试步骤：
1. GET /api/tutorials?all=1&status=pending，Bearer <admin token>

预期结果：
1. HTTP 200，返回 list 仅含 pending 状态教程（all 被 status 覆盖）
1. 不返回 draft/published/offline 教程

---

### API-NF-LIST-033 ERP 模块卡入口命中集：erpModule 映射分类下的教程可经 categoryId 检索（查看教程跳转数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-033 |
| 用例描述 | ERP 模块卡入口命中集：erpModule 映射分类下的教程可经 categoryId 检索（查看教程跳转数据源） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-14 |

前置条件：
1. 存在 erpModule=purchase 的启用分类且其下有已发布教程

测试步骤：
1. GET /api/categories 找到 erpModule=purchase 的分类 id
1. GET /api/tutorials?categoryId=<该id>

预期结果：
1. HTTP 200，返回该模块映射分类下的已发布教程
1. 模拟工作台「查看教程」按钮跳转列表页并选中该分类的取数链路成立

---

### API-NF-LIST-034 桌面 UA 与移动 UA 请求同一列表返回一致数据（接口无客户端分支，375px 适配由前端承担）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-034 |
| 用例描述 | 桌面 UA 与移动 UA 请求同一列表返回一致数据（接口无客户端分支，375px 适配由前端承担） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-03 |

前置条件：
1. 种子库已初始化

测试步骤：
1. GET /api/tutorials?pageSize=10，User-Agent: <桌面 Chrome UA>
1. GET /api/tutorials?pageSize=10，User-Agent: <iPhone Safari 移动 UA（375px 机型）>
1. 对比两次响应

预期结果：
1. 两次均 HTTP 200，code=0
1. 两次 list 逐条一致（id/顺序/total 相同），字段结构无客户端差异化分支

---

### API-NF-LIST-035 百级教程量下关键词搜索 P95 响应时间 <1s（性能指标统计验证）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-035 |
| 用例描述 | 百级教程量下关键词搜索 P95 响应时间 <1s（性能指标统计验证） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-01 |

前置条件：
1. 数据规模达百级教程量（在种子基础上扩充至 ≥100 篇已发布教程；若执行环境受限则登记实际规模）

测试步骤：
1. 准备 ≥10 个不同关键词（覆盖标题/摘要/标签命中与无命中）
1. 对每个关键词各执行 2 次 GET /api/tutorials?keyword=<词>，共 ≥20 次请求，记录每次耗时
1. 计算耗时的 P95 分位

预期结果：
1. 所有请求 HTTP 200，无超时与 5xx
1. P95 响应时间 <1000ms
1. 在测试报告登记实测数据规模与 P95 数值

---

### API-NF-LIST-036 列表卡片计数字段（浏览/收藏/有帮助/没帮助/分享）均为非负整数（反馈占比标红计算的数据源完整性）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-036 |
| 用例描述 | 列表卡片计数字段（浏览/收藏/有帮助/没帮助/分享）均为非负整数（反馈占比标红计算的数据源完整性） |
| 优先级 | P2 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-03 |

前置条件：
1. 存在已产生浏览/收藏/评价数据的已发布教程

测试步骤：
1. GET /api/tutorials?pageSize=100
1. 逐条校验 list 元素计数字段类型与取值

预期结果：
1. viewCount/favCount/helpfulYes/helpfulNo/shareCount 均为整数且 ≥0
1. helpfulYes 与 helpfulNo 可直接用于「没帮助占比 = 没帮助 ÷（有帮助+没帮助）」的红标计算（分母为 0 时由前端显示「—」）

---

### API-NF-LIST-037 hasOnlineVersion 字段区分纯草稿与曾过审教程（删除保护判定依据）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-037 |
| 用例描述 | hasOnlineVersion 字段区分纯草稿与曾过审教程（删除保护判定依据） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-07 |

前置条件：
1. admin 已登录；存在从未提审的纯草稿与已发布教程各一篇

测试步骤：
1. GET /api/tutorials?all=1，Bearer <admin token>
1. 取纯草稿与已发布教程两条记录对比 hasOnlineVersion

预期结果：
1. 纯草稿（从未过审）hasOnlineVersion=false（后台删除操作仅对此类可用）
1. 已发布教程 hasOnlineVersion=true（存在线上过审版本，不提供删除入口）

---

### API-NF-LIST-038 submitCount 字段支撑审核队列修改版（v2+）标识：首次提审=1、编辑回审 ≥2

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-038 |
| 用例描述 | submitCount 字段支撑审核队列修改版（v2+）标识：首次提审=1、编辑回审 ≥2 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-09 |

前置条件：
1. admin 已登录；教程 A 为首次提审（submitCount=1）；教程 B 已发布一次后被运营编辑保存进入回审（submitCount≥2）

测试步骤：
1. GET /api/tutorials?status=pending，Bearer <admin token>
1. 对比 A 与 B 的 submitCount

预期结果：
1. A 的 submitCount=1（首次提交，无修改版标识）
1. B 的 submitCount≥2（存在线上过审版本的回审提交，前端显示修改版 v2+ 标识）

---

### API-NF-LIST-039 驳回原因列数据源：被驳回过的草稿 rejectReason 非空、未驳回过为 null

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-039 |
| 用例描述 | 驳回原因列数据源：被驳回过的草稿 rejectReason 非空、未驳回过为 null |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-07 |

前置条件：
1. admin 已登录；教程 C 曾被驳回（带原因）现处草稿态；教程 D 为从未被驳回的新建草稿

测试步骤：
1. GET /api/tutorials?status=draft，Bearer <admin token>
1. 对比 C 与 D 的 rejectReason

预期结果：
1. C 的 rejectReason 为驳回时提交的原文（非空字符串）
1. D 的 rejectReason=null
1. 后台列表驳回原因列可按此字段渲染

---

### API-NF-LIST-040 tags 字段为 JSON 数组反序列化结果且元素数 ≤5（标签筛选数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-LIST-040 |
| 用例描述 | tags 字段为 JSON 数组反序列化结果且元素数 ≤5（标签筛选数据源） |
| 优先级 | P2 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-02 |

前置条件：
1. 存在带标签的已发布教程

测试步骤：
1. GET /api/tutorials
1. 校验 list 元素 tags 字段

预期结果：
1. tags 为 JSON 数组（非字符串），元素为字符串
1. 每条教程 tags 长度 0~5（不超过标签上限 5）

---

### API-NF-DETAIL-001 游客打开已发布教程详情 2s 内返回全字段（首屏数据一次到位）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-001 |
| 用例描述 | 游客打开已发布教程详情 2s 内返回全字段（首屏数据一次到位） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-02 |

前置条件：
1. 存在已发布教程 T（content/summary 有线上过审快照）

测试步骤：
1. GET /api/tutorials/<T的id>（不携带 Authorization），记录响应耗时

预期结果：
1. HTTP 200，code=0，响应耗时 <2000ms
1. data.content 与 data.summary 为线上过审版本快照内容（非空）
1. 含 title/videoUrl/tags/categoryId/categoryName/isTop/sort/viewCount/favCount/helpfulYes/helpfulNo/shareCount/publishedAt/updatedAt/prev/next/related 字段

---

### API-NF-DETAIL-002 content 为完整 HTML 单次返回（弱网文字先行渲染的服务端前提）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-002 |
| 用例描述 | content 为完整 HTML 单次返回（弱网文字先行渲染的服务端前提） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-05 |

前置条件：
1. 存在图文正文含文字段落与图片标签的已发布教程

测试步骤：
1. GET /api/tutorials/<教程id>
1. 检查 data.content 结构

预期结果：
1. HTTP 200，content 为非空 HTML 字符串，正文文字与 <img> 标签在同一字段内一次返回
1. 图片不依赖额外的阻塞式接口分片加载（前端可先渲染文字后懒加载图片）

---

### API-NF-DETAIL-003 videoUrl 为纯 URL 数据字段且响应不含自动播放指令（视频不自动播放契约）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-003 |
| 用例描述 | videoUrl 为纯 URL 数据字段且响应不含自动播放指令（视频不自动播放契约） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-05 |

前置条件：
1. 存在 videoUrl 非 null 的已发布教程

测试步骤：
1. GET /api/tutorials/<教程id>
1. 检查 data.videoUrl 及响应体结构

预期结果：
1. HTTP 200，data.videoUrl 为 mp4 直链字符串（或 null）
1. 响应体不含 autoplay 标志或任何播放控制指令字段（是否播放由前端控制，仅提示流量）

---

### API-NF-DETAIL-004 未登录访问详情返回 200 且 myFavorite/myFeedback/myProgress 均为 null

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-004 |
| 用例描述 | 未登录访问详情返回 200 且 myFavorite/myFeedback/myProgress 均为 null |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-15 |

前置条件：
1. 存在已发布教程

测试步骤：
1. GET /api/tutorials/<教程id>（无 Authorization）

预期结果：
1. HTTP 200（游客可浏览详情，全局入口无需登录）
1. data.myFavorite=null，data.myFeedback=null，data.myProgress=null（无个性化数据返回）

---

### API-NF-DETAIL-005 已收藏用户携带登录态请求详情返回 myFavorite=true（收藏按钮选中态数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-005 |
| 用例描述 | 已收藏用户携带登录态请求详情返回 myFavorite=true（收藏按钮选中态数据源） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-06 |

前置条件：
1. 用户 U 已登录并已收藏教程 T（可先 POST /api/favorites/<T的id> 构造）

测试步骤：
1. POST /api/favorites/<T的id>，Authorization: Bearer <U的token>
1. GET /api/tutorials/<T的id>，携带同一 token

预期结果：
1. 第一步收藏成功（HTTP 200，favorited=true）
1. 第二步 HTTP 200，data.myFavorite=true（详情接口与收藏接口数据联动，刷新后一致）

---

### API-NF-DETAIL-006 myFeedback 字段返回评价状态（1 有帮助 / 0 没帮助 / null 未评价，二选一互斥数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-006 |
| 用例描述 | myFeedback 字段返回评价状态（1 有帮助 / 0 没帮助 / null 未评价，二选一互斥数据源） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-07 |

前置条件：
1. 用户 U1 已对教程 T 评价「有帮助」；用户 U2 已评价「没帮助」；用户 U3 未评价

测试步骤：
1. GET /api/tutorials/<T的id>，Bearer <U1 token>
1. GET /api/tutorials/<T的id>，Bearer <U2 token>
1. GET /api/tutorials/<T的id>，Bearer <U3 token>

预期结果：
1. U1 请求返回 myFeedback=1（有帮助选中态）
1. U2 请求返回 myFeedback=0（没帮助选中态）
1. U3 请求返回 myFeedback=null（未评价，两按钮均未选中）

---

### API-NF-DETAIL-007 myProgress 返回 0-100 整数阅读进度（继续阅读提示数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-007 |
| 用例描述 | myProgress 返回 0-100 整数阅读进度（继续阅读提示数据源） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-11 |

前置条件：
1. 用户 U 曾阅读教程 T 至 60%（已有进度记录）

测试步骤：
1. GET /api/tutorials/<T的id>，Authorization: Bearer <U的token>

预期结果：
1. HTTP 200，data.myProgress=60（0-100 整数，跨端取最新值）
1. 前端据此弹出「继续阅读」提示并定位上次位置

---

### API-NF-DETAIL-008 myProgress 边界：无记录为 null、进度 100 为满分值

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-008 |
| 用例描述 | myProgress 边界：无记录为 null、进度 100 为满分值 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-11 |

前置条件：
1. 用户 U 对教程 T1 无阅读记录；对教程 T2 阅读进度已达 100%

测试步骤：
1. GET /api/tutorials/<T1的id>，Bearer <U token>
1. GET /api/tutorials/<T2的id>，Bearer <U token>

预期结果：
1. T1 返回 myProgress=null（无记录，不弹继续阅读）
1. T2 返回 myProgress=100（进度上界，完成口径）

---

### API-NF-DETAIL-009 每次成功打开详情 viewCount +1（打开即计、不去重、含游客，与首屏 <2s 同请求完成）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-009 |
| 用例描述 | 每次成功打开详情 viewCount +1（打开即计、不去重、含游客，与首屏 <2s 同请求完成） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-02 |

前置条件：
1. 存在已发布教程 T，记录当前 viewCount 基线（可从首次响应获取）

测试步骤：
1. GET /api/tutorials/<T的id>，记录 data.viewCount 为 V1
1. 再次 GET /api/tutorials/<T的id>（游客态），记录 viewCount 为 V2

预期结果：
1. 两次均 HTTP 200 且耗时 <2000ms
1. V2=V1+1（每次成功打开 +1，不去重）

---

### API-NF-DETAIL-010 同分类中间教程返回相邻 prev 与 next（上下篇跳转数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-010 |
| 用例描述 | 同分类中间教程返回相邻 prev 与 next（上下篇跳转数据源） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-05 |

前置条件：
1. 同启用分类下存在 ≥3 篇前台可见教程；已知列表排序（isTop DESC→sort ASC→updated_at DESC）

测试步骤：
1. GET /api/tutorials?categoryId=<分类id>&pageSize=100 获取排序后的教程序列
1. 取序列中间位置教程 M，GET /api/tutorials/<M的id>

预期结果：
1. HTTP 200，data.prev 与 data.next 均非 null
1. prev.id=序列中 M 的前一篇 id，next.id=序列中 M 的后一篇 id（同分类可见池内相邻）

---

### API-NF-DETAIL-011 分类内首篇 prev=null、末篇 next=null（上下篇按钮置灰数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-011 |
| 用例描述 | 分类内首篇 prev=null、末篇 next=null（上下篇按钮置灰数据源） |
| 优先级 | P0 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-05 |

前置条件：
1. 同分类下存在 ≥2 篇前台可见教程，已知排序序列的首篇 F 与末篇 L

测试步骤：
1. GET /api/tutorials/<F的id>
1. GET /api/tutorials/<L的id>

预期结果：
1. F 的响应 data.prev=null（首篇无上一篇），next 非空
1. L 的响应 data.next=null（末篇无下一篇），prev 非空
1. 前端据此将对应按钮置灰不可点击

---

### API-NF-DETAIL-012 related 关联推荐返回同分类可见教程 4 篇（排除本篇、浏览量倒序）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-012 |
| 用例描述 | related 关联推荐返回同分类可见教程 4 篇（排除本篇、浏览量倒序） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-16 |

前置条件：
1. 分类 C 下存在本篇教程 T 与 ≥5 篇其他前台可见教程

测试步骤：
1. GET /api/tutorials/<T的id>
1. 校验 data.related

预期结果：
1. HTTP 200，related 长度=4
1. related 内所有教程与 T 同分类、均前台可见、且不含 T 本身
1. related 按 viewCount 倒序排列
1. 元素含 id/title/summary/viewCount 字段（可点击跳转对应详情）

---

### API-NF-DETAIL-013 同分类可见教程不足 4 篇时 related 返回实际数量（仅本篇时为空数组）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-013 |
| 用例描述 | 同分类可见教程不足 4 篇时 related 返回实际数量（仅本篇时为空数组） |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-16 |

前置条件：
1. 分类 C1 下仅有 2 篇可见教程（含本篇 T1）；分类 C2 下仅有 1 篇可见教程（即本篇 T2）

测试步骤：
1. GET /api/tutorials/<T1的id>
1. GET /api/tutorials/<T2的id>

预期结果：
1. T1 的 related 长度=1（仅另 1 篇，排除本篇后取实际）
1. T2 的 related=[]（排除本篇后无可推荐）

---

### API-NF-DETAIL-014 content 含多级标题标签（h2/h3）支撑侧边目录锚点导航生成

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-014 |
| 用例描述 | content 含多级标题标签（h2/h3）支撑侧边目录锚点导航生成 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-03 |

前置条件：
1. 存在正文按多级标题组织的已发布教程（如含 <h2> 与 <h3> 小节）

测试步骤：
1. GET /api/tutorials/<教程id>
1. 解析 data.content 中的标题标签结构

预期结果：
1. HTTP 200，content 含标题标签且层级结构完整（标题文本不缺失）
1. 前端可据此生成侧边目录并在点击时平滑滚动定位到对应标题

---

### API-NF-DETAIL-015 content 含步骤序号结构（ol/li）支撑步骤式引导与勾选进度渲染

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-015 |
| 用例描述 | content 含步骤序号结构（ol/li）支撑步骤式引导与勾选进度渲染 |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-10 |

前置条件：
1. 存在步骤式正文的已发布教程（如 <ol><li> 步骤列表）

测试步骤：
1. GET /api/tutorials/<教程id>
1. 解析 data.content 中的列表标签

预期结果：
1. HTTP 200，content 保留有序列表结构与步骤文本（步骤序号与文字内容不缺失）
1. 前端可按步骤标题拆分渲染步骤序号与进度条（勾选后进度百分比更新并保存）

---

### API-NF-DETAIL-016 同一教程连续两次请求 content 逐字节一致（字号档位为纯前端本地状态，与服务端数据解耦）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-016 |
| 用例描述 | 同一教程连续两次请求 content 逐字节一致（字号档位为纯前端本地状态，与服务端数据解耦） |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-04 |

前置条件：
1. 存在已发布教程

测试步骤：
1. GET /api/tutorials/<教程id>，记录 content 为 C1
1. GET /api/tutorials/<教程id>，记录 content 为 C2
1. 对比 C1 与 C2

预期结果：
1. 两次 HTTP 200
1. C1 与 C2 完全一致（三档字号切换与本地记忆不影响接口数据，仅前端正文区域样式变化）

---

### API-NF-DETAIL-017 已下架教程直达详情返回 404 该教程已下架 并携带提示页数据（reason=offline 与同类推荐）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-017 |
| 用例描述 | 已下架教程直达详情返回 404 该教程已下架 并携带提示页数据（reason=offline 与同类推荐） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-02 |

前置条件：
1. 教程 T 曾发布（存在线上过审版本）后被 admin 下架（POST /api/tutorials/<T的id>/offline）

测试步骤：
1. POST /api/tutorials/<T的id>/offline，Bearer <admin token>，body {}
1. GET /api/tutorials/<T的id>

预期结果：
1. 下架请求 HTTP 200，status=offline
1. 详情请求 HTTP 404，code=404，message=「该教程已下架」
1. data.reason=offline，data.related 为同分类前台可见教程推荐（非空）
1. 响应不含 content/publishedAt 等正文字段（正文不可见）

---

### API-NF-DETAIL-018 纯草稿/首次待审核教程详情返回 404 该教程不存在或暂不可见（不可见内容不泄露）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-018 |
| 用例描述 | 纯草稿/首次待审核教程详情返回 404 该教程不存在或暂不可见（不可见内容不泄露） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 存在从未通过审核的纯草稿教程 D（admin 可经 all=1 获取其 id）；存在首次提审的待审核教程 P

测试步骤：
1. GET /api/tutorials/<D的id>
1. GET /api/tutorials/<P的id>

预期结果：
1. 两个请求均 HTTP 404，code=404，message=「该教程不存在或暂不可见」
1. 响应不含正文/摘要等任何内容数据（未发布内容不可经详情接口探测）

---

### API-NF-DETAIL-019 教程 id 不存在时详情返回 404 该教程不存在或暂不可见

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-019 |
| 用例描述 | 教程 id 不存在时详情返回 404 该教程不存在或暂不可见 |
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
1. HTTP 404，code=404，message=「该教程不存在或暂不可见」
1. 不返回 data 内容字段

---

### API-NF-DETAIL-020 桌面 UA 与移动 UA 请求同一详情返回一致数据（PC/小程序同数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-020 |
| 用例描述 | 桌面 UA 与移动 UA 请求同一详情返回一致数据（PC/小程序同数据源） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-03 |

前置条件：
1. 存在已发布教程 T

测试步骤：
1. GET /api/tutorials/<T的id>，User-Agent: <桌面 Chrome UA>
1. GET /api/tutorials/<T的id>，User-Agent: <移动端 Safari UA（375px 机型）>
1. 对比两次响应正文数据字段

预期结果：
1. 两次均 HTTP 200
1. content/summary/viewCount 基线一致（viewCount 各自 +1 属预期计数）、结构一致
1. 接口对客户端类型无差异化分支（跨端一致性由同一数据源保证）

---

### API-NF-DETAIL-021 正文含 script 标签的教程详情以 JSON 数据载荷返回不执行（脚本剥离契约的接口边界）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-021 |
| 用例描述 | 正文含 script 标签的教程详情以 JSON 数据载荷返回不执行（脚本剥离契约的接口边界） |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 已构造正文含 <script>alert(1)</script> 片段且已过审发布的教程 S（经后台编辑器写入并审核通过）

测试步骤：
1. GET /api/tutorials/<S的id>
1. 检查响应 Content-Type 与 data.content

预期结果：
1. HTTP 200，响应 Content-Type 为 application/json（脚本只作为字符串数据存在，无服务端执行路径）
1. 若后台保存时未剥离，content 中 <script> 以文本形式原样出现在 JSON 字符串内，浏览器不执行（渲染前剥离由前端执行）；若后台保存时已剥离，则 content 中不含 <script>——两种实现均满足防注入目标，登记实测行为

---

### API-NF-DETAIL-022 videoUrl=null 的纯图文教程详情正常返回（视频占位判定数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-022 |
| 用例描述 | videoUrl=null 的纯图文教程详情正常返回（视频占位判定数据源） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-06 |

前置条件：
1. 存在无视频外链（videoUrl=null）的已发布教程

测试步骤：
1. GET /api/tutorials/<教程id>

预期结果：
1. HTTP 200，data.videoUrl=null
1. content/summary 等其余字段正常返回（无视频不阻塞图文展示，前端视频区按占位处理）

---

### API-NF-DETAIL-023 videoUrl 为失效/非 mp4 链接时详情仍返回原值（可用性判定在前端加载层）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-023 |
| 用例描述 | videoUrl 为失效/非 mp4 链接时详情仍返回原值（可用性判定在前端加载层） |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-06 |

前置条件：
1. 已构造 videoUrl 指向失效地址（如 https://invalid.example/x.mp4 或非 mp4 直链）的已发布教程

测试步骤：
1. GET /api/tutorials/<教程id>

预期结果：
1. HTTP 200，data.videoUrl 原样返回写入值（接口不校验外链可达性）
1. 正文 content 完整返回（视频失效不阻断图文，「视频暂不可用」占位由前端加载失败时展示）

---

### API-NF-DETAIL-024 详情与列表的 helpfulYes/helpfulNo 数值一致（红标占比计算数据源可对账）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-024 |
| 用例描述 | 详情与列表的 helpfulYes/helpfulNo 数值一致（红标占比计算数据源可对账） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-03 |

前置条件：
1. 存在已产生评价数据（有帮助与没帮助均 >0）的已发布教程 T

测试步骤：
1. GET /api/tutorials?keyword=<T标题特征>，取该条 helpfulYes/helpfulNo
1. GET /api/tutorials/<T的id>，取 data.helpfulYes/helpfulNo

预期结果：
1. 两次均 HTTP 200
1. 两接口返回的 helpfulYes/helpfulNo 完全一致（「没帮助占比 = 没帮助 ÷（有帮助+没帮助）」在任一数据源计算结果相同，>50% 由前端标红）

---

### API-NF-DETAIL-025 shareCount 字段存在且为非负整数（分享计数数据留存契约）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-025 |
| 用例描述 | shareCount 字段存在且为非负整数（分享计数数据留存契约） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-09 |

前置条件：
1. 存在已发布教程

测试步骤：
1. GET /api/tutorials/<教程id>
1. 校验 data.shareCount

预期结果：
1. HTTP 200，data.shareCount 为整数且 ≥0（分享动作本期仅数据留存，分享弹窗/复制链接由前端承载）

---

### API-NF-DETAIL-026 首次待审教程审核通过后详情立即 200 可见（无需重启或重新登录）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-026 |
| 用例描述 | 首次待审教程审核通过后详情立即 200 可见（无需重启或重新登录） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-13 |

前置条件：
1. 教程 P 为首次待审核（此前详情 404）；admin 已登录

测试步骤：
1. GET /api/tutorials/<P的id>，确认 404
1. POST /api/tutorials/<P的id>/review，body {"action":"approve"}，Bearer <admin token>
1. 立即 GET /api/tutorials/<P的id>

预期结果：
1. 第一步 HTTP 404
1. 审核通过 HTTP 200，status=published
1. 第三步 HTTP 200，content 返回过审内容（即时生效，刷新即最新数据）

---

### API-NF-DETAIL-027 携带无效 token 请求公开详情不破坏正常响应（登录态异常兜底）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-027 |
| 用例描述 | 携带无效 token 请求公开详情不破坏正常响应（登录态异常兜底） |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 存在已发布教程 T；持有格式合法但未登记的 token（如 0123456789abcdef）

测试步骤：
1. GET /api/tutorials/<T的id>，Authorization: Bearer 0123456789abcdef

预期结果：
1. 返回 HTTP 200（按游客口径忽略无效登录态，my* 为 null）或 HTTP 401「未登录或登录已失效」（拒绝无效凭据），两种实现均不 500——登记实测行为（待验证）

---

### API-NF-DETAIL-028 all=1 管理口径返回当前编辑值且不计浏览量、prev/next 为 null（后台编辑器/审核队列取数）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-028 |
| 用例描述 | all=1 管理口径返回当前编辑值且不计浏览量、prev/next 为 null（后台编辑器/审核队列取数） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 或 operator 已登录；教程 T 处于待审核且当前编辑值与线上快照不同（已发布教程回审场景）

测试步骤：
1. GET /api/tutorials/<T的id>?all=1，Bearer <管理token>，连续两次
1. 对比 data.content 与公开口径（不带 all）的 content

预期结果：
1. HTTP 200，返回当前编辑值 content/summary（工作列，非 published_content 快照）
1. 两次请求 viewCount 不变（管理口径不计数）
1. data.prev=null 且 data.next=null

---

### API-NF-DETAIL-029 未登录使用 all=1 管理口径参数被拒绝（管理数据不泄露）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-029 |
| 用例描述 | 未登录使用 all=1 管理口径参数被拒绝（管理数据不泄露） |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 不携带登录态；存在处于编辑中（如待审核）的教程 T

测试步骤：
1. GET /api/tutorials/<T的id>?all=1（无 Authorization）

预期结果：
1. 非 200：返回 401「未登录或登录已失效」（参照管理参数鉴权规则；404 亦可接受——不可见教程不暴露存在性；登记实测行为，待验证）
1. 无论如何不返回当前编辑值 content

---

### API-NF-DETAIL-030 教程 id 传非数字（/api/tutorials/abc）不引发 500

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-030 |
| 用例描述 | 教程 id 传非数字（/api/tutorials/abc）不引发 500 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-02 |

前置条件：
1. 服务正常启动

测试步骤：
1. GET /api/tutorials/abc

预期结果：
1. 不返回 500
1. 返回 404「该教程不存在或暂不可见」或 400「查询参数不合法」（登记实测行为，待验证）

---

### API-NF-DETAIL-031 已发布教程编辑回审期间详情持续返回线上过审旧版快照（前台不断供）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-DETAIL-031 |
| 用例描述 | 已发布教程编辑回审期间详情持续返回线上过审旧版快照（前台不断供） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-02 |

前置条件：
1. 教程 T 已发布（线上版本 v1，记录其 content 特征）；运营在后台编辑器保存修改（含新内容特征 v2）使 T 进入待审核（回审来源=已发布态）

测试步骤：
1. GET /api/tutorials/<T的id>

预期结果：
1. HTTP 200（回审期间前台持续展示）
1. data.content 为线上过审版本 v1（published_content 快照），不含 v2 编辑内容
1. data.summary 同为线上快照摘要

---

### API-NF-REVIEW-001 admin 审核通过待审核教程返回 published 与完整审核留痕（审核人/审核时间/发布时间）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-001 |
| 用例描述 | admin 审核通过待审核教程返回 published 与完整审核留痕（审核人/审核时间/发布时间） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. admin 已登录；存在待审核教程 T

测试步骤：
1. POST /api/tutorials/<T的id>/review，Bearer <admin token>
1. 请求体 {"action":"approve"}

预期结果：
1. HTTP 200，code=0，data.status=published
1. data.publishedAt 为非空时间字符串（快照发布时间）
1. data.reviewerId=admin 的用户 id，data.reviewedAt 为非空时间字符串（管理操作留痕）

---

### API-NF-REVIEW-002 admin 驳回待审核教程返回 draft 与驳回原因原文（作者可见留痕）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-002 |
| 用例描述 | admin 驳回待审核教程返回 draft 与驳回原因原文（作者可见留痕） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. admin 已登录；存在待审核教程 T

测试步骤：
1. POST /api/tutorials/<T的id>/review，Bearer <admin token>
1. 请求体 {"action":"reject","reason":"正文步骤缺少截图说明，请补充后重提"}

预期结果：
1. HTTP 200，code=0，data.status=draft
1. data.rejectReason 与提交的 reason 逐字一致（驱动作者在编辑页顶部可见并修改重提）

---

### API-NF-REVIEW-003-E01 驳回时 reason 缺失返回 400 请填写至少 5 个字的驳回原因（后端双重校验）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-003-E01 |
| 用例描述 | 驳回时 reason 缺失返回 400 请填写至少 5 个字的驳回原因（后端双重校验） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-19 |

前置条件：
1. admin 已登录；存在待审核教程 T

测试步骤：
1. POST /api/tutorials/<T的id>/review，body {"action":"reject"}（不携带 reason）
1. POST /api/tutorials/<T的id>/review，body {"action":"reject","reason":""}（空串）

预期结果：
1. 两个请求均 HTTP 400，code=400，message=「请填写至少 5 个字的驳回原因」
1. 教程状态不发生变化（仍为待审核，可用 GET /api/tutorials?status=pending 复核）

---

### API-NF-REVIEW-004-B01 驳回原因 5 字边界：4 字被拒绝、恰 5 字通过

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-004-B01 |
| 用例描述 | 驳回原因 5 字边界：4 字被拒绝、恰 5 字通过 |
| 优先级 | P0 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-19 |

前置条件：
1. admin 已登录；存在两篇待审核教程 T1 与 T2

测试步骤：
1. POST /api/tutorials/<T1的id>/review，body {"action":"reject","reason":"内容太浅"}（4 字）
1. POST /api/tutorials/<T2的id>/review，body {"action":"reject","reason":"正文内容太浅"}（5 字）

预期结果：
1. T1 请求 HTTP 400「请填写至少 5 个字的驳回原因」，T1 状态仍为待审核
1. T2 请求 HTTP 200，data.status=draft，rejectReason=「正文内容太浅」（下界含 5 字通过）

---

### API-NF-REVIEW-005-E02 action 缺失或传枚举外非法值返回 400 action 参数不合法

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-005-E02 |
| 用例描述 | action 缺失或传枚举外非法值返回 400 action 参数不合法 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 已登录；存在待审核教程 T

测试步骤：
1. POST /api/tutorials/<T的id>/review，body {}（action 缺失）
1. POST /api/tutorials/<T的id>/review，body {"action":"pass"}（非法枚举）

预期结果：
1. 两个请求均 HTTP 400，code=400，message=「action 参数不合法」
1. 教程状态不变（仍待审核）

---

### API-NF-REVIEW-006-E03 未登录调用审核接口返回 401（后台鉴权全覆盖）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-006-E03 |
| 用例描述 | 未登录调用审核接口返回 401（后台鉴权全覆盖） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 不携带登录态；存在待审核教程 T

测试步骤：
1. POST /api/tutorials/<T的id>/review，body {"action":"approve"}（无 Authorization）

预期结果：
1. HTTP 401，code=401，message=「未登录或登录已失效」
1. 教程状态不变（仍待审核）

---

### API-NF-REVIEW-007-E04 operator 调用审核接口返回 403 且教程状态不变化（审核为管理员专属）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-007-E04 |
| 用例描述 | operator 调用审核接口返回 403 且教程状态不变化（审核为管理员专属） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. operator 已登录；存在待审核教程 T

测试步骤：
1. POST /api/tutorials/<T的id>/review，Bearer <operator token>，body {"action":"approve"}
1. GET /api/tutorials?status=pending，Bearer <admin token>，确认 T 仍在队列

预期结果：
1. 第一步 HTTP 403，code=403，message=「无权限执行该操作」
1. 第二步返回的待审核列表仍包含 T（状态未发生任何变化）

---

### API-NF-REVIEW-008-E05 普通用户（user 角色）调用审核接口返回 403

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-008-E05 |
| 用例描述 | 普通用户（user 角色）调用审核接口返回 403 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 普通用户已通过选角色登录获得 token

测试步骤：
1. POST /api/tutorials/<待审教程id>/review，Bearer <user token>，body {"action":"approve"}

预期结果：
1. HTTP 403，code=403，message=「无权限执行该操作」
1. 教程状态不变

---

### API-NF-REVIEW-009 审核不存在的教程 id 返回 404 教程不存在

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-009 |
| 用例描述 | 审核不存在的教程 id 返回 404 教程不存在 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 已登录；id=99999 的教程不存在

测试步骤：
1. POST /api/tutorials/99999/review，Bearer <admin token>，body {"action":"approve"}

预期结果：
1. HTTP 404，code=404，message=「教程不存在」

---

### API-NF-REVIEW-010 对非待审核状态教程执行审核返回 409 该教程状态已变化，请刷新

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-010 |
| 用例描述 | 对非待审核状态教程执行审核返回 409 该教程状态已变化，请刷新 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 已登录；教程 T 已发布（status=published）

测试步骤：
1. POST /api/tutorials/<T的id>/review，Bearer <admin token>，body {"action":"approve"}

预期结果：
1. HTTP 409，code=409，message=「该教程状态已变化，请刷新」
1. 教程状态保持 published 不变

---

### API-NF-REVIEW-011 同一教程连续两次审核通过：第二次返回 409（后端等效防抖，仅一条状态迁移与留痕）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-011 |
| 用例描述 | 同一教程连续两次审核通过：第二次返回 409（后端等效防抖，仅一条状态迁移与留痕） |
| 优先级 | P1 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. admin 已登录；待审核教程 T；模拟审核按钮连点（同参数连续两次请求）

测试步骤：
1. POST /api/tutorials/<T的id>/review，body {"action":"approve"}，Bearer <admin token>
1. 立即再次 POST /api/tutorials/<T的id>/review，同参数
1. GET /api/tutorials?status=pending，Bearer <admin token>

预期结果：
1. 第一次 HTTP 200，status=published（仅一次迁移）
1. 第二次 HTTP 409「该教程状态已变化，请刷新」（重复动作失效，无重复留痕）
1. 待审核列表中 T 已移除且仅移除一次

---

### API-NF-REVIEW-012 approve 时携带 reason 字段被忽略（action=approve 时 reason 不生效）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-012 |
| 用例描述 | approve 时携带 reason 字段被忽略（action=approve 时 reason 不生效） |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 已登录；待审核教程 T

测试步骤：
1. POST /api/tutorials/<T的id>/review，body {"action":"approve","reason":"多余的说明文字"}

预期结果：
1. HTTP 200，data.status=published
1. 教程不产生驳回原因（后续 GET /api/tutorials?status=published 中该教程 rejectReason 为 null 或不出现驳回字段）

---

### API-NF-REVIEW-013 审核接口 id 传非数字（/api/tutorials/abc/review）不引发 500

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-013 |
| 用例描述 | 审核接口 id 传非数字（/api/tutorials/abc/review）不引发 500 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 已登录

测试步骤：
1. POST /api/tutorials/abc/review，Bearer <admin token>，body {"action":"approve"}

预期结果：
1. 不返回 500
1. 返回 400「action 参数不合法」/「查询参数不合法」或 404「教程不存在」（登记实测行为，待验证）

---

### API-NF-REVIEW-014 驳回已发布教程的回审版后前台详情仍返回线上旧版（驳回不断供联动验证）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-014 |
| 用例描述 | 驳回已发布教程的回审版后前台详情仍返回线上旧版（驳回不断供联动验证） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-RULE-02 |

前置条件：
1. 教程 T 已发布（线上 v1）；运营编辑保存使其回审（v2 待审核，回审来源=已发布态）；admin 已登录

测试步骤：
1. POST /api/tutorials/<T的id>/review，Bearer <admin token>，body {"action":"reject","reason":"本版修改不符合发布规范要求"}
1. GET /api/tutorials/<T的id>

预期结果：
1. 驳回 HTTP 200，data.status=draft，rejectReason 原文返回
1. 详情请求 HTTP 200，data.content 为线上过审版本 v1（非 v2 编辑内容，正文内容不变）

---

### API-NF-REVIEW-015 审核通过后前台搜索下一次请求即命中新发布教程（三端分发即时性）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-015 |
| 用例描述 | 审核通过后前台搜索下一次请求即命中新发布教程（三端分发即时性） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-13 |

前置条件：
1. 首次待审核教程 P（标题含唯一特征词）；admin 已登录

测试步骤：
1. GET /api/tutorials?keyword=<P标题特征词>，确认 total=0
1. POST /api/tutorials/<P的id>/review，body {"action":"approve"}，Bearer <admin token>
1. GET /api/tutorials?keyword=<P标题特征词>

预期结果：
1. 审核通过后列表/搜索的下一次请求即返回 P（HTTP 200，total≥1）
1. 无需重启服务、无需重新登录

---

### API-NF-REVIEW-016 回审教程在审核队列带 submitCount≥2（修改版 v2+ 标识数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-REVIEW-016 |
| 用例描述 | 回审教程在审核队列带 submitCount≥2（修改版 v2+ 标识数据源） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-09 |

前置条件：
1. 教程 B 已发布过一次；运营在后台编辑器保存修改使其自动回审（submitCount 累计 ≥2）；admin 已登录

测试步骤：
1. GET /api/tutorials?status=pending，Bearer <admin token>
1. 定位教程 B 记录，校验 submitCount

预期结果：
1. HTTP 200，队列包含 B
1. B 的 submitCount≥2（存在线上过审版本的回审提交，审核队列显示修改版 v2+ 标识）

---

### API-NF-CATE-001 前台默认返回仅启用分类的两级树（分类宫格/筛选树数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-001 |
| 用例描述 | 前台默认返回仅启用分类的两级树（分类宫格/筛选树数据源） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-01 |

前置条件：
1. 种子库已初始化，存在启用与（若有）停用分类

测试步骤：
1. GET /api/categories（无参数无登录）

预期结果：
1. HTTP 200，code=0，data.list 为一级分类数组（parentId=null）
1. 所有节点 status=enabled（停用分类不返回）
1. 节点含 id/name/parentId/sort/status/erpModule/children 字段

---

### API-NF-CATE-002 分类树两级结构完整：children 的 parentId 指向父节点且无第三层

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-002 |
| 用例描述 | 分类树两级结构完整：children 的 parentId 指向父节点且无第三层 |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-01 |

前置条件：
1. 存在带二级子分类的分类

测试步骤：
1. GET /api/categories
1. 遍历树校验父子引用与层级深度

预期结果：
1. 每个二级节点的 parentId=其父一级节点 id
1. 二级节点的 children 为空数组（本期限两级，无第三层）

---

### API-NF-CATE-003 种子一级分类数量为 12（8 大模块 + 新手入门/最佳实践/常见问题/开放平台）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-003 |
| 用例描述 | 种子一级分类数量为 12（8 大模块 + 新手入门/最佳实践/常见问题/开放平台） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-06 |

前置条件：
1. 刚执行种子初始化，未增删分类

测试步骤：
1. GET /api/categories
1. 统计 data.list 长度与名称

预期结果：
1. HTTP 200，一级分类数量=12
1. 名称集合含 8 大模块（销售/项目/文件/生产制造/采购/库存/人事财务/系统设置）与新手入门/最佳实践/常见问题/开放平台

---

### API-NF-CATE-004 同级分类按 sort 升序排列（前台宫格与列表顺序数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-004 |
| 用例描述 | 同级分类按 sort 升序排列（前台宫格与列表顺序数据源） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-12 |

前置条件：
1. 存在多个不同 sort 值的一级与二级分类

测试步骤：
1. GET /api/categories
1. 分别校验一级数组与各 children 数组的顺序

预期结果：
1. HTTP 200，一级分类按 sort 升序排列
1. 每个一级分类的 children 同样按 sort 升序（排序值调整后前台顺序同步变化的数据依据）

---

### API-NF-CATE-005 withCount=1 返回各分类 tutorialCount 角标计数（前台可见口径）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-005 |
| 用例描述 | withCount=1 返回各分类 tutorialCount 角标计数（前台可见口径） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-05 |

前置条件：
1. 种子库已初始化，各分类下存在数量已知的已发布教程

测试步骤：
1. GET /api/categories?withCount=1

预期结果：
1. HTTP 200，每个节点含 tutorialCount 字段且为整数 ≥0
1. tutorialCount 与该分类前台可见教程数一致（存在线上过审版本且未下架口径）

---

### API-NF-CATE-006 tutorialCount=0 的启用分类正确返回 0（空白区/待补充角标判定依据）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-006 |
| 用例描述 | tutorialCount=0 的启用分类正确返回 0（空白区/待补充角标判定依据） |
| 优先级 | P0 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-04, UI-ELEM-05 |

前置条件：
1. 存在（或构造）一个启用且前台可见教程数为 0 的分类

测试步骤：
1. GET /api/categories?withCount=1
1. 定位该分类节点

预期结果：
1. HTTP 200，该分类 tutorialCount=0（数值 0 而非 null/缺失）
1. 前端覆盖度矩阵据此标「空白区」、首页宫格角标显示「待补充」

---

### API-NF-CATE-007 一级分类计数为本级与子分类汇总口径（tutorialCount 汇不遗漏）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-007 |
| 用例描述 | 一级分类计数为本级与子分类汇总口径（tutorialCount 汇不遗漏） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-05 |

前置条件：
1. 分类 A 含子分类 A1 且两者下均有已发布教程

测试步骤：
1. GET /api/categories?withCount=1
1. 对比 A 的 tutorialCount 与 A1 的 tutorialCount

预期结果：
1. HTTP 200，A.tutorialCount ≥ A1.tutorialCount（一级含其子分类汇总，A 的计数不小于任一子分类计数）
1. 宫格角标展示汇总数而非本级直属数

---

### API-NF-CATE-008 erpModule 字段取值符合 8 大模块枚举（角色推荐与模块卡入口映射数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-008 |
| 用例描述 | erpModule 字段取值符合 8 大模块枚举（角色推荐与模块卡入口映射数据源） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-14 |

前置条件：
1. 种子库已初始化（8 大模块分类均有映射）

测试步骤：
1. GET /api/categories
1. 遍历所有节点校验 erpModule

预期结果：
1. HTTP 200，erpModule 取值均属于 {sales, project, file, produce, purchase, inventory, hrFinance, system, null}
1. 8 大模块一级分类的 erpModule 一一对应（未映射分类为 null，如新手入门等）

---

### API-NF-CATE-009 按 erpModule 取分类后可检索其下教程（采购→采购/库存模块命中集联动）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-009 |
| 用例描述 | 按 erpModule 取分类后可检索其下教程（采购→采购/库存模块命中集联动） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-14 |

前置条件：
1. erpModule=purchase 与 inventory 的分类下存在已发布教程

测试步骤：
1. GET /api/categories，筛选 erpModule=purchase 和 inventory 的分类 id 列表
1. 对每个 id 执行 GET /api/tutorials?categoryId=<id>

预期结果：
1. 每次教程请求均 HTTP 200
1. 返回教程均属于对应模块映射分类（采购角色推荐位与 ERP 模块卡入口命中集取数链路成立）

---

### API-NF-CATE-010 桌面 UA 与移动 UA 请求分类树返回一致数据（小程序宫格与 PC 同源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-010 |
| 用例描述 | 桌面 UA 与移动 UA 请求分类树返回一致数据（小程序宫格与 PC 同源） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-03 |

前置条件：
1. 种子库已初始化

测试步骤：
1. GET /api/categories?withCount=1，User-Agent: <桌面 Chrome UA>
1. GET /api/categories?withCount=1，User-Agent: <移动端 UA（375px 机型）>
1. 对比两次响应

预期结果：
1. 两次均 HTTP 200
1. 分类数量、顺序、tutorialCount 完全一致（无客户端分支）

---

### API-NF-CATE-011-E01 未登录使用 all=1 管理参数返回 401（目录管理数据鉴权）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-011-E01 |
| 用例描述 | 未登录使用 all=1 管理参数返回 401（目录管理数据鉴权） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 不携带登录态

测试步骤：
1. GET /api/categories?all=1（无 Authorization）

预期结果：
1. HTTP 401，code=401，message=「未登录或登录已失效」
1. 不返回停用分类等管理口径数据

---

### API-NF-CATE-012-E02 operator 使用 all=1 返回 403（分类树管理为管理员专属）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-012-E02 |
| 用例描述 | operator 使用 all=1 返回 403（分类树管理为管理员专属） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. operator 已登录

测试步骤：
1. GET /api/categories?all=1，Bearer <operator token>

预期结果：
1. HTTP 403，code=403，message=「无权限执行该操作」

---

### API-NF-CATE-013-E03 普通用户使用 all=1 返回 403

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-013-E03 |
| 用例描述 | 普通用户使用 all=1 返回 403 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 普通用户已通过选角色登录获得 token

测试步骤：
1. GET /api/categories?all=1，Bearer <user token>

预期结果：
1. HTTP 403，code=403，message=「无权限执行该操作」

---

### API-NF-CATE-014 admin 使用 all=1 返回含停用分类的全量树（管理口径与前台口径差集）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-014 |
| 用例描述 | admin 使用 all=1 返回含停用分类的全量树（管理口径与前台口径差集） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-12 |

前置条件：
1. admin 已登录；已构造至少 1 个停用（disabled）分类

测试步骤：
1. GET /api/categories?all=1，Bearer <admin token>
1. GET /api/categories（前台口径）
1. 对比两者

预期结果：
1. 管理口径 HTTP 200，返回树中含 status=disabled 节点
1. 管理口径节点数 ≥ 前台口径节点数（差集为停用分类）
1. 前台口径不含任何 disabled 节点

---

### API-NF-CATE-015 回审期间分类角标计数不减（旧版在线计入 tutorialCount）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-015 |
| 用例描述 | 回审期间分类角标计数不减（旧版在线计入 tutorialCount） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-05 |

前置条件：
1. 分类 C 下已发布教程 T；记录 C 的 tutorialCount=N；运营编辑保存 T 使其回审（来源=已发布态）

测试步骤：
1. GET /api/categories?withCount=1，记录 C.tutorialCount
1. （T 已进入回审后）再次 GET /api/categories?withCount=1

预期结果：
1. 回审期间 C.tutorialCount 仍为 N（线上旧版在线计入角标计数，不因回审减少）

---

### API-NF-CATE-016-B01 withCount 传非 1 值（如 2）不引发 500（计数开关容错）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-016-B01 |
| 用例描述 | withCount 传非 1 值（如 2）不引发 500（计数开关容错） |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-01 |

前置条件：
1. 服务正常启动

测试步骤：
1. GET /api/categories?withCount=2

预期结果：
1. 不返回 500
1. 按等价未开启（不返回 tutorialCount）或视为 1（返回计数）处理，登记实测行为（待验证）

---

### API-NF-CATE-017 不带 withCount 时不返回 tutorialCount 字段（默认不携带计数）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-CATE-017 |
| 用例描述 | 不带 withCount 时不返回 tutorialCount 字段（默认不携带计数） |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-01 |

前置条件：
1. 种子库已初始化

测试步骤：
1. GET /api/categories
1. 检查响应节点字段

预期结果：
1. HTTP 200，节点不含 tutorialCount 字段（或值为 null，登记实测行为）
1. 其余树结构字段完整返回

---

### API-NF-FAV-001 登录用户收藏前台可见教程成功且 favCount 联动 +1（收藏按钮切换数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-FAV-001 |
| 用例描述 | 登录用户收藏前台可见教程成功且 favCount 联动 +1（收藏按钮切换数据源） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-06 |

前置条件：
1. 用户 U 已登录；教程 T 为已发布（前台可见）且记录收藏前 favCount 基线（可从详情获取）

测试步骤：
1. GET /api/tutorials/<T的id>，记录 data.favCount 为 F0
1. POST /api/favorites/<T的id>，Authorization: Bearer <U的token>，body {}

预期结果：
1. HTTP 200，code=0
1. data.tutorialId=T 的 id，data.favorited=true
1. data.favCount=F0+1（当前有效收藏数口径联动）

---

### API-NF-FAV-002 同一用户重复收藏幂等返回 true 且 favCount 不重复增加（联合唯一约束）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-FAV-002 |
| 用例描述 | 同一用户重复收藏幂等返回 true 且 favCount 不重复增加（联合唯一约束） |
| 优先级 | P0 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-06 |

前置条件：
1. 用户 U 已收藏教程 T（记收藏后 favCount=F1）

测试步骤：
1. POST /api/favorites/<T的id>，Bearer <U的token>，body {}
1. 再次 POST /api/favorites/<T的id>，Bearer <U的token>

预期结果：
1. 两次均 HTTP 200，data.favorited=true（幂等成功）
1. 两次返回的 favCount 均为 F1（不随重复请求递增，同一用户同一教程唯一）

---

### API-NF-FAV-003 收藏后详情接口 myFavorite=true 且 favCount 与收藏接口一致（按钮选中态与计数同步）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-FAV-003 |
| 用例描述 | 收藏后详情接口 myFavorite=true 且 favCount 与收藏接口一致（按钮选中态与计数同步） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-06 |

前置条件：
1. 用户 U 已登录；教程 T 前台可见

测试步骤：
1. POST /api/favorites/<T的id>，Bearer <U的token>，记录 data.favCount
1. GET /api/tutorials/<T的id>，Bearer <U的token>

预期结果：
1. 详情 HTTP 200，data.myFavorite=true（按钮切换为已收藏态）
1. 详情 data.favCount 与收藏接口返回值一致（刷新后一致）

---

### API-NF-FAV-004-E01 游客（未登录）收藏返回 401（前端引导选角色登录的数据依赖）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-FAV-004-E01 |
| 用例描述 | 游客（未登录）收藏返回 401（前端引导选角色登录的数据依赖） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-06, AC-NF-04 |

前置条件：
1. 不携带登录态；教程 T 前台可见

测试步骤：
1. POST /api/favorites/<T的id>（无 Authorization），body {}

预期结果：
1. HTTP 401，code=401，message=「未登录或登录已失效」
1. favCount 不变化（游客收藏不计数，登录引导由前端承载）

---

### API-NF-FAV-005-E02 收藏已下架教程返回 404 该教程不存在或暂不可见（不可新增收藏）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-FAV-005-E02 |
| 用例描述 | 收藏已下架教程返回 404 该教程不存在或暂不可见（不可新增收藏） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-02 |

前置条件：
1. 教程 T 已被 admin 下架（status=offline）；用户 U 已登录

测试步骤：
1. POST /api/tutorials/<T的id>/offline，Bearer <admin token>，body {}（构造下架）
1. POST /api/favorites/<T的id>，Bearer <U的token>

预期结果：
1. 下架 HTTP 200
1. 收藏请求 HTTP 404，code=404，message=「该教程不存在或暂不可见」
1. favCount 不变化（仅可收藏前台可见教程；历史收藏的下架标注由收藏列表承载）

---

### API-NF-FAV-006-E03 收藏纯草稿/首次待审核教程返回 404（不可见教程不可收藏）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-FAV-006-E03 |
| 用例描述 | 收藏纯草稿/首次待审核教程返回 404（不可见教程不可收藏） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-02 |

前置条件：
1. 存在纯草稿教程 D（从未过审）；用户 U 已登录

测试步骤：
1. GET /api/tutorials?status=draft&all=1（admin）获取 D 的 id
1. POST /api/favorites/<D的id>，Bearer <U的token>

预期结果：
1. HTTP 404，code=404，message=「该教程不存在或暂不可见」

---

### API-NF-FAV-007 收藏不存在的教程 id 返回 404

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-FAV-007 |
| 用例描述 | 收藏不存在的教程 id 返回 404 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-06 |

前置条件：
1. 用户 U 已登录；tutorialId=99999 不存在

测试步骤：
1. POST /api/favorites/99999，Bearer <U的token>

预期结果：
1. HTTP 404，code=404，message=「该教程不存在或暂不可见」

---

### API-NF-FAV-008-B01 tutorialId 传非数字（/api/favorites/abc）不引发 500

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-FAV-008-B01 |
| 用例描述 | tutorialId 传非数字（/api/favorites/abc）不引发 500 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-06 |

前置条件：
1. 用户 U 已登录

测试步骤：
1. POST /api/favorites/abc，Bearer <U的token>

预期结果：
1. 不返回 500
1. 返回 404「该教程不存在或暂不可见」或 400 参数不合法（登记实测行为，待验证）

---

### API-NF-FAV-009 admin/operator/user 三类登录角色收藏均被允许（收藏接口角色边界确认）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-FAV-009 |
| 用例描述 | admin/operator/user 三类登录角色收藏均被允许（收藏接口角色边界确认） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. admin、operator、user 三类账号均已登录获得 token；教程 T 前台可见

测试步骤：
1. POST /api/favorites/<T的id>，Bearer <admin token>
1. POST /api/favorites/<T的id>，Bearer <operator token>
1. POST /api/favorites/<T的id>，Bearer <user token>

预期结果：
1. 三个请求均 HTTP 200，favorited=true（收藏对所有已登录角色开放）
1. favCount 共 +3（三个不同用户各计一条）

---

### API-NF-FAV-010-B02 不发送请求体或发送空对象的收藏请求均正常（请求体可选）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-FAV-010-B02 |
| 用例描述 | 不发送请求体或发送空对象的收藏请求均正常（请求体可选） |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-06 |

前置条件：
1. 用户 U 已登录；教程 T1、T2 前台可见

测试步骤：
1. POST /api/favorites/<T1的id>，Bearer <U的token>（不发送 body）
1. POST /api/favorites/<T2的id>，Bearer <U的token>，body {}

预期结果：
1. 两个请求均 HTTP 200，favorited=true
1. 空 body 与无 body 行为一致

---

### API-NF-FAV-011 收藏计数即时回流后台列表（下一请求即新值，两端刷新后一致）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-FAV-011 |
| 用例描述 | 收藏计数即时回流后台列表（下一请求即新值，两端刷新后一致） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-13 |

前置条件：
1. admin 已登录；用户 U 已登录；教程 T 前台可见且记录基线 favCount

测试步骤：
1. GET /api/tutorials?all=1，Bearer <admin token>，记录 T 的 favCount
1. POST /api/favorites/<T的id>，Bearer <U的token>
1. 再次 GET /api/tutorials?all=1，Bearer <admin token>

预期结果：
1. 第二次管理列表请求中 T 的 favCount=基线+1（PC 与小程序同库，任一端操作另一端刷新即可见）

---

### API-NF-FAV-012-E04 携带无效 token 收藏返回 401（失效登录态拒绝）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-FAV-012-E04 |
| 用例描述 | 携带无效 token 收藏返回 401（失效登录态拒绝） |
| 优先级 | P2 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 持有未登记的无效 token；教程 T 前台可见

测试步骤：
1. POST /api/favorites/<T的id>，Authorization: Bearer 0123456789abcdef

预期结果：
1. HTTP 401，code=401，message=「未登录或登录已失效」
1. favCount 不变化

---

### API-NF-OFFLINE-001 admin 下架已发布教程成功返回 offline 与 lastOfflineAt 留痕（操作人/操作时间留痕契约）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-OFFLINE-001 |
| 用例描述 | admin 下架已发布教程成功返回 offline 与 lastOfflineAt 留痕（操作人/操作时间留痕契约） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. admin 已登录；教程 T 状态为已发布

测试步骤：
1. POST /api/tutorials/<T的id>/offline，Bearer <admin token>，body {}

预期结果：
1. HTTP 200，code=0
1. data.id=T 的 id，data.status=offline
1. data.lastOfflineAt 为非空时间字符串（下架动作时间戳，可见性判定派生列；二次确认由前端承载）

---

### API-NF-OFFLINE-002 下架后前台列表与搜索下一次请求即不返回该教程（三端即时不可见）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-OFFLINE-002 |
| 用例描述 | 下架后前台列表与搜索下一次请求即不返回该教程（三端即时不可见） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-13 |

前置条件：
1. admin 已登录；教程 T 已发布且标题含唯一特征词

测试步骤：
1. GET /api/tutorials?keyword=<T标题特征词>，确认命中
1. POST /api/tutorials/<T的id>/offline，Bearer <admin token>，body {}
1. GET /api/tutorials?keyword=<T标题特征词>
1. GET /api/tutorials?pageSize=100，确认列表不含 T 的 id

预期结果：
1. 下架前搜索命中 T
1. 下架后搜索与列表的下一次请求均不返回 T（即时生效，无缓存延迟）

---

### API-NF-OFFLINE-003 下架后直达详情返回 404 该教程已下架 并附同类推荐（收藏/历史点击与直达链接善后数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-OFFLINE-003 |
| 用例描述 | 下架后直达详情返回 404 该教程已下架 并附同类推荐（收藏/历史点击与直达链接善后数据源） |
| 优先级 | P0 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-02 |

前置条件：
1. 教程 T 已发布后被 admin 下架；其分类下存在其他前台可见教程

测试步骤：
1. POST /api/tutorials/<T的id>/offline，Bearer <admin token>，body {}
1. GET /api/tutorials/<T的id>

预期结果：
1. 详情请求 HTTP 404，code=404，message=「该教程已下架」
1. data.reason=offline，data.related 为同分类前台可见教程推荐（非空）
1. 响应不含正文 content（正文不可见，前端展示提示页与同类推荐）

---

### API-NF-OFFLINE-004 下架后浏览与收藏计数保留（善后标注场景数据不清零）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-OFFLINE-004 |
| 用例描述 | 下架后浏览与收藏计数保留（善后标注场景数据不清零） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-02 |

前置条件：
1. 教程 T 已产生浏览/收藏数据（记录 viewCount/favCount 基线）；admin 已登录

测试步骤：
1. GET /api/tutorials?all=1，Bearer <admin token>，记录 T 的 viewCount/favCount
1. POST /api/tutorials/<T的id>/offline，Bearer <admin token>，body {}
1. GET /api/tutorials?status=offline，Bearer <admin token>

预期结果：
1. 下架成功 HTTP 200
1. 下架后管理口径查询 T 的 viewCount/favCount 与下架前一致（计数延续至重新发布，仅复制清零）

---

### API-NF-OFFLINE-005-E01 未登录调用下架接口返回 401（后台鉴权全覆盖）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-OFFLINE-005-E01 |
| 用例描述 | 未登录调用下架接口返回 401（后台鉴权全覆盖） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 不携带登录态；存在已发布教程

测试步骤：
1. POST /api/tutorials/<已发布教程id>/offline（无 Authorization），body {}

预期结果：
1. HTTP 401，code=401，message=「未登录或登录已失效」
1. 教程状态不变（仍已发布）

---

### API-NF-OFFLINE-006-E02 operator 调用下架接口返回 403 且教程状态不变化（下架为管理员专属）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-OFFLINE-006-E02 |
| 用例描述 | operator 调用下架接口返回 403 且教程状态不变化（下架为管理员专属） |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. operator 已登录；教程 T 已发布

测试步骤：
1. POST /api/tutorials/<T的id>/offline，Bearer <operator token>，body {}
1. GET /api/tutorials?keyword=<T标题特征词>，确认仍命中

预期结果：
1. 第一步 HTTP 403，code=403，message=「无权限执行该操作」
1. 第二步仍命中 T（状态未变化，前台持续可见）

---

### API-NF-OFFLINE-007-E03 普通用户（user 角色）调用下架接口返回 403

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-OFFLINE-007-E03 |
| 用例描述 | 普通用户（user 角色）调用下架接口返回 403 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | AC-NF-04 |

前置条件：
1. 普通用户已登录；存在已发布教程

测试步骤：
1. POST /api/tutorials/<已发布教程id>/offline，Bearer <user token>，body {}

预期结果：
1. HTTP 403，code=403，message=「无权限执行该操作」
1. 教程状态不变

---

### API-NF-OFFLINE-008 下架不存在的教程 id 返回 404 教程不存在

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-OFFLINE-008 |
| 用例描述 | 下架不存在的教程 id 返回 404 教程不存在 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-02 |

前置条件：
1. admin 已登录；id=99999 的教程不存在

测试步骤：
1. POST /api/tutorials/99999/offline，Bearer <admin token>，body {}

预期结果：
1. HTTP 404，code=404，message=「教程不存在」

---

### API-NF-OFFLINE-009 对非已发布状态教程（如草稿）下架返回 409 该教程状态已变化，请刷新

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-OFFLINE-009 |
| 用例描述 | 对非已发布状态教程（如草稿）下架返回 409 该教程状态已变化，请刷新 |
| 优先级 | P0 |
| 测试类型 | 异常测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-02 |

前置条件：
1. admin 已登录；教程 D 为纯草稿（从未过审）

测试步骤：
1. POST /api/tutorials/<D的id>/offline，Bearer <admin token>，body {}

预期结果：
1. HTTP 409，code=409，message=「该教程状态已变化，请刷新」
1. 仅 published 状态可下架，D 状态保持草稿不变

---

### API-NF-OFFLINE-010 重复下架（已下架教程再次调用）返回 409

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-OFFLINE-010 |
| 用例描述 | 重复下架（已下架教程再次调用）返回 409 |
| 优先级 | P1 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-02 |

前置条件：
1. 教程 T 已被下架（status=offline）

测试步骤：
1. POST /api/tutorials/<T的id>/offline，Bearer <admin token>，body {}

预期结果：
1. HTTP 409，code=409，message=「该教程状态已变化，请刷新」
1. lastOfflineAt 不被重复刷新（登记实测行为，待验证）

---

### API-NF-OFFLINE-011 下架接口 id 传非数字（/api/tutorials/abc/offline）不引发 500

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-OFFLINE-011 |
| 用例描述 | 下架接口 id 传非数字（/api/tutorials/abc/offline）不引发 500 |
| 优先级 | P2 |
| 测试类型 | 边界测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-ELEM-02 |

前置条件：
1. admin 已登录

测试步骤：
1. POST /api/tutorials/abc/offline，Bearer <admin token>，body {}

预期结果：
1. 不返回 500
1. 返回 404「教程不存在」或 400 参数不合法（登记实测行为，待验证）

---

### API-NF-OFFLINE-012 下架后后台列表 status=offline 筛选包含该教程且 lastOfflineAt 非空（四态状态标签数据源）

| 项目 | 内容 |
|------|------|
| 用例ID | API-NF-OFFLINE-012 |
| 用例描述 | 下架后后台列表 status=offline 筛选包含该教程且 lastOfflineAt 非空（四态状态标签数据源） |
| 优先级 | P1 |
| 测试类型 | 功能测试 |
| version | v1 |
| lastUpdatedBy | case-designer |
| 覆盖AC | UI-IXD-17 |

前置条件：
1. admin 已登录；教程 T 刚被下架

测试步骤：
1. POST /api/tutorials/<T的id>/offline，Bearer <admin token>，body {}
1. GET /api/tutorials?status=offline，Bearer <admin token>

预期结果：
1. HTTP 200，返回列表包含 T 且其 status=offline
1. T 的 lastOfflineAt 为非空时间字符串（后台状态列与善后标注的数据依据）

---
