// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · 知识库体系管理引擎 (KB Management Engine)
// 标准文档: docs/KB_MANAGEMENT_STANDARD.md
// 依赖: server/kb-schema.sql (需先执行)
// ═══════════════════════════════════════════════════════════════

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'database', 'yidao.db');
const KB_DIR = path.join(__dirname, '..', 'knowledge');
const MODEL_DIR = path.join(__dirname, '..', 'knowledge-models');

const db = new DatabaseSync(DB_PATH);

// ═══ 工具函数 ═══

function genId(prefix, module, seq) {
  return `KB-${module.toUpperCase()}-${String(seq).padStart(3, '0')}`;
}

function genSrcId(type, seq) {
  // type 已是 'SRC-BOOK' / 'SRC-COURSE' / ... 完整前缀
  return `${type}-${String(seq).padStart(3, '0')}`;
}

function parseJSON(s, fallback) {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch (e) { return fallback; }
}

function toJSON(v) { return JSON.stringify(v || []); }

// ═══ Phase 1: 来源索引注册 ═══

/**
 * 注册知识来源
 * @param {Object} src - {src_type, title, author, url, publisher, publish_date, trust_score, tags, access_level}
 * @returns {string} src_id
 */
function registerSource(src) {
  // 查找已有同类型最大序号
  const row = db.prepare(
    `SELECT src_id FROM source_index WHERE src_type=? ORDER BY src_id DESC LIMIT 1`
  ).get(src.src_type);
  const seq = row ? (parseInt(row.src_id.split('-').pop()) + 1) : 1;
  const src_id = genSrcId(src.src_type, seq);

  db.prepare(`INSERT OR REPLACE INTO source_index
    (src_id, src_type, title, author, url, publisher, publish_date, trust_score, tags, access_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    src_id, src.src_type, src.title || '', src.author || '',
    src.url || '', src.publisher || '', src.publish_date || '',
    src.trust_score || 0.5, toJSON(src.tags || []),
    src.access_level || 'public'
  );

  return src_id;
}

/**
 * 批量注册来源
 */
function registerSources(sources) {
  const ids = [];
  for (const s of sources) {
    ids.push(registerSource(s));
  }
  return ids;
}

// ═══ Phase 2: 知识提取（从现有 KB 文件提取） ═══

/**
 * 将一个知识条目写入 staging 表
 */
function writeToStaging(entry) {
  // 检查重复
  const exists = db.prepare(`SELECT entry_id FROM kb_staging WHERE entry_id=?`).get(entry.entry_id);
  if (exists) return false;

  // 缺字段用 fallback
  const title = entry.title || (entry.summary ? entry.summary.slice(0, 80) : entry.entry_id);
  const module = entry.module || 'general';
  const content = entry.content || '';
  const src_id = entry.src_id || (Array.isArray(entry.source_ids) && entry.source_ids[0]) || null;

  db.prepare(`INSERT INTO kb_staging
    (entry_id, module, title, content, src_id, summary, keywords, tags, source_ids, confidence, access_level, category, difficulty, status, audit_status, version, raw_metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'staging', 'pending', 1, ?)`).run(
    entry.entry_id, module, title, content, src_id,
    entry.summary || '',
    toJSON(entry.tags || []), toJSON(entry.tags || []), toJSON(entry.source_ids || []),
    entry.confidence || 0.5, entry.access_level || 'registered',
    entry.category || '基础', entry.difficulty || 'intermediate',
    toJSON({ original: entry })
  );
  return true;
}

/**
 * 从现有 KB JS 文件提取知识条目（默认写入 staging）
 * @param {string} filename - knowledge/ 目录下的 JS 文件名
 * @param {string} module - 所属模块
 * @param {boolean} write - 是否直接写入 staging（默认 true）
 * @returns {Array} 提取的知识条目数组
 */
function extractFromKBFile(filename, module, write) {
  if (write === undefined) write = true;
  const filepath = path.join(KB_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`[KB] 文件不存在: ${filepath}`);
    return [];
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  const entries = [];

  // 提取策略：按空行分段
  const lines = content.split('\n');
  let currentChunk = [];
  let chunkIndex = 0;

  for (const line of lines) {
    currentChunk.push(line);
    if (line.trim() === '' && currentChunk.length > 10) {
      const chunkText = currentChunk.join('\n').trim();
      if (chunkText.length > 50) {
        const entry = parseKBChunk(chunkText, module, filename, chunkIndex++);
        if (entry) {
          // 默认加上 legacy 来源
          entry.source_ids = ['SRC-LEGACY-001'];
          entries.push(entry);
        }
      }
      currentChunk = [];
    }
  }
  // 处理最后一块
  const lastChunk = currentChunk.join('\n').trim();
  if (lastChunk.length > 50) {
    const entry = parseKBChunk(lastChunk, module, filename, chunkIndex++);
    if (entry) {
      entry.source_ids = ['SRC-LEGACY-001'];
      entries.push(entry);
    }
  }

  // 写入 staging
  if (write) {
    let written = 0;
    for (const e of entries) {
      if (writeToStaging(e)) written++;
    }
    console.log(`[KB] 提取 ${filename}: ${entries.length} 条，写入 staging: ${written} 条`);
  }

  return entries;
}

/**
 * 解析一个知识块为标准条目
 */
function parseKBChunk(text, module, filename, index) {
  // 提取中文关键句作为 summary
  const meaningfulLines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('//') && !l.startsWith('/*') && !l.startsWith('*/') && !l.startsWith('*'));

  if (meaningfulLines.length === 0) return null;

  // 提取所有中文文本
  const chineseText = meaningfulLines.join(' ');
  const summary = chineseText.slice(0, 80).replace(/[,;，；]/g, ' ') + (chineseText.length > 80 ? '...' : '');

  // 提取可能的标签（关键词）
  const tagPattern = /(日主|癸水|甲木|乙木|丙火|丁火|戊土|己土|庚金|辛金|壬水|寅木|卯木|巳火|午火|申金|酉金|亥水|子水|辰土|戌土|丑土|未土|十神|格局|用神|神煞|大运|流年|五行|阴阳|命理|风水|奇门|六壬|紫微|六爻|梅花|中医|养生|经络|穴位|方剂|伤寒|金匮|温病|针灸|本草)/g;
  const tags = [...new Set(chineseText.match(tagPattern) || [])].slice(0, 10);

  const entry_id = genId('KB', module, index + 1);

  return {
    entry_id,
    module,
    content: text.slice(0, 8000),  // 限制单条最大 8KB
    summary,
    tags,
    source_ids: [],  // 待标注
    confidence: 0.5, // 默认中等置信度
    access_level: 'registered',
    category: detectCategory(text, module),
    difficulty: 'intermediate',
    status: 'staging',
    audit_status: 'pending',
    version: 1,
  };
}

/**
 * 自动分类检测
 */
function detectCategory(text, module) {
  const categories = {
    bazi: ['格局', '用神', '十神', '大运', '流年', '神煞', '五行', '日主', '长生'],
    tcm: ['方剂', '伤寒', '针灸', '经络', '穴位', '养生', '体质', '本草'],
    fengshui: ['方位', '罗盘', '形煞', '理气', '玄空'],
    liuren: ['三传', '四课', '三奇', '天将'],
    liuyao: ['六亲', '六神', '世应', '用神'],
    ziwei: ['十二宫', '星曜', '四化', '命宫'],
    qimen: ['九星', '八门', '八神', '奇仪'],
    meihua: ['体用', '互卦', '变卦'],
  };

  const cats = categories[module] || [];
  for (const cat of cats) {
    if (text.includes(cat)) return cat;
  }
  return '基础';
}

// ═══ Phase 3: 蒸馏（从案例提取新知识） ═══

/**
 * 从 master_cases 表蒸馏知识
 * @param {Object} opts - {min_quality: 8, min_effectiveness: 3}
 * @returns {Array} 新提取的知识条目
 */
function distillFromCases(opts) {
  opts = opts || {};
  // quality_score 采用 0-100 百分制, 默认 80 起步
  const minQ = opts.min_quality || 80;
  // effectiveness_rating 0-5, 3 表示有效
  const minE = opts.min_effectiveness || 3;

  const cases = db.prepare(`
    SELECT id, case_uuid, bazi_chart, wuxing_summary, symptoms,
           master_analysis, analysis_summary, medical_translation,
           doctor_diagnosis, final_plan, quality_score, effectiveness_rating
    FROM master_cases
    WHERE quality_score >= ?
      AND status = 'completed'
    ORDER BY quality_score DESC, effectiveness_rating DESC
    LIMIT 100
  `).all(minQ);

  const extracted = [];
  let seq = 1;

  for (const c of cases) {
    if (!c.master_analysis || c.master_analysis.length < 20) continue;

    const summary = c.analysis_summary || c.master_analysis.slice(0, 80);
    const tags = extractKeywords(c.master_analysis + ' ' + (c.wuxing_summary || ''));

    extracted.push({
      entry_id: genId('KB', 'case', seq++),
      module: 'tcm',
      content: c.master_analysis.slice(0, 8000),
      summary: summary + '...',
      tags,
      source_ids: [`SRC-CASE-${String(c.id).padStart(3, '0')}`],
      confidence: Math.min(0.3 + (c.quality_score || 0) * 0.07, 0.95),
      access_level: 'professional',
      category: '临床案例蒸馏',
      difficulty: 'advanced',
      status: 'staging',
      audit_status: 'pending',
      version: 1,
    });

    // 注册来源
    registerSource({
      src_type: 'SRC-CASE',
      title: `诊疗案例 #${c.case_uuid || c.id}`,
      trust_score: 0.7,
      tags: tags,
      access_level: 'professional',
    });
  }

  // 写入 staging
  let written = 0;
  for (const e of extracted) {
    if (writeToStaging(e)) written++;
  }
  console.log(`[KB] 蒸馏 ${cases.length} 个案例: 提取 ${extracted.length} 条，写入 staging: ${written} 条`);

  return extracted;
}

