// BE-04 self-test: submit / withdraw / review(approve+reject)
const BASE = 'http://localhost:3000';
const DB_PATH = 'D:/code/demo/zcode-demo-smt-yuanbo/server/erp.db';
const results = [];
let pass = 0, fail = 0;
function rec(name, ok, detail) {
  results.push({ name, ok, detail });
  ok ? pass++ : fail++;
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''));
}
function req(method, path, { token, body } = {}) {
  return fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  }).then(async r => {
    let json = null; try { json = await r.json(); } catch {}
    return { status: r.status, json };
  });
}
const uniq = Date.now().toString().slice(-6);
async function mgmtItem(T, id) {
  const r = await req('GET', '/api/tutorials?all=1&pageSize=100', { token: T.admin });
  return (r.json.data.list || []).find(x => x.id === id) || null;
}
async function frontHit(keyword) {
  const r = await req('GET', '/api/tutorials?keyword=' + encodeURIComponent(keyword) + '&pageSize=50');
  return (r.json?.data?.list || []).map(x => x.id);
}
function dbRow(id) {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  const row = db.prepare('SELECT id,status,submit_count,published_content,published_summary,published_at,last_offline_at,reject_reason,reviewer_id,reviewed_at,author_id FROM tutorials WHERE id=?').get(id);
  db.close();
  return row;
}
const isBlank = v => v === null || v === undefined || ('' + v).trim() === '';

