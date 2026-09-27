#!/usr/bin/env node

// ═══ LEGACY-INGEST-GUARD (R-INGEST-SPEC-20260927) ═══
// 一次性历史脚本，入库口径已过时。新口径见 scripts/lib/kb_ingest.py。
// 确需原样重跑：ALLOW_LEGACY_INGEST=1 node <本脚本>
if (process.env.ALLOW_LEGACY_INGEST !== '1') {
  console.error('⛔ 旧口径入库脚本已禁用（R-INGEST-SPEC-20260927 防 KB 污染）。确需重跑请设 ALLOW_LEGACY_INGEST=1');
  process.exit(2);
}
// ═══ END GUARD ═══

/**
 * R491 Worker R — 排盘引擎元数据 KB 播种
 * ============================================================
 * 基于 server/engine-capabilities.json（7 引擎能力清单，单一事实源），
 * 生成「排盘引擎元数据」条目写入 kb_formal：
 *   - module:      r491_r_engine_meta
 *   - category:    "排盘引擎元数据"
 *   - trust_score: 0.95（自有元数据，非蒸馏外部）
 * 每引擎 10 条 × 7 引擎 = 70 条（≥ 50 达标）
 *
 * 硬约束：不爬虫、不蒸馏外部模型；仅整理自有 7 引擎的内部元数据。
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.join(__dirname, '..');
const CAPS_PATH = path.join(ROOT, 'server', 'engine-capabilities.json');
const DB_PATH = path.join(ROOT, 'server', 'database', 'yidao.db');

const MODULE = 'r491_r_engine_meta';
const CATEGORY = '排盘引擎元数据';
const TRUST = 0.95;

function loadCapabilities() {
  const raw = JSON.parse(fs.readFileSync(CAPS_PATH, 'utf8'));
  return raw.engines;
}

/**
 * 每条目包含：引擎名、算法版本、理论依据、主流派、倪师评价、合规等级
 */
function buildEntries(engine, id) {
  const E = (title, content, extraTags) => ({
    title,
    content: [
      `【引擎】${engine.name}（${id}）`,
      `【算法版本】${engine.algorithmVersion}`,
      `【理论依据】${engine.theoryBasis}`,
      `【主流派】${engine.schools.join('；')}`,
      `【倪师评价】${engine.niShiComment}`,
      `【合规等级】${engine.compliance.level}（红线：${engine.compliance.redLines.join('；')}）`,
      content,
      `本条目为自有排盘引擎元数据（trust_score 0.95），仅供传统文化研究与自我认知参考，不构成对命运、健康、婚姻、财富的预言或保证。`,
    ].join('\n'),
    tags: ['r491', '引擎元数据', engine.name, ...(extraTags || [])],
  });

  const entries = [
    E('引擎总览', `【模块入口】${engine.module}\n【统一入口】${engine.entryPoint}\n【调度优先级】${engine.scheduling.priority}（用途：${engine.scheduling.useCases.join('、')}）\n【典型时延】${engine.scheduling.latency}`, ['总览']),
    E('输入字段规范', `【输入字段】${engine.inputFields.map(f => `${f.name}(${f.type}${f.required ? '' : ',可选'})：${f.desc}${f.default !== undefined ? `，默认 ${f.default}` : ''}`).join('\n')}`, ['输入字段']),
    E('输出字段规范', `【输出字段】${engine.outputFields.map(f => `${f.name}(${f.type})：${f.desc}`).join('\n')}`, ['输出字段']),
    E('流年/大限/小限支持', `【流年】${engine.flowSupport.liuNian ? '支持' : '不支持'}\n【大限】${engine.flowSupport.daXian ? '支持' : '不支持'}\n【小限】${engine.flowSupport.xiaoXian ? '支持' : '不支持'}`, ['流年', '大限', '小限']),
    E('SVG 输出能力', `【SVG 支持】${engine.svg.supported ? '支持' : '不支持'}\n【渲染器】${engine.svg.renderer}\n【说明】${engine.svg.notes}`, ['SVG']),
    E('理论依据与算法版本', `【算法版本】${engine.algorithmVersion}\n【理论依据】${engine.theoryBasis}`, ['理论依据']),
    E('主流派与师承脉络', `【主流派】${engine.schools.join('；')}`, ['流派']),
    E('倪师评价', `【倪师评价】${engine.niShiComment}`, ['倪师']),
    E('合规等级与红线', `【合规等级】${engine.compliance.level}\n【免责声明】${engine.compliance.disclaimer}\n【红线】${engine.compliance.redLines.join('；')}`, ['合规']),
    E('调度建议', `【调度优先级】${engine.scheduling.priority}\n【适用场景】${engine.scheduling.useCases.join('、')}\n【时延预期】${engine.scheduling.latency}\n本条目供 closed-loop-advisor 自动调度与 divination-hub 能力展示消费。`, ['调度']),
  ];
  return entries;
}

function main() {
  const engines = loadCapabilities();
  const engineIds = Object.keys(engines);
  console.log(`加载能力清单：${engineIds.length} 个引擎`);

  const db = new DatabaseSync(DB_PATH);

  // 清理旧批次（幂等：重复执行不叠加）
  const removed = db.prepare(`DELETE FROM kb_formal WHERE module = ?`).run(MODULE);
  console.log(`清理旧条目：${removed.changes} 条`);

  const insert = db.prepare(`
    INSERT INTO kb_formal
    (entry_id, module, title, content, src_id, category, keywords, summary, trust_score,
     version, promoted_at, promoted_from, reviewed_by, hit_count, tags, source_ids,
     confidence, access_level, difficulty, status, created_at, updated_at, audit_status, audit_by, audit_at, fingerprint)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'r491-auto', 'R491-Worker-R', 0,
            ?, ?, 0.95, 'public', '📘 引擎元数据', 'formal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
            'approved', 'r491-auto', CURRENT_TIMESTAMP, ?)
  `);

  let inserted = 0;
  let skipped = 0;

  for (const id of engineIds) {
    const engine = engines[id];
    const entries = buildEntries(engine, id);
    entries.forEach((e, i) => {
      const entryId = `r491-meta-${id}-${String(i + 1).padStart(2, '0')}`;
      const summary = `${engine.name}：${e.title}`;
      const tagsJson = JSON.stringify(e.tags);
      const sourceIdsJson = JSON.stringify([`自有引擎 ${engine.module} (R474 修真)`]);
      const fp = crypto.createHash('md5').update(MODULE + '|' + e.title + '|' + engine.name).digest('hex').slice(0, 16);

      try {
        insert.run(
          entryId, MODULE, e.title, e.content, `SRC-ENGINE-${id.toUpperCase()}`,
          CATEGORY, `${engine.name} ${e.tags.join(' ')}`, summary, TRUST, 'v1',
          tagsJson, sourceIdsJson, fp
        );
        inserted++;
      } catch (err) {
        if (String(err.message || '').includes('UNIQUE')) { skipped++; }
        else { console.error(`插入失败 ${entryId}: ${err.message}`); }
      }
    });
  }

  const total = db.prepare(`SELECT COUNT(*) c FROM kb_formal WHERE module = ?`).get(MODULE);
  console.log(`完成：插入 ${inserted} 条，跳过 ${skipped} 条，库内总计 ${total.c} 条（module=${MODULE}）`);
  db.close();
}

main();