function extractKeywords(text) {
  if (!text) return [];
  const pattern = /(日主|[甲乙丙丁戊己庚辛壬癸][木火土金水]|十神|格局|用神|神煞|大运|流年|五行|阴阳|命理|风水|中医|养生|经络|方剂|伤寒|体质|湿|热|寒|虚|实|肝|心|脾|肺|肾)/g;
  return [...new Set(text.match(pattern) || [])].slice(0, 10);
}

// ═══ Phase 4: 审计与安全检查 ═══

/**
 * 审计一个 staging 条目
 * @param {string} entry_id
 * @returns {Object} {passed: bool, reason: string}
 */
function auditEntry(entry_id) {
  const entry = db.prepare(`SELECT * FROM kb_staging WHERE entry_id = ?`).get(entry_id);
  if (!entry) return { passed: false, reason: '条目不存在' };

  const tags = parseJSON(entry.tags, []);
  const source_ids = parseJSON(entry.source_ids, []);

  // 检查 1: 内容非空
  if (!entry.content || entry.content.trim().length < 10) {
    return rejectEntry(entry_id, '内容过短或为空');
  }

  // 检查 2: 来源追溯
  if (source_ids.length === 0) {
    return rejectEntry(entry_id, '无来源追溯 (source_ids 为空)');
  }

  // 检查 3: 置信度
  if (entry.confidence < 0.3) {
    return rejectEntry(entry_id, `置信度过低 (${entry.confidence})`);
  }

  // 检查 4: 医疗安全
  const medPattern = /(诊断|开方|处方|服用|剂量|用法|用量)/g;
  if (medPattern.test(entry.content) && !entry.content.includes('仅供参考')) {
    return rejectEntry(entry_id, '含医疗建议但未标注"仅供参考"');
  }

  // 检查 5: 敏感信息
  const sensitivePattern = /(\d{15,}|\d{3}-\d{8}|身份证|手机号|电话|地址：)/g;
  if (sensitivePattern.test(entry.content)) {
    return rejectEntry(entry_id, '含敏感信息（身份证/手机号/地址）');
  }

  // 检查 6: 重复检测
  const existing = db.prepare(`
    SELECT entry_id FROM kb_formal
    WHERE module = ? AND substr(content, 1, 100) = substr(?, 1, 100)
    LIMIT 1
  `).get(entry.module, entry.content);
  if (existing) {
    return rejectEntry(entry_id, `与正式库条目 ${existing.entry_id} 相似`);
  }

  // 全部通过 → 移至 formal
  promoteToFormal(entry_id);
  // 写 kb_audit 表（修复：原代码漏写 kb_audit，导致审计链路断）
  try {
    db.prepare(`INSERT INTO kb_audit (audit_id, entry_id, module, action, score, auditor, audited_at)
      VALUES (?, ?, ?, 'audit', 0.85, 'auto', CURRENT_TIMESTAMP)`).run(
      'AUD-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      entry_id, entry.module
    );
  } catch (e) { /* 表结构差异容错 */ }
  return { passed: true, reason: '审计通过，已移至正式库' };
}

