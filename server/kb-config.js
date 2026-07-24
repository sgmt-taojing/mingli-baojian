// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · 知识库分级配置 (KB Access Level Configuration)
// ═══════════════════════════════════════════════════════════════
// 本文件定义全部60个知识库JS文件的访问级别。
// 级别分层：
//   public      (L1 公开)      — 8 个：知识索引、生肖文化、基础概念
//   registered  (L2 注册)      — 15个：注册用户可见的进阶内容
//   member      (L3 会员)      — 17个：付费会员可见的排盘/命理知识
//   premium     (L3+ 精进)     — 7 个：高级会员可见的深度内容
//   professional(L4 专业)      — 9 个：大师/医生专用（含周易术语+医疗知识）
//   admin       (管理员)       — 4 个：系统管理相关
// ═══════════════════════════════════════════════════════════════

const KB_LEVELS = {
  // ──────────────── L1 公开 (8个) ────────────────
  'knowledge-index.js':         { level: 'public',       desc: '知识库索引' },
  'koujue-daily.js':            { level: 'public',       desc: '口诀每日一句（365条）' },
  'psychology-wisdom.js':       { level: 'public',       desc: '心灵智慧生活知识库' },
  'temple-guide-insert.js':     { level: 'public',       desc: '道场参拜指南（103座寺庙道观）' },
  'wisdom-quotes.js':           { level: 'public',       desc: '智慧语录数据库' },
  'wisdom-supplement.js':       { level: 'public',       desc: '智慧语录扩展补充' },
  'zodiac-complete.js':         { level: 'public',       desc: '十二生肖完整模块（本命佛/年度化解/吉祥物）' },
  'zodiac-knowledge-base.js':   { level: 'public',       desc: '十二生肖知识库 v2.0' },

  // ──────────────── L2 注册 (15个) ────────────────
  'classics-highlights.js':     { level: 'registered',   desc: '典籍精华（历代命理古籍名句白话注解）' },
  'faith-content.js':           { level: 'registered',   desc: '信众每日修行指导内容' },
  'faith-deities-detail.js':    { level: 'registered',   desc: '神仙详解数据库（22位神仙）' },
  'faith-guide.js':             { level: 'registered',   desc: '信众实战指导（参拜/修行/养生/禁忌）' },
  'faith-knowledge-base.js':    { level: 'registered',   desc: '信众板块知识库 v3.0' },
  'faith-renderer.js':          { level: 'registered',   desc: '信众板块渲染引擎' },
  'huajie-age-specific.js':     { level: 'registered',   desc: '花甲年龄专属指导（少年到老年）' },
  'incantation-database.js':    { level: 'registered',   desc: '咒语真言大全（佛/道/儒/密宗）' },
  'koujue-database-full.js':    { level: 'registered',   desc: '全量口诀库 v3.0（佛道儒口诀/养生导引）' },
  'koujue-renderer.js':         { level: 'registered',   desc: '口诀宝库渲染引擎' },
  'masters-knowledge.js':       { level: 'registered',   desc: '命理大师人物库 v2.0（历代宗师）' },
  'scripture-database.js':      { level: 'registered',   desc: '经书全文带拼音数据库（语音伴读）' },
  'wuxing-correspondence.js':   { level: 'registered',   desc: '五行万物对应关系体系' },
  'yanzhi-knowledge-base.js':   { level: 'registered',   desc: '言之沟通知识库（场景化沟通智慧）' },
  'yanzhi-part2.js':            { level: 'registered',   desc: '言之沟通知识库扩展（场景9-16）' },

  // ──────────────── L3 会员 (17个) ────────────────
  'bazi-knowledge-base.js':           { level: 'member',  desc: '八字命理基础（起源/十神/格局）' },
  'fengshui-knowledge-base.js':       { level: 'member',  desc: '风水学知识库（形势派/理气派）' },
  'knowledge-details.js':             { level: 'member',  desc: '知识详情模块（八卦/生肖/五行详情）' },
  'knowledge-supplement.js':          { level: 'member',  desc: '知识库补充包（紫微/奇门/梅花/大六壬）' },
  'knowledge-supplement-1.js':        { level: 'member',  desc: '姓名学知识库补充（五格数理）' },
  'knowledge-supplement-2.js':        { level: 'member',  desc: '中医体质知识库补充（九种体质）' },
  'knowledge-supplement-3.js':        { level: 'member',  desc: '梅花易数知识库补充（八卦万物类象）' },
  'knowledge-supplement-4.js':        { level: 'member',  desc: '大六壬知识库补充（十二天将详解）' },
  'knowledge-supplement-5.js':        { level: 'member',  desc: '奇门遁甲知识库补充（八门/九星详解）' },
  'knowledge-supplement-6.js':        { level: 'member',  desc: '测字数据库（500+汉字）' },
  'liuren-knowledge-base.js':         { level: 'member',  desc: '大六壬知识库（起源/月将/天将）' },
  'liuyao-knowledge-base.js':         { level: 'member',  desc: '六爻知识库（起源/断法/纳甲）' },
  'meihua-knowledge-base.js':         { level: 'member',  desc: '梅花易数知识库（起源/万物类象）' },
  'qimen-knowledge-base.js':          { level: 'member',  desc: '奇门遁甲知识库（起源/排盘/断局）' },
  'yangzhai-knowledge-base.js':       { level: 'member',  desc: '阳宅风水知识库（口诀/布局/化煞）' },
  'zhouyi-knowledge-base.js':         { level: 'member',  desc: '周易知识库（起源/八卦/六十四卦）' },
  'ziwei-knowledge-base.js':          { level: 'member',  desc: '紫微斗数知识库（起源/星曜/宫位）' },

  // ──────────────── L3+ 精进 (7个) ────────────────
  'authoritative-knowledge-base.js':  { level: 'premium', desc: '权威知识库 v2.0（全网最权威命理体系）' },
  'knowledge-deep-supplement.js':     { level: 'premium', desc: '知识库深度补充（八卦详解/五行详解）' },
  'knowledge-details-extra.js':       { level: 'premium', desc: '知识库扩展全量专业详情' },
  'shuhan-basic-kb.js':               { level: 'premium', desc: '舒晗奇门36节基础课全量OCR知识库' },
  'shuhan-knowledge-base.js':         { level: 'premium', desc: '舒晗奇门知识库（32节课程索引）' },
  'shuhan-mixun-tianji.js':           { level: 'premium', desc: '舒晗密训班+天纪内容（PDF提取）' },
  'ziwei-new-sections.js':            { level: 'premium', desc: '紫微斗数深度补充（双星组合详解）' },

  // ──────────────── L4 专业 (9个) ────────────────
  'nihaisha-batch1.js':               { level: 'professional', desc: '倪海厦知识库 Batch1（截图证据类）' },
  'nihaisha-batch2.js':               { level: 'professional', desc: '倪海厦知识库 Batch2（核心课程类）' },
  'nihaisha-batch3.js':               { level: 'professional', desc: '倪海厦知识库 Batch3（课程+笔记类）' },
  'nihaisha-batch4.js':               { level: 'professional', desc: '倪海厦知识库 Batch4（小文件）' },
  'nihaisha-classics-kb.js':          { level: 'professional', desc: '倪海厦典籍知识库（PDF提取）' },
  'nihaisha-structured-kb.js':        { level: 'professional', desc: '倪海厦知识库结构化条目（118条·自动从33模块切分·R10审计产物）' },
  'nihaisha-tcm-kb.js':               { level: 'professional', desc: '倪海厦中医知识库全量移植版' },
  'nishan-knowledge.js':              { level: 'professional', desc: '倪海厦讲堂知识库（天纪命理+人纪中医）' },
  'tcm-diagnosis-kb.js':              { level: 'professional', desc: '中医诊疗知识库（症状→证候映射）' },
  'tcm-famous-formulas-kb.js':        { level: 'professional', desc: '历代名医名方与医学典籍知识库' },

  // ──────────────── 管理员 (4个) ────────────────
  'gzh-collect-system.js':            { level: 'admin',   desc: '公众号关注与内容采集系统' },
  'kb-missing-sections.js':           { level: 'admin',   desc: '知识库缺失部分补丁' },
  'shop-data.js':                     { level: 'admin',   desc: '商城数据（吉祥物/法器/文创）' },
  'shop-medicine-data.js':            { level: 'admin',   desc: '商城医药数据（道医药品）' },
};

