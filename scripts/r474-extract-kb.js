#!/usr/bin/env node
/**
 * R474 · 本地 KB JS → 结构化 JSON 提取器
 * 用法: node scripts/r474-extract-kb.js [system1] [system2] ...
 * 输出: .openclaw/tmp/r474-extracted.json
 */

const fs = require('fs');
const path = require('path');

const KB_DIR = path.resolve(__dirname, '../knowledge');
const OUT = path.resolve(__dirname, '../.openclaw/tmp/r474-extracted.json');

// 注册目标系统和文件映射
const TARGETS = {
  ziwei: { file: 'ziwei-knowledge-base.js', var: 'ZIWEI_KB' },
  qimen: { file: 'qimen-knowledge-base.js', var: 'QIMEN_KB' },
  liuyao: { file: 'liuyao-knowledge-base.js', var: 'LIUYAO_KB' },
  liuren: { file: 'liuren-knowledge-base.js', var: 'LIUREN_KB' },
  meihua: { file: 'meihua-knowledge-base.js', var: 'MEIHUA_KB' },
  bazi: { file: 'bazi-knowledge-base.js', var: 'BAZI_KB' },
  zhouyi: { file: 'zhouyi-knowledge-base.js', var: 'ZHOUYI_KB' },
  yangzhai: { file: 'yangzhai-knowledge-base.js', var: 'YANGZHAI_KB' },
  fengshui: { file: 'fengshui-knowledge-base.js', var: 'FENGSHUI_KB' },
  yanzhi: { file: 'yanzhi-knowledge-base.js', var: 'YANZHI_KB' },
};

// 标题映射
const TITLE_MAP = {
  ziwei: '紫微斗数', qimen: '奇门遁甲', liuyao: '六爻断法',
  liuren: '大六壬', meihua: '梅花易数', bazi: '八字命理',
  zhouyi: '周易基础', yangzhai: '阳宅风水', fengshui: '风水堪舆',
  yanzhi: '言值写作',
};

// 需要提取的系统（默认 4 个最缺的）
const SYSTEMS = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ['ziwei', 'qimen', 'liuyao', 'liuren', 'meihua'];

let allEntries = [];
let entrySeq = 0;

for (const sys of SYSTEMS) {
  const cfg = TARGETS[sys];
  if (!cfg) { console.error(`⚠️ 未知系统: ${sys}`); continue; }

  const fp = path.join(KB_DIR, cfg.file);
  if (!fs.existsSync(fp)) { console.error(`⚠️ 文件不存在: ${fp}`); continue; }

  console.error(`📖 ${sys} (${(fs.statSync(fp).size / 1024).toFixed(0)}KB)...`);

  // 读取并执行 JS（模拟 window 环境）
  const code = fs.readFileSync(fp, 'utf-8');
  const sandbox = {};
  const fn = new Function('window', code + '\n; return window;');
  const window = fn(sandbox);

  const kb = window[cfg.var];
  if (!kb) { console.error(`  ❌ window.${cfg.var} 未找到`); continue; }

  // 遍历顶层 key → section 对象
  const sections = [];
  for (const key of Object.keys(kb)) {
    const val = kb[key];
    if (!val || typeof val !== 'object') continue;

    // 获取 title: 取 val.title 或 val[0]?.title 或 null
    let title = val.title || '';
    if (!title && Array.isArray(val) && val[0] && val[0].title) {
      title = val[0].title;
    }

    // 获取 content: string[], 或从 val.content/intro/methods 等提取
    let contentArr = [];
    if (Array.isArray(val.content)) {
      contentArr = val.content;
    } else if (typeof val.content === 'string') {
      contentArr = [val.content];
    } else if (val.intro && typeof val.intro === 'string') {
      contentArr = [val.intro];
    } else if (Array.isArray(val)) {
      // 可能是一个 section 数组
      contentArr = val.map(v =>
        typeof v === 'string' ? v : (v.title || v.name || JSON.stringify(v).slice(0, 100))
      );
    }

    // 递归提取嵌套 subsections
    const nested = [];
    for (const subKey of Object.keys(val)) {
      const subVal = val[subKey];
      if (typeof subVal !== 'object' || subVal === null) continue;
      if (subKey === 'content' || subKey === 'title' || subKey === 'intro') continue;
      if (typeof subVal.title === 'string' && (Array.isArray(subVal.content) || typeof subVal.content === 'string')) {
        nested.push({ key: subKey, ...subVal });
      }
    }

    if (contentArr.length > 0 || title) {
      sections.push({ key, title, content: contentArr, nested });
    }

    // 递归处理 nested
    for (const n of nested) {
      let nc = [];
      if (Array.isArray(n.content)) nc = n.content;
      else if (typeof n.content === 'string') nc = [n.content];
      if (nc.length > 0 || n.title) {
        sections.push({ key: `${key}.${n.key}`, title: n.title, content: nc });
      }
    }
  }

  if (sections.length === 0) {
    console.error(`  ⚠️ 无可提取 sections`);
    continue;
  }

  // 生成条目
  let count = 0;
  for (const sec of sections) {
    const contentText = (Array.isArray(sec.content)
      ? sec.content.filter(c => typeof c === 'string' && c.length > 10).join('\n')
      : String(sec.content || '')).trim();

    if (contentText.length < 30) continue; // 跳过太短的

    const entryId = `R474-${sys}-${String(++entrySeq).padStart(4, '0')}`;
    const summary = sec.title || `${TITLE_MAP[sys] || sys}·${sec.key}`;

    // 提取 tags
    const tagsFromContent = contentText.slice(0, 200)
      .replace(/[，。、；：""''（）《》【】\s]/g, ' ')
      .split(' ')
      .filter(w => w.length >= 2 && w.length <= 8)
      .slice(0, 10);

    allEntries.push({
      entry_id: entryId,
      module: sys,
      title: summary,
      content: contentText,
      tags: [sys, sec.key, ...tagsFromContent].filter(Boolean).join(','),
      keywords: sec.key,
      category: TITLE_MAP[sys] || sys,
      confidence: 0.85,
      source: `local-kb:${cfg.file}`,
      source_ids: `local-kb:${cfg.file}:${sec.key}`,
    });
    count++;
  }

  console.error(`  ✅ ${count} sections → ${count} entries`);
}

// 输出 JSON
fs.writeFileSync(OUT, JSON.stringify(allEntries, null, 2));
console.log(JSON.stringify({ ok: true, total: allEntries.length, file: OUT }));