(async () => {
  // ---- auth setup ----
  const A = (await req('POST', '/api/auth/login', { body: { username: 'admin', password: '123456' } })).json.data.token;
  const O = (await req('POST', '/api/auth/login', { body: { username: 'operator', password: '123456' } })).json.data.token;
  const U = (await req('POST', '/api/auth/role-login', { body: { erpRole: 'sales' } })).json.data.token;
  const T = { admin: A, operator: O, user: U };
  rec('登录准备 admin/operator/user', !!A && !!O && !!U);

  const mk = async (suffix, over = {}) => {
    const body = {
      title: 'BE04自测' + suffix + ' ' + uniq,
      categoryId: 1,
      summary: '自测摘要-' + suffix + '，用于BE-04提审审核链路验证。',
      content: '<p>自测正文-' + suffix + '-v1</p>',
      tags: ['自测']
    };
    Object.assign(body, over);
    const r = await req('POST', '/api/tutorials', { token: O, body });
    if (r.status !== 200) throw new Error('create failed: ' + JSON.stringify(r.json));
    return { id: r.json.data.id, title: body.title };
  };

  // ============ 1. submit 正向 AC-FN-07 ============
  const t1 = await mk('A1');
  const beforeHit = await frontHit(t1.title);
  rec('AC-FN-07 前置: 提审前前台 keyword 检索不返回草稿', beforeHit.length === 0, 'hits=' + JSON.stringify(beforeHit));
  let r = await req('POST', `/api/tutorials/${t1.id}/submit`, { token: O, body: {} });
  rec('AC-FN-07 提审: 200 + status=pending + submitCount=1',
    r.status === 200 && r.json.code === 0 && r.json.data.status === 'pending' && r.json.data.submitCount === 1,
    JSON.stringify(r.json));
  let m = await mgmtItem(T, t1.id);
  rec('AC-FN-07 管理列表状态=pending', m && m.status === 'pending', m && m.status);
  rec('AC-FN-07 提审后前台仍不返回(无快照)', (await frontHit(t1.title)).length === 0);

  // 自建 offline 态教程（供 AC-EG-09 / AC-EG-18 使用，避免依赖种子 id 状态）
  const tOff = await mk('D9');
  await req('POST', `/api/tutorials/${tOff.id}/submit`, { token: O, body: {} });
  await req('POST', `/api/tutorials/${tOff.id}/review`, { token: A, body: { action: 'approve' } });
  const offPrepare = await req('POST', `/api/tutorials/${tOff.id}/offline`, { token: A, body: {} });
  const OFF_ID = offPrepare.status === 200 ? offPrepare.json.data.id : null;

  // submit 参数/状态校验
  r = await req('POST', `/api/tutorials/${t1.id}/submit`, { token: O, body: {} });
  rec('AC-EG-03 后端防重复提审: pending 再 submit → 409 该教程状态已变化',
    r.status === 409 && r.json.code === 409 && r.json.message === '该教程状态已变化，请刷新', JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${OFF_ID}/submit`, { token: O, body: {} });
  rec('AC-EG-09 已下架直接提审 → 409 且保持 offline',
    r.status === 409 && r.json.message === '该教程状态已变化，请刷新', JSON.stringify(r.json));
  const off = await mgmtItem(T, OFF_ID);
  rec('AC-EG-09 已下架教程状态保持 offline', off && off.status === 'offline', off && off.status);
  r = await req('POST', `/api/tutorials/${t1.id}/submit`, { token: U, body: {} });
  rec('权限: user 提审 → 403 无权限执行该操作', r.status === 403 && r.json.message === '无权限执行该操作', JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${t1.id}/submit`, { body: {} });
  rec('异常: 未登录提审 → 401 未登录或登录已失效', r.status === 401 && r.json.message === '未登录或登录已失效', JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/99999/submit`, { token: O, body: {} });
  rec('异常: 不存在 id 提审 → 404 教程不存在', r.status === 404 && r.json.message === '教程不存在', JSON.stringify(r.json));

  // ============ 2. submit 必填校验 AC-EG-01 ============
  const t2 = await mk('A2', { summary: '', content: '' });
  r = await req('POST', `/api/tutorials/${t2.id}/submit`, { token: O, body: {} });
  rec('AC-EG-01 缺摘要+正文提审 → 400 请补全标题/分类/摘要/正文后再提交',
    r.status === 400 && r.json.message === '请补全标题/分类/摘要/正文后再提交', JSON.stringify(r.json));
  m = await mgmtItem(T, t2.id);
  rec('AC-EG-01 阻断后状态仍 draft(不进待审核)', m && m.status === 'draft', m && m.status);
  const t2b = await mk('A2b', { summary: '有摘要无正文的自测案例说明。' , content: '' });
  r = await req('POST', `/api/tutorials/${t2b.id}/submit`, { token: O, body: {} });
  rec('AC-EG-01 仅缺正文提审 → 400 同文案', r.status === 400 && r.json.message === '请补全标题/分类/摘要/正文后再提交', JSON.stringify(r.json));

  // ============ 3. submit 停用分类 409 ============
  const cat = await req('POST', '/api/categories', { token: A, body: { name: 'BE04停用分类' + uniq } });
  const catId = cat.json?.data?.id;
  const t3 = catId ? await mk('A3', { categoryId: catId }) : null;
  if (t3) {
    await req('PUT', `/api/categories/${catId}`, { token: A, body: { status: 'disabled' } });
    r = await req('POST', `/api/tutorials/${t3.id}/submit`, { token: O, body: {} });
    rec('业务规则: 停用分类下教程提审 → 409 所属分类已停用，请选择启用的分类',
      r.status === 409 && r.json.message === '所属分类已停用，请选择启用的分类', JSON.stringify(r.json));
    await req('PUT', `/api/categories/${catId}`, { token: A, body: { status: 'enabled' } });
    r = await req('POST', `/api/tutorials/${t3.id}/submit`, { token: O, body: {} });
    rec('业务规则: 分类恢复启用后提审 → 200 pending', r.status === 200 && r.json.data.status === 'pending', JSON.stringify(r.json));
  } else { rec('业务规则: 停用分类提审(分类创建失败跳过)', false, JSON.stringify(cat.json)); }

  // ============ 4. 边界: 100字标题提审 ============
  const t100Title = 'T'.repeat(94) + uniq; // 94+6=100 恰好上限
  const t100 = await mk('A5', { title: t100Title });
  r = await req('POST', `/api/tutorials/${t100.id}/submit`, { token: O, body: {} });
  rec('边界: 标题恰100字提审 → 200(不越界)', r.status === 200 && r.json.data.status === 'pending',
    'titleLen=' + t100Title.length + ' resp=' + JSON.stringify(r.json));

  // ============ 5. review 权限 + 参数校验 ============
  r = await req('POST', `/api/tutorials/${t1.id}/review`, { token: O, body: { action: 'approve' } });
  rec('AC-FN-18 operator 审核 → 403 无权限执行该操作', r.status === 403 && r.json.message === '无权限执行该操作', JSON.stringify(r.json));
  m = await mgmtItem(T, t1.id);
  rec('AC-FN-18 403 后教程状态不变(仍 pending)', m && m.status === 'pending', m && m.status);
  r = await req('POST', `/api/tutorials/${t1.id}/review`, { token: U, body: { action: 'approve' } });
  rec('AC-FN-18 user 审核 → 403', r.status === 403, JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${t1.id}/review`, { token: A, body: {} });
  rec('参数: action 缺失 → 400 action 参数不合法', r.status === 400 && r.json.message === 'action 参数不合法', JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${t1.id}/review`, { token: A, body: { action: 'pass' } });
  rec('参数: action 非法枚举 → 400 action 参数不合法', r.status === 400 && r.json.message === 'action 参数不合法', JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${t1.id}/review`, { body: { action: 'approve' } });
  rec('异常: 未登录审核 → 401', r.status === 401, JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/99999/review`, { token: A, body: { action: 'approve' } });
  rec('异常: 不存在 id 审核 → 404 教程不存在', r.status === 404 && r.json.message === '教程不存在', JSON.stringify(r.json));

  // ============ 6. reject 原因校验 AC-FN-09 / AC-RULE-19 ============
  const reason4 = '正文太空';   // 4字
  const reason5 = '正文太空洞';  // 5字
  r = await req('POST', `/api/tutorials/${t1.id}/review`, { token: A, body: { action: 'reject', reason: reason4 } });
  rec('AC-FN-09/RULE-19 reject 原因4字 → 400 请填写至少 5 个字的驳回原因',
    r.status === 400 && r.json.message === '请填写至少 5 个字的驳回原因', 'reason=' + reason4 + ' resp=' + JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${t1.id}/review`, { token: A, body: { action: 'reject' } });
  rec('AC-FN-09 reject 原因缺失 → 400 同文案', r.status === 400 && r.json.message === '请填写至少 5 个字的驳回原因', JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${t1.id}/review`, { token: A, body: { action: 'reject', reason: '  ' + reason4 + '  ' } });
  rec('AC-RULE-19 reject 原因trim后<5字(空白填充) → 400', r.status === 400 && r.json.message === '请填写至少 5 个字的驳回原因', JSON.stringify(r.json));
  m = await mgmtItem(T, t1.id);
  rec('驳回被阻断后状态仍 pending', m && m.status === 'pending', m && m.status);

  r = await req('POST', `/api/tutorials/${t1.id}/review`, { token: A, body: { action: 'reject', reason: reason5 } });
  rec('AC-FN-09 reject 原因恰5字 → 200 回草稿+rejectReason 回显',
    r.status === 200 && r.json.data.status === 'draft' && r.json.data.rejectReason === reason5,
    'reason5.len=' + reason5.length + ' resp=' + JSON.stringify(r.json));
  m = await mgmtItem(T, t1.id);
  rec('AC-FN-09 管理列表回读: 状态draft+驳回原因可见', m && m.status === 'draft' && !isBlank(m.rejectReason), JSON.stringify({ status: m && m.status, rejectReason: m && m.rejectReason }));
  const rowT1 = dbRow(t1.id);
  rec('持久化: reject落库 status=draft + reject_reason + reviewer留痕',
    rowT1.status === 'draft' && rowT1.reject_reason === reason5 && rowT1.reviewer_id === 1 && !isBlank(rowT1.reviewed_at),
    JSON.stringify({ status: rowT1.status, reject: rowT1.reject_reason, reviewer: rowT1.reviewer_id, at: rowT1.reviewed_at }));

  // ============ 7. withdraw 正向 AC-OP-07 + submitCount 留痕 ============
  r = await req('POST', `/api/tutorials/${t1.id}/submit`, { token: O, body: {} });
  rec('AC-OP-07 驳回后可重新提审(第2次) → submitCount=2', r.status === 200 && r.json.data.submitCount === 2, JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${t1.id}/withdraw`, { token: O, body: {} });
  rec('AC-OP-07 撤回: 200 + status=draft', r.status === 200 && r.json.data.status === 'draft', JSON.stringify(r.json));
  m = await mgmtItem(T, t1.id);
  rec('AC-OP-07 管理列表状态变更 draft', m && m.status === 'draft', m && m.status);
  r = await req('POST', `/api/tutorials/${t1.id}/withdraw`, { token: O, body: {} });
  rec('withdraw 非pending → 409', r.status === 409 && r.json.message === '该教程状态已变化，请刷新', JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${t1.id}/withdraw`, { token: U, body: {} });
  rec('权限: user 撤回 → 403', r.status === 403, JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/99999/withdraw`, { token: O, body: {} });
  rec('异常: 不存在 id 撤回 → 404', r.status === 404, JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${t1.id}/submit`, { token: O, body: {} });
  rec('AC-OP-07 撤回后可再次提审(第3次) → submitCount=3', r.status === 200 && r.json.data.submitCount === 3, JSON.stringify(r.json));
  const rowCnt = dbRow(t1.id);
  rec('留痕: submit_count=3 落库', rowCnt.submit_count === 3, 'submit_count=' + rowCnt.submit_count);

  // ============ 8. 并发互斥 AC-EG-04 ============
  // 8a: 先 withdraw 后 review
  const t7 = await mk('B1');
  await req('POST', `/api/tutorials/${t7.id}/submit`, { token: O, body: {} });
  r = await req('POST', `/api/tutorials/${t7.id}/withdraw`, { token: O, body: {} });
  const wFirst = r.status === 200;
  r = await req('POST', `/api/tutorials/${t7.id}/review`, { token: A, body: { action: 'approve' } });
  rec('AC-EG-04 先撤回后审核: review 收到 409 且状态保持 draft',
    wFirst && r.status === 409 && r.json.message === '该教程状态已变化，请刷新', JSON.stringify(r.json));
  m = await mgmtItem(T, t7.id);
  rec('AC-EG-04a 终态= draft(先到动作生效)', m && m.status === 'draft', m && m.status);
  // 8b: 先 review 后 withdraw
  const t8 = await mk('B2');
  await req('POST', `/api/tutorials/${t8.id}/submit`, { token: O, body: {} });
  r = await req('POST', `/api/tutorials/${t8.id}/review`, { token: A, body: { action: 'approve' } });
  const rFirst = r.status === 200;
  r = await req('POST', `/api/tutorials/${t8.id}/withdraw`, { token: O, body: {} });
  rec('AC-EG-04 先审核后撤回: withdraw 收到 409 且状态保持 published',
    rFirst && r.status === 409 && r.json.message === '该教程状态已变化，请刷新', JSON.stringify(r.json));
  m = await mgmtItem(T, t8.id);
  rec('AC-EG-04b 终态= published(先到动作生效)', m && m.status === 'published', m && m.status);

  // ============ 9. approve 正向 AC-FN-08 ============
  const t5 = await mk('C1');
  await req('POST', `/api/tutorials/${t5.id}/submit`, { token: O, body: {} });
  r = await req('POST', `/api/tutorials/${t5.id}/review`, { token: A, body: { action: 'approve' } });
  rec('AC-FN-08 approve: 200 published + publishedAt/reviewerId/reviewedAt 齐备',
    r.status === 200 && r.json.data.status === 'published' && !isBlank(r.json.data.publishedAt)
      && r.json.data.reviewerId === 1 && !isBlank(r.json.data.reviewedAt), JSON.stringify(r.json));
  const d = await req('GET', `/api/tutorials/${t5.id}`);
  rec('AC-FN-08 前台详情下一请求即返回新 content', d.status === 200 && d.json.data.content === '<p>自测正文-C1-v1</p>', 'content=' + d.json?.data?.content);
  rec('AC-FN-08 前台列表下一请求即包含', (await frontHit(t5.title)).includes(t5.id));
  const row5 = dbRow(t5.id);
  rec('持久化: approve 原子落库(快照列+published_at+last_offline_at=NULL)',
    row5.status === 'published' && row5.published_content === '<p>自测正文-C1-v1</p>'
      && !isBlank(row5.published_summary) && !isBlank(row5.published_at) && row5.last_offline_at === null,
    JSON.stringify({ status: row5.status, pc: row5.published_content, pa: row5.published_at, lo: row5.last_offline_at }));
  // AC-EG-19 重复审核
  r = await req('POST', `/api/tutorials/${t5.id}/review`, { token: A, body: { action: 'approve' } });
  rec('AC-EG-19 重复 approve → 409(后到失效,仅一次迁移)', r.status === 409 && r.json.message === '该教程状态已变化，请刷新', JSON.stringify(r.json));

  // ============ 10. 回审版驳回 AC-FN-19 / AC-EG-15 ============
  r = await req('PUT', `/api/tutorials/${t5.id}`, { token: O, body: { content: '<p>自测正文-C1-v2回审版</p>' } });
  rec('AC-FN-19 前置: 已发布编辑保存自动回审 pending', r.status === 200 && r.json.data.status === 'pending', JSON.stringify(r.json));
  let dOld = await req('GET', `/api/tutorials/${t5.id}`);
  rec('AC-FN-19 回审期间前台详情仍返回旧版快照 v1', dOld.status === 200 && dOld.json.data.content === '<p>自测正文-C1-v1</p>', 'content=' + dOld.json?.data?.content);
  rec('AC-FN-19 回审期间前台列表仍命中', (await frontHit(t5.title)).includes(t5.id));
  r = await req('POST', `/api/tutorials/${t5.id}/review`, { token: A, body: { action: 'reject', reason: '回审版正文质量不达标需修改' } });
  rec('AC-FN-19 驳回回审版: 200 → 编辑版回草稿', r.status === 200 && r.json.data.status === 'draft', JSON.stringify(r.json));
  dOld = await req('GET', `/api/tutorials/${t5.id}`);
  rec('AC-FN-19/AC-EG-15 驳回后前台继续展示旧版 v1 不变',
    dOld.status === 200 && dOld.json.data.content === '<p>自测正文-C1-v1</p>', 'content=' + dOld.json?.data?.content);
  rec('AC-EG-15 驳回后前台列表/搜索持续命中', (await frontHit(t5.title)).includes(t5.id));
  const row5b = dbRow(t5.id);
  rec('持久化: 驳回后快照列不动(content≠快照), status=draft',
    row5b.status === 'draft' && row5b.published_content === '<p>自测正文-C1-v1</p>' && row5b.reject_reason === '回审版正文质量不达标需修改',
    JSON.stringify({ status: row5b.status, pc: row5b.published_content, rr: row5b.reject_reason }));

  // ============ 11. AC-EG-18 已下架编辑回审 ============
  r = await req('PUT', `/api/tutorials/${OFF_ID}`, { token: O, body: { summary: 'AC-EG-18 已下架编辑回审自测-更新摘要，保证内容已变触发回审流程完整验证。' } });
  rec('AC-EG-18 已下架编辑保存 → 自动回审 pending', r.status === 200 && r.json.data.status === 'pending', JSON.stringify(r.json));
  const d24 = await req('GET', `/api/tutorials/${OFF_ID}`);
  rec('AC-EG-18 回审期间前台保持不可见(404 invisible)', d24.status === 404 && d24.json.message === '该教程不存在或暂不可见' && d24.json.data?.reason === 'invisible', JSON.stringify(d24.json));
  r = await req('POST', `/api/tutorials/${OFF_ID}/review`, { token: A, body: { action: 'reject', reason: '下架回审版驳回保持不可见验证' } });
  rec('AC-EG-18 回审版驳回 → draft', r.status === 200 && r.json.data.status === 'draft', JSON.stringify(r.json));
  const d24b = await req('GET', `/api/tutorials/${OFF_ID}`);
  rec('AC-EG-18 驳回后维持不可见(来源已下架态)', d24b.status === 404, JSON.stringify(d24b.json));

  console.log('\nSUMMARY pass=' + pass + ' fail=' + fail);
  results.filter(x => !x.ok).forEach(x => console.log('FAILED: ' + x.name + ' | ' + x.detail));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(2); });
