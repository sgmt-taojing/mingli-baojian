#!/usr/bin/env node
/**
 * paipan-boundary-regression.js — 排盘边界回归（固化 08-29 扫描结论）
 *
 * 覆盖：
 *  A. 八字 8911 API：巳时时柱（前端映射 bug 回归）、早晚子时、立春交节时刻、日柱连续性、节气换月
 *  B. 紫微引擎（in-process）：12 宫齐全、命身宫存在、闰月不崩
 *  C. 六爻引擎（in-process）：世应 1-6 且唯一、干支/六亲字段合法、动爻合法
 *
 * 用法：node scripts/paipan-boundary-regression.js   （需 8911 在线；B/C 组离线可跑）
 * 退出码：0 全过 / 1 有失败
 */
const path = require('path');
const SERVER = path.join(__dirname, '..', 'server');

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; failures.push(name); console.log(`  ✗ ${name}  ${detail || ''}`); }
}

async function baziApi(y, m, d, h) {
  const resp = await fetch(`http://127.0.0.1:8911/paipan?year=${y}&month=${m}&day=${d}&hour=${h}&module=bazi`, { signal: AbortSignal.timeout(8000) });
  const j = await resp.json();
  if (j.error) throw new Error(j.error);
  return j;
}

(async () => {
  console.log('=== A. 八字 8911 API 边界 ===');
  try {
    // A1: 巳时时柱=丁巳（paipan-quick 时辰索引 bug 回归锚点）
    const a1 = await baziApi(1990, 10, 15, 10);
    check('A1 1990-10-15 巳时(10) 时柱=丁巳', a1.pillars['时'] === '丁巳', `got ${a1.pillars['时']}`);
    check('A1 四柱=庚午/丙戌/癸丑/丁巳', a1.pillars['年'] === '庚午' && a1.pillars['月'] === '丙戌' && a1.pillars['日'] === '癸丑', JSON.stringify(a1.pillars));

    // A2: 晚子时——日柱不翻、时柱按次日起
    const a2a = await baziApi(1990, 10, 15, 23);
    const a2b = await baziApi(1990, 10, 16, 0);
    check('A2 15日23时 日柱癸丑(当日)+时柱甲子(次日起)', a2a.pillars['日'] === '癸丑' && a2a.pillars['时'] === '甲子', JSON.stringify(a2a.pillars));
    check('A2 16日00时 日柱甲寅+时柱甲子', a2b.pillars['日'] === '甲寅' && a2b.pillars['时'] === '甲子', JSON.stringify(a2b.pillars));

    // A3: 立春交节时刻（1990-02-04 约16:08）：交节前己巳年、交节后庚午年
    const a3a = await baziApi(1990, 2, 4, 10);
    const a3b = await baziApi(1990, 2, 4, 18);
    check('A3 立春10时(交节前) 年柱己巳', a3a.pillars['年'] === '己巳', `got ${a3a.pillars['年']}`);
    check('A3 立春18时(交节后) 年柱庚午 月柱戊寅', a3b.pillars['年'] === '庚午' && a3b.pillars['月'] === '戊寅', JSON.stringify(a3b.pillars));

    // A4: 节气换月（寒露 1990-10-08）：前=乙酉月 后=丙戌月
    const a4a = await baziApi(1990, 10, 7, 12);
    const a4b = await baziApi(1990, 10, 9, 12);
    check('A4 寒露前(10-07) 月柱乙酉', a4a.pillars['月'] === '乙酉', `got ${a4a.pillars['月']}`);
    check('A4 寒露后(10-09) 月柱丙戌', a4b.pillars['月'] === '丙戌', `got ${a4b.pillars['月']}`);

    // A5: 年末小寒边界（1991-01-05 小寒前后 丑月切换）
    const a5a = await baziApi(1991, 1, 4, 12);
    const a5b = await baziApi(1991, 1, 6, 12);
    check('A5 小寒前(01-04) 月柱戊子', a5a.pillars['月'] === '戊子', `got ${a5a.pillars['月']}`);
    check('A5 小寒后(01-06) 月柱己丑', a5b.pillars['月'] === '己丑', `got ${a5b.pillars['月']}`);
  } catch (e) {
    fail++; failures.push('A组: 8911 不可用 - ' + e.message);
    console.log('  ✗ A组跳过：8911 不可用（' + e.message + '）');
  }

  console.log('=== B. 紫微引擎边界（in-process）===');
  try {
    const zw = require(path.join(SERVER, 'ziwei-engine-node.js'));
    // B1: 常规盘 12 宫 + 命身宫
    const b1 = zw.paipan(1990, 10, 15, 10, false, 'male');
    const c1 = b1.chart || b1;
    const palaces = c1.palaces || c1.gong || [];
    check('B1 紫微 12 宫齐全', palaces.length === 12, `got ${palaces.length}`);
    const names = palaces.map(p => p.name || p.gongName || '');
    check('B1 命宫/身宫存在', palaces.some(p => p.isMingGong) && palaces.some(p => p.isShenGong), '');
    // B2: 闰月（2023 闰二月，农历）不崩且宫数正确
    const b2 = zw.paipan(2023, 2, 15, 8, true, 'female', undefined, undefined, true);
    const c2 = b2.chart || b2;
    check('B2 闰二月盘生成且 12 宫', (c2.palaces || c2.gong || []).length === 12, '');
    // B3: 晚子时紫微（23 点）
    const b3 = zw.paipan(1990, 10, 15, 23, false, 'male');
    const c3 = b3.chart || b3;
    check('B3 23 点紫微盘生成且 12 宫', (c3.palaces || c3.gong || []).length === 12, '');
  } catch (e) {
    fail++; failures.push('B组: ' + e.message);
    console.log('  ✗ B组异常：' + e.message);
  }

  console.log('=== C. 六爻引擎边界（in-process）===');
  try {
    const ly = require(path.join(SERVER, 'liuyao-engine-node.js'));
    const r = ly.paipan({ year: 2026, month: 8, day: 29, hour: 22 });
    const c = r.chart || r;
    check('C1 卦名非空', !!c.guaName, '');
    const yaos = c.yaos || [];
    check('C2 六爻齐全且 position 1-6', yaos.length === 6 && yaos.every((y, i) => y.position === i + 1), '');
    const shi = yaos.filter(y => y.shiying === '世');
    const ying = yaos.filter(y => y.shiying === '应');
    check('C3 世爻唯一', shi.length === 1, `got ${shi.length}`);
    check('C4 应爻唯一', ying.length === 1, `got ${ying.length}`);
    check('C5 世应 0 基索引与 shiying 标记一致', yaos[c.shiYao] === shi[0] && yaos[c.yingYao] === ying[0], `shiYao=${c.shiYao} yingYao=${c.yingYao}`);
    check('C6 每爻干支/六亲非空', yaos.every(y => y.ganZhi && y.liuqin), '');
    // C7: 白话引擎世应爻不再出现占位符
    const bh = require(path.join(SERVER, 'paipan-baihua-engine.js'));
    const out = bh.buildBaihua('liuyao', c, { liuNian: ly.liuNian });
    check('C7 白话世爻无「—」占位', out.overview && !out.overview.includes('在—，临—'), (out.overview || '').slice(0, 80));
  } catch (e) {
    fail++; failures.push('C组: ' + e.message);
    console.log('  ✗ C组异常：' + e.message);
  }

  console.log(`\n结果：${pass} 过 / ${fail} 失败`);
  if (failures.length) console.log('失败项：' + failures.join('；'));
  process.exit(fail ? 1 : 0);
})();