function rejectEntry(entry_id, reason) {
  db.prepare(`UPDATE kb_staging SET audit_status='rejected', audit_notes=?, audit_at=CURRENT_TIMESTAMP WHERE entry_id=?`)
    .run(reason, entry_id);
  db.prepare(`INSERT INTO audit_logs (action, detail, created_at) VALUES ('kb-audit-rejected', ?, CURRENT_TIMESTAMP)`)
    .run(`${entry_id}: ${reason}`);
  return { passed: false, reason };
}

function promoteToFormal(entry_id) {
  const entry = db.prepare(`SELECT * FROM kb_staging WHERE entry_id = ?`).get(entry_id);
  if (!entry) return;

  db.prepare(`INSERT OR REPLACE INTO kb_formal
    (entry_id, module, content, summary, tags, source_ids, confidence,
     access_level, category, difficulty, status, audit_status, audit_by,
     audit_at, audit_notes, version, created_at, updated_at, model_id, hit_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'formal', 'approved', 'system',
     CURRENT_TIMESTAMP, '自动审计通过', ?, ?, CURRENT_TIMESTAMP, ?, 0)`).run(
    entry.entry_id, entry.module, entry.content, entry.summary,
    entry.tags, entry.source_ids, entry.confidence,
    entry.access_level, entry.category, entry.difficulty,
    entry.version, entry.created_at, entry.model_id
  );

  db.prepare(`UPDATE kb_staging SET status='promoted', audit_status='approved', audit_at=CURRENT_TIMESTAMP WHERE entry_id=?`)
    .run(entry_id);

  db.prepare(`INSERT INTO audit_logs (action, detail, created_at) VALUES ('kb-audit-approved', ?, CURRENT_TIMESTAMP)`)
    .run(`${entry_id}: 自动审计通过`);
  // 写 kb_audit 表（修复：原代码漏写 kb_audit，导致审计链路断）
  try {
    db.prepare(`INSERT INTO kb_audit (audit_id, entry_id, module, action, score, auditor, audited_at)
      VALUES (?, ?, ?, 'promote', 0.85, 'auto', CURRENT_TIMESTAMP)`).run(
      'AUD-PROMO-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      entry_id, entry.module
    );
  } catch (e) { /* 表结构差异容错 */ }
}

