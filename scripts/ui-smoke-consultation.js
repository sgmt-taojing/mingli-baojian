#!/usr/bin/env node
/**
 * ui-smoke-consultation.js — 问诊台双轨链路 UI 级回归（puppeteer-core + 系统 Chrome）
 *
 * 覆盖（与 2026-08-30 手工 UI 验收同口径）：
 *   1. 命理采集卡填生辰 → 点「排盘·AI命理」→ 草案生成（mingliDraft 落 App）
 *   2. 病历四字段录入 → 点「归档」→ 病历号回执 + 「查看合并报告」链接
 *   3. 切命理师视角 → SLA 计时条拉取 8974 队列
 *   4. 直达合并报告页 → 主诉段 + 命理合参段（验证 emr.mingli 真实落库）
 *
 * 用法：node scripts/ui-smoke-consultation.js
 * 证据：DELIVERY/ui-smoke-evidence-<ts>.json + 报告页截图；退出码 0=PASS 1=FAIL
 * 依赖：项目 node_modules 的 puppeteer-core；系统 Chrome（无头）。
 */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const BASE = 'http://127.0.0.1:8900';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, '..', 'DELIVERY');
const RUN_TAG = 'UI回归';

const evidence = { smoke: 'ui-consultation-dual-track', started_at: new Date().toISOString(), nodes: [], verdict: null };

function node(name, ok, summary, extra) {
  evidence.nodes.push({ node: name, ts: new Date().toISOString(), ok, summary, ...(extra || {}) });
  const mark = ok ? '✓' : '✗';
  console.log(` ${mark} ${name}${summary ? ' — ' + summary : ''}`);
  if (!ok) throw new Error(`${name}: ${summary}`);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1280,1800'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1800 });
  page.setDefaultTimeout(20000);

  let caseId = null, sid = null, reportUrl = null;

  try {
    // ── 0. 打开问诊台 ──
    await page.goto(`${BASE}/unified-consultation.html`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#capMlYear');
    node('0-打开问诊台', true, 'unified-consultation.html loaded');

    // ── 1. 命理采集卡：填生辰 → 点排盘 ──
    await page.evaluate(() => {
      $('capMlYear').value = 1990; $('capMlMonth').value = 5; $('capMlDay').value = 12;
      $('capMlHour').value = '10'; $('capMlCal').value = 'solar'; $('capMlGender').value = 'male';
    });
    await page.click('button[onclick="captureMingli()"]');
    await page.waitForFunction(() => $('mlTrackLabel').textContent === '已生成', { timeout: 20000 });
    const draft = await page.evaluate(() => ({
      cards: App.mingliDraft ? App.mingliDraft.cards.length : 0,
      overview: App.mingliDraft ? (App.mingliDraft.overview || '').slice(0, 30) : '',
      backfillYear: $('mlYear').value,
      resultShown: $('capMlResult').style.display,
    }));
    node('1-采集卡排盘出草案', draft.cards > 0 && draft.resultShown === 'block',
      `草案 ${draft.cards} 卡 · 批注台生辰回填=${draft.backfillYear} · ${draft.overview}…`);

    // ── 2. 病历录入 → 归档 ──
    await page.evaluate((tag) => {
      setEmr('complaint', `${tag}：胃脘胀满三日，伴食欲不振`);
      setEmr('examination', '舌淡红苔白腻，脉细弱');
      setEmr('syndrome', '脾胃气虚');
      setEmr('prescription', '四君子汤加减：党参9g 白术9g 茯苓9g 炙甘草6g');
    }, RUN_TAG);
    await page.click('button[onclick="archiveEmr()"]');
    await page.waitForFunction(() => {
      const b = document.getElementById('caseIdBadge');
      return b && b.style.display !== 'none' && b.innerText.includes('病历号 #');
    }, { timeout: 20000 });
    const arch = await page.evaluate(() => ({
      caseId: App.caseId, sid: App.sessionId,
      link: (document.querySelector('#caseIdBadge a') || {}).href || null,
    }));
    caseId = arch.caseId; sid = arch.sid; reportUrl = arch.link;
    node('2-归档回执+报告链接', !!(caseId && reportUrl && reportUrl.includes('report.html?sid=')),
      `病历号 #${caseId} · sid=${sid}`);

    // ── 3. 命理师视角 → SLA 计时条 ──
    await page.evaluate(() => setRole('master'));
    await page.waitForFunction(() => $('slaBacklog').textContent !== '—', { timeout: 15000 });
    const sla = await page.evaluate(() => ({
      backlog: $('slaBacklog').textContent, overdue: $('slaOverdue').textContent,
      boxShown: $('aiMingliBox').style.display,
    }));
    node('3-SLA计时条（命理师视角）', sla.boxShown === 'block',
      `待核 ${sla.backlog} · 超48h ${sla.overdue}`);

    // ── 4. 合并报告页：主诉段 + 命理合参段（emr.mingli 落库验证）──
    await page.goto(reportUrl, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('命理合参'), { timeout: 15000 });
    const rep = await page.evaluate((tag) => {
      const secs = [...document.querySelectorAll('.sec')];
      const find = (k) => { const s = secs.find(x => x.innerText.includes(k)); return s ? s.innerText : ''; };
      return {
        badges: document.getElementById('badges').innerText.replace(/\n/g, ' '),
        complaint: find('主诉'), mingli: find('命理合参'),
        prescription: find('处方'),
        disclaimer: document.getElementById('disclaimer').innerText,
      };
    }, RUN_TAG);
    const mingliOk = rep.mingli.includes('AI命理草案') && rep.mingli.includes('日主');
    node('4-合并报告（mingli 落库）', rep.complaint.includes(RUN_TAG) && mingliOk && rep.prescription.includes('党参'),
      `徽标[${rep.badges}] · 命理段 ${mingliOk ? '完整（草案全文在库）' : '缺失!'}`,
      { mingli_head: rep.mingli.slice(0, 60) });

    const shot = path.join(OUT, `ui-smoke-report-${caseId}-${Date.now()}.jpg`);
    await page.screenshot({ path: shot, type: 'jpeg', quality: 75, fullPage: false });
    evidence.screenshot = shot;

    evidence.case_id = caseId; evidence.session_id = sid;
    evidence.verdict = 'PASS';
  } catch (e) {
    evidence.verdict = 'FAIL: ' + e.message;
    try { await page.screenshot({ path: path.join(OUT, `ui-smoke-FAIL-${Date.now()}.png`) }); } catch (_) {}
    evidence.case_id = caseId; evidence.session_id = sid;
  } finally {
    evidence.finished_at = new Date().toISOString();
    fs.mkdirSync(OUT, { recursive: true });
    const fp = path.join(OUT, `ui-smoke-evidence-${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)}.json`);
    fs.writeFileSync(fp, JSON.stringify(evidence, null, 2), 'utf-8');
    console.log(`\n结论: ${evidence.verdict}\n证据: ${fp}`);
    await browser.close();
    process.exit(evidence.verdict === 'PASS' ? 0 : 1);
  }
})();
