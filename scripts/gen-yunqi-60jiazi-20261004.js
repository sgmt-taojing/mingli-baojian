#!/usr/bin/env node
// gen-yunqi-60jiazi-20261004.js — 五运六气 120 年速查生成（R-YQ-120 · 2026-10-04）
// 直接调用生产引擎 server/yunqi-engine.js 的 yunqiOfYear（同源口径），
// 岁会/同天符/同岁会/太乙天符按 KB-YQ-012~014 规则补标：
//   岁会=岁运与年支五行同（甲辰甲戌己丑己未乙酉丁卯戊午丙子 8 年）
//   同天符=太过之年岁运与在泉同；同岁会=不及之年岁运与在泉同
//   太乙天符=天符+岁会同年（戊午乙酉己丑己未 4 年）
// 输出 training/yunqi-120years.json → 由 ingest 脚本入 KB（KB-YQ-021）
'use strict';
const fs = require('fs');
const path = require('path');
const { yunqiOfYear } = require(path.join(__dirname, '..', 'server', 'yunqi-engine.js'));

const ZHI_WX = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
                 '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };

const rows = [];
for (let y = 1924; y <= 2043; y++) {
  const r = yunqiOfYear(y);
  const zhi = r.ganzhi[1];
  const zhiWx = ZHI_WX[zhi];
  const tags = [];
  const isTianfu = !!r.tianfu;
  // 岁会古制严限八正：木临卯/火临午/金临酉/水临子/土临四库（辰戌丑未）——四生支（寅申巳亥）不论岁会
  const SUIHUI_ZHI = new Set(['卯', '午', '酉', '子', '辰', '戌', '丑', '未']);
  const isSuihui = SUIHUI_ZHI.has(zhi) && zhiWx === r.yun;
  if (isTianfu) tags.push('天符');
  if (isSuihui) tags.push('岁会');
  const zqWx = r.zaiquan ? (r.zaiquan.match(/[木火土金水]/) || [])[0] : '';
  if (r.guo === '太过' && zqWx === r.yun) tags.push('同天符');
  if (r.guo === '不及' && zqWx === r.yun) tags.push('同岁会');
  if (isTianfu && isSuihui) tags.push('太乙天符');
  rows.push({ year: y, ganzhi: r.ganzhi, yun: `${r.yun}运${r.guo}`,
              sitian: r.sitian, zaiquan: r.zaiquan, special: tags.join('·') || '—' });
}

// 校验锚点（与 KB-YQ-012~014 记载的经典年份对拍）
const CHECK = { '戊午': '太乙天符', '乙酉': '太乙天符', '己丑': '太乙天符', '己未': '太乙天符',
                '丁卯': '岁会', '丙子': '岁会', '甲辰': '岁会' };
let bad = 0;
for (let y = 1924; y <= 2043; y++) {
  const r = rows[y - 1924];
  if (CHECK[r.ganzhi] && !r.special.includes(CHECK[r.ganzhi])) {
    console.error(`锚点失配: ${y} ${r.ganzhi} 应含${CHECK[r.ganzhi]} 实际 ${r.special}`);
    bad++;
  }
}
if (bad) { console.error(`校验失败 ${bad} 处`); process.exit(1); }

const cyc = (a, b) => rows.filter(r => r.year >= a && r.year <= b)
  .map(r => `${r.year} ${r.ganzhi}｜${r.yun}｜${r.sitian}司天/${r.zaiquan}在泉｜${r.special}`)
  .join('\n');
const content =
`【五运六气·百二十年运气速查（1924–2043 两个甲子）】（引擎同源计算·可验证）
口径：天干化五运（甲己土/乙庚金/丙辛水/丁壬木/戊癸火，阳干太过阴干不及）；
地支化六气定司天在泉；天符=岁运同司天，岁会=岁运同年支，同天符=太过合在泉，同岁会=不及合在泉，太乙天符=天符岁会并临。
用法：命理批注查出生年禀赋底色与流年天时背景；只说天时五行偏性，不作诊疗断语。

── 第一甲子（1924–1983）──
${cyc(1924, 1983)}

── 第二甲子（1984–2043）──
${cyc(1984, 2043)}`;

fs.writeFileSync(path.join(__dirname, '..', 'training', 'yunqi-120years.json'),
  JSON.stringify({ entry_id: 'KB-YQ-021', title: '五运六气·百二十年运气速查（1924–2043 双甲子）',
    content, rows: rows.length }, null, 1));
console.log(`生成 ${rows.length} 年，锚点校验全过 → training/yunqi-120years.json`);
