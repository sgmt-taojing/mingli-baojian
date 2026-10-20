#!/usr/bin/env node
/**
 * R26-A2: FTS5 vs LIKE Benchmark
 *
 * Measures three search modes against kb_formal (12,626 entries):
 *   A) LIKE baseline        — `content LIKE '%term%'`
 *   B) FTS5 MATCH           — `kb_fts5 MATCH 'term'`
 *   C) FTS5 + BM25 ranked   — `ORDER BY bm25(kb_fts5)`
 *
 * Metrics per mode:
 *   - P50 / P95 latency (microseconds → milliseconds)
 *   - Hit-rate: % of queries where ≥1 result is returned in top-10
 *   - Recall@10 vs LIKE ground-truth (for FTS modes only)
 *
 * Output: scripts/r26-a2-fts5-results.json
 */
'use strict';

const { DatabaseSync } = require('node:sqlite');
const { writeFileSync, existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const DB_PATH = join(__dirname, '..', 'server', 'database', 'yidao.db');
const OUT_PATH = join(__dirname, 'r26-a2-fts5-results.json');
const ROUNDS = 3;        // repeat to get stable percentiles
const TOP_N = 10;        // top-N for hit-rate evaluation

// ── 1. BUILD QUERY SET ────────────────────────────────────────────
// Real queries from kb_hit_log (14 unique → 14 queries)
const HISTORICAL_QUERIES = [
  '化解', '八字', '五行', '面相', '流年', '大运',
  '健康', '事业', '空亡', '十神', '财星', '偏印',
  '正官', '七杀',
];

// Domain-realistic queries derived from module names + common terms
const DOMAIN_QUERIES = [
  // bazi
  '日主', '月令', '格局', '用神', '伤官', '食神', '劫财', '比肩',
  '正财', '偏财', '正印', '偏官', '藏干', '羊刃', '桃花',
  // ziwei
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴',
  '贪狼', '巨门', '天相', '天梁', '七杀', '破军', '左辅', '右弼',
  // qimen
  '奇门', '遁甲', '九星', '八门', '值符', '腾蛇', '太阴', '六合',
  // tcm
  '伤寒', '桂枝', '麻黄', '芍药', '经络', '穴位', '针灸', '方剂',
  '黄芩', '黄连', '人参', '当归', '茯苓', '白术', '甘草',
  // fengshui
  '风水', '罗盘', '八卦', '方位', '青龙', '白虎', '朱雀', '玄武',
  // yijing / meihua / liuyao / liuren
  '易经', '卦象', '乾卦', '坤卦', '梅花', '六爻', '六壬',
  // zodiac / huangli / zeri
  '生肖', '黄历', '择日', '太岁',
  // mantra / faith
  '心经', '金刚经', '楞严咒', '大悲咒',
  // r39 / r45 series
  '人生规划', '职业发展', '婚姻', '财运', '迁移',
  // compound queries (closer to real user input)
  '八字看婚姻', '紫微斗数事业', '伤寒论方剂', '奇门遁甲预测',
  '风水布局', '六爻占卜', '面相分析', '五行健康',
  '流年运势', '财运方位',
];

// Long-tail natural-language queries (simulating AI-assistant input)
const NATURAL_QUERIES = [
  '我的八字适合什么行业', '紫微斗数怎么看事业宫', '伤寒论怎么治感冒',
  '奇门遁甲能预测什么', '家里风水怎么布置', '六爻怎么起卦',
  '面相怎么看财运', '五行缺水怎么办', '流年不利怎么化解',
  '太岁年要注意什么', '什么时辰出生最好', '经络不通怎么调理',
  '针灸能治什么病', '黄芩汤主治什么', '梅花易数怎么断卦',
];

const ALL_QUERIES = [...HISTORICAL_QUERIES, ...DOMAIN_QUERIES, ...NATURAL_QUERIES];
console.log(`[R26-A2] Query set: ${ALL_QUERIES.length} queries`);

// ── 2. OPEN DB ─────────────────────────────────────────────────────
const db = new DatabaseSync(DB_PATH, { readOnly: true });
db.exec('PRAGMA journal_mode = WAL');

// Verify FTS5 exists
const ftsExists = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='kb_fts5'"
).get();
if (!ftsExists) {
  console.error('[R26-A2] FATAL: kb_fts5 table does not exist. Aborting.');
  process.exit(1);
}
console.log('[R26-A2] kb_fts5 confirmed present');

// ── 3. PREPARE STATEMENTS ──────────────────────────────────────────

