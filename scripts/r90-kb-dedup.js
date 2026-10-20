/* ===== R90 KB 多副本一致性治理 ===== */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const DB_PATH = path.join(__dirname, '..', 'server', 'database', 'yidao.db');

(function main() {
  const db = new DatabaseSync(DB_PATH);
  console.log('[R90] KB 去重开始，时间', new Date().toISOString());
  const before = db.prepare('SELECT COUNT(*) c FROM kb_formal').get().c;
  console.log('[R90] 去重前 kb_formal 总行数:', before);

  // 扫重：同 module + 同 title 的所有行
  const dups = db.prepare(`
    SELECT module, title, COUNT(*) c, GROUP_CONCAT(entry_id) ids, GROUP_CONCAT(entry_id || ':' || COALESCE(hit_count,0)) hcs
    FROM kb_formal GROUP BY module, title HAVING c > 1
  `).all();
  console.log('[R90] 扫到 duplicate groups:', dups.length);

  let deleted = 0;
  const archive = []; // 备份被删的 entry_id
  const dupGroupMap = {}; // module -> {title: count}

  for (const g of dups) {
    // 保留策略：trust_score DESC, hit_count DESC, created_at ASC（最早优先）
    const ids = g.ids.split(',');
    // 详情读
    const rows = db.prepare(`
      SELECT entry_id, trust_score, hit_count, created_at
      FROM kb_formal WHERE module=? AND title=? ORDER BY trust_score DESC, hit_count DESC, created_at ASC
    `).all(g.module, g.title);
    // 第一行保留，其余删除
    const keepId = rows[0].entry_id;
    const dupIds = rows.slice(1).map(r => r.entry_id);
    if (dupIds.length === 0) continue;
    // 真实删除（按 entry_id）
    const placeholders = dupIds.map(() => '?').join(',');
    const del = db.prepare(`DELETE FROM kb_formal WHERE entry_id IN (${placeholders})`).run(...dupIds);
    deleted += del.changes || 0;
    for (const did of dupIds) archive.push({ module: g.module, title: g.title, entry_id: did, keep: keepId });
    dupGroupMap[g.module] = dupGroupMap[g.module] || {};
    dupGroupMap[g.module][g.title] = rows.length;
  }

  // 额外清理 shuhan / r39_dual_core 占位行（"段落分隔9223..."）
  const placeholderDel = db.prepare(`DELETE FROM kb_formal WHERE title LIKE '段落分隔%' OR title LIKE '\n%' OR LENGTH(TRIM(title))<2`).run();
  console.log('[R90] 占位行清理:', placeholderDel.changes || 0);
  deleted += placeholderDel.changes || 0;

  // 写审计记录
  const after = db.prepare('SELECT COUNT(*) c FROM kb_formal').get().c;
  console.log('[R90] 去重后 kb_formal 总行数:', after);
  console.log('[R90] 删除行数:', deleted);

  // 输出治理报告（JSON）
  const report = {
    runAt: new Date().toISOString(),
    before, after,
    deleted,
    dupGroups: dups.length,
    dupGroupMap,
    removedSample: archive.slice(0, 20),
    moduleBreakdown: {}
  };
  // 按模块汇总
  for (const r of archive) {
    report.moduleBreakdown[r.module] = (report.moduleBreakdown[r.module] || 0) + 1;
  }

  const fs = require('node:fs');
  const out = path.join(__dirname, '..', '.openclaw', 'tmp', 'r90-kb-dedup-report.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log('[R90] 报告写入:', out);
  console.log('[R90] DONE');
})();
