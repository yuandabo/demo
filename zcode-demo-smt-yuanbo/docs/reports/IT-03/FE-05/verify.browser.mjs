/**
 * FE-05 浏览器通道联调验证脚本（Playwright 驱动，非仓库测试套件）
 * 目标：http://localhost:3000/portal.html（Express 托管 web/dist + /api 同源集成环境）
 * 覆盖矩阵：M1 首页两区块排序 / M3 搜索计时 / M4 宫格点击过滤 / M5 角标 /
 *          M6 推荐双口径（游客+采购登录）/ M7 详情计数与渲染 / M8 404 两分支 /
 *          M9 1s 超时兜底两路恢复 / M10 erpModule 带参 / M11 Chrome内核+Edge 控制台 /
 *          M12 详情首屏口径
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = 'http://localhost:3000';
const PAGE = `${BASE}/portal.html`;
const OUT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const results = [];
const shot = (name) => `${OUT}${name}`;

function record(id, pass, detail) {
  results.push({ id, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${id} | ${detail}`);
}

async function apiJson(path) {
  const r = await fetch(BASE + path);
  return r.json();
}

/** 汇集页面 console error / pageerror（M11 控制台 0 Error 口径） */
function attachConsole(page, sink) {
  page.on('console', (m) => m.type() === 'error' && sink.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => sink.push(`pageerror: ${String(e)}`));
}

