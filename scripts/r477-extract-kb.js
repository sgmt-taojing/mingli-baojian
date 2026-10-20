#!/usr/bin/env node
/**
 * R477 · 舒晗 + 倪海厦结构化 KB 提取器
 * 处理 shuhan-kb-combined.js (lessons→ppt/daotu) 和
 * nihaisha-structured-kb.js (118 条结构化条目)
 */

const fs = require('fs');
const path = require('path');

const KB_DIR = path.resolve(__dirname, '../knowledge');
const OUT = path.resolve(__dirname, '../.openclaw/tmp/r477-extracted.json');

let allEntries = [];
let entrySeq = 0;

// ─── 舒晗 (32 节课 PPT) ───
console.error('📖 shuhan-kb-combined.js (860KB)...');
{
  const fp = path.join(KB_DIR, 'shuhan-kb-combined.js');
  const code = fs.readFileSync(fp, 'utf-8');
  const fn = new Function('window', code + '\n; return window;');
  const w = fn({});
  const kb = w.SHUHAN_KB;
  if (!kb) { console.error('  ❌ window.SHUHAN_KB 未找到'); }
  else {
    const lessons = kb.lessons || {};
    const contentMap = kb.content || {};
    let count = 0;

    for (const [num, lesson] of Object.entries(lessons)) {
      if (typeof num !== 'string' || isNaN(parseInt(num))) continue;
      const title = lesson.title || `舒晗第${num}课`;
      const group = lesson.group || '综合';
      
      // content[num] → { title, ppt: "..." }
      const cntObj = contentMap[num] || {};
      let content = '';
      if (typeof cntObj.ppt === 'string') content = cntObj.ppt;
      else if (typeof cntObj === 'string') content = cntObj;

      if (content.length < 50) continue; // 跳过无实际内容

      const entryId = `R477-shuhan-${String(++entrySeq).padStart(4, '0')}`;
      
      // 提取关键词
      const tagWords = content.slice(0, 300)
        .replace(/[，。、；：""''（）《》【】\s\n#*\->]+/g, ' ')
        .split(' ')
        .filter(w => w.length >= 2 && w.length <= 10)
        .slice(0, 8);

      allEntries.push({
        entry_id: entryId,
        module: 'shuhan',
        title: `舒晗·${title}`,
        content: content.slice(0, 8000), // 限制长度
        tags: ['shuhan', '舒晗', group, ...tagWords].filter(Boolean).join(','),
        keywords: [group, title].filter(Boolean).join(','),
        category: `舒晗·${group}`,
        confidence: 0.85,
        source: 'local-kb:shuhan-kb-combined.js',
        source_ids: `local-kb:shuhan-kb-combined.js:lesson_${num}`,
      });
      count++;
    }
    console.error(`  ✅ ${count} entries`);
  }
}

// ─── 倪海厦结构化 (118 条) ───
console.error('📖 nihaisha-structured-kb.js (942KB)...');
{
  const fp = path.join(KB_DIR, 'nihaisha-structured-kb.js');
  const code = fs.readFileSync(fp, 'utf-8');
  const fn = new Function('window', code + '\n; return window;');
  const w = fn({});
  const kb = w.NIHAISHA_STRUCTURED_KB;
  if (!kb) { console.error('  ❌ window.NIHAISHA_STRUCTURED_KB 未找到'); }
  else {
    let count = 0;
    for (const [key, entry] of Object.entries(kb)) {
      if (!entry || typeof entry !== 'object') continue;
      if (!entry.content || (typeof entry.content === 'string' && entry.content.length < 50)) continue;

      const entryId = `R477-nihaisha-${String(++entrySeq).padStart(4, '0')}`;
      const title = entry.name || entry.id || key;
      const content = typeof entry.content === 'string' ? entry.content.slice(0, 8000) : JSON.stringify(entry.content).slice(0, 8000);
      const cat = entry.category || entry.module || '综合';
      const source = entry.source || '倪海厦';

      allEntries.push({
        entry_id: entryId,
        module: 'nihaisha',
        title: `倪海厦·${title}`,
        content,
        tags: ['nihaisha', '倪海厦', cat, source].filter(Boolean).join(','),
        keywords: [cat, title].filter(Boolean).join(','),
        category: `倪海厦·${cat}`,
        confidence: entry.level === '📘 实践' ? 0.85 : 0.80,
        source: 'local-kb:nihaisha-structured-kb.js',
        source_ids: `local-kb:nihaisha-structured-kb.js:${key}`,
      });
      count++;
    }
    console.error(`  ✅ ${count} entries`);
  }
}

// ─── 言值 (写作表达) ───
console.error('📖 yanzhi-knowledge-base.js (82KB)...');
try {
  const fp = path.join(KB_DIR, 'yanzhi-knowledge-base.js');
  const code = fs.readFileSync(fp, 'utf-8');
  const fn = new Function('window', code + '\n; return window;');
  const w = fn({});
  const kb = w.YANZHI_KNOWLEDGE;
  if (!kb) { console.error('  ❌ window.YANZHI_KB 未找到'); }
  else {
    let count = 0;
    for (const [key, val] of Object.entries(kb)) {
      if (!val || typeof val !== 'object') continue;
      let title = val.title || '';
      let contentArr = [];
      if (Array.isArray(val.content)) contentArr = val.content;
      else if (typeof val.content === 'string') contentArr = [val.content];
      else if (val.intro) contentArr = [val.intro];

      const contentText = contentArr.filter(c => typeof c === 'string' && c.length > 10).join('\n');
      if (contentText.length < 50) continue;

      const entryId = `R477-yanzhi-${String(++entrySeq).padStart(4, '0')}`;
      allEntries.push({
        entry_id: entryId,
        module: 'yanzhi',
        title: title || key,
        content: contentText.slice(0, 8000),
        tags: ['yanzhi', '言值', key].filter(Boolean).join(','),
        keywords: key,
        category: '言值写作',
        confidence: 0.85,
        source: 'local-kb:yanzhi-knowledge-base.js',
        source_ids: `local-kb:yanzhi-knowledge-base.js:${key}`,
      });
      count++;
    }
    console.error(`  ✅ ${count} entries`);
  }
} catch(e) { console.error(`  ⚠️ yanzhi: ${e.message}`); }

fs.writeFileSync(OUT, JSON.stringify(allEntries, null, 2));
console.log(JSON.stringify({ ok: true, total: allEntries.length, file: OUT }));
