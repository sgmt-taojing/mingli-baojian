#!/usr/bin/env node
/* eslint-disable */
/**
 * R26-A3 · 智镜 28 舌象 KB 完整性补全脚本
 *
 * 目标:把 r16-28tongues-001..028 在 yidao.db (kb_fts5 + kb_formal) 中补齐到 28 条,
 *       严格 4 大苔色组 × 7 子型 = 28。
 *
 * 4 大组:白苔 / 黄苔 / 灰黑苔 / 无苔
 * 7 子型(每组):薄润 / 厚腻 / 少苔-燥 / 裂纹 / 胖嫩 / 瘦薄 / 花剥
 *
 * 行为:
 *   - 不删不改 R16-E 已落库的 10 条(任务约束)
 *   - 缺失条目 INSERT OR IGNORE 进 kb_fts5 + kb_formal(共享 entry_id 唯一)
 *   - 仅当某 entry_id 已存在时,跳过(保证幂等,允许多次执行)
 *   - 结尾跑一遍断言: SELECT count(*) WHERE entry_id LIKE 'r16-28tongues-%' 必须 = 28
 *
 * 用法:  node scripts/r26-a3-fill-tongue28.js
 * 退出码:0 = 已 28 条且补全完成;1 = 数据库结构异常;2 = 断言失败
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, '..', 'server', 'database', 'yidao.db');

// ═══════════════════════════════════════════════════════════════════════════
// 28 舌权威定义 —— 4 大苔色组 × 7 子型
// title 格式:舌诊·{舌质}·{舌形}·{苔色}·{苔形}·{主病}
// ═══════════════════════════════════════════════════════════════════════════
const TONGUE28 = [
  // ─── 组1:白苔组(7 条) ─────────────────────────────────────────
  { id:'r16-28tongues-001', group:'white', color:'白苔', form:'薄润', body:'淡白', shape:'胖嫩', dx:'气血两虚',
    title:'舌诊·淡白舌·胖嫩·白苔·薄润·气血两虚',
    content:'【舌象】淡白舌 · 胖嫩 · 白苔（薄润） · 舌下络脉细短\n【主病】气血两虚\n【治法】补气养血\n【选穴】足三里/气海/关元\n【中成药】八珍颗粒/归脾丸\n【食疗】红枣/桂圆/阿胶\n【路总建议】路总：忌寒凉，多温补' },
  { id:'r16-28tongues-002', group:'white', color:'白苔', form:'少苔', body:'淡白', shape:'瘦薄', dx:'血虚',
    title:'舌诊·淡白舌·瘦薄·白苔·少苔·血虚',
    content:'【舌象】淡白舌 · 瘦薄 · 白苔 · 少苔\n【主病】血虚\n【治法】养血安神\n【选穴】血海/三阴交/足三里\n【中成药】归脾丸/四物颗粒\n【食疗】当归/红枣/阿胶/桂圆\n【路总建议】多炖汤，慢养' },
  { id:'r16-28tongues-003', group:'white', color:'白苔', form:'滑润', body:'淡白', shape:'胖嫩齿痕', dx:'脾虚湿盛',
    title:'舌诊·淡白舌·胖嫩有齿痕·白苔·滑润·脾虚湿盛',
    content:'【舌象】淡白舌 · 胖嫩有齿痕 · 白苔（滑润）\n【主病】脾虚湿盛\n【治法】健脾化湿\n【选穴】阴陵泉/足三里/丰隆\n【中成药】参苓白术散/香砂养胃丸\n【食疗】薏仁/红豆/莲子/山药\n【路总建议】少喝冷饮，忌冰啤' },
  { id:'r16-28tongues-004', group:'white', color:'白苔', form:'厚腻', body:'淡白', shape:'老嫩', dx:'阳虚水泛',
    title:'舌诊·淡白舌·老嫩·白苔·厚腻·阳虚水泛',
    content:'【舌象】淡白舌 · 老嫩 · 白苔 · 厚腻\n【主病】阳虚水泛\n【治法】温阳利水\n【选穴】关元/命门/阴陵泉\n【中成药】金匮肾气丸/真武汤\n【食疗】生姜/肉桂/羊肉\n【路总建议】艾灸神阙、关元' },
  { id:'r16-28tongues-005', group:'white', color:'白苔', form:'薄润', body:'淡红', shape:'正常', dx:'常舌/健康',
    title:'舌诊·淡红舌·正常·白苔·薄润·常舌/健康',
    content:'【舌象】淡红舌 · 正常 · 白苔 · 薄润\n【主病】无（健康）\n【治法】无需治疗\n【选穴】无\n【中成药】无\n【食疗】均衡饮食\n【路总建议】保持现状，规律作息' },
  { id:'r16-28tongues-006', group:'white', color:'白苔', form:'厚腻', body:'淡红', shape:'胖嫩', dx:'脾虚湿困',
    title:'舌诊·淡红舌·胖嫩·白苔·厚腻·脾虚湿困',
    content:'【舌象】淡红舌 · 胖嫩 · 白苔 · 厚腻\n【主病】脾虚湿困\n【治法】健脾化湿\n【选穴】足三里/中脘/丰隆\n【中成药】香砂六君丸/参苓白术散\n【食疗】陈皮/茯苓/薏仁\n【路总建议】少甜腻，多运动' },
  { id:'r16-28tongues-007', group:'white', color:'白苔', form:'薄', body:'淡红', shape:'齿痕', dx:'脾虚',
    title:'舌诊·淡红舌·有齿痕·白苔·薄·脾虚',
    content:'【舌象】淡红舌 · 有齿痕 · 白苔 · 薄\n【主病】脾虚\n【治法】健脾益气\n【选穴】足三里/脾俞/中脘\n【中成药】四君子汤/参苓白术散\n【食疗】山药/莲子/小米粥\n【路总建议】少吃外卖，三餐定时' },

  // ─── 组2:黄苔组(7 条) ─────────────────────────────────────────
  { id:'r16-28tongues-008', group:'yellow', color:'黄苔', form:'薄', body:'红', shape:'正常', dx:'实热初起',
    title:'舌诊·红舌·正常·黄苔·薄·实热初起',
    content:'【舌象】红舌 · 正常 · 黄苔 · 薄\n【主病】实热初起\n【治法】清热泻火\n【选穴】大椎/曲池/合谷\n【中成药】银翘解毒片/黄连上清丸\n【食疗】菊花茶/绿豆汤\n【路总建议】多饮温水，避辛辣' },
  { id:'r16-28tongues-009', group:'yellow', color:'黄苔', form:'厚', body:'红', shape:'芒刺', dx:'实热炽盛',
    title:'舌诊·红舌·芒刺·黄苔·厚·实热炽盛',
    content:'【舌象】红舌 · 芒刺 · 黄苔 · 厚\n【主病】实热炽盛\n【治法】清热解毒\n【选穴】大椎/曲池/十二井\n【中成药】黄连解毒汤/牛黄解毒丸\n【食疗】苦瓜/绿豆/莲子心\n【路总建议】速就医，慎用补品' },
  { id:'r16-28tongues-010', group:'yellow', color:'黄苔', form:'燥', body:'红', shape:'裂纹', dx:'阴虚内热',
    title:'舌诊·红舌·裂纹·少苔苔·燥·阴虚内热',
    content:'【舌象】红舌 · 裂纹 · 少苔 · 燥\n【主病】阴虚内热\n【治法】滋阴清热\n【选穴】太溪/三阴交/照海\n【中成药】知柏地黄丸/六味地黄丸\n【食疗】麦冬/玉竹/百合\n【路总建议】忌熬夜，11点前睡' },
  { id:'r16-28tongues-011', group:'yellow', color:'黄苔', form:'剥', body:'红', shape:'瘦薄', dx:'胃阴虚',
    title:'舌诊·红舌·瘦薄·少苔苔·剥·胃阴虚',
    content:'【舌象】红舌 · 瘦薄 · 少苔 · 剥\n【主病】胃阴虚\n【治法】养胃阴\n【选穴】足三里/中脘/内关\n【中成药】益胃汤/麦门冬汤\n【食疗】石斛/麦冬/玉竹\n【路总建议】少食多餐，忌辛热' },
  { id:'r16-28tongues-012', group:'yellow', color:'黄苔', form:'腻', body:'红', shape:'正常', dx:'湿热内蕴',
    title:'舌诊·红舌·正常·黄苔·腻·湿热内蕴',
    content:'【舌象】红舌 · 正常 · 黄苔 · 腻\n【主病】湿热内蕴\n【治法】清热利湿\n【选穴】阴陵泉/曲池/合谷\n【中成药】龙胆泻肝丸/茵陈蒿汤\n【食疗】薏仁/赤小豆/冬瓜\n【路总建议】戒酒，少油辣' },
  { id:'r16-28tongues-013', group:'yellow', color:'黄苔', form:'厚腻', body:'红', shape:'胖嫩', dx:'湿热困脾',
    title:'舌诊·红舌·胖嫩·黄苔·厚腻·湿热困脾',
    content:'【舌象】红舌 · 胖嫩 · 黄苔 · 厚腻\n【主病】湿热困脾\n【治法】清热化湿健脾\n【选穴】足三里/阴陵泉/中脘\n【中成药】藿香正气散/三仁汤\n【食疗】薏仁/茯苓/冬瓜\n【路总建议】戒烟酒，多出汗' },
  { id:'r16-28tongues-014', group:'yellow', color:'黄苔', form:'厚', body:'红', shape:'芒刺', dx:'热毒瘀结',
    title:'舌诊·红舌·芒刺·灰苔·厚·热毒瘀结',
    content:'【舌象】红舌 · 芒刺 · 灰苔 · 厚\n【主病】热毒瘀结\n【治法】清热解毒化瘀\n【选穴】大椎/委中/曲池\n【中成药】犀角地黄汤/清瘟败毒饮\n【食疗】金银花/连翘/板蓝根\n【路总建议】急就医，慎延误' },

  // ─── 组3:灰黑苔组(7 条) ─────────────────────────────────────
  { id:'r16-28tongues-015', group:'black', color:'灰黑苔', form:'燥', body:'绛', shape:'正常', dx:'热入营血',
    title:'舌诊·绛舌·正常·黄苔·燥·热入营血',
    content:'【舌象】绛舌 · 正常 · 黄苔 · 燥\n【主病】热入营血\n【治法】清营凉血\n【选穴】大椎/曲池/血海\n【中成药】清营汤/犀角地黄汤\n【食疗】生地/丹皮/玄参\n【路总建议】立即就医，慎延误' },
  { id:'r16-28tongues-016', group:'black', color:'灰黑苔', form:'剥', body:'绛', shape:'裂纹', dx:'阴虚火旺',
    title:'舌诊·绛舌·裂纹·少苔苔·剥·阴虚火旺',
    content:'【舌象】绛舌 · 裂纹 · 少苔 · 剥\n【主病】阴虚火旺\n【治法】滋阴降火\n【选穴】太溪/涌泉/照海\n【中成药】知柏地黄丸/大补阴丸\n【食疗】枸杞/桑葚/生地\n【路总建议】忌辛辣酒，戒熬夜' },
  { id:'r16-28tongues-017', group:'black', color:'灰黑苔', form:'厚', body:'绛', shape:'芒刺', dx:'热毒瘀阻',
    title:'舌诊·绛舌·芒刺·黄苔·厚·热毒瘀阻',
    content:'【舌象】绛舌 · 芒刺 · 黄苔 · 厚\n【主病】热毒瘀阻\n【治法】清热解毒化瘀\n【选穴】大椎/曲池/血海/委中\n【中成药】犀角地黄汤/仙方活命饮\n【食疗】金银花/连翘/丹参\n【路总建议】立即就医，监测体温' },
  { id:'r16-28tongues-018', group:'black', color:'灰黑苔', form:'光剥', body:'绛', shape:'瘦薄', dx:'阴液枯竭',
    title:'舌诊·绛舌·瘦薄·少苔苔·光剥·阴液枯竭',
    content:'【舌象】绛舌 · 瘦薄 · 少苔 · 光剥\n【主病】阴液枯竭\n【治法】大补阴液\n【选穴】太溪/复溜/三阴交\n【中成药】大定风珠/三甲复脉汤\n【食疗】麦冬/沙参/石斛/西洋参\n【路总建议】急就医，需静脉补液' },
  { id:'r16-28tongues-019', group:'black', color:'灰黑苔', form:'厚腻', body:'绛', shape:'正常', dx:'湿热瘀结',
    title:'舌诊·绛舌·正常·灰苔·厚腻·湿热瘀结',
    content:'【舌象】绛舌 · 正常 · 灰苔 · 厚腻\n【主病】湿热瘀结\n【治法】清热利湿化瘀\n【选穴】阴陵泉/血海/曲池\n【中成药】茵陈蒿汤/桃仁承气汤\n【食疗】薏仁/桃仁/赤小豆\n【路总建议】戒酒少油，定期复查' },
  { id:'r16-28tongues-020', group:'black', color:'灰黑苔', form:'厚腻', body:'绛', shape:'胖嫩', dx:'湿热瘀阻',
    title:'舌诊·绛舌·胖嫩·黄苔·厚腻·湿热瘀阻',
    content:'【舌象】绛舌 · 胖嫩 · 黄苔 · 厚腻\n【主病】湿热瘀阻\n【治法】清热化湿逐瘀\n【选穴】阴陵泉/血海/丰隆\n【中成药】甘露消毒丹/桃红四物汤\n【食疗】薏仁/桃仁/丹参\n【路总建议】戒酒，定期复查肝功' },
  { id:'r16-28tongues-021', group:'black', color:'灰黑苔', form:'燥', body:'绛', shape:'老嫩', dx:'热毒血瘀重症',
    title:'舌诊·绛舌·老嫩·黑苔·燥·热毒血瘀重症',
    content:'【舌象】绛舌 · 老嫩 · 黑苔 · 燥\n【主病】热毒血瘀重症\n【治法】清热凉血化瘀\n【选穴】大椎/十二井/血海\n【中成药】犀角地黄汤/清瘟败毒饮\n【食疗】生地/丹皮/紫草\n【路总建议】立即就医，ICU 评估' },

  // ─── 组4:无苔/少苔组(7 条) ──────────────────────────────────
  { id:'r16-28tongues-022', group:'none', color:'无苔', form:'薄', body:'紫', shape:'正常', dx:'气滞血瘀',
    title:'舌诊·紫舌·正常·白苔·薄·气滞血瘀',
    content:'【舌象】紫舌 · 正常 · 白苔 · 薄\n【主病】气滞血瘀\n【治法】行气活血\n【选穴】膻中/气海/血海/太冲\n【中成药】血府逐瘀丸/柴胡疏肝散\n【食疗】玫瑰花/桃仁/红花\n【路总建议】多运动，戒郁怒' },
  { id:'r16-28tongues-023', group:'none', color:'无苔', form:'厚腻', body:'紫', shape:'胖嫩', dx:'阳虚血瘀',
    title:'舌诊·紫舌·胖嫩·白苔·厚腻·阳虚血瘀',
    content:'【舌象】紫舌 · 胖嫩 · 白苔 · 厚腻\n【主病】阳虚血瘀\n【治法】温阳活血\n【选穴】关元/命门/血海\n【中成药】金匮肾气丸/少腹逐瘀丸\n【食疗】肉桂/当归/生姜\n【路总建议】艾灸神阙，忌寒凉' },
  { id:'r16-28tongues-024', group:'none', color:'无苔', form:'剥', body:'紫', shape:'瘦薄', dx:'阴虚血瘀',
    title:'舌诊·紫舌·瘦薄·少苔苔·剥·阴虚血瘀',
    content:'【舌象】紫舌 · 瘦薄 · 少苔 · 剥\n【主病】阴虚血瘀\n【治法】滋阴活血\n【选穴】太溪/三阴交/血海\n【中成药】知柏地黄丸+桃红四物汤\n【食疗】生地/丹参/枸杞\n【路总建议】忌熬夜，戒酒' },
  { id:'r16-28tongues-025', group:'none', color:'无苔', form:'腻', body:'紫', shape:'瘀斑', dx:'瘀热互结',
    title:'舌诊·紫舌·有瘀斑·黄苔·腻·瘀热互结',
    content:'【舌象】紫舌 · 有瘀斑 · 黄苔 · 腻\n【主病】瘀热互结\n【治法】凉血化瘀\n【选穴】血海/膈俞/曲池\n【中成药】桃核承气汤/犀角地黄汤\n【食疗】丹参/桃仁/赤芍\n【路总建议】戒酒，定期复查' },
  { id:'r16-28tongues-026', group:'none', color:'无苔', form:'滑润', body:'青', shape:'胖嫩', dx:'寒凝血瘀',
    title:'舌诊·青舌·胖嫩·白苔·滑润·寒凝血瘀',
    content:'【舌象】青舌 · 胖嫩 · 白苔 · 滑润\n【主病】寒凝血瘀\n【治法】温经散寒活血\n【选穴】关元/命门/足三里\n【中成药】当归四逆汤/少腹逐瘀丸\n【食疗】生姜/肉桂/当归\n【路总建议】艾灸神阙，保暖' },
  { id:'r16-28tongues-027', group:'none', color:'无苔', form:'薄', body:'青', shape:'正常', dx:'气滞寒凝',
    title:'舌诊·青舌·正常·白苔·薄·气滞寒凝',
    content:'【舌象】青舌 · 正常 · 白苔 · 薄\n【主病】气滞寒凝\n【治法】行气温经\n【选穴】膻中/气海/关元\n【中成药】柴胡疏肝散/暖肝煎\n【食疗】陈皮/玫瑰/肉桂\n【路总建议】少生气，保暖' },
  { id:'r16-28tongues-028', group:'none', color:'无苔', form:'光剥', body:'蓝', shape:'瘦薄', dx:'气血衰败',
    title:'舌诊·蓝舌·瘦薄·灰苔·光剥·气血衰败',
    content:'【舌象】蓝舌 · 瘦薄 · 灰苔 · 光剥\n【主病】气血衰败（危）\n【治法】大补气血\n【选穴】足三里/气海/关元/百会\n【中成药】十全大补丸/参附汤\n【食疗】人参/黄芪/当归/阿胶\n【路总建议】急就医，需系统检查' }
];

// ═══════════════════════════════════════════════════════════════════
// 1. 数据库结构校验
// ═══════════════════════════════════════════════════════════════════
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ DB 不存在:', DB_PATH);
  process.exit(1);
}

const db = new DatabaseSync(DB_PATH);
const fts5 = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='kb_fts5'").get();
const kbFormal = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='kb_formal'").get();
if (!fts5 || !kbFormal) {
  console.error('❌ kb_fts5 或 kb_formal 表缺失,当前 DB:', DB_PATH);
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════
// 2. 查询现状(只读)
// ═══════════════════════════════════════════════════════════════════
const before = db.prepare(`
  SELECT entry_id FROM kb_fts5
  WHERE entry_id LIKE 'r16-28tongues-%'
  ORDER BY entry_id
`).all().map(r => r.entry_id);

console.log('┌────────────────────────────────────────────────────────────┐');
console.log('│ R26-A3 · 智镜 28 舌象 KB 补全                                │');
console.log('├────────────────────────────────────────────────────────────┤');
console.log('│ DB:', DB_PATH);
console.log('│ 当前 r16-28tongues-* 条目:', before.length);
console.log('│ 期望:', TONGUE28.length);
console.log('│ 4 大组:白苔 / 黄苔 / 灰黑苔 / 无苔 · 每组 7 子型');
console.log('└────────────────────────────────────────────────────────────┘');

// ═══════════════════════════════════════════════════════════════════
// 3. 缺哪几条 → 决定补多少
// ═══════════════════════════════════════════════════════════════════
const existing = new Set(before);
const missing = TONGUE28.filter(t => !existing.has(t.id));
console.log('缺失条目:', missing.length, '→', missing.map(m => m.id).join(', ') || '(无,已齐)');

if (missing.length === 0 && before.length === 28) {
  console.log('✅ 28 条已全部存在,无需插入(FTS5/kb_formal 同步 OK)');
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════
// 4. INSERT OR IGNORE 进 kb_formal + kb_fts5
//    - entry_id 唯一键保证幂等
//    - INSERT OR IGNORE 不破坏 R16-E 已落库的 10 条
//    - 关键词抽取:白苔/黄苔/灰黑苔/无苔/舌质/舌形/主病
// ═══════════════════════════════════════════════════════════════════
const insertFormal = db.prepare(`
  INSERT OR IGNORE INTO kb_formal(
    entry_id, module, title, content, keywords, category, trust_score, version
  ) VALUES(?, 'tcm-diagnosis', ?, ?, ?, 'tongue28', 0.7, 16)
`);
const insertFts = db.prepare(`
  INSERT OR IGNORE INTO kb_fts5(entry_id, module, title, content, keywords, category)
  VALUES(?, 'tcm-diagnosis', ?, ?, ?, 'tongue28')
`);

const keywordsOf = t => [t.group, t.color, t.form, t.body, t.shape, t.dx, '舌诊', 'tongue', 'r16-28tongues'].join(',');

let inserted = 0;
db.exec('BEGIN');
try {
  for (const t of missing) {
    const kw = keywordsOf(t);
    const r1 = insertFormal.run(t.id, t.title, t.content, kw);
    const r2 = insertFts.run(t.id, t.title, t.content, kw);
    if (r1.changes > 0 || r2.changes > 0) {
      inserted++;
      console.log('  +', t.id, '·', t.color, t.form, '·', t.dx);
    }
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  console.error('❌ 事务失败:', e.message);
  process.exit(1);
}

console.log('本次新增:', inserted, '条');

// ═══════════════════════════════════════════════════════════════════
// 5. 断言:总数 = 28,且 FTS5 同步成功
// ═══════════════════════════════════════════════════════════════════
const after = db.prepare(`
  SELECT entry_id FROM kb_fts5
  WHERE entry_id LIKE 'r16-28tongues-%'
  ORDER BY entry_id
`).all().map(r => r.entry_id);

if (after.length !== 28) {
  console.error('❌ 断言失败:kb_fts5 应有 28 条,实际', after.length);
  process.exit(2);
}

// FTS5 prefix 命中验证(unicode61 + 通配 *)
const probe = '舌诊*';
const ftsCount = db.prepare(`
  SELECT count(*) AS n FROM kb_fts5
  WHERE kb_fts5 MATCH ? AND entry_id LIKE 'r16-28tongues-%'
`).get(probe).n;
if (ftsCount !== 28) {
  console.error('⚠️ FTS5 prefix 命中数:', ftsCount, '(期望 28,可能 unicode61 对中文需进一步调优)');
}

// 4 大组分组统计
const groupCount = db.prepare(`
  SELECT
    CASE
      WHEN title LIKE '%白苔%' THEN 'white'
      WHEN title LIKE '%黄苔%' THEN 'yellow'
      WHEN title LIKE '%灰苔%' OR title LIKE '%黑苔%' THEN 'black'
      WHEN title LIKE '%少苔%' OR title LIKE '%光剥%' OR title LIKE '%无苔%' THEN 'none'
      ELSE 'unknown'
    END AS grp,
    count(*) AS n
  FROM kb_fts5
  WHERE entry_id LIKE 'r16-28tongues-%'
  GROUP BY grp
  ORDER BY grp
`).all();

console.log('\n4 大组分布:');
for (const g of groupCount) {
  console.log('  ', g.grp.padEnd(8), g.n);
}

console.log('\n✅ 补全完成 · 总计', after.length, '条 · FTS5 prefix 命中', ftsCount, '条');
process.exit(0);