#!/usr/bin/env node
/**
 * v4 distill — proper load with source_index FK satisfied
 */
const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '../training-data/sft-tcm-engine-distill.jsonl');
const KB_STAGING = path.resolve(__dirname, '../server/database/yidao.db');

const FORBIDDEN_TAGS = [
    '确诊', '诊断为', '诊断疾病', '可以治愈', '一定能治', '包治',
    '绝对有效', '根治', '无副作用', '祖传秘方', '神药',
    '无证配方', '包治百病'
];

const lines = fs.readFileSync(INPUT, 'utf-8').split('\n').filter(l => l.trim());
console.log(`Input lines: ${lines.length}`);

let pass = 0, fail = 0;
const issues = [];
for (let i = 0; i < lines.length; i++) {
    const d = JSON.parse(lines[i]);
    const asst = d.messages.find(m => m.role === 'assistant');
    const text = asst ? asst.content : '';
    let bad = null;
    for (const tag of FORBIDDEN_TAGS) {
        if (text.includes(tag)) { bad = tag; break; }
    }
    if (bad) { fail++; issues.push({ idx: i + 1, module: d.module, tag: bad }); }
    else pass++;
}
console.log(`Compliance: ${pass}/${lines.length} pass, ${fail} fail`);
if (issues.length) for (const x of issues.slice(0, 5)) console.log(`  [#${x.idx}] [${x.module}] "${x.tag}"`);

const CHATML_OUT = path.join(__dirname, '../training-data/mingli_sft_v4_tcm_engines.json');
const chatml = lines.map(line => JSON.parse(line));
fs.writeFileSync(CHATML_OUT, JSON.stringify(chatml, null, 2));
console.log(`ChatML → ${CHATML_OUT}: ${chatml.length} pairs`);

const Database = require('better-sqlite3');
const db = new Database(KB_STAGING);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ═══════════════════════════════════════════
// Step 1: Register source in source_index (one per module)
// ═══════════════════════════════════════════
const MODULES = [...new Set(chatml.map(p => p.module))];
console.log(`\nRegistering ${MODULES.length} sources...`);

const srcStmt = db.prepare(`INSERT OR IGNORE INTO source_index 
    (src_id, src_type, title, author, url, publisher, publish_date, trust_score, tags, module, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`);

for (const m of MODULES) {
    const srcId = `SRC-TCM-AGENT-DISTILL-V4-${m}`;
    srcStmt.run(
        srcId,
        'distill-engine',
        `TCM Agent Engine Distill V4 — ${m}`,
        'tcm-agent project',
        'https://internal/tcm-agent/distill-v4',
        'tcm-agent internal',
        '2026-08-09',
        0.80,
        `tcm,distill,${m}`,
        'tcm'
    );
}

// ═══════════════════════════════════════════
// Step 2: Insert into kb_staging
// ═══════════════════════════════════════════
console.log(`\nLoading ${chatml.length} entries...`);

const entryId = 1;
const maxRow = db.prepare('SELECT MAX(CAST(SUBSTR(entry_id, 4) AS INTEGER)) AS m FROM kb_staging WHERE entry_id LIKE ?').get('KB-%');
let seq = (maxRow?.m || 0) + 1;

const insStmt = db.prepare(`INSERT INTO kb_staging 
    (entry_id, module, title, content, src_id, category, keywords, summary, status, confidence, access_level, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`);

let loaded = 0;
const tx = db.transaction(() => {
    for (const pair of chatml) {
        const user = pair.messages.find(m => m.role === 'user');
        const asst = pair.messages.find(m => m.role === 'assistant');
        if (!user || !asst) continue;
        
        const eid = `KB-tcm-${String(seq++).padStart(5, '0')}`;
        const srcId = `SRC-TCM-AGENT-DISTILL-V4-${pair.module}`;
        const title = user.content.substring(0, 80);
        const content = `Q: ${user.content}\n\nA: ${asst.content}`;
        const keywords = JSON.stringify(['tcm', 'distill', pair.module]);
        const summary = asst.content.substring(0, 120);
        
        insStmt.run(
            eid, 'tcm', title, content, srcId,
            `engine-distill/${pair.module}`,
            keywords, summary,
            'pending', 0.80, 'registered'
        );
        loaded++;
    }
});
tx();

const stagingCount = db.prepare("SELECT COUNT(*) AS c FROM kb_staging WHERE src_id LIKE 'SRC-TCM-AGENT-DISTILL-V4-%'").get();
console.log(`✅ Loaded ${loaded} → kb_staging distill-v4 entries: ${stagingCount.c}`);

const srcCount = db.prepare("SELECT COUNT(*) AS c FROM source_index WHERE src_id LIKE 'SRC-TCM-AGENT-DISTILL-V4-%'").get();
console.log(`✅ source_index entries: ${srcCount.c}`);

db.close();
console.log(`\n✅ DONE: ${pass}/${lines.length} compliance pass, ${chatml.length} pairs ChatML, ${loaded} entries KB staging`);