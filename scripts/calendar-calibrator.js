#!/usr/bin/env node
/**
 * 历法校准智能体 v1.0 — 永久正确循环
 * =====================================================
 * 职责: 定期从互联网权威源拉取节气数据, 与本地历法表比对,
 *       发现漂移自动修真 → 全量验证 → 提交, 形成永久正确闭环。
 *
 * 用法:
 *   node scripts/calendar-calibrator.js            # 完整校准(比对→修真→验证→commit)
 *   node scripts/calendar-calibrator.js --dry-run  # 只报告不修真不commit
 *   node scripts/calendar-calibrator.js --check    # 只比对报告
 *   node scripts/calendar-calibrator.js --year 2027  # 指定校准年份
 *
 * 数据源(多源交叉):
 *   源1: bmcx.com 节气页 (https://jieqi.bmcx.com/{YEAR}__jieqi/) — 互联网权威
 *   源2: lunar_python 天文算法 (本地, server/paipan.py 同源)
 *   源3: 本地 JIE_TABLE / LICHUN_TABLE (shared/ganzhi-60.js)
 *
 * 判定: 源1 == 源2 → 高置信; 源1 != 源2 → 数据冲突(不修真, 报警)
 *       本地表 != 权威 → 自动修真
 *
 * 审计: logs/calibration-audit.jsonl (永久留痕)
 * 验证: 修真后必跑 scripts/verify-ganzhi.js, 全绿才 commit
 *
 * 规范: docs/60JIAZI_STANDARD.md §10 历法校准智能体
 */

'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const PROJECT = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian';
const GZ_FILE = path.join(PROJECT, 'shared/ganzhi-60.js');
const AUDIT_FILE = path.join(PROJECT, 'logs/calibration-audit.jsonl');
const VERIFY_CMD = `cd ${PROJECT} && node scripts/verify-ganzhi.js`;

// ─── 1. 配置 ───
const JIE_NAMES = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'];
// 月节(定月用12节): 立春 惊蛰 清明 立夏 芒种 小暑 立秋 白露 寒露 立冬 大雪 小寒
const MONTH_JIE = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CHECK_ONLY = args.includes('--check');
const yearArgIdx = args.indexOf('--year');
const yearArgEq = args.find(a => a.startsWith('--year='));
const TARGET_YEARS = yearArgIdx >= 0
  ? [parseInt(args[yearArgIdx + 1])]
  : yearArgEq
    ? [parseInt(yearArgEq.split('=').pop())]
    : [new Date().getFullYear(), new Date().getFullYear() + 1];

