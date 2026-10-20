#!/usr/bin/env node
/**
 * R478 · 言值(全量) + 权威知识库 蒸馏提取器
 * 
 * 言值：16 个 entry（前轮只采到 2 个，因为大部分用 principles+scenarios 结构）
 * 权威：单文件 JSON，含 bazi/ziwei/qimen/liuyao/liuren/meihua/fengshui/naming/tcm
 */

const fs = require('fs');
const path = require('path');

const KB_DIR = path.resolve(__dirname, '../knowledge');
const OUT = path.resolve(__dirname, '../.openclaw/tmp/r478-extracted.json');

let allEntries = [];
let entrySeq = 0;

function makeEntry(module, title, content, tags, category, source, sourceIds, confidence) {
  const entryId = `R478-${module}-${String(++entrySeq).padStart(4, '0')}`;
  return {
    entry_id: entryId,
    module,
    title,
    content: content.slice(0, 8000),
    tags: tags.filter(Boolean).join(','),
    keywords: category,
    category,
    confidence: confidence || 0.85,
    source: source || `local-kb:${module}`,
    source_ids: sourceIds || `local-kb:${module}`,
  };
}

// ═══════════════════════════════════════════
// 言值 (YANZHI_KNOWLEDGE) — 16 entries
// ═══════════════════════════════════════════
console.error('📖 yanzhi-knowledge-base.js...');
{
  const fp = path.join(KB_DIR, 'yanzhi-knowledge-base.js');
  const code = fs.readFileSync(fp, 'utf-8');
  const fn = new Function('window', code + '\n; return window;');
  const w = fn({});
  const kb = w.YANZHI_KNOWLEDGE;
  if (!kb) { console.error('  ❌ YANZHI_KNOWLEDGE not found'); }
  else {
    let count = 0;
    for (const [key, v] of Object.entries(kb)) {
      if (!v || typeof v !== 'object') continue;
      
      // Build rich content from all available fields
      let parts = [];
      if (v.desc) parts.push('## 概述\n' + v.desc);
      if (v.intro) parts.push('## 导论\n' + v.intro);
      if (v.principles && Array.isArray(v.principles) && v.principles.length > 0) {
        parts.push('## 核心原则\n' + v.principles.map((p,i) => `${i+1}. ${p}`).join('\n'));
      }
      if (v.scenarios && Array.isArray(v.scenarios)) {
        for (const s of v.scenarios) {
          let sp = `### ${s.situation || '场景'}`;
          if (s.principle) sp += `\n**原则**: ${s.principle}`;
          if (s.do && Array.isArray(s.do)) sp += '\n✅ 做法:\n' + s.do.map(d => `- ${d}`).join('\n');
          if (s.dont && Array.isArray(s.dont)) sp += '\n🚫 禁忌:\n' + s.dont.map(d => `- ${d}`).join('\n');
          parts.push(sp);
        }
      }
      if (v.methods && Array.isArray(v.methods)) {
        for (const m of v.methods) {
          let mp = `### ${m.name || '方法'}`;
          if (m.desc) mp += `\n${m.desc}`;
          if (m.details && Array.isArray(m.details)) mp += '\n' + m.details.map(d => `- ${d}`).join('\n');
          parts.push(mp);
        }
      }
      if (v.shuli && Array.isArray(v.shuli)) {
        parts.push('## 数理表\n' + v.shuli.slice(0, 20).map(s => 
          `|${s.num}|${s.wuxing||'-'}|${s.jixiong||'-'}|${s.name||'-'}|${(s.meaning||'').slice(0,60)}|`
        ).join('\n'));
      }
      if (v.points && Array.isArray(v.points)) {
        parts.push('## 要点\n' + v.points.map((p,i) => `${i+1}. ${p}`).join('\n'));
      }
      
      const fullContent = parts.join('\n\n');
      if (fullContent.length < 30) continue;
      
      const tags = [...(v.tags || []), key, '言值'];
      allEntries.push(makeEntry(
        'yanzhi',
        v.title || key,
        fullContent,
        tags,
        v.title || key,
        'local-kb:yanzhi-knowledge-base.js',
        `local-kb:yanzhi-knowledge-base.js:${key}`,
        0.85
      ));
      count++;
    }
    console.error(`  ✅ ${count} entries`);
  }
}