async function main() {
  // ---------- Chromium 通道（Chrome 151 同源内核） ----------
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  // M8 的 404 分支页会合法产生 API 404 控制台记录（应用预期行为），单独归集不计入 M11
  const branch404Errors = [];

  // ===== 场景 1：游客首页（M1 两区块排序 / M5 角标 / M6a 游客推荐） =====
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachConsole(page, errors);
    await page.goto(PAGE + '#/');
    await page.waitForSelector('[data-testid="categories-grid"] .ccell', { timeout: 10000 });
    await page.waitForSelector('[data-testid="latest-section"] .tcard');
    await page.waitForSelector('[data-testid="hot-section"] .tcard');

    // M5 角标：12 格 + 待补充（系统设置 8 / 开放平台 12）
    const cells = await page.locator('[data-testid="categories-grid"] .ccell').count();
    const badge8 = await page.locator('[data-testid="category-count-8"]').innerText();
    const badge12 = await page.locator('[data-testid="category-count-12"]').innerText();
    const badge1 = await page.locator('[data-testid="category-count-1"]').innerText();
    record('M5-宫格12格+角标', cells === 12 && badge8 === '待补充' && badge12 === '待补充',
      `cells=${cells} cat8=${badge8} cat12=${badge12} cat1=${badge1}`);

    // M5 对账：每个一级分类角标 N 篇 == API categoryId 列表 total
    const cats = (await apiJson('/api/categories?withCount=1')).data.list;
    let reconOk = true; const recon = [];
    for (const c of cats) {
      const t = (await apiJson(`/api/tutorials?categoryId=${c.id}&pageSize=1`)).data.total;
      const ok = t === c.tutorialCount;
      reconOk = reconOk && ok;
      recon.push(`cat${c.id}(${c.name}) badge=${c.tutorialCount}/list=${t}${ok ? '' : ' ✗'}`);
    }
    record('M5-角标对账(12分类)', reconOk, recon.join(', '));

    // M1 首页两区块与接口排序一致
    const latestIds = await page.locator('[data-testid="latest-section"] .tcard').evaluateAll(
      (els) => els.map((e) => e.getAttribute('data-testid').replace('tutorial-card-', '')));
    const hotIds = await page.locator('[data-testid="hot-section"] .tcard').evaluateAll(
      (els) => els.map((e) => e.getAttribute('data-testid').replace('tutorial-card-', '')));
    const apiLatest = (await apiJson('/api/tutorials?sort=latest&page=1&pageSize=6')).data.list.map((t) => String(t.id));
    const apiHot = (await apiJson('/api/tutorials?sort=hot&page=1&pageSize=6')).data.list.map((t) => String(t.id));
    record('M1-最近更新区块=sort=latest', JSON.stringify(latestIds) === JSON.stringify(apiLatest),
      `dom=[${latestIds}] api=[${apiLatest}]`);
    record('M1-热门区块=sort=hot', JSON.stringify(hotIds) === JSON.stringify(apiHot),
      `dom=[${hotIds}] api=[${apiHot}]`);

    // M6a 游客推荐：热门推荐口径=全站 Top6
    const rTitle = await page.locator('[data-testid="recommend-title"]').innerText();
    const rIds = await page.locator('[data-testid="recommend-section"] .role-grid .tcard').evaluateAll(
      (els) => els.map((e) => e.getAttribute('data-testid').replace('tutorial-card-', '')));
    const apiGuest = (await apiJson('/api/recommend')).data;
    const apiGuestIds = apiGuest.list.map((t) => String(t.id));
    record('M6a-游客推荐=全站Top6', rTitle === '热门推荐' && apiGuest.source === 'global' &&
      JSON.stringify(rIds) === JSON.stringify(apiGuestIds),
      `title=${rTitle} source=${apiGuest.source} dom=[${rIds}] api=[${apiGuestIds}]`);

    await page.screenshot({ path: shot('FE-05-home-chromium.png'), fullPage: true });
    await page.screenshot({ path: shot('FE-05-impl.png'), fullPage: true });

    // M4 宫格点击"生产制造"→列表过滤对账
    await page.click('[data-testid="category-cell-4"]');
    await page.waitForURL('**/list?categoryId=4');
    await page.waitForSelector('[data-testid="list-total"]');
    await page.waitForFunction(() => !document.querySelector('[data-testid="list-skeleton"]'));
    const total4 = await page.locator('[data-testid="list-total"]').innerText();
    const treeOn = await page.locator('[data-testid="tree-node-4"].on').count();
    record('M4-宫格点击生产制造跳列表过滤', total4 === '3' && treeOn === 1,
      `listTotal=${total4} tree-node-4 selected=${treeOn === 1}`);
    await page.screenshot({ path: shot('FE-05-list-category4.png'), fullPage: true });
    await ctx.close();
  }

  // ===== 场景 2：搜索计时（M3）+ erpModule 带参（M10） =====
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachConsole(page, errors);
    await page.goto(PAGE + '#/list');
    await page.waitForSelector('[data-testid="search-input"]');
    await page.fill('[data-testid="search-input"]', '算料');
    await page.click('[data-testid="search-submit-btn"]');
    await page.waitForFunction(() => !document.querySelector('[data-testid="list-skeleton"]'));
    const total = await page.locator('[data-testid="list-total"]').innerText();
    const timing = await page.evaluate(() => {
      const es = performance.getEntriesByType('resource').filter((e) => e.name.includes('/api/tutorials') && e.name.includes('keyword'));
      return es.length ? Math.round(es[es.length - 1].duration) : -1;
    });
    const rows = await page.locator('.row-card').count();
    record('M3-搜索算料计时≤1s', Number(total) === 4 && timing >= 0 && timing <= 1000,
      `total=${total} rows=${rows} requestDuration=${timing}ms`);
    await page.screenshot({ path: shot('FE-05-list-search.png'), fullPage: true });

    // M10 工作台带参入口（FE-04 页面未交付，验证 FE-03 列表 erpModule 映射）
    await page.goto(PAGE + '#/list?erpModule=produce');
    await page.waitForFunction(() => !document.querySelector('[data-testid="list-skeleton"]'));
    await page.waitForSelector('[data-testid="tree-node-4"]');
    await page.waitForTimeout(300);
    const url = page.url();
    const totalP = await page.locator('[data-testid="list-total"]').innerText();
    const on4 = await page.locator('[data-testid="tree-node-4"].on').count();
    record('M10-erpModule=produce→生产制造', url.includes('categoryId=4') && totalP === '3' && on4 === 1,
      `url=${url.replace(PAGE, '')} listTotal=${totalP} node4Selected=${on4 === 1}`);
    await ctx.close();
  }

  // ===== 场景 3：采购角色登录推荐（M6b） =====
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachConsole(page, errors);
    await page.goto(PAGE + '#/');
    await page.waitForSelector('[data-testid="role-pill-btn"]');
    await page.click('[data-testid="role-pill-btn"]');
    await page.waitForSelector('[data-testid="role-login-modal"]');
    await page.click('[data-testid="role-card-purchase"]');
    await page.waitForFunction(() => document.querySelector('[data-testid="recommend-title"]')?.textContent.includes('采购'));
    const rTitle = await page.locator('[data-testid="recommend-title"]').innerText();
    const cards = await page.locator('[data-testid="recommend-section"] .role-grid .tcard').evaluateAll(
      (els) => els.map((e) => ({ id: e.getAttribute('data-testid').replace('tutorial-card-', ''), cat: e.querySelector('.tc-meta .cat')?.textContent ?? '' })));
    const vcs = await page.locator('[data-testid="recommend-section"] .role-grid .tcard').evaluateAll(
      (els) => els.map((e) => e.textContent.match(/👁\s*([\d,]+)/)?.[1] ?? '?'));
    const apiRole = await (await fetch(BASE + '/api/recommend', {
      headers: { Authorization: 'Bearer ' + (await page.evaluate(() => localStorage.getItem('erp_token'))) },
    })).json();
    const inHitSet = cards.every((c) => /采购管理|库存管理/.test(c.cat));
    const vcNums = vcs.map((v) => Number(v.replace(/,/g, '')));
    const desc = vcNums.every((v, i) => i === 0 || vcNums[i - 1] >= v);
    record('M6b-采购推荐命中集+倒序+不足6实际数',
      rTitle.includes('采购') && apiRole.data.source === 'role' && cards.length === 5 && inHitSet && desc,
      `title=${rTitle} source=${apiRole.data.source} n=${cards.length}/${apiRole.data.list.length} 命中集=${inHitSet} 倒序=${desc} vcs=[${vcNums}]`);
    await page.screenshot({ path: shot('FE-05-home-purchase.png'), fullPage: true });
    await ctx.close();
  }

  // ===== 场景 4：详情（M7 浏览器通道 / M8 两分支 / M12 首屏口径） =====
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachConsole(page, branch404Errors);

    // M12 + M7：列表点卡进详情（跳转链路），接口耗时与文字渲染
    await page.goto(PAGE + '#/list?keyword=BOM');
    await page.waitForFunction(() => !document.querySelector('[data-testid="list-skeleton"]'));
    await page.click('[data-testid="tutorial-card-3"]');
    await page.waitForURL('**/detail/3');
    await page.waitForSelector('.dt-body, .dt-wrap, main', { timeout: 5000 }).catch(() => {});
    await page.waitForFunction(() => document.body.textContent.includes('MRP 自动算料'));
    const dtTiming = await page.evaluate(() => {
      const es = performance.getEntriesByType('resource').filter((e) => /\/api\/tutorials\/3/.test(e.name));
      return es.length ? Math.round(es[es.length - 1].duration) : -1;
    });
    const textOk = await page.evaluate(() => document.body.innerText.length > 500);
    record('M12-详情接口耗时<2s+文字先行基础', dtTiming >= 0 && dtTiming < 2000 && textOk,
      `apiDuration=${dtTiming}ms 文字内容渲染=${textOk}`);

    // M7：刷新详情 → 页面显示计数 vs 紧随 API 取值 = 显示值+1（每次 GET 均含自身 +1，AC-RULE-08）
    await page.reload();
    await page.waitForFunction(() => document.body.textContent.includes('MRP 自动算料'));
    const displayed = await page.evaluate(() => {
      const m = document.body.textContent.match(/👁 浏览 ([\d,]+)/);
      return m ? Number(m[1].replace(/,/g, '')) : -1;
    });
    const apiAfter = (await apiJson('/api/tutorials/3')).data.viewCount;
    record('M7-详情刷新后API计数=页面显示+1', apiAfter === displayed + 1,
      `页面显示=${displayed} 紧随API=${apiAfter} (差值=${apiAfter - displayed})`);

    // prev 置灰（id3 为置顶首位无上一篇）、next 可点
    const prevDisabled = await page.locator('[data-testid="detail-prev-btn"]').isDisabled();
    const nextDisabled = await page.locator('[data-testid="detail-next-btn"]').isDisabled();
    record('M7-prev/next按钮态', prevDisabled && !nextDisabled,
      `prevDisabled=${prevDisabled} nextDisabled=${nextDisabled}`);
    await page.screenshot({ path: shot('FE-05-detail.png'), fullPage: true });

    // M8a 纯草稿 22 → 不存在或暂不可见
    await page.goto(PAGE + '#/detail/22');
    await page.waitForFunction(() => document.body.textContent.includes('该教程不存在或暂不可见'));
    record('M8a-纯草稿详情404提示页', true, '#/detail/22 显示"该教程不存在或暂不可见"');
    await page.screenshot({ path: shot('FE-05-detail-invisible.png'), fullPage: true });

    // M8b 已下架 24 → 已下架 + related
    await page.goto(PAGE + '#/detail/24');
    await page.waitForFunction(() => document.body.textContent.includes('该教程已下架'));
    const relCount = await page.locator('[data-testid="offline-related"] a').count();
    record('M8b-已下架详情提示页+related', relCount === 3, `#/detail/24 显示"该教程已下架" related=${relCount} 篇`);
    await page.screenshot({ path: shot('FE-05-detail-offline.png'), fullPage: true });
    await ctx.close();
  }

  // ===== 场景 5：1s 超时兜底（M9，路由延迟模拟 Slow 3G） =====
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    attachConsole(page, errors);
    await page.goto(PAGE + '#/list');
    await page.waitForSelector('[data-testid="search-input"]');
    // 拦截 keyword 搜索请求延迟 3s（>1s 前端竞速超时）
    await page.route('**/api/tutorials?**keyword**', async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });
    const t0 = Date.now();
    await page.fill('[data-testid="search-input"]', '算料');
    await page.click('[data-testid="search-submit-btn"]');
    await page.waitForSelector('[data-testid="search-timeout-alert"]', { timeout: 4000 });
    const alertMs = Date.now() - t0;
    const alertText = (await page.locator('[data-testid="search-timeout-alert"]').innerText()).trim();
    const kwKept = await page.inputValue('[data-testid="search-input"]');
    record('M9-1s超时提示+筛选保留', alertText.includes('搜索超时，请重试') && alertMs < 2500 && kwKept === '算料',
      `alert="${alertText.split('\n')[0]}" 出现耗时=${alertMs}ms 关键词保留=${kwKept}`);
    await page.screenshot({ path: shot('FE-05-timeout-alert.png'), fullPage: true });

    // 恢复路径 1：解除限速 → 重试成功
    await page.unroute('**/api/tutorials?**keyword**');
    await page.click('[data-testid="search-retry-link"]');
    await page.waitForFunction(() => document.querySelector('[data-testid="list-total"]')?.textContent === '4');
    const alertGone = (await page.locator('[data-testid="search-timeout-alert"]').count()) === 0;
    record('M9-恢复路径1:重试成功', alertGone, `total=4 超时条消失=${alertGone}`);

    // 恢复路径 2：分类浏览不受影响（先清关键词，避免组合过滤干扰对账）
    await page.click('[data-testid="clear-filters-btn"]');
    await page.waitForFunction(() => document.querySelector('[data-testid="list-total"]')?.textContent === '19');
    await page.click('[data-testid="tree-node-4"]');
    await page.waitForFunction(() => document.querySelector('[data-testid="list-total"]')?.textContent === '3');
    const totalCat = await page.locator('[data-testid="list-total"]').innerText();
    record('M9-恢复路径2:分类浏览正常', totalCat === '3', `清空后全站=19 → 生产制造 total=${totalCat}`);
    await ctx.close();
  }

  const chromiumErrors = errors.filter((e) => !/favicon/.test(e));
  record('M11-Chromium控制台0Error', chromiumErrors.length === 0, chromiumErrors.join(' ;; ') || '0 error');

  await browser.close();

  // ---------- Edge 通道（真实 Edge 151 stable，M11） ----------
  try {
    const edge = await chromium.launch({ channel: 'msedge', headless: true });
    const eErrors = [];
    const eCtx = await edge.newContext({ viewport: { width: 1440, height: 900 } });
    const ePage = await eCtx.newPage();
    attachConsole(ePage, eErrors);
    await ePage.goto(PAGE + '#/');
    await ePage.waitForSelector('[data-testid="categories-grid"] .ccell');
    const eCells = await ePage.locator('[data-testid="categories-grid"] .ccell').count();
    const eGridW = await ePage.locator('[data-testid="categories-grid"]').boundingBox();
    await ePage.screenshot({ path: shot('FE-05-home-edge.png'), fullPage: true });

    await ePage.goto(PAGE + '#/list');
    await ePage.waitForFunction(() => !document.querySelector('[data-testid="list-skeleton"]'));
    await ePage.fill('[data-testid="search-input"]', '算料');
    await ePage.click('[data-testid="search-submit-btn"]');
    await ePage.waitForFunction(() => document.querySelector('[data-testid="list-total"]')?.textContent === '4');
    await ePage.screenshot({ path: shot('FE-05-list-edge.png'), fullPage: true });

    await ePage.goto(PAGE + '#/detail/3');
    await ePage.waitForFunction(() => document.body.textContent.includes('MRP 自动算料'));
    await ePage.screenshot({ path: shot('FE-05-detail-edge.png'), fullPage: true });

    const eErr = eErrors.filter((e) => !/favicon/.test(e));
    record('M11-Edge三页走查', eCells === 12 && eGridW.width > 1100 && eErr.length === 0,
      `home 12格+grid宽=${Math.round(eGridW.width)}px; 搜索total=4; 详情渲染OK; console errors=${eErr.length}${eErr.length ? ' :: ' + eErr.join(';;') : ''}`);
    await edge.close();
  } catch (e) {
    record('M11-Edge三页走查', false, String(e.message).split('\n')[0]);
  }

  fs.writeFileSync(`${OUT}browser-results.json`, JSON.stringify(results, null, 2));
  const fail = results.filter((r) => !r.pass);
  console.log(`\n==== SUMMARY: ${results.length - fail.length}/${results.length} PASS ====`);
  process.exit(fail.length ? 1 : 0);
}

main().catch((e) => { console.error('SCRIPT ERROR', e); process.exit(2); });
