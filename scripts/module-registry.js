#!/usr/bin/env node
/**
 * module-registry.js — module 注册表立项（2026-10-19，第三十轮）
 * 病灶：kb_formal module 命名 220 个，游离命名混杂（yishi/huajie/ziwei+fengshui+qimen 等），
 *   面板与检索的分组口径不统一。
 * 决策：不做原地改名——'xingming' 是 API 路由工具 id、nihaisha-* 在 isTcmModule 集合里，
 *   改名必断链。改为注册表层统一口径（零风险、可审计）。
 * 产出：
 *   1. 新表 kb_module_registry（module/std_group/display_name/note/domain/entry_count）
 *   2. std_group 归 16 类：14 中文 domain + 引擎 + 参考（垃圾模块不藏，note 标 junk 候选）
 *   3. 复核清单：ziwei+fengshui+qimen 等组合模块为乱码重灾区，note 标记待裁决
 * 用法：node scripts/module-registry.js [--dry]
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const DB_PATH = process.env.YIDAO_DB_PATH || path.join(__dirname, '..', 'server', 'database', 'yidao.db');
const dry = process.argv.includes('--dry');
const db = new DatabaseSync(DB_PATH);

if (!dry) db.exec(`CREATE TABLE IF NOT EXISTS kb_module_registry (
  module TEXT PRIMARY KEY, std_group TEXT NOT NULL, display_name TEXT NOT NULL,
  domain TEXT, entry_count INTEGER DEFAULT 0, note TEXT, updated_at TEXT DEFAULT (datetime('now','localtime')))`);

// 展示名（主要模块人工审定；未列的回落为 module 原名）
const DISPLAY = {
  'tcm': '中医综合库', 'shanghan-lun': '伤寒论', 'tcm-fangji': '方剂学', 'nihaisha-tcm': '倪海厦中医',
  'tcm-diagnosis': '中医诊断', 'nihaisha': '倪海厦合集', 'huangdi-neijing': '黄帝内经',
  'ziwei': '紫微斗数', 'r45_palace_ext': '紫微宫位扩展', 'yizong-jinjian': '医宗金鉴',
  'jingyue': '景岳全书', 'bencao-gangmu': '本草纲目', 'mengzhan': '梦占断语', 'bazi': '八字命理',
  'xiangshu': '相术面相', 'tcm-classical': '中医经典', 'tcm-acupuncture': '针灸',
  'shennong-bencao': '神农本草经', 'authoritative': '权威参考', 'nihaisha_pcs': '倪师网盘转储',
  'r45_huajie_ext': '化解扩展', 'tcm-clinical': '中医临床', 'yijing': '周易易经', 'qimen': '奇门遁甲',
  'classics': '典籍综合', 'ziwei+fengshui+qimen': '紫风奇组合（乱码候选）', 'liuren': '大六壬',
  'fengshui': '风水阳宅', 'qianjin': '千金方', 'tcm-formula': '方剂', 'zeri': '择日择吉',
  'jinkui-yaolue': '金匮要略', 'tianji': '天纪听课笔记', 'yizhan': '卜筮正宗', 'mantra': '口诀咒诀',
  'shuhan': '舒晗奇门资料', 'r45_shishen_ext': '十神扩展', 'mingyi-leian': '名医类案',
  'nihaisha-yian': '倪师医案', 'liuyue': '六爻JS转储（junk）', 'tcm-herb': '中药',
  'koujue-daily': '每日口诀', 'r39_dual_core': '双核报告', 'acupuncture': '针灸学',
  'ziwei+fengshui': '紫微风水组合', 'meihua': '梅花易数', 'liuyao': '六爻', 'naming': '姓名学',
  'zhubingyuanhou': '诸病源候论', 'general': '通用（junk）', 'tianji-jiangjie': '天纪讲解',
  'faith': '信仰文化', 'rumen-shiqin': '儒门事亲', 'hehun': '合婚', 'tcm-syndrome': '中医证候',
  'tarot': '塔罗（离古制，待定夺）', 'wenbing-tiaobian': '温病条辨', 'jiayi-jing': '针灸甲乙经',
  'yishi': '行业运势', 'taixuan': '太玄经', 'kb-store': '知识存储', 'shuzi': '数字术数',
  'mingli-cross-moved': '命理交叉迁移', 'yangzhai': '阳宅', 'wuxing': '五行', 'mingxiang': '命相统合',
  'huangli': '黄历', 'maijing': '脉经', 'wangzhen': '望诊标签', 'ziwei-mingtu': '紫微命图',
  'epb-case': '环保案例（junk）', 'tizhi': '体质', 'wenre-lun': '温热论', 'r45_lifeplan': '人生规划',
  'monthly_cure': '月令宜忌', 'taiyi': '太乙神数', 'ziwei+yijing+fengshui': '紫易风组合',
  'tcm-wangzhen': '中医望诊', 'bencao': '本草', 'ziwei+caibo': '紫微财帛', 'xingming': '姓名81数理',
  'nanjing': '难经', 'taisui': '太岁科仪', 'zodiac': '生肖', 'huajie': '化解', 'piwei-lun': '脾胃论',
  'wenyi-lun': '温疫论', 'yangsheng': '养生', 'neijing': '内经', 'folklore': '民俗',
  'koujue-state': '状态口诀', 'danxi': '丹溪心法', 'yilin-gaicuo': '医林改错', 'jingfang': '经方',
  'fuke': '妇科', 'jieqi': '节气', 'yunqi': '五运六气', 'fuyang': '扶阳', 'lifeplan': '人生规划',
  'bagua': '八卦', 'hechong': '合冲', 'nayin': '纳音', 'shensha': '神煞', 'shishen': '十神',
  'erke': '儿科', 'ganqing': '感情', 'wisdom': '智慧语录', 'keyi': '科仪', 'yanke': '眼科',
  'yiming-tongcan': '医命同参', 'xianzhi-lens': '先知智镜', 'ziwei-case': '紫微案例',
  'tianji-mingli': '天纪命理', 'ziwei-xize': '紫微细则'
};
// 标准组映射（16 类）：默认取该模块多数条目的 domain；特判如下
const GROUP_OVERRIDE = {
  'syndrome-engine': '引擎', 'chronic-disease-engine': '引擎', 'pulse-engine': '引擎',
  'constitution-engine': '引擎', 'drug-safety-engine': '引擎', 'tongue-inhouse-engine': '引擎',
  'dosage-engine': '引擎', 'safety-engine': '引擎', 'dual-constitution-engine': '引擎',
  'pathway-engine': '引擎', 'classics-engine': '引擎', 'classics-engine-formulas': '引擎',
  'compliance-engine': '引擎', 'dialogue-engine': '引擎', 'causality-engine': '引擎',
  'recommend-engine': '引擎', 'multimodal-fusion-synthesized': '引擎', 'tcm-engine': '引擎',
  'tcm-device': '引擎', 'tcm-app': '引擎', 'tcm-agent': '引擎',
  'authoritative': '参考', 'shuhan': '参考', 'kb-store': '参考', 'knowledge-raw': '参考',
  'knowledge-supplement': '参考', 'kb-supplement': '参考', 'master-class': '参考',
  'wechat-cases': '参考', 'mobile': '参考', 'shop': '参考', 'ai-prompt': '参考',
  'vision-system': '参考', 'feedback-distill': '参考', 'engine_compare': '参考',
  'r491_r_engine_meta': '参考', 'r96-meta': '参考', 'yanzhi': '参考', 'xianzhi-lens': '参考',
  'wangzhen': '参考'
};
const JUNK_NOTE = { 'general': 'junk 已裁决', 'liuyue': 'junk 已裁决（JS dump）',
  'epb-case': 'junk 已裁决', 'epb-enterprise': 'junk 已裁决', 'epb-law': 'junk 已裁决',
  'epb-violation': 'junk 已裁决', 'epb-device': 'junk 已裁决',
  'ziwei+fengshui+qimen': '乱码重灾区，junk 候选待裁决', 'ziwei+fengshui': '部分乱码，待抽样复核',
  'nihaisha_pcs': '含乱码转储，待复核', 'tarot': '离古制 charter，待缘主定夺去留' };

const mods = db.prepare(`SELECT module, COUNT(*) n FROM kb_formal GROUP BY module ORDER BY n DESC`).all();
// 每模块多数 domain
const domQ = db.prepare(`SELECT domain, COUNT(*) n FROM kb_formal WHERE module=? AND domain IS NOT NULL AND domain!='' GROUP BY domain ORDER BY n DESC LIMIT 1`);
const ins = db.prepare(`INSERT OR REPLACE INTO kb_module_registry (module, std_group, display_name, domain, entry_count, note, updated_at)
  VALUES (?,?,?,?,?,?,datetime('now','localtime'))`);
if (!dry) db.exec('BEGIN');
const stat = {};
for (const m of mods) {
  const dom = domQ.get(m.module);
  const domain = dom ? dom.domain : null;
  const grp = GROUP_OVERRIDE[m.module] || domain || '参考';
  const disp = DISPLAY[m.module] || m.module;
  const note = JUNK_NOTE[m.module] || null;
  if (!dry) ins.run(m.module, grp, disp, domain, m.n, note);
  stat[grp] = (stat[grp] || 0) + 1;
}
if (!dry) db.exec('COMMIT');
console.log((dry ? '[DRY] ' : '') + `module 注册表完成：${mods.length} 个模块入册`);
console.log('标准组分布：', JSON.stringify(stat));
if (!dry) {
  const c = db.prepare('SELECT COUNT(*) n FROM kb_module_registry').get();
  console.log('kb_module_registry 现', c.n, '行');
}