// ═══════════════════════════════════════════════════════════════
// 级别 → 目录映射
// ═══════════════════════════════════════════════════════════════
const LEVEL_TO_DIR = {
  'public':       'public',
  'registered':   'registered',
  'member':       'member',
  'premium':      'premium',
  'professional': 'professional',
  'admin':        'admin',
};

// ═══════════════════════════════════════════════════════════════
// 级别 → 所需RBAC权限映射
// 对齐 rbac-middleware.js 中的 PERMISSIONS 定义
// ═══════════════════════════════════════════════════════════════
const LEVEL_TO_PERMISSION = {
  'public':       null,                          // 无需鉴权
  'registered':   'kb:registered',               // free+ 可见
  'member':       'kb:member',                   // mingdao+ 可见
  'premium':      'kb:premium',                  // advanced+ 可见
  'professional': 'kb:professional',             // master/doctor/admin 可见
  'admin':        'system:admin',                // 管理员可见
};

// ═══════════════════════════════════════════════════════════════
// 级别优先级（用于比较）
// ═══════════════════════════════════════════════════════════════
const LEVEL_PRIORITY = {
  'public':       1,
  'registered':   2,
  'member':       3,
  'premium':      4,
  'professional': 5,
  'admin':        6,
};

// ═══════════════════════════════════════════════════════════════
// 统计信息
// ═══════════════════════════════════════════════════════════════
const LEVEL_COUNTS = {
  'public':       8,
  'registered':   15,
  'member':       17,
  'premium':      7,
  'professional': 9,
  'admin':        4,
};

module.exports = {
  KB_LEVELS,
  LEVEL_TO_DIR,
  LEVEL_TO_PERMISSION,
  LEVEL_PRIORITY,
  LEVEL_COUNTS,
};