// ═══════════════════════════════════════════
// 权威知识库 (AUTHORITATIVE_KNOWLEDGE) — JSON 单文件
// ═══════════════════════════════════════════
console.error('\n📖 authoritative-knowledge-base.js...');
{
  const fp = path.join(KB_DIR, 'authoritative-knowledge-base.js');
  const code = fs.readFileSync(fp, 'utf-8');
  // Extract JSON from `const AUTHORITATIVE_KNOWLEDGE = {...};`
  const jsonMatch = code.match(/const\s+AUTHORITATIVE_KNOWLEDGE\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!jsonMatch) { console.error('  ❌ Could not parse JSON'); }
  else {
    try {
      const kb = JSON.parse(jsonMatch[1]);
      const topKeys = Object.keys(kb);
      console.error(`  top-level keys: ${topKeys.join(', ')} (${topKeys.length})`);
      
      let count = 0;
      
      for (const [system, systemData] of Object.entries(kb)) {
        if (!systemData || typeof systemData !== 'object') continue;
        
        // Module mapping
        const modMap = {
          bazi: 'bazi', ziwei: 'ziwei', qimen: 'qimen',
          liuyao: 'liuyao', liuren: 'liuren', meihua: 'meihua',
          fengshui: 'fengshui', naming: 'naming', tcm: 'tcm',
          wuxing: 'wuxing', yijing: 'yijing'
        };
        const mod = modMap[system] || system;
        
        // Process each sub-section
        for (const [section, sectionData] of Object.entries(systemData)) {
          if (!sectionData || typeof sectionData !== 'object') continue;
          
          let contentParts = [];
          let title = sectionData.title || `${system}.${section}`;
          
          if (sectionData.overview) {
            if (typeof sectionData.overview === 'string') contentParts.push(sectionData.overview);
            else if (sectionData.overview.title) contentParts.push(`# ${sectionData.overview.title}\n${sectionData.overview.content || ''}`);
          }
          if (sectionData.classic_source) contentParts.push(`**典籍来源**: ${sectionData.classic_source}`);
          if (sectionData.content) {
            if (typeof sectionData.content === 'string') contentParts.push(sectionData.content);
            else if (Array.isArray(sectionData.content)) contentParts.push(sectionData.content.join('\n'));
          }
          if (sectionData.learning_path && Array.isArray(sectionData.learning_path)) {
            contentParts.push('## 学习路径\n' + sectionData.learning_path.map((s,i) => `${i+1}. ${s}`).join('\n'));
          }
          
          // Process sub-items (e.g., bazi.ganzhi, bazi.shishen, etc.)
          for (const [subKey, subVal] of Object.entries(sectionData)) {
            if (['title', 'overview', 'classic_source', 'content', 'learning_path', 'difficulty'].includes(subKey)) continue;
            if (!subVal || typeof subVal !== 'object') continue;
            
            let subTitle = subVal.title || subKey;
            let subContent = '';
            if (subVal.content) {
              if (typeof subVal.content === 'string') subContent = subVal.content;
              else if (Array.isArray(subVal.content)) subContent = subVal.content.join('\n');
            }
            if (subVal.description) subContent = subVal.description + (subContent ? '\n' + subContent : '');
            if (subVal.overview && typeof subVal.overview === 'string') subContent = subVal.overview + (subContent ? '\n' + subContent : '');
            if (subVal.principles && Array.isArray(subVal.principles)) {
              subContent += '\n\n' + subVal.principles.map((p,i) => `${i+1}. ${p}`).join('\n');
            }
            if (subVal.details && Array.isArray(subVal.details)) {
              subContent += '\n\n' + subVal.details.join('\n');
            }
            if (subVal.items && Array.isArray(subVal.items)) {
              subContent += '\n\n' + subVal.items.map(it => {
                if (typeof it === 'string') return `- ${it}`;
                if (it.name && it.meaning) return `- **${it.name}**: ${it.meaning}`;
                return `- ${JSON.stringify(it).slice(0, 120)}`;
              }).join('\n');
            }
            
            if (subContent.length > 30) {
              contentParts.push(`## ${subTitle}\n${subContent}`);
            }
          }
          
          const fullContent = contentParts.join('\n\n');
          if (fullContent.length < 50) continue;
          
          const tags = [system, section, '权威知识库', mod];
          if (sectionData.difficulty) tags.push(sectionData.difficulty);
          
          allEntries.push(makeEntry(
            mod,
            title,
            fullContent,
            tags,
            `${system}·${section}`,
            'local-kb:authoritative-knowledge-base.js',
            `local-kb:authoritative-kb:${system}:${section}`,
            0.88
          ));
          count++;
        }
      }
      console.error(`  ✅ ${count} entries`);
    } catch(e) {
      console.error(`  ❌ JSON parse error: ${e.message}`);
    }
  }
}

fs.writeFileSync(OUT, JSON.stringify(allEntries, null, 2));
console.log(JSON.stringify({ ok: true, total: allEntries.length, file: OUT }));