// Mode A: LIKE baseline
const stmtLike = db.prepare(`
  SELECT entry_id, module, title
  FROM kb_formal
  WHERE content LIKE '%' || ? || '%' OR title LIKE '%' || ? || '%'
  LIMIT ${TOP_N}
`);

// Mode B: FTS5 MATCH (no BM25 ranking, natural rowid order)
const stmtFtsMatch = db.prepare(`
  SELECT f.entry_id, f.module, f.title
  FROM kb_fts5
  JOIN kb_formal f ON f.entry_id = kb_fts5.entry_id
  WHERE kb_fts5 MATCH ?
  LIMIT ${TOP_N}
`);

// Mode C: FTS5 + BM25 ranked
const stmtFtsBm25 = db.prepare(`
  SELECT f.entry_id, f.module, f.title, bm25(kb_fts5) as score
  FROM kb_fts5
  JOIN kb_formal f ON f.entry_id = kb_fts5.entry_id
  WHERE kb_fts5 MATCH ?
  ORDER BY bm25(kb_fts5)
  LIMIT ${TOP_N}
`);

// ── 4. HELPERS ─────────────────────────────────────────────────────

/** Convert user query → FTS5 MATCH syntax (split tokens with OR) */
function toFtsQuery(q) {
  // For single-keyword queries, use as-is
  // For multi-token, use OR to maximize recall
  const cleaned = q.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
  if (!cleaned) return q;
  const tokens = cleaned.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length <= 1) return cleaned;
  return tokens.map(t => `"${t}"`).join(' OR ');
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function runMode(label, stmt, paramFn, isFts) {
  const latencies = [];
  const hitCounts = [];
  const resultSets = [];

  for (let round = 0; round < ROUNDS; round++) {
    for (const q of ALL_QUERIES) {
      const params = paramFn(q);
      const t0 = process.hrtime.bigint();
      let rows;
      try {
        rows = stmt.all(...params);
      } catch (e) {
        rows = [];
      }
      const t1 = process.hrtime.bigint();
      const us = Number(t1 - t0) / 1000; // microseconds
      latencies.push(us);
      hitCounts.push(rows.length);
      if (round === 0) resultSets.push({ query: q, count: rows.length, entry_ids: rows.map(r => r.entry_id).slice(0, TOP_N) });
    }
  }

  const latenciesMs = latencies.map(u => u / 1000);
  const hitRate = hitCounts.filter(c => c > 0).length / hitCounts.length;
  const avgHits = hitCounts.reduce((a, b) => a + b, 0) / hitCounts.length;

  return {
    mode: label,
    p50_ms: +percentile(latenciesMs, 50).toFixed(3),
    p95_ms: +percentile(latenciesMs, 95).toFixed(3),
    mean_ms: +(latenciesMs.reduce((a, b) => a + b, 0) / latenciesMs.length).toFixed(3),
    min_ms: +Math.min(...latenciesMs).toFixed(3),
    max_ms: +Math.max(...latenciesMs).toFixed(3),
    hit_rate: +hitRate.toFixed(4),
    avg_hits_per_query: +avgHits.toFixed(2),
    total_runs: latencies.length,
    sample_results: resultSets.slice(0, 10),
  };
}

// ── 5. RUN BENCHMARK ───────────────────────────────────────────────
console.log('\n[R26-A2] Starting benchmark: %d queries × %d rounds = %d runs per mode\n',
  ALL_QUERIES.length, ROUNDS, ALL_QUERIES.length * ROUNDS);

// Warmup (1 pass, not measured)
console.log('[R26-A2] Warmup pass...');
for (const q of ALL_QUERIES.slice(0, 10)) {
  try { stmtLike.all(q, q); } catch {}
  try { stmtFtsMatch.all(toFtsQuery(q)); } catch {}
  try { stmtFtsBm25.all(toFtsQuery(q)); } catch {}
}

console.log('[R26-A2] Mode A: LIKE baseline...');
const resultLike = runMode(
  'LIKE_baseline',
  stmtLike,
  (q) => [q, q],
  false
);
console.log('[R26-A2]   P50=%.2fms  P95=%.2fms  hit=%.1f%%',
  resultLike.p50_ms, resultLike.p95_ms, resultLike.hit_rate * 100);

console.log('[R26-A2] Mode B: FTS5 MATCH...');
const resultFtsMatch = runMode(
  'FTS5_MATCH',
  stmtFtsMatch,
  (q) => [toFtsQuery(q)],
  true
);
console.log('[R26-A2]   P50=%.2fms  P95=%.2fms  hit=%.1f%%',
  resultFtsMatch.p50_ms, resultFtsMatch.p95_ms, resultFtsMatch.hit_rate * 100);