/**
 * 批量审计 staging 中所有 pending 条目
 */
function auditAllPending() {
  const pending = db.prepare(`SELECT entry_id FROM kb_staging WHERE audit_status='pending'`).all();
  const results = { passed: 0, rejected: 0, total: pending.length };

  for (const { entry_id } of pending) {
    const result = auditEntry(entry_id);
    if (result.passed) results.passed++;
    else results.rejected++;
  }

  return results;
}

// ═══ Phase 5: 知识模型构建 ═══

/**
 * 为指定模块构建知识模型
 * @param {string} module - bazi / tcm / fengshui / ...
 * @returns {Object} 模型元数据
 */
function buildModel(module) {
  const entries = db.prepare(`
    SELECT entry_id, content, summary, tags, source_ids, confidence,
           category, difficulty, access_level, title
    FROM kb_formal
    WHERE module = ? AND (status = 'formal' OR status IS NULL)
  `).all(module);

  if (entries.length === 0) {
    return { model_id: `${module}-model-v1`, entry_count: 0, built: false };
  }

  // 构建倒排索引
  const invertedIndex = {};
  const categoryIndex = {};

  for (const e of entries) {
    const tags = parseJSON(e.tags, []);
    for (const tag of tags) {
      if (!invertedIndex[tag]) invertedIndex[tag] = [];
      invertedIndex[tag].push(e.entry_id);
    }

    if (e.category) {
      if (!categoryIndex[e.category]) categoryIndex[e.category] = [];
      categoryIndex[e.category].push(e.entry_id);
    }
  }

  const model_id = `${module}-model-v1`;
  const entry_ids = entries.map(e => e.entry_id);

  // 存入数据库
  db.prepare(`INSERT OR REPLACE INTO knowledge_models
    (model_id, module, version, description, entry_count, entry_ids, inverted_index, categories, built_at, status)
    VALUES (?, ?, 'v1', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'active')`).run(
    model_id, module, `${module} 知识模型 v1`,
    entries.length, toJSON(entry_ids), JSON.stringify(invertedIndex), JSON.stringify(categoryIndex)
  );

  // 写 JS 文件到 knowledge-models/
  if (!fs.existsSync(MODEL_DIR)) fs.mkdirSync(MODEL_DIR, { recursive: true });

  const modelJs = generateModelJS(module, entries, invertedIndex, categoryIndex);
  fs.writeFileSync(path.join(MODEL_DIR, `${module}-model.js`), modelJs);

  return { model_id, entry_count: entries.length, built: true };
}

