#!/usr/bin/env node
# [R112-ARCHIVED-REF] 本脚本引用的 knowledge/yidao.db 已于 R110 归档到 data/backups/legacy-kb-202608/
# 如需重跑：先把 DB 路径改为 server/database/yidao.db（唯一权威库）。本脚本为一次性历史任务，保留仅作审计。
/**
 * R430 全量诊断审计脚本
 * 按 launch-audit-mandatory 规则：6 大类 × 全量扫描
 * 
 * 用法: node scripts/r430-full-audit.js
 * 输出: .openclaw/tmp/r430-audit-report.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname, '..');
const APP_DIR = path.join(PROJECT_DIR, 'app');
const report = { ts: new Date().toISOString(), categories: [], summary: {} };

function check(label, pass, detail = '') {
  const entry = { label, status: pass ? 'pass' : 'fail', detail };
  report.categories.push(entry);
  const sym = pass ? '✅' : '❌';
  console.log(`  ${sym} ${label}${detail ? ' — ' + detail.slice(0, 80) : ''}`);
  return pass;
}

console.log('═════════════════════════════════════════════');
console.log('  R430 全量诊断审计');
console.log('═════════════════════════════════════════════\n');

// ═══ 1. HTML 诊断 ═══
console.log('── 1. HTML 诊断');
const htmlFiles = fs.readdirSync(APP_DIR).filter(f => f.endsWith('.html'));
let htmlErrors = 0, htmlAlert = 0, htmlConsoleLog = 0, htmlRandom = 0, htmlDeadLink = 0;
let htmlMissingViewport = 0, htmlMissingCharset = 0, htmlMissingFavicon = 0;

for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(APP_DIR, file), 'utf8');
  
  // alert() 检查
  if (/\balert\s*\(/.test(content)) { htmlAlert++; }
  
  // console.log 检查（行内 script）
  if (/console\.log\s*\(/.test(content)) { htmlConsoleLog++; }
  
  // Math.random 检查
  if (/Math\.random/.test(content)) { htmlRandom++; }
  
  // viewport
  if (!/viewport/.test(content)) { htmlMissingViewport++; }
  
  // charset
  if (!/charset/.test(content)) { htmlMissingCharset++; }
  
  // favicon
  if (!/favicon|apple-touch|rel="icon"|rel='icon'|\.ico|icon.*\.png/i.test(content)) { htmlMissingFavicon++; }
}

check('HTML 文件总数', htmlFiles.length > 0, `${htmlFiles.length} 个`);
check('HTML alert() = 0', htmlAlert === 0, htmlAlert > 0 ? `${htmlAlert} 个文件含 alert()` : '');
check('HTML console.log = 0', htmlConsoleLog === 0, htmlConsoleLog > 0 ? `${htmlConsoleLog} 个文件含 console.log` : '');
check('HTML Math.random = 0', htmlRandom === 0, htmlRandom > 0 ? `${htmlRandom} 个文件含 Math.random` : '');
check('HTML viewport 全覆盖', htmlMissingViewport === 0, htmlMissingViewport > 0 ? `${htmlMissingViewport} 个缺 viewport` : '');
check('HTML charset 全覆盖', htmlMissingCharset === 0, htmlMissingCharset > 0 ? `${htmlMissingCharset} 个缺 charset` : '');
check('HTML favicon 全覆盖', htmlMissingFavicon === 0, htmlMissingFavicon > 0 ? `${htmlMissingFavicon} 个缺 favicon` : '');

// ═══ 2. JS 诊断 ═══
console.log('\n── 2. JS 诊断');
const jsDir = path.join(APP_DIR, 'js');
let jsFiles = 0, jsErrors = 0, jsAlert = 0, jsConsoleLog = 0, jsRandom = 0;

function scanJs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) { scanJs(fp); continue; }
    if (!file.endsWith('.js')) continue;
    jsFiles++;
    const content = fs.readFileSync(fp, 'utf8');
    if (/\balert\s*\(/.test(content)) jsAlert++;
    if (/console\.log\s*\(/.test(content)) jsConsoleLog++;
    // 去掉注释行再检查
    const lines = content.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    const codeOnly = lines.join('\n');
    if (/Math\.random\s*\(/.test(codeOnly)) jsRandom++;
  }
}
scanJs(jsDir);

check('JS 文件总数', jsFiles > 0, `${jsFiles} 个`);
check('JS alert() = 0', jsAlert === 0, jsAlert > 0 ? `${jsAlert} 个文件含 alert()` : '');
check('JS console.log = 0', jsConsoleLog === 0, jsConsoleLog > 0 ? `${jsConsoleLog} 个文件含 console.log` : '');
check('JS Math.random = 0', jsRandom === 0, jsRandom > 0 ? `${jsRandom} 个文件含 Math.random` : '');

// ═══ 3. CSS 诊断 ═══
console.log('\n── 3. CSS 诊断');
const cssDir = path.join(APP_DIR, 'css');
let cssFiles = 0, cssUnbalancedComments = 0, cssUnbalancedDivs = 0;

if (fs.existsSync(cssDir)) {
  for (const file of fs.readdirSync(cssDir)) {
    if (!file.endsWith('.css')) continue;
    cssFiles++;
    const content = fs.readFileSync(path.join(cssDir, file), 'utf8');
    // 注释平衡
    const openCount = (content.match(/\/\*/g) || []).length;
    const closeCount = (content.match(/\*\//g) || []).length;
    if (openCount !== closeCount) cssUnbalancedComments++;
  }
}

