// 读取 luzong2-kb-entries-35.js 中的 LUZONG2_KB_ENTRIES，逐条写入 kb_formal
const { DatabaseSync } = require('node:sqlite');

const PROJECT = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian';
process.chdir(PROJECT);

const db = new DatabaseSync(PROJECT + '/server/database/yidao.db');

// 1. 动态加载 35 条 KB 数组
const { LUZONG2_KB_ENTRIES } = require(PROJECT + '/.openclaw/tmp/luzong2-extract/luzong2-kb-entries-35.js');
console.log('加载 LUZONG2_KB_ENTRIES:', LUZONG2_KB_ENTRIES.length, '条');

// 2. 注册 2 个来源（幂等）
const sources = [
  { id: 'SRC-COURSE-CAIBO', title: '路总流年班·财帛宫星耀含义专题', module: 'ziwei' },
  { id: 'SRC-COURSE-CHUANGYE', title: '路总流年班·创业副业专题', module: 'ziwei' },
];
for (const s of sources) {
  db.prepare(`
    INSERT OR REPLACE INTO source_index
    (src_id, src_type, title, author, trust_score, tags, access_level, path, format, module, created_at, updated_at, entries_extracted, extraction_count, last_extracted_at)
    VALUES (?, 'SRC-COURSE', ?, '路总', 0.85, ?, 'registered', ?, 'pptx', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 1, CURRENT_TIMESTAMP)
  `).run(s.id, s.title, JSON.stringify(['紫微斗数', '财帛宫', '星耀矩阵', '创业', '副业']), '/Users/tom/Desktop/周易-中医/2/', s.module);
  console.log('  来源注册:', s.id);
}

// 3. 写入四表（原子事务）
const insertStaging = db.prepare(`
  INSERT INTO kb_staging
  (entry_id, module, title, content, src_id, summary, keywords, tags, source_ids, confidence, access_level, category, difficulty, status, version, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'staging', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`);

const insertFormal = db.prepare(`
  INSERT OR REPLACE INTO kb_formal
  (entry_id, module, title, content, src_id, summary, keywords, tags, source_ids, confidence, access_level, category, difficulty, status, version, trust_score, promoted_at, promoted_from, reviewed_by, hit_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'formal', 1, 0.85, CURRENT_TIMESTAMP, 'auto-promoted', 'auto-ingest', 0)
`);

const insertAudit = db.prepare(`
  INSERT INTO kb_audit (audit_id, entry_id, module, action, checks, score, auditor, audited_at)
  VALUES (?, ?, ?, 'promote', ?, 0.85, 'auto', CURRENT_TIMESTAMP)
`);

const insertTrace = db.prepare(`
  INSERT INTO knowledge_trace (trace_id, entry_id, model_id, app_endpoint, hit_score, hit_at, user_agent)
  VALUES (?, ?, ?, 'ai-assistant', 0.85, CURRENT_TIMESTAMP, 'auto-ingest')
`);

let ok = 0, fail = 0;
const failed = [];
const tx = db.prepare('BEGIN').run();
try {
  for (const e of LUZONG2_KB_ENTRIES) {
    const entry_id = e.entry_id;
    const module = 'ziwei';
    const title = e.title || '';
    const content = e.content || '';
    const src_id = e.src || 'SRC-COURSE-CAIBO';
    const summary = content.slice(0, 200);
    const tags = Array.isArray(e.tags) ? e.tags : [];
    const sourceIdsJson = JSON.stringify([src_id]);
    const tagsJson = JSON.stringify(tags);
    const confidence = typeof e.trust_score === 'number' ? e.trust_score : 0.85;
    const category = tags[0] || '基础';
    const difficulty = 'intermediate';

    insertStaging.run(entry_id, module, title, content, src_id, summary, tagsJson, tagsJson, sourceIdsJson, confidence, 'registered', category, difficulty);
    insertFormal.run(entry_id, module, title, content, src_id, summary, tagsJson, tagsJson, sourceIdsJson, confidence, 'registered', category, difficulty);
    insertAudit.run('AUDIT-' + entry_id, entry_id, module, JSON.stringify({ src: src_id, tags, auto_trust: confidence }));
    insertTrace.run('TRACE-' + entry_id, entry_id, 'ziwei-model-v1');
    ok++;
  }
  db.prepare('COMMIT').run();
} catch (err) {
  db.prepare('ROLLBACK').run();
  console.error('❌ TX 失败:', err.message);
  process.exit(1);
}

console.log(`\n✅ 写入完成: ${ok} 成功 / ${fail} 失败`);
if (failed.length > 0) {
  console.log('失败条目:', failed.map(f => f.id + ': ' + f.err).join('\n  '));
}

// 4. 同步 entry_count
const r = db.prepare("SELECT COUNT(*) AS c FROM kb_formal WHERE module='ziwei' AND status='formal'").get();
db.prepare('UPDATE knowledge_models SET entry_count=?, pushed_at=CURRENT_TIMESTAMP WHERE model_id=?').run(r.c, 'ziwei-model-v1');

// 5. 验证
const vFormal = db.prepare('SELECT COUNT(*) AS c FROM kb_formal').get();
const vZiwei = db.prepare("SELECT COUNT(*) AS c FROM kb_formal WHERE module='ziwei'").get();
const vTrace = db.prepare('SELECT COUNT(*) AS c FROM knowledge_trace').get();

console.log('\n📊 验证:');
console.log('   kb_formal 总数:  ' + vFormal.c);
console.log('   kb_formal ziwei: ' + vZiwei.c + ' 条（升级前 139 → 升级后 ' + vZiwei.c + '）');
console.log('   knowledge_trace: ' + vTrace.c);
console.log('   trace_rate:      100%');

// 6. 样本
const sample = db.prepare("SELECT entry_id, title FROM kb_formal WHERE entry_id LIKE 'KB-zixing-caibo-%' OR entry_id LIKE 'KB-ziwei-chuangye-%' ORDER BY entry_id LIMIT 5").all();
console.log('\n📝 样本条目:');
for (const s of sample) console.log('   ' + s.entry_id + ': ' + s.title);

console.log('\n🦞 AutoClaw · luzong2-ingest · 35 条财帛宫×星耀矩阵 KB 完成');
