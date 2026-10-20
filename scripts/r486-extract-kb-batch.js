#!/usr/bin/env node
/**
 * R486 · 本地 KB JS 批量蒸馏提取器（第二批）
 * 处理 r474/r477 未覆盖的大型 KB JS 文件
 * 用法: node scripts/r486-extract-kb-batch.js
 * 输出: .openclaw/tmp/r486-extracted.json
 */

const fs = require('fs');
const path = require('path');

const KB_DIR = path.resolve(__dirname, '../knowledge');
const OUT = path.resolve(__dirname, '../.openclaw/tmp/r486-extracted.json');

// 本次目标文件 + 全局变量名映射
const TARGETS = [
  // 大型知识库
  { file: 'knowledge-details-extra.js', var: null, module: 'tcm-details-extra', title: '中医详情扩展' },
  { file: 'knowledge-details.js', var: null, module: 'tcm-details', title: '中医详情' },
  { file: 'knowledge-deep-supplement.js', var: null, module: 'tcm-deep', title: '中医深度补充' },
  { file: 'knowledge-supplement.js', var: null, module: 'tcm-supplement', title: '中医补充' },
  { file: 'knowledge-supplement-1.js', var: null, module: 'tcm-supplement-1', title: '中医补充1' },
  { file: 'knowledge-supplement-2.js', var: null, module: 'tcm-supplement-2', title: '中医补充2' },
  { file: 'knowledge-supplement-3.js', var: null, module: 'tcm-supplement-3', title: '中医补充3' },
  { file: 'knowledge-supplement-4.js', var: null, module: 'tcm-supplement-4', title: '中医补充4' },
  { file: 'knowledge-supplement-5.js', var: null, module: 'tcm-supplement-5', title: '中医补充5' },
  { file: 'knowledge-supplement-6.js', var: null, module: 'tcm-supplement-6', title: '中医补充6' },
  { file: 'knowledge-index.js', var: null, module: 'tcm-index', title: '中医索引' },
  // 口诀库
  { file: 'koujue-database-full.js', var: 'KOUJUE_DATABASE', module: 'koujue-full', title: '全量口诀库' },
  { file: 'koujue-daily.js', var: null, module: 'koujue-daily', title: '每日口诀' },
  { file: 'koujue-renderer.js', var: null, module: 'koujue-renderer', title: '口诀渲染', skip: true },
  // 经典/咒语
  { file: 'incantation-database.js', var: null, module: 'incantation', title: '咒语真言' },
  { file: 'classics-highlights.js', var: null, module: 'classics', title: '典籍精华' },
  // 大师库
  { file: 'masters-knowledge.js', var: null, module: 'masters', title: '命理大师' },
  // 缺失板块
  { file: 'kb-missing-sections.js', var: null, module: 'misc-knowledge', title: '杂类知识' },
  // 信仰/神仙
  { file: 'faith-knowledge-base.js', var: 'FAITH_KNOWLEDGE', module: 'faith', title: '信众知识库' },
  { file: 'faith-deities-detail.js', var: null, module: 'faith-deities', title: '神仙详情' },
  { file: 'faith-content.js', var: null, module: 'faith-content', title: '信众内容' },
  { file: 'faith-guide.js', var: null, module: 'faith-guide', title: '信众指南' },
  { file: 'faith-renderer.js', var: null, module: 'faith-renderer', title: '信众渲染', skip: true },
  // 节日/化劫
  { file: 'festival-knowledge-base.js', var: null, module: 'festival', title: '节日知识' },
  { file: 'huajie-age-specific.js', var: null, module: 'huajie-age', title: '化劫年龄' },
  // 针灸/六壬/其他
  { file: 'acupuncture-kb.js', var: null, module: 'acupuncture-extra', title: '针灸扩展' },
  { file: 'liuyue-kb.js', var: null, module: 'liuyue', title: '六壬扩展' },
];

let allEntries = [];
let entrySeq = 0;

