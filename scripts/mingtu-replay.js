#!/usr/bin/env node
/**
 * mingtu-replay.js — 康节本卷四命图「生辰引擎复盘」批量脚本
 *
 * 输入: /tmp/mingtu-entries.json（由 python 导出，含解析后生辰 + 已录命宫重建）
 * 输出: training/mingtu-replay/replay-report-<date>.json
 *   每例: { entry_id, name, ju_ok, mgzhi_ok, stars_ok, replay: {wuxingJu, mingGong, palaces[12]} }
 * 末尾汇总三项符合率（局 / 命宫地支 / 主星集合）。
 */
const fs = require('fs');
const path = require('path');
const zw = require(path.join(__dirname, '..', 'server', 'ziwei-engine-node.js'));

const ZHI = '子丑寅卯辰巳午未申酉戌亥';
const entries = JSON.parse(fs.readFileSync('/tmp/mingtu-entries.json', 'utf8'));

function hourOf(zhi) {
  const i = ZHI.indexOf(zhi);
  return i === 0 ? 0 : i * 2 - 1; // 子=0(早子), 丑=1, 寅=3, … 亥=21
}

function starSet(arr) {
  return new Set((arr || []).map(s => (typeof s === 'string' ? s : s.name)));
}
function sameSet(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

const results = [];
let juOk = 0, mgOk = 0, starOk = 0, ran = 0;

for (const e of entries) {
  if (!e.year) {
    results.push({ entry_id: e.entry_id, title: e.title, skipped: e.parse_fail ? '生辰残缺（原书缺字）' : '年份不可定' });
    continue;
  }
  const gender = e.gender.endsWith('男') ? '男' : '女';
  let chart;
  try {
    chart = zw.paipan(e.year, e.month, e.day, hourOf(e.hour_zhi), true, gender);
  } catch (err) {
    results.push({ entry_id: e.entry_id, title: e.title, name: e.name, error: String(err.message || err).split('\n')[0] });
    continue;
  }
  ran++;
  const palaces = (chart.palaces || []).map(p => ({
    name: p.name, ganZhi: p.ganZhi,
    mainStars: (p.mainStars || []).map(s => (typeof s === 'string' ? s : s.name)),
    auxStars: (p.auxStars || []).map(s => (typeof s === 'string' ? s : s.name)),
    evilStars: (p.evilStars || []).map(s => (typeof s === 'string' ? s : s.name)),
    isMingGong: !!p.isMingGong, isShenGong: !!p.isShenGong,
  }));
  const mg = palaces.find(p => p.isMingGong) || {};
  const mgZhi = (mg.ganZhi || '')[1];

  const ju_ok = chart.wuxingJu === e.ju;
  // 局不符时：试月±1（节气月安命假说），命中则记录替代解
  let alt = null;
  if (!ju_ok) {
    for (const dm of [-1, 1]) {
      const m2 = e.month + dm;
      if (m2 < 1 || m2 > 12) continue;
      try {
        const c2 = zw.paipan(e.year, m2, e.day, hourOf(e.hour_zhi), true, gender);
        if (c2.wuxingJu === e.ju) {
          const mg2 = (c2.palaces || []).find(p => p.isMingGong) || {};
          alt = { month_delta: dm, ju: c2.wuxingJu, mg_gz: mg2.ganZhi,
                  stars: (mg2.mainStars || []).map(s => (typeof s === 'string' ? s : s.name)).join('、') };
          break;
        }
      } catch (_) { /* ignore */ }
    }
  }
  const mgzhi_ok = e.rec_mg_zhi ? mgZhi === e.rec_mg_zhi : null;
  // 主星比对：已录写法「无主星（借对宫论）」或「天相」或「武曲、七杀」
  let stars_ok = null;
  if (e.rec_stars) {
    const recStars = e.rec_stars.includes('无主星')
      ? new Set()
      : new Set(e.rec_stars.split(/[、,，]/).map(s => s.trim()).filter(Boolean));
    stars_ok = sameSet(starSet(mg.mainStars), recStars);
  }
  if (ju_ok) juOk++;
  if (mgzhi_ok) mgOk++;
  if (stars_ok) starOk++;

  results.push({
    entry_id: e.entry_id, name: e.name, gz: e.gz, gz_fixed: !!e.gz_fixed,
    gender: e.gender, lunar: `${e.year}-${e.month}-${e.day}`, hour_zhi: e.hour_zhi,
    ju_book: e.ju, ju_replay: chart.wuxingJu, ju_ok,
    mgzhi_book: e.rec_mg_zhi || null, mgzhi_replay: mgZhi, mgzhi_ok,
    stars_book: e.rec_stars || null, stars_replay: (mg.mainStars || []).join('、'), stars_ok,
    alt,
    palaces,
  });
}

const summary = {
  total: entries.length,
  replayed: ran,
  skipped_or_error: entries.length - ran,
  ju_match: `${juOk}/${ran}`,
  mgzhi_match: `${mgOk}/${ran}`,
  stars_match: `${starOk}/${ran}`,
};

const outDir = path.join(__dirname, '..', 'training', 'mingtu-replay');
fs.mkdirSync(outDir, { recursive: true });
const day = new Date().toISOString().slice(0, 10);
const outFile = path.join(outDir, `replay-report-${day}.json`);
fs.writeFileSync(outFile, JSON.stringify({ summary, results }, null, 1));

console.log('=== 命图复盘汇总 ===');
console.log(JSON.stringify(summary, null, 1));
const mism = results.filter(r => !r.skipped && !r.error && (r.ju_ok === false || r.mgzhi_ok === false || r.stars_ok === false));
console.log(`不一致条目: ${mism.length}`);
for (const m of mism.slice(0, 20)) {
  console.log(` - ${m.name} | 局 ${m.ju_book}→${m.ju_replay}${m.ju_ok ? '✓' : '✗'} | 命宫 ${m.mgzhi_book}→${m.mgzhi_replay}${m.mgzhi_ok ? '✓' : '✗'} | 主星 ${m.stars_book}→${m.stars_replay}${m.stars_ok ? '✓' : '✗'}`);
}
console.log('report:', outFile);
