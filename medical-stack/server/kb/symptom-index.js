/**
 * symptom-index.js — R825 症状→方剂反向索引（运行时）
 *
 * 数据资产（均由 scripts/formula-symptom-index-build.py 从 KB 真实条目蒸馏，可溯源）：
 *   server/kb/symptom-aliases.json        症状别名词典（125 规范症状，俗称/现代/古文表述）
 *   server/kb/formula-symptom-index.json  条目级标签 + 方剂级标签（A 结构化 / B 方名条目 / C 古籍挖掘）
 *
 * 用法：buildBoostMap(q, kbFlat) → Map(eid → 加权分) 或 null（查询无症状词）
 * 权重设计：条目级 3×重叠数；方剂传播 A/B 源 2×重叠+2，C 源（古籍窗口挖掘，噪声容忍）1×重叠+2。
 */
const fs = require('fs');
const path = require('path');

let _doc = null;       // formula-symptom-index.json
let _pairs = null;     // [[alias, canon]] 长词优先
let _demote = null;    // R827 线上驳回降级名单 {formula: true}（scripts/kb-recall-metrics.py 生成）

function load() {
  if (_doc) return;
  _doc = JSON.parse(fs.readFileSync(path.join(__dirname, 'formula-symptom-index.json'), 'utf8'));
  const aliasDoc = JSON.parse(fs.readFileSync(path.join(__dirname, 'symptom-aliases.json'), 'utf8'));
  _pairs = [];
  for (const s of aliasDoc.symptoms) {
    for (const a of s.aliases) _pairs.push([a, s.canon]);
  }
  _pairs.sort((x, y) => y[0].length - x[0].length);
  // R827：医生驳回 ≥2 且 0 采纳的方剂降一级有效命中数（dppo 在线学习回流）
  try {
    _demote = JSON.parse(fs.readFileSync(path.join(__dirname, 'recall-demotions.json'), 'utf8'));
  } catch (e) { _demote = {}; }
}

/** 查询 → 规范症状集（长词优先子串匹配；无症状词返回 []） */
function analyzeQuery(q) {
  load();
  const out = new Set();
  for (const [alias, canon] of _pairs) {
    if (q.includes(alias)) out.add(canon);
  }
  return [...out];
}

/** 方剂名在标题内的匹配（标题允许带短前后缀，如「路总补气类：①四君子汤」） */
function titleHitsFormula(title, name) {
  return title && title.includes(name) && title.length <= name.length + 8;
}

/**
 * 构建 eid → 加权分 Map。
 * @param q       原始查询串
 * @param kbFlat  检索索引（[{id,module,title,...}]）
 * @returns Map|null  null 表示查询无症状语义，走纯文本通道
 */
function buildBoostMap(q, kbFlat) {
  const qc = analyzeQuery(q);
  if (!qc.length) return null;
  const qs = new Set(qc);
  const boost = new Map();
  const add = (eid, w) => { if (eid) boost.set(eid, (boost.get(eid) || 0) + w); };

  // 条目级：症状标签直接重叠
  for (const [eid, tags] of Object.entries(_doc.entries)) {
    let ov = 0;
    for (const t of tags) if (qs.has(t)) ov++;
    if (ov) add(eid, 3 * ov);
  }
  // 方剂传播：命中的方剂把权重带给标题含该方名的条目
  for (const [name, f] of Object.entries(_doc.formulas)) {
    let ov = 0;
    for (const t of f.canon) if (qs.has(t)) ov++;
    if (!ov) continue;
    const w = (f.src === 'C' ? 1 : 2) * ov + 2;
    for (const it of kbFlat) {
      if (titleHitsFormula(it.title, name)) add(it.id, w);
    }
  }
  return boost;
}

/**
 * 症状文本 → 方剂召回（R826 问诊台实时环用）
 * @param text  主诉+症状+当前语句拼接文本
 * @param limit 返回方剂数
 * @param exclude  R831：医生点掉的误识别规范症状（可迭代字符串集），从本次召回中剔除
 * @returns { canon: [...], formulas: [{name, overlap, ratio, matched, src, refs}] }
 *   overlap 降序 → 覆盖率降序 → 源可信度（A>B>C）；C 源（古籍挖掘）需 overlap≥2 才出。
 */
function formulaRecall(text, limit = 5, exclude = null) {
  let canon = analyzeQuery(String(text || ''));
  if (exclude) {
    const ex = new Set(exclude);
    canon = canon.filter(c => !ex.has(c));
  }
  if (!canon.length) return { canon: [], formulas: [] };
  const qs = new Set(canon);
  const SRC_RANK = { A: 3, B: 2, C: 1 };
  const rows = [];
  for (const [name, f] of Object.entries(_doc.formulas)) {
    const matched = f.canon.filter(t => qs.has(t));
    if (!matched.length) continue;
    // R827：在线驳回降级——有效命中数 −1，降到 0 即本轮不再召回
    const penalty = _demote[name] ? 1 : 0;
    if (matched.length - penalty <= 0) continue;
    if ((f.src || 'B') === 'C' && matched.length < 2) continue;   // C 源降噪
    rows.push({
      name,
      overlap: matched.length - penalty,
      ratio: +(matched.length / f.canon.length).toFixed(3),
      matched,
      src: f.src || 'B',
      refs: (f.refs || []).slice(0, 2),
      ...(penalty ? { demoted: true } : {}),
    });
  }
  rows.sort((a, b) => b.overlap - a.overlap || b.ratio - a.ratio ||
    (SRC_RANK[b.src] || 0) - (SRC_RANK[a.src] || 0));
  return { canon, formulas: rows.slice(0, limit) };
}

module.exports = { analyzeQuery, buildBoostMap, formulaRecall };