/**
 * 生成模型 JS 文件
 */
function generateModelJS(module, entries, invertedIndex, categoryIndex) {
  const entriesObj = {};
  for (const e of entries) {
    entriesObj[e.entry_id] = {
      tags: parseJSON(e.tags, []),
      confidence: e.confidence,
      category: e.category,
      difficulty: e.difficulty,
      access_level: e.access_level,
      summary: e.summary,
      content: e.content.slice(0, 4000), // 模型中只存压缩版
      source_ids: parseJSON(e.source_ids, []),
    };
  }

  const modelName = module.toUpperCase() + '_MODEL';

  return `// ═══ ${modelName} · Auto-generated ${new Date().toISOString().slice(0,10)} ═══
// DO NOT EDIT - This file is generated by kb-management-engine.js
// Source: kb_formal table → knowledge_models table

const ${modelName} = {
  module: "${module}",
  version: "v1",
  updated_at: "${new Date().toISOString()}",

  entries: ${JSON.stringify(entriesObj, null, 2)},

  inverted_index: ${JSON.stringify(invertedIndex, null, 2)},

  categories: ${JSON.stringify(categoryIndex, null, 2)},

  /**
   * 按关键词搜索（标签匹配）
   */
  search(query) {
    if (!query) return [];
    const words = query.split(/[\\s,，、]+/).filter(w => w.length > 0);
    const scored = {};
    for (const word of words) {
      for (const [tag, ids] of Object.entries(this.inverted_index)) {
        if (tag.includes(word) || word.includes(tag)) {
          for (const id of ids) {
            scored[id] = (scored[id] || 0) + 1;
          }
        }
      }
    }
    return Object.entries(scored)
      .sort((a, b) => b[1] - a[1])
      .map(([id, score]) => ({ entry_id: id, score, ...this.entries[id] }))
      .filter(e => e.content);
  },

  /**
   * 按分类获取
   */
  byCategory(cat) {
    const ids = this.categories[cat] || [];
    return ids.map(id => ({ entry_id: id, ...this.entries[id] })).filter(e => e.content);
  },

  /**
   * 按标签获取
   */
  byTag(tag) {
    const ids = this.inverted_index[tag] || [];
    return ids.map(id => ({ entry_id: id, ...this.entries[id] })).filter(e => e.content);
  },

  /**
   * 追溯来源
   */
  traceSource(entry_id) {
    const e = this.entries[entry_id];
    if (!e || !e.source_ids) return [];
    return e.source_ids;
  },

  /**
   * 统计
   */
  stats() {
    return {
      module: this.module,
      version: this.version,
      entry_count: Object.keys(this.entries).length,
      tag_count: Object.keys(this.inverted_index).length,
      category_count: Object.keys(this.categories).length,
    };
  }
};

// 挂到全局
try { window.${modelName} = ${modelName}; } catch(e) {}
try { module.exports = ${modelName}; } catch(e) {}
`;
}

