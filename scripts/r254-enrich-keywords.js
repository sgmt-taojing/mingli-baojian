#!/usr/bin/env node
// R254: 智能扩 keywords — 基于 title 提取真实搜索词
// 策略：对每个条目，把 title 中的关键名词/术语拆出来，与原 keywords 合并
// 模块聚焦：mantra, koujue-daily, tcm-classical, nihaixia-yian, wangzhen, classics

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const dbPath = path.resolve(__dirname, '../server/database/yidao.db');
const db = new DatabaseSync(dbPath);

// 模块优先级：短内容但内容真实知识
const TARGET_MODULES = [
  'mantra', 'koujue-daily', 'tcm-classical', 'nihaixia-yian',
  'wangzhen', 'classics', 'tcm', 'tcm-fangji', 'acupuncture',
  'shanghan-lun', 'shuhan', 'tcm-diagnosis'
];

// 词典：title 里频繁出现的真实术语 → 标准关键词
const TERM_KEYWORDS = {
  // 经典
  '心经': ['般若波罗蜜多', '观音', '玄奘'],
  '大悲咒': ['观世音', '千手千眼', '慈悲'],
  '楞严咒': ['佛顶', '楞严经', '大势至'],
  '地藏经': ['地藏王', '地狱', '救度'],
  '药师': ['药师佛', '琉璃光', '消灾延寿'],
  '阿弥陀': ['西方极乐', '净土', '无量寿'],
  '金刚经': ['般若', '应无所住', '如来'],
  '六字大明': ['观音心咒', '唵嘛呢叭咪吽'],
  '观音': ['观世音', '菩萨', '慈悲'],
  // 中医经典
  '伤寒': ['伤寒论', '六经辨证', '张仲景'],
  '金匮': ['金匮要略', '杂病论'],
  '黄帝内经': ['素问', '灵枢', '医经'],
  '神农本草': ['本草经', '中药学'],
  '难经': ['八十一难', '扁鹊'],
  '脉经': ['王叔和', '脉学'],
  '针灸甲乙经': ['皇甫谧', '针灸'],
  '奇经八脉': ['任督', '冲脉', '八脉'],
  // 紫微八字
  '紫微': ['紫微斗数', '帝星', '命宫'],
  '天机': ['智慧星', '南斗', '机谋'],
  '太阳': ['日星', '博爱', '男性'],
  '太阴': ['月星', '财富', '女性'],
  '天府': ['财星', '南斗', '稳定'],
  '七杀': ['将星', '权星', '威猛'],
  '贪狼': ['桃花星', '欲望', '才艺'],
  '比肩': ['同我', '独立', '合伙'],
  '劫财': ['偏财', '争夺', '异我'],
  '食神': ['才艺', '口福', '子女'],
  '伤官': ['叛逆', '才华', '克夫'],
  '正官': ['官贵', '约束', '事业'],
  '七杀': ['偏官', '权威', '暴力'],
  '正印': ['母亲', '学识', '庇护'],
  '偏印': ['继母', '偏门', '悟性'],
  '正财': ['财富', '稳定', '妻子'],
  // 风水
  '玄空': ['玄空飞星', '风水', '九星'],
  '八宅': ['八宅明镜', '风水', '方位'],
  '三元': ['三元九运', '玄空', '风水'],
  '峦头': ['形势派', '山水', '砂水'],
  '理气': ['理气派', '方位', '卦气'],
  // 六爻奇门
  '六爻': ['纳甲', '卦象', '易经'],
  '奇门': ['奇门遁甲', '九宫', '八门'],
  '太乙': ['太乙神数', '五元', '神算'],
  '六壬': ['大六壬', '天盘', '地盘'],
};

// 从 title 抽出 [[term, keywords...]] 匹配
function extractTitleKeywords(title) {
  const matched = new Set();
  for (const term of Object.keys(TERM_KEYWORDS)) {
    if (title.includes(term)) {
      matched.add(term);
      TERM_KEYWORDS[term].forEach(k => matched.add(k));
    }
  }
  return [...matched];
}

// 合并 keywords
function mergeKeywords(existing, additions) {
  let arr = [];
  try {
    arr = JSON.parse(existing || '[]');
    if (!Array.isArray(arr)) arr = [];
  } catch (e) { arr = []; }
  const set = new Set([...arr, ...additions]);
  return JSON.stringify([...set]);
}

const startTime = Date.now();
let updated = 0;
let totalProcessed = 0;

for (const module of TARGET_MODULES) {
  const rows = db.prepare(
    `SELECT entry_id, title, keywords FROM kb_formal WHERE status='formal' AND module = ?`
  ).all(module);

  if (rows.length === 0) continue;
  console.log(`\n=== ${module} (${rows.length} 条) ===`);

  const stmt = db.prepare(`UPDATE kb_formal SET keywords = ? WHERE entry_id = ?`);
  for (const r of rows) {
    totalProcessed++;
    const additions = extractTitleKeywords(r.title);
    if (additions.length === 0) continue;
    const newKw = mergeKeywords(r.keywords, additions);
    stmt.run(newKw, r.entry_id);
    updated++;
  }
}

console.log(`\n--- DONE ---`);
console.log(`处理: ${totalProcessed} 条 · 新增 keywords: ${updated} 条 · 用时: ${Date.now() - startTime}ms`);

// FTS5 重建
console.log('\n--- 重建 FTS5 ---');
db.exec('DELETE FROM kb_fts5');
db.exec(`
  INSERT INTO kb_fts5(entry_id, module, title, content, keywords, category)
  SELECT entry_id, module, title, content, keywords, category
  FROM kb_formal WHERE status = 'formal'
`);
const ftsCount = db.prepare('SELECT COUNT(*) as c FROM kb_fts5').get();
console.log(`FTS5 重建后: ${ftsCount.c} 条`);

db.close();
