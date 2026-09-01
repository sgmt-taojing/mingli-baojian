// R779：干支验证脚本（历法校准配套——年份扩展后的干支一致性检查）
'use strict';
const path = require('path');
const g = require(path.join(__dirname, '..', 'shared', 'ganzhi-60.js'));
let fail = 0;
// 已知锚点：1984甲子、1991辛未、2026丙午（与排盘引擎输出交叉验证）
const anchors = [[1984,'甲子'],[1991,'辛未'],[2026,'丙午'],[1911,'辛亥'],[1900,'庚子']];
for (const [y, expect] of anchors) {
  const got = g.yearGanzhi(y);
  const ok = got === expect;
  if (!ok) fail++;
  console.log(`${ok?'✓':'✗'} ${y} → ${got}（期望 ${expect}）`);
}
// 折叠一致性
const f = g.foldYear(12000);
const ok2 = g.yearGanzhi(12000) === g.yearGanzhi(f);
if (!ok2) fail++;
console.log(`${ok2?'✓':'✗'} 12000 折叠 ${f} 干支等价`);
process.exit(fail ? 1 : 0);
