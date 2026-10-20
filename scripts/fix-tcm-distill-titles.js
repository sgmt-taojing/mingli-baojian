#!/usr/bin/env node
/**
 * fix-tcm-distill-titles.js — R657 修真脚本
 * 问题：v4 loader 将 messages[0]（system prompt）当 title/content 开头
 * 修复：从 content 中提取真正的 Q/A，重写 title + content + summary
 *
 * 修真范围：kb_formal + kb_staging 中 entry_id LIKE 'KB-%' 且 module IN (19 个蒸馏模块)
 * 策略：
 *   1. 读取所有 184 条记录
 *   2. 从 content 解析真正的 Q 和 A
 *   3. 重写 title = 真正问题前 60 字
 *   4. 重写 content = "Q: 真正问题\n\nA: 真正答案"（无 system prompt）
 *   5. 重写 summary = 真正问题前 80 字
 *   6. FTS5 重建索引
 */
const path = require('path');
const Database = require('better-sqlite3');
const KB_DB = path.resolve(__dirname, '../server/database/yidao.db');

const DISTILL_MODULES = [
  'syndrome-engine', 'chronic-disease-engine', 'pulse-engine', 'classics-engine',
  'constitution-engine', 'drug-safety-engine', 'tongue-inhouse-engine',
  'safety-engine', 'multimodal-fusion-synthesized', 'dosage-engine',
  'compliance-engine', 'recommend-engine', 'pathway-engine',
  'nihaisha-acupuncture', 'nihaisha-shanghanlun', 'dual-constitution-engine',
  'dialogue-engine', 'classics-engine-formulas', 'causality-engine'
];

const db = new Database(KB_DB);
db.pragma('journal_mode = WAL');

// ═══════════════════════════════════════════
// 解析 content，提取真正的 Q 和 A
// ═══════════════════════════════════════════
function parseContent(content) {
  // 格式 1（v4 loader bug）: "Q: <system_prompt>\n...\n最高合规铁律...\nA: <actual_answer>"
  //   其中 system_prompt = "你是中医辅助诊疗智能体..."，实际 Q 隐藏在 system prompt 之后
  // 格式 2（正确 v5）: "Q: <real_question>\n\nA: <real_answer>"

  // 尝试提取 Q: 和 A:
  const qMatch = content.match(/^Q:\s*([\s\S]*?)\n+A:\s*([\s\S]*)$/);
  if (!qMatch) return null;

  let question = qMatch[1].trim();
  let answer = qMatch[2].trim();

  // 检测 system prompt 污染（v4 bug）
  const isSystemPrompt = question.startsWith('你是中医辅助诊疗智能体') ||
                         question.startsWith('最高合规铁律') ||
                         question.includes('依托中医经典知识库');

  if (isSystemPrompt) {
    // system prompt 污染 — 从 JSONL 重新提取
    return { needReload: true, oldContent: content };
  }

  return { question, answer };
}

// ═══════════════════════════════════════════
// 从 JSONL 文件重建（v4 + v5）
// ═══════════════════════════════════════════
function loadJsonlSeeds() {
  const fs = require('fs');
  const files = [
    path.join(__dirname, '../training-data/sft-tcm-engine-distill.jsonl'),
    path.join(__dirname, '../training-data/sft-tcm-engine-distill-v5.jsonl'),
  ];
  const seeds = [];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const lines = fs.readFileSync(f, 'utf-8').split('\n').filter(l => l.trim());
    for (const line of lines) {
      const item = JSON.parse(line);
      // 找 user message（跳过 system）
      const userMsg = item.messages.find(m => m.role === 'user');
      const asstMsg = item.messages.find(m => m.role === 'assistant');
      if (userMsg && asstMsg) {
        seeds.push({
          module: item.module,
          question: userMsg.content,
          answer: asstMsg.content,
        });
      }
    }
  }
  return seeds;
}

// ═══════════════════════════════════════════
// 生成 content MD5 用于匹配
// ═══════════════════════════════════════════
const crypto = require('crypto');
function md5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

// ═══════════════════════════════════════════
// 主修复流程
// ═══════════════════════════════════════════

