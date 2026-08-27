// BE-05 self-test: offline / republish / copy / top
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
const { DatabaseSync } = require('node:sqlite');
function dbRow(id) {
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  const row = db.prepare('SELECT id,title,status,is_top,sort,view_count,fav_count,helpful_yes,helpful_no,share_count,submit_count,published_content,published_summary,published_at,last_offline_at,reject_reason,author_id FROM tutorials WHERE id=?').get(id);
  db.close();
  return row;
}
async function mgmtItem(T, id) {
  const r = await req('GET', '/api/tutorials?all=1&pageSize=100', { token: T.admin });
  return (r.json.data.list || []).find(x => x.id === id) || null;
}
async function frontHit(keyword) {
  const r = await req('GET', '/api/tutorials?keyword=' + encodeURIComponent(keyword) + '&pageSize=50');
  return (r.json?.data?.list || []).map(x => x.id);
}
const isBlank = v => v === null || v === undefined || ('' + v).trim() === '';

(async () => {
  // ---- auth setup ----
  const A = (await req('POST', '/api/auth/login', { body: { username: 'admin', password: '123456' } })).json.data.token;
  const O = (await req('POST', '/api/auth/login', { body: { username: 'operator', password: '123456' } })).json.data.token;
  const U = (await req('POST', '/api/auth/role-login', { body: { erpRole: 'sales' } })).json.data.token;
  const T = { admin: A, operator: O, user: U };
  rec('登录准备 admin/operator/user', !!A && !!O && !!U);

  // fixture: 建草稿 → 提审 → 过审（published，自持数据不依赖种子状态）
  async function mkDraft(suffix, over = {}) {
    const body = {
      title: 'BE05自测' + suffix + ' ' + uniq,
      categoryId: 1,
      summary: '自测摘要-' + suffix + '，用于BE-05上下架复制置顶链路验证。',
      content: '<p>自测正文-' + suffix + '-v1</p>',
      tags: ['自测']
    };
    Object.assign(body, over);
    const r = await req('POST', '/api/tutorials', { token: O, body });
    if (r.status !== 200) throw new Error('create failed: ' + JSON.stringify(r.json));
    return { id: r.json.data.id, title: body.title };
  }
  async function publish(fx) {
    await req('POST', `/api/tutorials/${fx.id}/submit`, { token: O, body: {} });
    const r = await req('POST', `/api/tutorials/${fx.id}/review`, { token: A, body: { action: 'approve' } });
    if (r.status !== 200) throw new Error('publish failed: ' + JSON.stringify(r.json));
    return r.json.data;
  }

  // ============ 1. offline 正向 AC-OP-03 / AC-RULE-04 ============
  const p1 = await mkDraft('E1'); await publish(p1);
  for (let i = 0; i < 3; i++) await req('GET', `/api/tutorials/${p1.id}`);           // 浏览计数+3
  await req('POST', `/api/favorites/${p1.id}`, { token: U, body: {} });              // 收藏+1
  const before = await mgmtItem(T, p1.id);
  rec('AC-OP-03 前置: published 且前台可见+计数非零', before.status === 'published' && before.viewCount >= 3 && before.favCount >= 1,
    JSON.stringify({ status: before.status, v: before.viewCount, f: before.favCount }));
  rec('AC-OP-03 前置: 前台列表命中', (await frontHit(p1.title)).includes(p1.id));
  let r = await req('POST', `/api/tutorials/${p1.id}/offline`, { token: A, body: {} });
  rec('AC-OP-03 下架: 200 + status=offline + lastOfflineAt 非空',
    r.status === 200 && r.json.code === 0 && r.json.data.status === 'offline' && !isBlank(r.json.data.lastOfflineAt), JSON.stringify(r.json));
  rec('AC-OP-03 下架后前台列表/keyword 下一请求即不返回', (await frontHit(p1.title)).length === 0);
  const dOff = await req('GET', `/api/tutorials/${p1.id}`);
  rec('AC-OP-03/AC-RULE-04 直达详情 404 该教程已下架', dOff.status === 404 && dOff.json.message === '该教程已下架' && dOff.json.data?.reason === 'offline', JSON.stringify(dOff.json));
  const mOff = await mgmtItem(T, p1.id);
  rec('AC-OP-03 计数保留: view/fav 与下架前一致',
    mOff.viewCount === before.viewCount && mOff.favCount === before.favCount,
    JSON.stringify({ before: [before.viewCount, before.favCount], after: [mOff.viewCount, mOff.favCount] }));
  const rowOff = dbRow(p1.id);
  rec('AC-RULE-04 持久化: status=offline + last_offline_at 落库',
    rowOff.status === 'offline' && !isBlank(rowOff.last_offline_at), JSON.stringify({ status: rowOff.status, lo: rowOff.last_offline_at }));

  // offline 权限/异常
  r = await req('POST', `/api/tutorials/${p1.id}/offline`, { token: O, body: {} });
  rec('权限: operator 下架 → 403 无权限执行该操作', r.status === 403 && r.json.message === '无权限执行该操作', JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${p1.id}/offline`, { token: U, body: {} });
  rec('权限: user 下架 → 403', r.status === 403, JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${p1.id}/offline`, { body: {} });
  rec('异常: 未登录下架 → 401', r.status === 401, JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/99999/offline`, { token: A, body: {} });
  rec('异常: 不存在 id 下架 → 404 教程不存在', r.status === 404 && r.json.message === '教程不存在', JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${p1.id}/offline`, { token: A, body: {} });
  rec('非法迁移: 已下架再下架 → 409', r.status === 409 && r.json.message === '该教程状态已变化，请刷新', JSON.stringify(r.json));

  // offline 非法迁移: pending / draft
  const pend = await mkDraft('E2'); await req('POST', `/api/tutorials/${pend.id}/submit`, { token: O, body: {} });
  r = await req('POST', `/api/tutorials/${pend.id}/offline`, { token: A, body: {} });
  rec('非法迁移: pending 下架 → 409 且保持 pending', r.status === 409 && r.json.message === '该教程状态已变化，请刷新', JSON.stringify(r.json));
  let m = await mgmtItem(T, pend.id);
  rec('非法迁移: pending 状态不变', m.status === 'pending', m.status);
  const dr = await mkDraft('E3');
  r = await req('POST', `/api/tutorials/${dr.id}/offline`, { token: A, body: {} });
  rec('非法迁移: draft 下架 → 409 且保持 draft', r.status === 409, JSON.stringify(r.json));
  m = await mgmtItem(T, dr.id);
  rec('非法迁移: draft 状态不变', m.status === 'draft', m.status);

  // ============ 2. republish 正向 AC-FN-11 ============
  r = await req('POST', `/api/tutorials/${p1.id}/republish`, { token: A, body: {} });
  rec('AC-FN-11 重发布: 200 published + 计数延续 + 无 pending 中间态',
    r.status === 200 && r.json.data.status === 'published' && r.json.data.viewCount === before.viewCount && r.json.data.favCount === before.favCount,
    JSON.stringify(r.json));
  rec('AC-FN-11 前台下一请求即返回(列表命中)', (await frontHit(p1.title)).includes(p1.id));
  const dRep = await req('GET', `/api/tutorials/${p1.id}`);
  rec('AC-FN-11 直达详情恢复 200', dRep.status === 200 && dRep.json.data.content === '<p>自测正文-E1-v1</p>', dRep.status);
  const rowRep = dbRow(p1.id);
  rec('AC-FN-11 持久化: last_offline_at=NULL + status=published',
    rowRep.status === 'published' && rowRep.last_offline_at === null, JSON.stringify({ status: rowRep.status, lo: rowRep.last_offline_at }));
  m = await mgmtItem(T, p1.id);
  rec('AC-FN-11 管理列表状态=published', m.status === 'published', m.status);

  // republish 权限/非法
  r = await req('POST', `/api/tutorials/${p1.id}/republish`, { token: A, body: {} });
  rec('非法迁移: published 重发布 → 409 且保持 published', r.status === 409 && r.json.message === '该教程状态已变化，请刷新', JSON.stringify(r.json));
  m = await mgmtItem(T, p1.id);
  rec('非法迁移: published 状态不变', m.status === 'published', m.status);
  // offline 权限补测(用临时下架教程)
  const p2 = await mkDraft('F1'); await publish(p2);
  await req('POST', `/api/tutorials/${p2.id}/offline`, { token: A, body: {} });
  r = await req('POST', `/api/tutorials/${p2.id}/republish`, { token: O, body: {} });
  rec('权限: operator 重发布 → 403', r.status === 403 && r.json.message === '无权限执行该操作', JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${p2.id}/republish`, { token: U, body: {} });
  rec('权限: user 重发布 → 403', r.status === 403, JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${p2.id}/republish`, { body: {} });
  rec('异常: 未登录重发布 → 401', r.status === 401, JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/99999/republish`, { token: A, body: {} });
  rec('异常: 不存在 id 重发布 → 404', r.status === 404, JSON.stringify(r.json));
  await req('POST', `/api/tutorials/${p2.id}/republish`, { token: A, body: {} }); // 复位 published 供 top 用

  // ============ 3. copy 正向 AC-FN-12 / AC-RULE-14（种子 id=3，published 计数非零） ============
  const srcBefore = await mgmtItem(T, 3);
  r = await req('POST', `/api/tutorials/3/copy`, { token: O, body: {} });
  const cp = r.json?.data;
  const suffix = '（副本）';
  const titleOk = cp && cp.title === srcBefore.title + suffix;
  rec('AC-FN-12/RULE-14 复制: 200 新草稿 + 标题=源标题+（副本）',
    r.status === 200 && cp.status === 'draft' && cp.id !== 3 && titleOk, JSON.stringify({ resp: r.json, srcTitle: srcBefore.title }));
  rec('AC-RULE-14 六类计数全 0（响应）',
    cp && cp.viewCount === 0 && cp.favCount === 0 && cp.helpfulYes === 0 && cp.helpfulNo === 0 && cp.shareCount === 0,
    JSON.stringify({ v: cp?.viewCount, f: cp?.favCount, hy: cp?.helpfulYes, hn: cp?.helpfulNo, s: cp?.shareCount }));
  m = await mgmtItem(T, cp.id);
  rec('AC-FN-12 管理列表: 新记录 draft', m && m.status === 'draft', m && m.status);
  rec('AC-FN-12 前台不可见(published_content=NULL)', (await frontHit(m.title)).length === 0);
  const rowCp = dbRow(cp.id);
  rec('AC-RULE-14 持久化: 快照/驳回原因清空 + submit_count=0 + 作者=复制人 + is_top/sort 缺省',
    rowCp.published_content === null && rowCp.published_summary === null && rowCp.published_at === null
      && rowCp.reject_reason === null && rowCp.submit_count === 0 && rowCp.author_id === 2 && rowCp.is_top === 0 && rowCp.sort === 100,
    JSON.stringify({ pc: rowCp.published_content, sc: rowCp.submit_count, author: rowCp.author_id, top: rowCp.is_top, sort: rowCp.sort }));
  const srcAfter = await mgmtItem(T, 3);
  rec('AC-FN-12 源教程状态与计数不变',
    srcAfter.status === srcBefore.status && srcAfter.viewCount === srcBefore.viewCount && srcAfter.favCount === srcBefore.favCount && srcAfter.title === srcBefore.title,
    JSON.stringify({ b: [srcBefore.status, srcBefore.viewCount, srcBefore.favCount], a: [srcAfter.status, srcAfter.viewCount, srcAfter.favCount] }));
  r = await req('POST', `/api/tutorials/${pend.id}/copy`, { token: A, body: {} });
  rec('AC-FN-12 任意状态可复制(pending 源) + admin 也可复制', r.status === 200 && r.json.data.status === 'draft', JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/${dr.id}/copy`, { token: O, body: {} });
  rec('AC-FN-12 任意状态可复制(draft 源)', r.status === 200 && r.json.data.status === 'draft', JSON.stringify(r.json));

  // copy 标题截断边界
  const t96 = 'A'.repeat(96);
  const f96 = await mkDraft('G1', { title: t96 });
  r = await req('POST', `/api/tutorials/${f96.id}/copy`, { token: O, body: {} });
  rec('AC-RULE-14 边界: 源标题96字 → 新标题100字不截断', r.status === 200 && r.json.data.title === t96 + suffix && r.json.data.title.length === 100,
    'len=' + r.json?.data?.title?.length);
  const t97 = 'B'.repeat(97);
  const f97 = await mkDraft('G2', { title: t97 });
  r = await req('POST', `/api/tutorials/${f97.id}/copy`, { token: O, body: {} });
  rec('AC-RULE-14 边界: 源标题97字 → 截断至96再拼接恰100字',
    r.status === 200 && r.json.data.title === t97.slice(0, 96) + suffix && r.json.data.title.length === 100,
    'len=' + r.json?.data?.title?.length);

  // copy 异常
  r = await req('POST', `/api/tutorials/3/copy`, { token: U, body: {} });
  rec('权限: user 复制 → 403', r.status === 403 && r.json.message === '无权限执行该操作', JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/3/copy`, { body: {} });
  rec('异常: 未登录复制 → 401', r.status === 401, JSON.stringify(r.json));
  r = await req('POST', `/api/tutorials/99999/copy`, { token: O, body: {} });
  rec('异常: 不存在源复制 → 404 教程不存在', r.status === 404 && r.json.message === '教程不存在', JSON.stringify(r.json));

  // ============ 4. top 置顶与排序 ============
  r = await req('PUT', `/api/tutorials/${p2.id}/top`, { token: A, body: { isTop: 1, sort: 1 } });
  rec('top 正向: 已发布置顶 200 + isTop/sort/status 回显',
    r.status === 200 && r.json.data.isTop === 1 && r.json.data.sort === 1 && r.json.data.status === 'published', JSON.stringify(r.json));
  const fl = await req('GET', '/api/tutorials?page=1&pageSize=10');
  const first = fl.json.data.list[0];
  rec('top 生效: 前台列表第一位=置顶教程且 isTop=1', first.id === p2.id && first.isTop === 1, JSON.stringify({ firstId: first.id, isTop: first.isTop, expect: p2.id }));
  const rowTop = dbRow(p2.id);
  rec('top 持久化: is_top=1 + sort=1', rowTop.is_top === 1 && rowTop.sort === 1, JSON.stringify({ top: rowTop.is_top, sort: rowTop.sort }));
  // operator 权限
  const p3 = await mkDraft('H1'); await publish(p3);
  r = await req('PUT', `/api/tutorials/${p3.id}/top`, { token: O, body: { isTop: 1, sort: 2 } });
  rec('权限: operator 置顶放行 200', r.status === 200 && r.json.data.isTop === 1, JSON.stringify(r.json));
  // 取消置顶/调 sort 不限状态（draft）
  r = await req('PUT', `/api/tutorials/${dr.id}/top`, { token: O, body: { isTop: 0 } });
  rec('top 取消置顶: draft 态放行 200', r.status === 200 && r.json.data.isTop === 0 && r.json.data.status === 'draft', JSON.stringify(r.json));
  r = await req('PUT', `/api/tutorials/${dr.id}/top`, { token: O, body: { isTop: 0, sort: 123 } });
  rec('top 调 sort: draft 态放行 200 + sort=123', r.status === 200 && r.json.data.sort === 123, JSON.stringify(r.json));
  // 取消置顶恢复
  await req('PUT', `/api/tutorials/${p3.id}/top`, { token: A, body: { isTop: 0 } });

  // top 校验
  r = await req('PUT', `/api/tutorials/${dr.id}/top`, { token: O, body: { isTop: 1, sort: 5 } });
  rec('top 状态校验: draft 置顶 → 409 仅已发布教程可置顶', r.status === 409 && r.json.message === '仅已发布教程可置顶', JSON.stringify(r.json));
  r = await req('PUT', `/api/tutorials/${pend.id}/top`, { token: O, body: { isTop: 1 } });
  rec('top 状态校验: pending 置顶 → 409', r.status === 409 && r.json.message === '仅已发布教程可置顶', JSON.stringify(r.json));
  const p4 = await mkDraft('H2'); await publish(p4);
  await req('POST', `/api/tutorials/${p4.id}/offline`, { token: A, body: {} });
  r = await req('PUT', `/api/tutorials/${p4.id}/top`, { token: A, body: { isTop: 1 } });
  rec('top 状态校验: offline 置顶 → 409', r.status === 409 && r.json.message === '仅已发布教程可置顶', JSON.stringify(r.json));
  r = await req('PUT', `/api/tutorials/${p2.id}/top`, { token: O, body: { sort: 5 } });
  rec('top 参数: isTop 缺失 → 400 isTop 必须为 0 或 1', r.status === 400 && r.json.message === 'isTop 必须为 0 或 1', JSON.stringify(r.json));
  r = await req('PUT', `/api/tutorials/${p2.id}/top`, { token: O, body: { isTop: 2 } });
  rec('top 参数: isTop=2 → 400', r.status === 400 && r.json.message === 'isTop 必须为 0 或 1', JSON.stringify(r.json));
  r = await req('PUT', `/api/tutorials/${p2.id}/top`, { token: O, body: { isTop: '1' } });
  rec('top 参数: isTop 字符串类型 → 400', r.status === 400, JSON.stringify(r.json));
  r = await req('PUT', `/api/tutorials/${p2.id}/top`, { token: O, body: { isTop: 0, sort: 10000 } });
  rec('top 参数: sort=10000 越界 → 400', r.status === 400 && r.json.message === 'isTop 必须为 0 或 1', JSON.stringify(r.json));
  r = await req('PUT', `/api/tutorials/${p2.id}/top`, { token: O, body: { isTop: 0, sort: -1 } });
  rec('top 参数: sort=-1 越界 → 400', r.status === 400, JSON.stringify(r.json));
  r = await req('PUT', `/api/tutorials/${p2.id}/top`, { token: U, body: { isTop: 0 } });
  rec('权限: user top → 403', r.status === 403, JSON.stringify(r.json));
  r = await req('PUT', `/api/tutorials/${p2.id}/top`, { body: { isTop: 0 } });
  rec('异常: 未登录 top → 401', r.status === 401, JSON.stringify(r.json));
  r = await req('PUT', `/api/tutorials/99999/top`, { token: O, body: { isTop: 0 } });
  rec('异常: 不存在 id top → 404', r.status === 404, JSON.stringify(r.json));
  // 边界: sort=0 与 9999 合法
  r = await req('PUT', `/api/tutorials/${p2.id}/top`, { token: O, body: { isTop: 0, sort: 0 } });
  const r2 = await req('PUT', `/api/tutorials/${p2.id}/top`, { token: O, body: { isTop: 0, sort: 9999 } });
  rec('top 边界: sort=0 与 9999 均合法', r.status === 200 && r.json.data.sort === 0 && r2.status === 200 && r2.json.data.sort === 9999, JSON.stringify([r.json?.data, r2.json?.data]));
  await req('PUT', `/api/tutorials/${p2.id}/top`, { token: A, body: { isTop: 0, sort: 100 } }); // 复位

  // ============ 5. 权限矩阵: user 四端点全 403 ============
  const p5 = await mkDraft('H3'); await publish(p5); await req('POST', `/api/tutorials/${p5.id}/offline`, { token: A, body: {} });
  const m403 = [];
  m403.push(await req('POST', `/api/tutorials/${p5.id}/offline`, { token: U, body: {} }));
  m403.push(await req('POST', `/api/tutorials/${p5.id}/republish`, { token: U, body: {} }));
  m403.push(await req('POST', `/api/tutorials/3/copy`, { token: U, body: {} }));
  m403.push(await req('PUT', `/api/tutorials/3/top`, { token: U, body: { isTop: 0 } }));
  rec('权限矩阵: user 四端点全 403', m403.every(x => x.status === 403 && x.json.message === '无权限执行该操作'), m403.map(x => x.status).join(','));
  await req('POST', `/api/tutorials/${p5.id}/republish`, { token: A, body: {} });

  console.log('\nSUMMARY pass=' + pass + ' fail=' + fail);
  results.filter(x => !x.ok).forEach(x => console.log('FAILED: ' + x.name + ' | ' + x.detail));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(2); });