/**
 * 构建全部模块模型
 */
function buildAllModels() {
  const modules = db.prepare(`SELECT DISTINCT module FROM kb_formal WHERE status='formal'`).all();
  const results = [];
  for (const { module } of modules) {
    results.push(buildModel(module));
  }
  return results;
}

// ═══ Phase 6: 推送模型 ═══

/**
 * 推送模型到应用端（记录推送日志）
 */
function pushModel(model_id, endpoints) {
  const model = db.prepare(`SELECT * FROM knowledge_models WHERE model_id = ?`).get(model_id);
  if (!model) return { success: false, reason: '模型不存在' };

  const push_id = 'PUSH-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
  const eps = endpoints || ['divination-hub', 'ai-assistant', 'tcm-clinic'];

  db.prepare(`UPDATE knowledge_models SET pushed_at = CURRENT_TIMESTAMP, app_endpoints = ? WHERE model_id = ?`)
    .run(toJSON(eps), model_id);

  db.prepare(`INSERT INTO model_push_log (push_id, model_id, version, app_endpoints, trigger, result)
    VALUES (?, ?, ?, ?, 'manual', 'success')`).run(
    push_id, model_id, model.version, toJSON(eps)
  );

  return { success: true, push_id, model_id, version: model.version, endpoints: eps };
}

// ═══ Phase 7: 追溯 ═══

/**
 * 从应用端查询追溯来源
 */
function traceFromApp(entry_id) {
  const entry = db.prepare(`SELECT * FROM kb_formal WHERE entry_id = ?`).get(entry_id);
  if (!entry) return null;

  const source_ids = parseJSON(entry.source_ids, []);
  const sources = source_ids.map(id => {
    return db.prepare(`SELECT src_id, src_type, title, author, trust_score FROM source_index WHERE src_id = ?`).get(id);
  }).filter(s => s);

  return {
    entry: {
      entry_id: entry.entry_id,
      module: entry.module,
      summary: entry.summary,
      content: entry.content.slice(0, 200) + '...',
      confidence: entry.confidence,
      tags: parseJSON(entry.tags, []),
    },
    sources: sources,
    model_id: entry.model_id,
  };
}

/**
 * 记录应用端引用（用于使用统计）
 */
function recordHit(entry_id, app_endpoint, user_query) {
  db.prepare(`UPDATE kb_formal SET hit_count = hit_count + 1, last_hit = CURRENT_TIMESTAMP WHERE entry_id = ?`)
    .run(entry_id);

  const trace_id = 'TRACE-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex');
  db.prepare(`INSERT INTO knowledge_trace (trace_id, app_endpoint, entry_id, user_query, hit_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`).run(
    trace_id, app_endpoint, entry_id, user_query || ''
  );
}

// ═══ 导出 API ═══

module.exports = {
  // Phase 1: 来源
  registerSource,
  registerSources,

  // Phase 2: 提取
  extractFromKBFile,

  // Phase 3: 蒸馏
  distillFromCases,

  // Phase 4: 审计
  auditEntry,
  auditAllPending,
  promoteToFormal,

  // Phase 5: 模型构建
  buildModel,
  buildAllModels,

  // Phase 6: 推送
  pushModel,

  // Phase 7: 追溯
  traceFromApp,
  recordHit,

  // 工具
  genId,
  genSrcId,
  parseJSON,
  toJSON,
};