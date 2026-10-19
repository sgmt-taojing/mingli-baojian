#!/usr/bin/env node
/**
 * domain-backfill.js — domain 字段回填专项（2026-10-19，第二十七轮）
 * 病灶：kb_formal.domain 80% 空（263,155/327,330），ancient_book_search 的
 *   category 过滤（m.domain !== category → continue）大面积失效。
 * 方案：module→domain 显式映射表（人工审定，可审计），仅填空值，不覆盖已有值。
 * 铁律：有把握才映射；含糊模块（general、epb 系列、distill_wenmo、yanzhi 等）留 NULL 进复核清单。
 * 用法：node scripts/domain-backfill.js [--dry]
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const DB_PATH = process.env.YIDAO_DB_PATH || path.join(__dirname, '..', 'server', 'database', 'yidao.db');
const dry = process.argv.includes('--dry');
const db = new DatabaseSync(DB_PATH);

// module → domain 映射（词源对齐现有 domain 词汇表：中医/紫微/易卦/mingli/八字/三式/相术/阳宅/择日/民俗/科仪/命名/数字术数/reference）
const MAP = {
  '中医': [
    'tcm', 'shanghan-lun', 'tcm-fangji', 'tcm-diagnosis', 'nihaisha', 'nihaisha-tcm',
    'yizong-jinjian', 'jingyue', 'bencao-gangmu', 'qianjin', 'tcm-formula', 'huangdi-neijing',
    'mingyi-leian', 'tcm-acupuncture', 'zhubingyuanhou', 'rumen-shiqin', 'tcm-herb',
    'wenbing-tiaobian', 'jiayi-jing', 'maijing', 'wenre-lun', 'nanjing', 'tcm-classical',
    'piwei-lun', 'jinkui-yaolue', 'wenyi-lun', 'yangsheng', 'danxi', 'shennong-bencao',
    'r491_q_fangji', 'r491_q_bianzheng', 'r491_p_bianzheng', 'r491_q_zhenci',
    'r491_p_zhenduan', 'r491_p_fangji',
    'syndrome-engine', 'chronic-disease-engine', 'pulse-engine', 'constitution-engine',
    'drug-safety-engine', 'tongue-inhouse-engine', 'dosage-engine', 'safety-engine',
    'dual-constitution-engine', 'pathway-engine', 'classics-engine', 'classics-engine-formulas',
    'compliance-engine', 'dialogue-engine', 'causality-engine', 'recommend-engine',
    'multimodal-fusion-synthesized', 'tcm-authoritative', 'tcm-clinical',
    'shuihan-tcm', 'qimen/shuihan-tcm',
    'distill_wenzhen_liuqi', 'distill_wenzhen_sitian', 'distill_wenzhen_tiangan', 'distill_wenzhen_zhuanyun'
  ],
  '紫微': ['ziwei', 'case_ziwei', 'distill_yuanfen_ziwei_api', 'distill_yuanfen_ziwei_sihua', 'distill_yuanfen_ziwei_stars'],
  '八字': ['case_bazi'],
  '三式': ['qimen', 'case_qimen', 'case_liuren', 'distill_yuanfen_qimen_api'],
  '易卦': ['case_liuyao', 'case_meihua'],
  '阳宅': ['fengshui', 'case_fengshui'],
  'mingli': ['mingli-cross-moved', 'distill_zhiming_dayun', 'distill_zhiming_kline', 'distill_zhiming_tizheng', 'distill_zhiming_zhuanzhe'],
  'reference': [
    'authoritative', 'shuhan', 'kb-store', 'knowledge-raw', 'knowledge-supplement',
    'kb-supplement', 'master-class', 'wechat-cases', 'mobile', 'shop', 'ai-prompt',
    'vision-system', 'feedback-distill', 'engine_compare', 'r491_r_engine_meta'
  ]
};
// 留 NULL 复核：general/epb-*/distill_wenmo_*/distill_fusion_*/monthly_cure/yanzhi

const upd = db.prepare(`UPDATE kb_formal SET domain=?, updated_at=datetime('now','localtime') WHERE module=? AND (domain IS NULL OR domain='')`);
let total = 0;
const report = [];
if (!dry) db.exec('BEGIN');
for (const [domain, mods] of Object.entries(MAP)) {
  for (const m of mods) {
    const n = db.prepare(`SELECT COUNT(*) n FROM kb_formal WHERE module=? AND (domain IS NULL OR domain='')`).get(m).n;
    if (!n) continue;
    if (!dry) upd.run(domain, m);
    report.push({ domain, module: m, n });
    total += n;
  }
}
if (!dry) db.exec('COMMIT');
console.log((dry ? '[DRY] ' : '') + `domain 回填完成：${total} 条`);
const byDom = {};
for (const r of report) byDom[r.domain] = (byDom[r.domain] || 0) + r.n;
Object.entries(byDom).forEach(([d, n]) => console.log(`  ${d}: ${n}`));
// 复核清单
const remain = db.prepare(`SELECT module, COUNT(*) n FROM kb_formal WHERE domain IS NULL OR domain='' GROUP BY module ORDER BY n DESC`).all();
console.log(`\n仍空 domain（复核清单）：${remain.length} 模块 ${remain.reduce((a, r) => a + r.n, 0)} 条`);
remain.slice(0, 15).forEach(r => console.log(`  ${r.module}: ${r.n}`));
// 验证：整体覆盖率
const cov = db.prepare(`SELECT COUNT(*) n FROM kb_formal WHERE domain IS NOT NULL AND domain!=''`).get();
const all = db.prepare(`SELECT COUNT(*) n FROM kb_formal`).get();
console.log(`\n覆盖率：${cov.n}/${all.n} = ${(cov.n / all.n * 100).toFixed(1)}%`);