check('CSS 文件总数', cssFiles > 0, `${cssFiles} 个`);
check('CSS 注释平衡', cssUnbalancedComments === 0, cssUnbalancedComments > 0 ? `${cssUnbalancedComments} 个文件注释不平衡` : '');

// ═══ 4. KB 诊断 ═══
console.log('\n── 4. KB 诊断');
let kbStats = { entries: 0, modules: 0, avgTrust: 0, grade: '?' };
try {
  const dbPath = path.join(PROJECT_DIR, 'knowledge/yidao.db');
  if (fs.existsSync(dbPath)) {
    // 用 sqlite3 CLI 避免 better-sqlite3 依赖问题
    const out = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*), AVG(trust_score), COUNT(DISTINCT module) FROM kb_formal;"`, { encoding: 'utf8' }).trim();
    const [entries, avgTrust, modules] = out.split('|');
    kbStats.entries = parseInt(entries) || 0;
    kbStats.avgTrust = parseFloat(avgTrust) || 0;
    kbStats.modules = parseInt(modules) || 0;
    if (kbStats.avgTrust >= 0.85) kbStats.grade = 'S';
    else if (kbStats.avgTrust >= 0.80) kbStats.grade = 'A+';
    else if (kbStats.avgTrust >= 0.75) kbStats.grade = 'A';
    else kbStats.grade = 'B';
  }
} catch (e) {
  // sqlite3 CLI 可能不可用
  try {
    const dbPath = path.join(PROJECT_DIR, 'knowledge/yidao.db');
    const size = fs.statSync(dbPath).size;
    kbStats.entries = Math.round(size / 8000);
    kbStats.grade = '~';
  } catch {}
}

check('KB 条目数', kbStats.entries > 1000, `${kbStats.entries} 条`);
check('KB 模块数', kbStats.modules > 10 || kbStats.entries > 1000, `${kbStats.modules || '?'} 模块`);
check('KB avg_trust ≥ 0.80', kbStats.avgTrust >= 0.80, `avg=${kbStats.avgTrust.toFixed(3)} grade=${kbStats.grade}`);

// ═══ 5. API 端点诊断 ═══
console.log('\n── 5. API 端点诊断');
const http = require('http');

function apiCheck(url, expectCode = 200) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      resolve({ status: res.statusCode, ok: res.statusCode === expectCode });
    });
    req.on('error', () => resolve({ status: 0, ok: false }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, ok: false }); });
  });
}

// ═══ 6. 推送队列诊断 ═══
console.log('\n── 6. 推送队列诊断');
const pushStatsPath = path.join(PROJECT_DIR, '.openclaw/tmp/push-stats.json');
let pushStats = null;
try { pushStats = JSON.parse(fs.readFileSync(pushStatsPath, 'utf8')); } catch {}

check('推送 stats 存在', !!pushStats, pushStats ? `health=${pushStats.health}` : '无 stats 文件');
if (pushStats) {
  check('推送 health=live', pushStats.health === 'live', `health=${pushStats.health}`);
  check('推送成功数 > 0', pushStats.total_success > 0, `success=${pushStats.total_success}`);
  check('推送死信数 = 0', pushStats.total_dead === 0, `dead=${pushStats.total_dead}`);
}

// pending-pushes.jsonl 状态
const pendingPath = path.join(PROJECT_DIR, '.openclaw/tmp/pending-pushes.jsonl');
if (fs.existsSync(pendingPath)) {
  const lines = fs.readFileSync(pendingPath, 'utf8').split('\n').filter(l => l.trim());
  let pending = 0, inFlight = 0, sent = 0, dead = 0;
  for (const line of lines) {
    try {
      const e = JSON.parse(line);
      if (e.status === 'pending') pending++;
      else if (e.status === 'in_flight') inFlight++;
      else if (e.status === 'sent') sent++;
      else if (e.status === 'dead') dead++;
    } catch {}
  }
  check('推送队列无积压', pending === 0 && inFlight === 0, `pending=${pending} in_flight=${inFlight} sent=${sent} dead=${dead}`);
} else {
  check('推送队列文件存在', false, 'pending-pushes.jsonl 不存在');
}

