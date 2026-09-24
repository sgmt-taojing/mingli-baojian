#!/usr/bin/env node
/**
 * 每日口诀推送生成器 v1（2026-09-24 · 接管 Qclaw「每日口诀推送」07:00）
 * 数据源：knowledge/koujue-database-full.js（KOUJUE_DATABASE，约 198 条，儒释道正统口诀）
 * 选取规则：年内第几天 % 总条数，确定性轮换，全年不重不漏方向遍历
 * 输出：企业微信 markdown 文本到 stdout（由 push-run.sh 管道外发）
 */
const path = require('path');
const KOUJUE_DATABASE = require(path.join(__dirname, '..', 'knowledge', 'koujue-database-full.js'));

// 拍平：保留类目来源信息
const ALL = [];
for (const [catKey, cat] of Object.entries(KOUJUE_DATABASE)) {
  if (!cat || !Array.isArray(cat.mantras)) continue;
  for (const m of cat.mantras) {
    if (m && m.name && m.text) ALL.push({ ...m, _cat: cat.title || catKey, _src: cat.source || '' });
  }
}

if (ALL.length === 0) {
  console.error('[push-koujue] 口诀库为空');
  process.exit(1);
}

const now = new Date();
const start = new Date(now.getFullYear(), 0, 0);
const dayOfYear = Math.floor((now - start) / 86400000);
const m = ALL[dayOfYear % ALL.length];

const lines = [
  '📿 每日口诀',
  '',
  `**${m.name}**（${m._cat}${m._src ? ' · 出自' + m._src : ''}）`,
  '',
  `原文：${m.text}`,
];
if (m.purpose) lines.push('', `功效：${m.purpose}`);
if (m.usage) lines.push(`修持：${m.usage}`);
if (Array.isArray(m.scene) && m.scene.length) lines.push(`适用：${m.scene.join('、')}`);
if (m.tips) lines.push(`提示：${m.tips}`);
lines.push(
  '',
  '⚠️ 传统修持内容仅供传统文化学习与参考，不替代医疗与专业建议；心诚则灵，量力而行。',
  '—— 🪷 易道智鉴 · 知命改运 · 明心正性'
);

console.log(lines.join('\n'));
