#!/usr/bin/env node
/**
 * 倪师知识库自动结构化脚本
 * 把 nihaisha-kb.js 的 33 个模块转换为标准 KB 条目格式
 * 输出：knowledge/nihaisha-structured-entries.js
 */

const fs = require('fs');
const path = require('path');

const KB_PATH = path.join(__dirname, '..', 'knowledge', 'nihaisha-kb.js');
const OUT_PATH = path.join(__dirname, '..', 'knowledge', 'nihaisha-structured-entries.js');

const src = fs.readFileSync(KB_PATH, 'utf8');
const fixed = src.replace('window.NIHAISHA_KB', 'global.NIHAISHA_KB');
eval(fixed);
const kb = global.NIHAISHA_KB;

// 模块 → 分类映射
const CATEGORY_MAP = {
  shanghanlun: { category: '伤寒论', difficulty: 'advanced' },
  jingui: { category: '金匮要略', difficulty: 'advanced' },
  huangdi: { category: '黄帝内经', difficulty: 'intermediate' },
  bencao: { category: '神农本草', difficulty: 'intermediate' },
  acupuncture: { category: '针灸大成', difficulty: 'advanced' },
  bagang: { category: '八纲辨证', difficulty: 'intermediate' },
  'zhongjing-xinfa': { category: '仲景心法', difficulty: 'advanced' },
  fuyang: { category: '扶阳论坛', difficulty: 'intermediate' },
  yijinjing: { category: '易筋经', difficulty: 'beginner' },
  liangdong: { category: '梁冬对话', difficulty: 'beginner' },
  stanford: { category: '斯坦福演讲', difficulty: 'beginner' },
  tianji: { category: '天纪', difficulty: 'advanced' },
  'clinical-cases': { category: '临床医案', difficulty: 'advanced' },
  'formula-patterns': { category: '方剂方证', difficulty: 'advanced' },
  'symptom-index': { category: '症状索引', difficulty: 'beginner' },
  'six-channel': { category: '六经辨证', difficulty: 'intermediate' },
  'lesson-map': { category: '课程地图', difficulty: 'beginner' },
  'learning-entry': { category: '学习入口', difficulty: 'beginner' },
  'beginner-questions': { category: '入门问答', difficulty: 'beginner' },
  'usage-scenarios': { category: '使用场景', difficulty: 'beginner' },
  ebooks: { category: '古籍溯源', difficulty: 'intermediate' },
  'audio-collection': { category: '音频合集', difficulty: 'beginner' },
  'notes-shanghan': { category: '伤寒论笔记', difficulty: 'intermediate' },
  'notes-jingui': { category: '金匮要略笔记', difficulty: 'intermediate' },
  'notes-huangdi': { category: '黄帝内经笔记', difficulty: 'intermediate' },
  'notes-bencao': { category: '神农本草笔记', difficulty: 'intermediate' },
  'notes-acupuncture-dacheng': { category: '针灸大成笔记', difficulty: 'intermediate' },
  'notes-shanghan-scan-essence': { category: '伤寒论扫描要点', difficulty: 'advanced' },
  'notes-bencao-scan-essence': { category: '神农本草扫描要点', difficulty: 'advanced' },
  'notes-huangdi-scan-essence': { category: '黄帝内经扫描要点', difficulty: 'intermediate' },
  'notes-acupuncture-dacheng-scan-essence': { category: '针灸大成扫描要点', difficulty: 'intermediate' },
};

const entries = [];
let moduleId = 1;

// 遍历所有模块（排除 _meta / index / 两个空模块）
const skipKeys = ['_meta', 'index', 'crossModuleThemes', 'mingliCorrelation'];

Object.keys(kb).forEach(key => {
  if (skipKeys.includes(key)) return;
  
  const mod = kb[key];
  if (!mod || typeof mod !== 'object') return;
  
  const cat = CATEGORY_MAP[key] || { category: '综合', difficulty: 'intermediate' };
  const title = mod.title || mod.name || key;
  const source = mod.source || '倪海厦课程';
  const content = mod.content || mod.rawContent || '';
  
  if (!content || content.length < 50) return; // 跳过空/极短模块
  
  // 策略：长内容按段落切分（>5000 chars 按 \n\n 切）
  const PARAGRAPH_THRESHOLD = 5000;
  const MAX_ENTRY_CHARS = 3000;
  
  if (content.length <= PARAGRAPH_THRESHOLD) {
    // 短模块：整条入库
    entries.push({
      id: `nihaisha-${String(moduleId).padStart(3, '0')}`,
      name: title,
      source: `倪海厦·${cat.category}`,
      level: '📘 实践',
      content: content,
      refs: [source],
      category: cat.category,
      difficulty: cat.difficulty,
      module: key,
      charCount: content.length
    });
    moduleId++;
  } else {
    // 长模块：按段落切分
    const paragraphs = content.split(/\n\n+/);
    let chunk = '';
    let chunkIdx = 1;
    
    for (const para of paragraphs) {
      if ((chunk + para).length > MAX_ENTRY_CHARS) {
        if (chunk) {
          entries.push({
            id: `nihaisha-${String(moduleId).padStart(3, '0')}`,
            name: `${title}（${chunkIdx}）`,
            source: `倪海厦·${cat.category}`,
            level: '📘 实践',
            content: chunk,
            refs: [source],
            category: cat.category,
            difficulty: cat.difficulty,
            module: key,
            chunkIndex: chunkIdx,
            charCount: chunk.length
          });
          moduleId++;
          chunkIdx++;
        }
        chunk = para;
      } else {
        chunk = chunk ? chunk + '\n\n' + para : para;
      }
    }
    // 最后一块
    if (chunk) {
      entries.push({
        id: `nihaisha-${String(moduleId).padStart(3, '0')}`,
        name: `${title}（${chunkIdx}）`,
        source: `倪海厦·${cat.category}`,
        level: '📘 实践',
        content: chunk,
        refs: [source],
        category: cat.category,
        difficulty: cat.difficulty,
        module: key,
        chunkIndex: chunkIdx,
        charCount: chunk.length
      });
      moduleId++;
    }
  }
});

// 生成输出文件
const output = `// 倪师知识库 - 结构化条目（自动生成）
// 生成时间: ${new Date().toISOString()}
// 源文件: nihaisha-kb.js (881KB)
// 条目数: ${entries.length}
// 说明: 从 nihaisha-kb.js 的 33 个模块自动切分生成，符合 KB API 标准 schema

window.NIHAISHA_STRUCTURED = ${JSON.stringify(entries, null, 2)};
`;

fs.writeFileSync(OUT_PATH, output, 'utf8');
console.log(`✅ 生成 ${entries.length} 条结构化条目 → ${OUT_PATH}`);
console.log(`   文件大小: ${(fs.statSync(OUT_PATH).size / 1024).toFixed(1)} KB`);
console.log(`   源模块数: 31 (排除 2 个空模块)`);
console.log(`   平均条目大小: ${(entries.reduce((s, e) => s + e.charCount, 0) / entries.length).toFixed(0)} chars`);