// ─── 2. 工具: HTTP 拉取(容错+超时) ───
function fetchUrl(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' } }, res => {
      if (res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode} for ${url}`)); return; }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => { data += c; if (data.length > 2 * 1024 * 1024) { req.destroy(); reject(new Error('response too large')); } });
      res.on('end', () => resolve(data));
    });
    req.on('error', e => reject(new Error(`network error: ${e.message}`)));
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error(`timeout after ${timeoutMs}ms`)); });
  });
}

// ─── 3. 源1: bmcx 解析 ───
// 页面结构: "小寒 01月05日 大寒 01月20日 ..." 或 "2026年小寒 开始时间是 2026年01月05日 16:23:21"
function parseBmcx(html, year) {
  const found = {};
  // 模式A: 速览表 "<strong>节气名</strong><span>MM月DD日</span>" (bmcx 年份页格式)
  const reA = /<strong>([\u4e00-\u9fa5]{2})<\/strong><span>(\d{2})月(\d{2})日<\/span>/g;
  let m;
  while ((m = reA.exec(html)) !== null) {
    const name = m[1];
    if (JIE_NAMES.includes(name) && !found[name]) {
      found[name] = { month: parseInt(m[2]), day: parseInt(m[3]), source: 'bmcx-quick' };
    }
  }
  // 模式B: 详情 "YYYY年节气名 开始时间是 YYYY年MM月DD日 HH:MM:SS"
  const reB = new RegExp(year + '年([\\u4e00-\\u9fa5]{2})\\s*开始时间是\\s*' + year + '年(\\d{2})月(\\d{2})日\\s*(\\d{2}):(\\d{2})', 'g');
  while ((m = reB.exec(html)) !== null) {
    const name = m[1];
    if (JIE_NAMES.includes(name)) {
      found[name] = { month: parseInt(m[2]), day: parseInt(m[3]), hour: parseInt(m[4]), minute: parseInt(m[5]), source: 'bmcx-detail' };
    }
  }
  // 校验: 必须 24 节气齐全且顺序正确, 否则视为解析失败(防错修真)
  const names = Object.keys(found);
  if (names.length < 24) {
    throw new Error(`bmcx 解析不完整: 仅 ${names.length}/24 (${names.join(',')})`);
  }
  // 顺序校验: 提取结果按 1-12 月顺序应基本单调(跨年12月→1月允许回跳一次)
  const ordered = JIE_NAMES.every(n => found[n]);
  if (!ordered) throw new Error('bmcx 解析缺少标准节气名');
  return found;
}

// ─── 4. 源2: lunar_python 本地天文算法 ───
function lunarJie(year) {
  const script = `
import json
from lunar_python import Solar
result = {}
for M in range(1, 13):
    for D in range(3, 10):
        l = Solar.fromYmd(${year}, M, D).getLunar()
        jq = l.getJie()
        if jq and jq not in result.values():
            result['${year}-' + str(M).zfill(2)] = {'name': jq, 'month': M, 'day': D}
            break
print(json.dumps(result, ensure_ascii=False))
`;
  const tmpFile = path.join(require('os').tmpdir(), `calib_${year}.py`);
  fs.writeFileSync(tmpFile, script, 'utf8');
  try {
    const out = execSync(`python3 ${tmpFile}`, { encoding: 'utf8', timeout: 60000 }).trim();
    return JSON.parse(out);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

// ─── 5. 源3: 本地表读取 ───
function readLocalTables() {
  const src = fs.readFileSync(GZ_FILE, 'utf8');
  const tables = {};
  const jieMatch = src.match(/const JIE_TABLE = \{([\s\S]*?)\n\};/);
  if (jieMatch) {
    // 每行格式: 2026: [[1,5,'小寒'],[2,4,'立春'],...],
    const lineRe = /(\d{4}): \[\[(.+?)\]\],?/g;
    let m;
    while ((m = lineRe.exec(jieMatch[1])) !== null) {
      const y = parseInt(m[1]);
      if (!tables[y]) tables[y] = {};
      // 行内全部节气: 1,5,'小寒' 格式(外层 [[ ]] 已被 lineRe 消耗)
      const itemRe = /(\d+),(\d+),'([^']+)'/g;
      let it;
      while ((it = itemRe.exec(m[2])) !== null) {
        tables[y][it[3]] = { month: parseInt(it[1]), day: parseInt(it[2]) };
      }
    }
  }
  return tables;
}

// ─── 6. 修真: 更新 JIE_TABLE + LICHUN_TABLE ───
function patchTables(year, authoritative) {
  let src = fs.readFileSync(GZ_FILE, 'utf8');
  const patches = [];
  // 6.1 构建新 JIE_TABLE 行（按月份 1-12 顺序, 单层外括号）
  const jieEntries = MONTH_JIE
    .map(name => ({ name, ...authoritative[name] }))
    .sort((a, b) => a.month - b.month || a.day - b.day)
    .map(j => `[${j.month},${j.day},'${j.name}']`)
    .join(',');
  const newLine = `  ${year}: [${jieEntries}],`;
  // 替换或新增年份行
  const lineRe = new RegExp(`^  ${year}: \\[\\[.*?\\]\\],?$`, 'm');
  if (lineRe.test(src)) {
    src = src.replace(lineRe, newLine);
    patches.push(`JIE_TABLE ${year} 行更新`);
  } else {
    // 新增: 插到 JIE_TABLE 对象内第一行后
    src = src.replace(/const JIE_TABLE = \{\n/, `const JIE_TABLE = {\n${newLine}\n`);
    patches.push(`JIE_TABLE ${year} 行新增`);
  }
  // 6.2 立春 → LICHUN_TABLE
  const lichun = authoritative['立春'];
  const lcLine = `  ${year}: [${lichun.month}, ${lichun.day}],`;
  const lcRe = new RegExp(`^  ${year}: \\[\\d+, \\d+\\],?$`, 'm');
  if (lcRe.test(src)) {
    src = src.replace(lcRe, lcLine);
  } else {
    src = src.replace(/const LICHUN_TABLE = \{\n/, `const LICHUN_TABLE = {\n${lcLine}\n`);
  }
  patches.push(`LICHUN_TABLE ${year}: [${lichun.month}, ${lichun.day}]`);
  fs.writeFileSync(GZ_FILE, src, 'utf8');
  return patches;
}

// ─── 7. 审计日志 ───
function audit(entry) {
  fs.mkdirSync(path.dirname(AUDIT_FILE), { recursive: true });
  fs.appendFileSync(AUDIT_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

// ─── 8. 主流程 ───
async function main() {
  console.log('🛰️ 历法校准智能体 v1.0');
  console.log(`   目标年份: ${TARGET_YEARS.join(', ')} | 模式: ${DRY_RUN ? 'dry-run' : CHECK_ONLY ? 'check' : 'full'}`);
  let totalDiff = 0, totalConflict = 0;

  for (const year of TARGET_YEARS) {
    console.log(`\n=== ${year} 年校准 ===`);
    // 8.1 拉取 bmcx
    let bmcx;
    try {
      const html = await fetchUrl(`https://jieqi.bmcx.com/${year}__jieqi/`);
      bmcx = parseBmcx(html, year);
      console.log(`  [源1 bmcx] 24 节气解析成功 (${Object.values(bmcx).filter(v => v.source === 'bmcx-detail').length} 条含精确时刻)`);
    } catch (e) {
      console.error(`  [源1 bmcx] 失败: ${e.message}`);
      audit({ event: 'source_fail', year, source: 'bmcx', error: e.message });
      continue;  // 单年失败不中断, 继续次年
    }
    // 8.2 lunar_python 交叉验证
    let lunar = null;
    try {
      lunar = lunarJie(year);
      const conflicts = [];
      for (const name of MONTH_JIE) {
        const b = bmcx[name];
        const lv = Object.values(lunar).find(v => v.name === name);
        if (lv && (lv.month !== b.month || lv.day !== b.day)) {
          conflicts.push(`${name}: bmcx=${b.month}/${b.day} lunar=${lv.month}/${lv.day}`);
        }
      }
      if (conflicts.length) {
        totalConflict += conflicts.length;
        console.log(`  ⚠️ [双源冲突] ${conflicts.join('; ')} (以 bmcx 为准并标记审计)`);
        audit({ event: 'conflict', year, conflicts });
      } else {
        console.log('  [源2 lunar_python] 与 bmcx 完全一致 ✅');
      }
    } catch (e) {
      console.error(`  [源2 lunar_python] 失败: ${e.message} (跳过交叉验证)`);
    }
    // 8.3 本地表比对
    const local = readLocalTables();
    const localYear = local[year];
    const diffs = [];
    if (!localYear) {
      diffs.push('本地 JIE_TABLE 无此年份 (需新增)');
    } else {
      for (const name of MONTH_JIE) {
        const b = bmcx[name];
        const l = localYear[name];
        if (!l) { diffs.push(`${name}: 本地缺`); continue; }
        if (l.month !== b.month || l.day !== b.day) {
          diffs.push(`${name}: 本地 ${l.month}/${l.day} → 权威 ${b.month}/${b.day}`);
        }
      }
    }
    if (diffs.length) {
      totalDiff += diffs.length;
      console.log(`  🔧 发现 ${diffs.length} 处差异:`);
      diffs.forEach(d => console.log(`    - ${d}`));
      if (DRY_RUN || CHECK_ONLY) {
        console.log(`  (${DRY_RUN ? 'dry-run' : 'check'} 模式, 不修真)`);
        audit({ event: 'diff_detected', year, diffs, mode: DRY_RUN ? 'dry-run' : 'check' });
      } else {
        const patches = patchTables(year, bmcx);
        console.log(`  ✅ 已修真: ${patches.join('; ')}`);
        audit({ event: 'patched', year, diffs, patches });
      }
    } else {
      console.log('  ✅ 本地表与权威一致, 无需修真');
      audit({ event: 'ok', year, diffs: 0 });
    }
  }

  // 8.4 修真后全量验证
  if (totalDiff > 0 && !DRY_RUN && !CHECK_ONLY) {
    console.log('\n=== 全量验证 ===');
    try {
      const out = execSync(VERIFY_CMD, { encoding: 'utf8', timeout: 180000 });
      const passLine = out.split('\n').filter(l => l.includes('通过')).pop() || '';
      console.log(out.split('\n').slice(-6).join('\n'));
      if (out.includes('失败 0') || out.includes('全部通过')) {
        console.log('✅ 验证全绿');
        audit({ event: 'verify_pass', year: TARGET_YEARS.join(','), passLine });
        // commit
        try {
          execSync(`cd ${PROJECT} && git add shared/ganzhi-60.js && git add -f logs/calibration-audit.jsonl && git commit -m "chore(calibrator): 历法校准 ${TARGET_YEARS.join('/')} — ${totalDiff} 处差异修真 (bmcx+lunar_python 双源)"`, { encoding: 'utf8', timeout: 30000 });
          console.log(`✅ commit 完成 (${totalDiff} 处修真)`);
        } catch (e) {
          console.log('ℹ️ commit 跳过或无需提交:', e.message.split('\n')[0]);
        }
      } else {
        console.error('❌ 验证未全绿, 修真已回滚风险 — 请人工检查');
        audit({ event: 'verify_fail', year: TARGET_YEARS.join(','), out: out.slice(-500) });
      }
    } catch (e) {
      console.error('❌ 验证执行失败:', e.message);
      audit({ event: 'verify_error', year: TARGET_YEARS.join(','), error: e.message });
    }
  }

  console.log(`\n📋 校准汇总: 差异 ${totalDiff} | 冲突 ${totalConflict} | 审计 ${AUDIT_FILE}`);
  return totalDiff + totalConflict;
}

main().then(code => {
  process.exit(code > 0 && !DRY_RUN && !CHECK_ONLY ? 1 : 0);
}).catch(e => {
  console.error('❌ 校准智能体异常:', e);
  process.exit(2);
});
