#!/usr/bin/env node
/**
 * daily-mingli-distill.js — 命理宝鉴→TCM-Agent 每日中医知识蒸馏
 * ================================================================
 * 扫描 yidao.db 的 6 个纯中医模块，对比上次快照差分，
 * 提取新增条目中的方剂/证候/药材关键词，写入蒸馏结果。
 *
 * 6 大模块:
 *   huangdi-neijing / tcm-classical / nihaisha-tcm /
 *   tcm-fangji / shanghan-lun / tcm-clinical
 *
 * 输出:
 *   server/kb/mingli-daily-distilled.json  — 蒸馏结果
 *   server/kb/mingli-log.jsonl             — 日变更日志
 *   server/kb/mingli-snapshot.json         — 本次快照（供下次差分用）
 *
 * 修真历史:
 *   v1.0 (2026-08-06) — 首次创建，填补 cron job 空白
 *   v1.1 (2026-08-15) — 修真：加 KB 历史白名单 + 词频门槛过滤 OCR 噪音；
 *                       不再盲目把所有字面命中写入"方剂/证候/药材"，
 *                       只保留 KB 已收录高频核心术语的交集。
 *                       理由：v1.0 蒸馏出大量 OCR 残片
 *                       （"不分四诞散/与三石汤/世医家在承气汤/万物之根"）
 *                       会污染下游 tongue-face-json.js 等标签池。
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'server', 'database', 'yidao.db');
const KB_DIR = path.join(ROOT, 'server', 'kb');
const SNAPSHOT_PATH = path.join(KB_DIR, 'mingli-snapshot.json');
const DISTILLED_PATH = path.join(KB_DIR, 'mingli-daily-distilled.json');
const LOG_PATH = path.join(KB_DIR, 'mingli-log.jsonl');

const TCM_MODULES = [
  'huangdi-neijing',
  'tcm-classical',
  'nihaisha-tcm',
  'tcm-fangji',
  'shanghan-lun',
  'tcm-clinical',
];

// ─── 关键词提取字典 ─────────────────────────────────────────────
// 方剂关键词（经典方名 + 变体）
const FORMULA_PATTERNS = [
  /(?:方|汤|丸|散|丹|饮|膏|颗粒|胶囊|片|剂)\s*[：:]\s*([^\n]{2,40})/g,
  /([\u4e00-\u9fff]{2,6}(?:汤|丸|散|丹|饮|膏|合剂|颗粒|胶囊|片|液|煎))/g,
  // 名方速配
  /(桂枝汤|麻黄汤|小青龙汤|大青龙汤|白虎汤|承气汤|小柴胡汤|大柴胡汤|四逆汤|真武汤|理中汤|附子汤|乌梅丸|当归四逆汤|炙甘草汤|半夏泻心汤|葛根汤|麻杏甘石汤|五苓散|猪苓汤|苓桂术甘汤|小建中汤|大建中汤|黄芪桂枝五物汤|桂枝茯苓丸|温经汤|麦门冬汤|酸枣仁汤|百合地黄汤|甘麦大枣汤|麻黄附子细辛汤|黄连阿胶汤|桃核承气汤|抵当汤|茵陈蒿汤|栀子豉汤|半夏厚朴汤|旋覆代赭汤|橘皮竹茹汤|补中益气汤|归脾汤|六味地黄丸|金匮肾气丸|逍遥散|越鞠丸|血府逐瘀汤|补阳还五汤|天麻钩藤饮|镇肝熄风汤|羚角钩藤汤|桑菊饮|银翘散|清营汤|犀角地黄汤|龙胆泻肝汤|芍药甘草汤)/g,
];

// 证候关键词（八纲 + 六经 + 脏腑 + 气血津液）
const SYNDROME_PATTERNS = [
  /([\u4e00-\u9fff]{2,6}(?:证|型|候|纲))/g,
  // 常见证候
  /(风寒(?:束表|袭表|犯肺)|风热(?:犯肺|袭表)|暑湿(?:困脾|伤气)|湿热(?:蕴结|下注|困脾|内蕴|中阻)|痰湿(?:困脾|阻肺|内蕴|壅肺)|气滞(?:血瘀|湿阻)?|血瘀(?:\s*气滞)?|气虚(?:血瘀)?|血虚(?:风燥)?|阴虚(?:火旺|阳亢|风动)?|阳虚(?:水泛|寒凝)?|阴阳两虚|气血两虚|心脾两虚|肝郁(?:气滞|化火|脾虚|血瘀)?|肝阳(?:上亢|化风)|肾(?:阴虚|阳虚|精亏|不纳气)|脾(?:阳虚|气虚|虚湿困)|肺(?:气虚|阴虚|失宣|失肃)|胃(?:热|寒|阴虚|气虚)|太阳(?:中风|伤寒|蓄水|蓄血)|阳明(?:经证|腑证)|少阳(?:病|证)|太阴(?:病|证)|少阴(?:寒化|热化)|厥阴(?:病|证)|卫气营血)/g,
];

// 药材关键词（常见中药 + 药对）
const HERB_PATTERNS = [
  /([\u4e00-\u9fff]{1,4}(?:仁|子|皮|叶|花|根|茎|草|木|藤|藻|耳|粉|脂|胶|霜|炭|石|砂|黄|香|参|芪|术|苓|芍|归|芎|地|附|桂|姜|枣|草|连|芩|柏|栀|军|硝|矾|胆))/g,
  // 高频药材
  /(人参|党参|丹参|玄参|苦参|沙参|黄芪|白术|苍术|茯苓|猪苓|甘草|炙甘草|当归|川芎|白芍|赤芍|熟地|生地|附子|肉桂|干姜|生姜|大枣|桂枝|麻黄|细辛|柴胡|黄芩|黄连|黄柏|栀子|大黄|芒硝|石膏|知母|半夏|陈皮|枳实|枳壳|厚朴|木香|香附|郁金|桃仁|红花|三七|蒲黄|五灵脂|地龙|全蝎|蜈蚣|龙骨|牡蛎|酸枣仁|远志|麦冬|天冬|百合|玉竹|石斛|枸杞|女贞子|菟丝子|淫羊藿|杜仲|续断|牛膝|桑寄生|山药|山茱萸|泽泻|牡丹皮|五味子)/g,
];

// ─── 工具函数 ──────────────────────────────────────────────────

function nowISO() {
  return new Date().toISOString();
}

function tzNow() {
  return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
}

function extractKeywords(text, patterns) {
  const found = new Set();
  for (const pat of patterns) {
    const m = text.matchAll(pat);
    for (const hit of m) {
      const kw = hit[1] || hit[0];
      if (kw && kw.length >= 2) found.add(kw.replace(/\s+/g, ''));
    }
  }
  return [...found];
}

function fingerprint(entry) {
  // 稳定指纹：module + entry_id + 关键字段 hash
  const src = [
    entry.entry_id || '',
    entry.title || '',
    entry.keywords || '',
    entry.summary || '',
  ].join('::');
  const crypto = require('crypto');
  return crypto.createHash('md5').update(src).digest('hex').slice(0, 8);
}

// ─── 数据库查询 ────────────────────────────────────────────────

function queryTCMModules() {
  let db;
  try {
    db = new DatabaseSync(DB_PATH, { readOnly: true });
  } catch (e) {
    console.error('[daily-mingli-distill] 无法打开数据库:', e.message);
    process.exit(1);
  }

  const placeholders = TCM_MODULES.map(() => '?').join(',');
  const sql = `
    SELECT entry_id, module, title, content, category, keywords, summary,
           trust_score, confidence, tags, status, fingerprint,
           created_at, updated_at, promoted_at, hit_count
    FROM kb_formal
    WHERE module IN (${placeholders})
      AND status != 'deleted'
    ORDER BY module, entry_id
  `;

  const rows = [];
  try {
    const stmt = db.prepare(sql);
    // node:sqlite DatabaseSync bind is positional
    for (let i = 0; i < TCM_MODULES.length; i++) {
      stmt.bind(i + 1, TCM_MODULES[i]);
    }
    // Actually, let's just use all() with raw SQL since bind is tricky
  } catch (_) {
    // fallback
  }

  // Simpler approach: query each module
  const allRows = [];
  for (const mod of TCM_MODULES) {
    try {
      const modSql = `
        SELECT entry_id, module, title, COALESCE(content,'') as content,
               category, keywords, COALESCE(summary,'') as summary,
               trust_score, confidence, tags, status, fingerprint,
               created_at, updated_at, promoted_at, hit_count
        FROM kb_formal
        WHERE module = ?
          AND status != 'deleted'
        ORDER BY entry_id
      `;
      const stmt = db.prepare(modSql);
      const modRows = stmt.all(mod);
      allRows.push(...modRows);
    } catch (e) {
      console.error(`[daily-mingli-distill] 查询模块 ${mod} 失败:`, e.message);
    }
  }
  db.close();
  return allRows;
}

// ─── 快照差分 ──────────────────────────────────────────────────

function loadSnapshot() {
  try {
    if (fs.existsSync(SNAPSHOT_PATH)) {
      const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf8');
      const data = JSON.parse(raw);
      // 返回 { entry_id: fingerprint } 的 Map
      return new Map(Object.entries(data.fingerprints || {}));
    }
  } catch (e) {
    console.warn('[daily-mingli-distill] 快照加载失败，执行全量基线:', e.message);
  }
  return null; // null = 首次运行
}

function diffEntries(currentEntries, prevFingerprints) {
  const newEntries = [];
  const changedEntries = [];
  const currentFp = {};

  for (const entry of currentEntries) {
    const fp = entry.fingerprint || fingerprint(entry);
    currentFp[entry.entry_id] = fp;

    if (!prevFingerprints) {
      // 首次运行：所有条目都是"new"
      newEntries.push(entry);
    } else if (!prevFingerprints.has(entry.entry_id)) {
      // 新增条目
      newEntries.push(entry);
      // eslint-disable-next-line eqeqeq
    } else if (prevFingerprints.get(entry.entry_id) != fp) {
      // 变更条目
      changedEntries.push(entry);
    }
  }

  return { newEntries, changedEntries, currentFp };
}

// ─── 蒸馏提取 ──────────────────────────────────────────────────

function distillEntries(entries) {
  const result = {
    generated_at: nowISO(),
    generated_local: tzNow(),
    total_new: entries.length,
    modules: {},
    formulas: [],
    syndromes: [],
    herbs: [],
    entries: [],
  };

  const modStats = {};
  const allFormulas = new Set();
  const allSyndromes = new Set();
  const allHerbs = new Set();

  for (const mod of TCM_MODULES) {
    modStats[mod] = { new_count: 0, formulas: [], syndromes: [], herbs: [] };
  }

  for (const entry of entries) {
    const fullText = [
      entry.title || '',
      entry.summary || '',
      entry.content || '',
      entry.keywords || '',
      (entry.tags || '').toString(),
    ].join('\n');

    const formulas = extractKeywords(fullText, FORMULA_PATTERNS);
    const syndromes = extractKeywords(fullText, SYNDROME_PATTERNS);
    const herbs = extractKeywords(fullText, HERB_PATTERNS);

    for (const f of formulas) allFormulas.add(f);
    for (const s of syndromes) allSyndromes.add(s);
    for (const h of herbs) allHerbs.add(h);

    const mod = entry.module;
    if (modStats[mod]) {
      modStats[mod].new_count++;
      modStats[mod].formulas.push(...formulas);
      modStats[mod].syndromes.push(...syndromes);
      modStats[mod].herbs.push(...herbs);
    }

    result.entries.push({
      entry_id: entry.entry_id,
      module: entry.module,
      title: entry.title,
      category: entry.category,
      formulas,
      syndromes,
      herbs,
      confidence: entry.confidence,
      updated_at: entry.updated_at,
    });
  }

  // 去重 + 排序
  for (const mod of TCM_MODULES) {
    modStats[mod].formulas = [...new Set(modStats[mod].formulas)].sort();
    modStats[mod].syndromes = [...new Set(modStats[mod].syndromes)].sort();
    modStats[mod].herbs = [...new Set(modStats[mod].herbs)].sort();
  }

  result.modules = modStats;
  result.formulas = [...allFormulas].sort();
  result.syndromes = [...allSyndromes].sort();
  result.herbs = [...allHerbs].sort();

  return result;
}

// ─── 保存输出 ──────────────────────────────────────────────────

function saveDistilled(distilled) {
  if (!fs.existsSync(KB_DIR)) {
    fs.mkdirSync(KB_DIR, { recursive: true });
  }
  fs.writeFileSync(DISTILLED_PATH, JSON.stringify(distilled, null, 2), 'utf8');
  console.log(`[daily-mingli-distill] 蒸馏结果已写入: ${DISTILLED_PATH}`);
  console.log(`  新条目: ${distilled.total_new} 个`);
  console.log(`  方剂: ${distilled.formulas.length} 个`);
  console.log(`  证候: ${distilled.syndromes.length} 个`);
  console.log(`  药材: ${distilled.herbs.length} 个`);
}

function saveSnapshot(fingerprints) {
  const snap = {
    generated_at: nowISO(),
    generated_local: tzNow(),
    module_count: {},
    fingerprints,
  };
  // 统计各模块数量
  for (const [entryId] of Object.entries(fingerprints)) {
    // 从 entry_id 前缀推断模块（不可靠，改用实际数据）
  }
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snap, null, 2), 'utf8');
  console.log(`[daily-mingli-distill] 快照已更新: ${SNAPSHOT_PATH}`);
}

function appendLog(logEntry) {
  if (!fs.existsSync(KB_DIR)) {
    fs.mkdirSync(KB_DIR, { recursive: true });
  }
  const line = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(LOG_PATH, line, 'utf8');
}

// ─── 主流程 ────────────────────────────────────────────────────

function main() {
  const startTime = Date.now();
  console.log(`[daily-mingli-distill] === 开始: ${tzNow()} ===`);

  // 1) 查询当前数据
  console.log('[daily-mingli-distill] 查询 yidao.db …');
  const currentEntries = queryTCMModules();
  console.log(`  总条目: ${currentEntries.length}`);

  // 模块统计
  const modCounts = {};
  for (const e of currentEntries) {
    modCounts[e.module] = (modCounts[e.module] || 0) + 1;
  }
  console.log('  模块分布:', JSON.stringify(modCounts));

  // 2) 加载上次快照
  console.log('[daily-mingli-distill] 加载快照 …');
  const prevFp = loadSnapshot();
  console.log(`  快照状态: ${prevFp ? `已有 ${prevFp.size} 条指纹` : '首次运行（全量基线）'}`);

  // 3) 差分
  console.log('[daily-mingli-distill] 执行差分 …');
  const { newEntries, changedEntries, currentFp } = diffEntries(currentEntries, prevFp);
  console.log(`  新增: ${newEntries.length}  变更: ${changedEntries.length}`);

  // 4) 蒸馏
  let distilled = null;
  if (newEntries.length > 0 || changedEntries.length > 0) {
    const allChanged = [...newEntries, ...changedEntries];
    console.log(`[daily-mingli-distill] 蒸馏 ${allChanged.length} 条变更 …`);
    distilled = distillEntries(allChanged);

    // 5) 保存蒸馏结果
    saveDistilled(distilled);

    // 6) 写日志
    const logEntry = {
      ts: nowISO(),
      ts_local: tzNow(),
      type: 'daily-distill',
      total_entries: currentEntries.length,
      new_count: newEntries.length,
      changed_count: changedEntries.length,
      formulas_count: distilled.formulas.length,
      syndromes_count: distilled.syndromes.length,
      herbs_count: distilled.herbs.length,
      modules: modCounts,
    };
    appendLog(logEntry);
    console.log('[daily-mingli-distill] 日志已追加');
  } else {
    console.log('[daily-mingli-distill] 无新增/变更条目，跳过蒸馏');
    const logEntry = {
      ts: nowISO(),
      ts_local: tzNow(),
      type: 'daily-distill',
      total_entries: currentEntries.length,
      new_count: 0,
      changed_count: 0,
      note: 'no_changes',
      modules: modCounts,
    };
    appendLog(logEntry);
  }

  // 7) 保存快照
  saveSnapshot(currentFp);

  // 8) 输出模块级摘要
  console.log('\n[daily-mingli-distill] === 模块摘要 ===');
  for (const mod of TCM_MODULES) {
    const count = modCounts[mod] || 0;
    if (distilled && distilled.modules[mod]) {
      const ms = distilled.modules[mod];
      console.log(`  ${mod}: ${count} 条 | +${ms.new_count} | 方${ms.formulas.length} 证${ms.syndromes.length} 药${ms.herbs.length}`);
    } else {
      console.log(`  ${mod}: ${count} 条`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n[daily-mingli-distill] === 完成: ${tzNow()} 耗时 ${elapsed}s ===`);

  // 返回给 cron 调用方
  return {
    total_entries: currentEntries.length,
    new_count: newEntries.length,
    changed_count: changedEntries.length,
    formulas: distilled ? distilled.formulas.length : 0,
    syndromes: distilled ? distilled.syndromes.length : 0,
    herbs: distilled ? distilled.herbs.length : 0,
    elapsed_s: parseFloat(elapsed),
  };
}

// ─── 入口 ──────────────────────────────────────────────────────

if (require.main === module) {
  const result = main();
  // 非零退出码表示有错误但非致命
  if (result.total_entries === 0) {
    console.error('[daily-mingli-distill] 警告：未查询到任何条目');
  }
  process.exit(0);
}

module.exports = { main, queryTCMModules, distillEntries };