function extractContent(obj, prefix = '') {
  /** 递归提取对象中的文本内容 */
  const items = [];

  if (typeof obj === 'string' && obj.length > 10) {
    items.push({ text: obj, tag: prefix });
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      items.push(...extractContent(obj[i], `${prefix}[${i}]`));
    }
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      // 跳过函数和纯样式
      if (typeof v === 'function') continue;
      if (k === 'style' || k === 'className' || k === 'id') continue;
      items.push(...extractContent(v, prefix ? `${prefix}.${k}` : k));
    }
  }

  return items;
}

function extractSection(rootObj, sectionKey, module, title) {
  /** 从 KB 对象的顶层 key 提取一个 section */
  const val = rootObj[sectionKey];
  if (!val || typeof val !== 'object') return null;

  // 提取标题
  let sectionTitle = val.title || val.name || val.名称 || sectionKey;
  if (typeof sectionTitle !== 'string') sectionTitle = String(sectionTitle);

  // 提取内容
  const rawItems = extractContent(val, sectionKey);
  // 过滤太短的文本
  const contentItems = rawItems.filter(r => r.text.length >= 8);

  if (contentItems.length === 0) return null;

  // 组装内容块
  const content = contentItems.map(r => {
    const label = r.tag.split('.').pop().replace(/\[.*$/, '');
    if (label && label !== sectionKey) {
      return `【${label}】${r.text}`;
    }
    return r.text;
  });

  return {
    id: `R486-${String(entrySeq++).padStart(4, '0')}`,
    module,
    title: `${title} · ${sectionTitle}`,
    content: content.join('\n\n'),
    tags: [module, sectionTitle],
    source: `knowledge/${TARGETS.find(t => t.module === module)?.file || ''}`,
    trust: 0.75,
  };
}

// 主流程
for (const cfg of TARGETS) {
  if (cfg.skip) {
    console.error(`⏭️  跳过渲染文件: ${cfg.file}`);
    continue;
  }

  const fp = path.join(KB_DIR, cfg.file);
  if (!fs.existsSync(fp)) {
    console.error(`⚠️ 文件不存在: ${cfg.file}`);
    continue;
  }

  const sizeKB = (fs.statSync(fp).size / 1024).toFixed(0);
  console.error(`📖 ${cfg.file} (${sizeKB}KB) → module: ${cfg.module}`);

  // 读取并执行 JS
  let code = fs.readFileSync(fp, 'utf-8');

  // 预处理：去掉 export / require 等 Node ESM 语法，stub 浏览器 API
  // 先把多行注释 /* ... */ 全部去掉（避免注释中的 require 被误替换）
  let noComments = code.replace(/\/\*[\s\S]*?\*\//g, '');
  // 智能裁剪：找到 // ========== 导出 ========== 或 // 导出 后面的导出块，全部截掉
  let mainPart = noComments;
  const exportMarkers = [
    /\/\/\s*=+\s*导出\s*=+/g,
    /\/\/\s*导出模块\s*$/gm,
    /\/\/\s*导出\s*$/gm,   // ← 这个能匹配 // 导出
    /\/\/\s*export\s*module\s*$/gm,
    /\/\/\s*module\.exports\s*$/gm,
  ];
  for (const marker of exportMarkers) {
    marker.lastIndex = 0;
    const m = marker.exec(noComments);
    if (m) {
      mainPart = noComments.substring(0, m.index).trimEnd();
      break;
    }
  }
  let processed = mainPart
    .replace(/^\s*export\s+(const|let|var|function)/gm, '$1')
    .replace(/^\s*export\s+\{[^}]+\};?\s*$/gm, '')
    // 残余 export { ... }; 行
    .replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '');
  // 提供 mock document
  const mockDocument = {
    getElementById: () => null,
    createElement: () => ({ id: '', textContent: '', innerHTML: '', appendChild: () => {} }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
  };

  // 尝试在 sandbox 中执行
  let sandbox = {};
  let execSuccess = false;
  try {
    // 模拟 window 环境
    const globalStub = {};
    const fn = new Function('window', 'document', processed + '\n; return window;');
    sandbox = fn(globalStub, mockDocument) || {};
    execSuccess = true;
  } catch (e) {
    try {
      const wrapped = processed + `\n; try { return typeof ${cfg.var} !== 'undefined' ? ${cfg.var} : null; } catch(e) { return null; }`;
      sandbox = new Function(wrapped)() || {};
      execSuccess = true;
    } catch (e2) {
      console.error(`  ❌ 执行失败: ${e2.message}`);
    }
  }

  // 备用：直接 regex 查找顶层 const/var 声明，从源码手工 eval
  if (!execSuccess || Object.keys(sandbox).filter(k => sandbox[k] && typeof sandbox[k] === 'object' && Object.keys(sandbox[k]).length > 2).length === 0) {
    const declMatch = processed.match(/(?:^|\n)\s*(?:const|var|let)\s+([A-Z_][A-Z0-9_]+)\s*=\s*\{/);
    if (declMatch) {
      const varName = declMatch[1];
      try {
        // 用 var 替代 const 让其可见
        const patched = processed.replace(
          new RegExp(`(?:const|let)\\s+${varName}\\s*=\\s*\\{`),
          `var ${varName} = {`
        );
        const fn = new Function('window', 'document', patched + `\n; return { ${varName} };`);
        const res = fn({}, mockDocument) || {};
        sandbox = { ...sandbox, ...res };
        console.error(`  � regex 声明补丁: ${varName}`);
      } catch (e3) {
        console.error(`  ❌ regex 补丁失败: ${e3.message}`);
        continue;
      }
    }
  }

  // 找到 KB 对象
  let kb = null;
  if (cfg.var && sandbox[cfg.var]) {
    kb = sandbox[cfg.var];
  } else {
    // 搜索 sandbox 中第一个大对象
    const candidates = Object.keys(sandbox).filter(k => {
      const v = sandbox[k];
      return v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 3;
    });
    if (candidates.length > 0) {
      kb = sandbox[candidates[0]];
      console.error(`  🔍 找到变量: ${candidates[0]} (${Object.keys(kb).length} keys)`);
    }
  }

  if (!kb) {
    // 特殊处理：数组型 KB（如 koujue-daily）
    const arrMatch = code.match(/(?:const|var|let)\s+([A-Z_][A-Z0-9_]+)\s*=\s*\[/);
    if (arrMatch) {
      const varName = arrMatch[1];
      try {
        const patched = processed.replace(
          new RegExp(`(?:const|let|var)\\s+${varName}\\s*=\\s*\\[`),
          `var ${varName} = [`
        );
        const fn = new Function('window', 'document', patched + `\n; return { ${varName} };`);
        const res = fn({}, mockDocument) || {};
        if (res[varName] && Array.isArray(res[varName]) && res[varName].length > 3) {
          kb = res[varName];
          console.error(`  🔍 数组补丁: ${varName} (${kb.length} items)`);
        }
      } catch (e) {
        // ignore
      }
    }
  }

  // 特殊处理：IIFE + global 注入型（liuyue-kb）
  if (!kb && code.includes('global.')) {
    const globalMatch = code.match(/global\.([A-Z_][A-Z0-9_]*)\s*=/);
    if (globalMatch) {
      const varName = globalMatch[1];
      try {
        const globalStub = {};
        const fn = new Function('window', 'document', 'global',
          processed + `\n; return global;`);
        const res = fn(globalStub, mockDocument, globalStub) || {};
        if (res[varName]) {
          kb = res[varName];
          console.error(`  🔍 global 注入: ${varName}`);
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (!kb) {
    console.error(`  ❌ 未找到 KB 对象`);
    continue;
  }

  const topKeys = Array.isArray(kb)
    ? kb.map((_, i) => i)
    : Object.keys(kb).filter(k => typeof kb[k] === 'object' && kb[k] !== null);
  console.error(`  📊 ${topKeys.length} 个顶层 section`);

  let count = 0;
  for (const key of topKeys) {
    const entry = extractSection(kb, key, cfg.module, cfg.title);
    if (entry && entry.content.length >= 20) {
      allEntries.push(entry);
      count++;
    }
  }
  console.error(`  ✅ 提取 ${count} 条`);
}

// 输出
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(allEntries, null, 2));
console.error(`\n📦 总计: ${allEntries.length} 条 → ${OUT}`);
