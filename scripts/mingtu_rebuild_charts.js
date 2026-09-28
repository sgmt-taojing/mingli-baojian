#!/usr/bin/env node
/** 古今命图·生辰复盘（2026-09-28）
 *  用生产同款 ziwei-engine-node（iztro@2.6.0）按古例生辰重建命盘，
 *  提取命宫主星/身宫/复盘五行局，回写 mingtu.jsonl（computed 字段）。
 *  用法：node scripts/mingtu_rebuild_charts.js [--dry]
 */
const fs = require('fs');
const path = require('path');
const { paipan } = require('../server/ziwei-engine-node.js');

const FILE = path.join(__dirname, '..', 'training', 'mingtu', 'mingtu.jsonl');
const DRY = process.argv.includes('--dry');

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
// 时辰 → 代表钟点（getHourZhi 区间中值）
const HOUR_MAP = { 子: 0, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10, 午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22 };

function gzToYear(gz) {
  const si = STEMS.indexOf(gz[0]), bi = BRANCHES.indexOf(gz[1]);
  if (si < 0 || bi < 0) return null;
  for (let i = 0; i < 60; i++) {
    if (i % 10 === si && i % 12 === bi) {
      let y = 1984 + i;
      if (y > 2026) y -= 60; // 落在可排范围内即可，星曜布局只看干支
      return y;
    }
  }
  return null;
}

// 干支年候选：主年 + 前后一甲子（农历月大小年异，大月三十日需换年试排）
function gzYearCandidates(gz) {
  const y = gzToYear(gz);
  if (!y) return [];
  return [y, y - 60, y + 60].filter(v => v > 1600 && v < 2100);
}

// 木刻本常见形近讹字：地支位误刻天干「己/已」，校读为「巳」（以复盘五行局与原著相合为校验）
function gzRepairCandidates(gz) {
  if (gzToYear(gz)) return [gz];
  const out = [];
  if (/[己已]/.test(gz[1] || '')) out.push(gz[0] + '巳');
  return out;
}

function starNames(arr) {
  return (arr || []).map(s => (typeof s === 'string' ? s : (s && (s.name || s.star)) || '')).filter(Boolean);
}

function main() {
  const lines = fs.readFileSync(FILE, 'utf-8').split('\n').filter(l => l.trim());
  const out = [];
  let ok = 0, fail = 0, agree = 0;
  const fails = [];
  for (const line of lines) {
    const rec = JSON.parse(line);
    if (rec._schema) { out.push(line); continue; }
    try {
      const b = rec.birth || {};
      const hour = HOUR_MAP[b.hour];
      if (hour === undefined || !b.lunar_month || !b.lunar_day) throw new Error('生辰字段不全: ' + JSON.stringify(b));
      const sex = /女/.test(rec.gender_yinyang || '') ? 'female' : 'male';
      let chart = null, usedGz = b.gz_year, repaired = false;
      outer:
      for (const gz of gzRepairCandidates(b.gz_year || '')) {
        for (const year of gzYearCandidates(gz)) {
          try {
            chart = paipan(year, b.lunar_month, b.lunar_day, hour, true, sex);
            usedGz = gz; repaired = gz !== b.gz_year;
            break outer;
          } catch (_e) { /* 换年再试（农历月大小差异） */ }
        }
      }
      if (!chart) throw new Error('生辰无法复盘: ' + JSON.stringify(b));
      const mg = (chart.palaces || []).find(p => p.isMingGong) || {};
      const sg = (chart.palaces || []).find(p => p.isShenGong) || {};
      const computed = {
        engine: chart.engine || 'iztro',
        gzUsed: usedGz,
        mingGongZhi: mg.ganZhi ? mg.ganZhi[1] : BRANCHES[chart.mingGongIdx],
        mingGongGanZhi: mg.ganZhi || '',
        mingStars: starNames(mg.mainStars),
        shenStars: starNames(sg.mainStars),
        computedMingju: chart.wuxingJu || '',
        mingjuAgree: chart.wuxingJu === rec.mingju
      };
      if (repaired) computed.note = `干支年疑似刻误校读：${b.gz_year}→${usedGz}`;
      rec.computed = computed;
      ok++;
      if (computed.mingjuAgree) agree++;
    } catch (e) {
      fail++;
      fails.push(`${rec.id} ${rec.title}: ${e.message}`);
    }
    out.push(JSON.stringify(rec));
  }
  if (!DRY) fs.writeFileSync(FILE, out.join('\n') + '\n');
  console.log(`复盘 ${ok} 盘成功 / ${fail} 失败；五行局与原著相合 ${agree}/${ok}${DRY ? '（DRY）' : ''}`);
  if (fails.length) console.log('失败明细:\n' + fails.join('\n'));
}
main();