// 1. 加载 JSONL seeds
console.log('=== 加载 JSONL seeds ===');
const seeds = loadJsonlSeeds();
console.log(`加载 ${seeds.length} 条 seeds`);

// 按模块分组
const seedsByModule = {};
for (const s of seeds) {
  if (!seedsByModule[s.module]) seedsByModule[s.module] = [];
  seedsByModule[s.module].push(s);
}

// 2. 读取 KB 中所有蒸馏条目
const placeholders = DISTILL_MODULES.map(() => '?').join(',');
const rows = db.prepare(`SELECT entry_id, module, title, content, summary FROM kb_formal WHERE module IN (${placeholders}) ORDER BY entry_id`).all(...DISTILL_MODULES);
console.log(`\nKB formal 中蒸馏条目: ${rows.length}`);

// 3. 修复每条记录
const updateStmt = db.prepare(`UPDATE kb_formal SET title = ?, content = ?, summary = ?, updated_at = datetime('now') WHERE entry_id = ?`);
const updateStagingStmt = db.prepare(`UPDATE kb_staging SET title = ?, content = ?, summary = ?, updated_at = datetime('now') WHERE entry_id = ?`);

let fixed = 0, skipped = 0, noSeed = 0;
const moduleIdx = {};

const fixTx = db.transaction(() => {
  for (const row of rows) {
    const parsed = parseContent(row.content);
    if (parsed && !parsed.needReload) {
      // v5 格式正确，跳过
      skipped++;
      continue;
    }

    // v4 bug — 从 seeds 中按模块顺序取下一条
    if (!moduleIdx[row.module]) moduleIdx[row.module] = 0;
    const seedList = seedsByModule[row.module] || [];
    const idx = moduleIdx[row.module]++;
    const seed = seedList[idx];

    if (!seed) {
      console.warn(`  ⚠ ${row.entry_id} [${row.module}] 无匹配 seed (idx=${idx}, seeds=${seedList.length})`);
      noSeed++;
      continue;
    }

    // 重写
    const newTitle = seed.question.slice(0, 60);
    const newContent = `Q: ${seed.question}\n\nA: ${seed.answer}`;
    const newSummary = seed.question.slice(0, 80);

    updateStmt.run(newTitle, newContent, newSummary, row.entry_id);
    // 同步 staging
    try { updateStagingStmt.run(newTitle, newContent, newSummary, row.entry_id); } catch(e) {}

    fixed++;
  }
});

fixTx();

console.log(`\n=== 修真结果 ===`);
console.log(`  修复: ${fixed}`);
console.log(`  跳过(v5 已正确): ${skipped}`);
console.log(`  无 seed: ${noSeed}`);
console.log(`  总计: ${rows.length}`);

// 4. 重建 FTS5 索引
console.log('\n=== 重建 FTS5 索引 ===');
try {
  db.exec('INSERT INTO kb_fts5(kb_fts5) VALUES(\'rebuild\')');
  console.log('✅ FTS5 重建完成');
} catch (e) {
  console.error(`FTS5 rebuild 失败: ${e.message}`);
  // 手动重建
  try {
    db.exec('DELETE FROM kb_fts5');
    const insertFts = db.prepare(`INSERT INTO kb_fts5(entry_id, module, title, content) VALUES (?, ?, ?, ?)`);
    const allRows = db.prepare(`SELECT entry_id, module, title, content FROM kb_formal`).all();
    const ftsTx = db.transaction(() => {
      for (const r of allRows) {
        insertFts.run(r.entry_id, r.module, r.title, r.content);
      }
    });
    ftsTx();
    console.log(`✅ 手动重建 ${allRows.length} 条`);
  } catch (e2) {
    console.error(`手动重建也失败: ${e2.message}`);
  }
}

// 5. 验证
console.log('\n=== 验证修复 ===');
const samples = db.prepare(`SELECT entry_id, module, substr(title, 1, 50) AS title, substr(content, 1, 80) AS content_snippet FROM kb_formal WHERE module = ? LIMIT 5`).all('syndrome-engine');
for (const s of samples) {
  console.log(`  ${s.entry_id} [${s.module}]`);
  console.log(`    title: ${s.title}`);
  console.log(`    content: ${s.content_snippet}`);
}

db.close();
console.log('\n✅ 修真完成');