console.log('[R26-A2] Mode C: FTS5 + BM25...');
const resultFtsBm25 = runMode(
  'FTS5_BM25',
  stmtFtsBm25,
  (q) => [toFtsQuery(q)],
  true
);
console.log('[R26-A2]   P50=%.2fms  P95=%.2fms  hit=%.1f%%',
  resultFtsBm25.p50_ms, resultFtsBm25.p95_ms, resultFtsBm25.hit_rate * 100);

// ── 6. RECALL ANALYSIS (FTS vs LIKE ground truth) ─────────────────
console.log('\n[R26-A2] Computing recall@10 vs LIKE ground-truth...');
let ftsMatchRecallSum = 0, ftsBm25RecallSum = 0, recallCount = 0;
for (const q of ALL_QUERIES) {
  const likeRows = stmtLike.all(q, q).map(r => r.entry_id);
  const likeSet = new Set(likeRows);
  if (likeSet.size === 0) continue; // no ground truth for this query

  const ftsQ = toFtsQuery(q);
  let ftsRows = [];
  try { ftsRows = stmtFtsMatch.all(ftsQ).map(r => r.entry_id); } catch {}
  let bm25Rows = [];
  try { bm25Rows = stmtFtsBm25.all(ftsQ).map(r => r.entry_id); } catch {}

  const matchOverlap = ftsRows.filter(id => likeSet.has(id)).length;
  const bm25Overlap = bm25Rows.filter(id => likeSet.has(id)).length;

  ftsMatchRecallSum += matchOverlap / Math.min(likeSet.size, TOP_N);
  ftsBm25RecallSum  += bm25Overlap / Math.min(likeSet.size, TOP_N);
  recallCount++;
}
const ftsMatchRecall = recallCount > 0 ? ftsMatchRecallSum / recallCount : 0;
const ftsBm25Recall  = recallCount > 0 ? ftsBm25RecallSum / recallCount : 0;
console.log('[R26-A2] Recall@10 — FTS5_MATCH: %.2f%%  FTS5_BM25: %.2f%% (n=%d)',
  ftsMatchRecall * 100, ftsBm25Recall * 100, recallCount);

// ── 7. COMPOSE REPORT ─────────────────────────────────────────────
const speedupP50 = resultLike.p50_ms / resultFtsBm25.p50_ms;
const speedupP95 = resultLike.p95_ms / resultFtsBm25.p95_ms;

const report = {
  benchmark: 'R26-A2: FTS5 Hit-Rate & Latency Benchmark',
  timestamp: new Date().toISOString(),
  db_path: DB_PATH,
  kb_total_entries: 12626,
  fts5_total_entries: 12626,
  query_count: ALL_QUERIES.length,
  rounds: ROUNDS,
  total_runs_per_mode: ALL_QUERIES.length * ROUNDS,
  top_n: TOP_N,
  modes: {
    like_baseline: resultLike,
    fts5_match: resultFtsMatch,
    fts5_bm25: resultFtsBm25,
  },
  recall: {
    note: 'Recall@10 = overlap of FTS top-10 with LIKE top-10 (ground truth = LIKE matches)',
    fts5_match_recall: +ftsMatchRecall.toFixed(4),
    fts5_bm25_recall: +ftsBm25Recall.toFixed(4),
    evaluated_queries: recallCount,
  },
  speedup: {
    fts5_bm25_vs_like_p50: +speedupP50.toFixed(2) + 'x',
    fts5_bm25_vs_like_p95: +speedupP95.toFixed(2) + 'x',
  },
  verdict: speedupP50 >= 2 && resultFtsBm25.hit_rate >= 0.5
    ? 'PASS: FTS5 BM25 is ≥2x faster than LIKE with ≥50% hit-rate. Enable in AI-assistant main path.'
    : speedupP50 >= 2
    ? 'PARTIAL: FTS5 is faster but hit-rate is low. Consider query preprocessing.'
    : 'FAIL: FTS5 does not provide sufficient speedup. Consider keeping LIKE.',
};

writeFileSync(OUT_PATH, JSON.stringify(report, null, 2));
console.log('\n[R26-A2] Results written to', OUT_PATH);
console.log('[R26-A2] Verdict:', report.verdict);
console.log('[R26-A2] Speedup P50: %s  P95: %s', report.speedup.fts5_bm25_vs_like_p50, report.speedup.fts5_bm25_vs_like_p95);

db.close();