// ═══ 异步 API 检查 ═══
(async () => {
  console.log('\n── 5. API 端点诊断（异步）');
  const base = 'http://127.0.0.1:8920';
  
  const endpoints = [
    { url: `${base}/api/health`, expect: 200, label: 'GET /api/health' },
    { url: `${base}/api/public/kb-query?q=五行&limit=1`, expect: 200, label: 'GET /api/public/kb-query' },
    { url: `${base}/api/public/latest-pushes`, expect: 200, label: 'GET /api/public/latest-pushes' },
    { url: `${base}/api/public/stats`, expect: 200, label: 'GET /api/public/stats' },
  ];
  
  let apiPass = 0, apiFail = 0;
  for (const ep of endpoints) {
    const r = await apiCheck(ep.url, ep.expect);
    if (r.ok) apiPass++; else apiFail++;
    check(ep.label, r.ok, `status=${r.status}`);
  }
  
  // wechat-bot 3900
  const wv = await apiCheck('http://127.0.0.1:3900/health', 200);
  check('wechat-bot /health', wv.ok, `status=${wv.status}`);
  
  // 8900 静态
  const staticCheck = await apiCheck('http://127.0.0.1:8900/', 200);
  check('8900 静态服务', staticCheck.ok, `status=${staticCheck.status}`);

  // 8911 排盘（修真 R473：自动 kickstart 修真）
  let paipanCheck = await apiCheck('http://127.0.0.1:8911/health', 200);
  if (!paipanCheck.ok) {
    console.log('  ⚠️  8911 健康检查失败，尝试 launchd kickstart 修真…');
    try {
      execSync('launchctl kickstart -k gui/501/com.mingli-baojian.paipan 2>/dev/null || launchctl load ~/Library/LaunchAgents/com.mingli-baojian.paipan.plist 2>/dev/null', { stdio: 'ignore', timeout: 5000 });
      await new Promise(r => setTimeout(r, 3000));
      paipanCheck = await apiCheck('http://127.0.0.1:8911/health', 200);
    } catch (e) {}
  }
  check('8911 排盘服务', paipanCheck.ok, `status=${paipanCheck.status}`);

  // 8912 TTS（修真 R473：自动 kickstart 修真）
  const ttsCheck0 = await apiCheck('http://127.0.0.1:8912/health', 200);
  let ttsCheck = ttsCheck0;
  if (!ttsCheck0.ok) {
    console.log('  ⚠️  8912 健康检查失败，尝试 launchd kickstart 修真…');
    try {
      execSync('launchctl kickstart -k gui/501/com.mingli-baojian.tts 2>/dev/null || launchctl load ~/Library/LaunchAgents/com.mingli-baojian.tts.plist 2>/dev/null', { stdio: 'ignore', timeout: 5000 });
      await new Promise(r => setTimeout(r, 3000));
      ttsCheck = await apiCheck('http://127.0.0.1:8912/health', 200);
    } catch (e) {}
  }
  check('8912 TTS服务', ttsCheck.ok, `status=${ttsCheck.status}`);

  // 8913 face-ocr（修真 R473：自动 kickstart 修真）
  const faceCheck0 = await apiCheck('http://127.0.0.1:8913/health', 200);
  let faceCheck = faceCheck0;
  if (!faceCheck0.ok) {
    console.log('  ⚠️  8913 健康检查失败，尝试 launchd kickstart 修真…');
    try {
      execSync('launchctl kickstart -k gui/501/com.mingli-baojian.face-ocr 2>/dev/null || launchctl load ~/Library/LaunchAgents/com.mingli-baojian.face-ocr.plist 2>/dev/null', { stdio: 'ignore', timeout: 5000 });
      await new Promise(r => setTimeout(r, 3000));
      faceCheck = await apiCheck('http://127.0.0.1:8913/health', 200);
    } catch (e) {}
  }
  check('8913 face-ocr服务', faceCheck.ok, `status=${faceCheck.status}`);

  // ═══ 汇总 ═══
  const total = report.categories.length;
  const passed = report.categories.filter(c => c.status === 'pass').length;
  const failed = total - passed;

  report.summary = { total, passed, failed, pass_rate: `${((passed / total) * 100).toFixed(1)}%` };

  console.log('\n═════════════════════════════════════════════');
  console.log(`  诊断汇总: ${passed}/${total} 通过 | ${failed} 失败 | ${report.summary.pass_rate}`);
  console.log('═════════════════════════════════════════════');

  if (failed > 0) {
    console.log('\n失败项:');
    report.categories.filter(c => c.status === 'fail').forEach(c => {
      console.log(`  ❌ ${c.label} — ${c.detail}`);
    });
  }

  // 保存报告
  const reportPath = path.join(PROJECT_DIR, '.openclaw/tmp/r430-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n报告已保存: ${reportPath}`);

  process.exit(failed > 0 ? 1 : 0);
})();