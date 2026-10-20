#!/usr/bin/env node
/**
 * generate-tcm-sft-v2.js · TCM 训练数据大规模生成器
 * R102 修真（2026-08-12）：从 kb_formal 的 9 个 TCM 模块拉取条目
 * 生成 4 类 instruction-response 组合：
 *   1. 概念解释（什么是 X）
 *   2. 方剂解读（X 方的组成/功效/主治）
 *   3. 临床辨证（X 证的临床表现/治法/方药）
 *   4. 医理问答（X 的病因病机/治则）
 */
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'server', 'database', 'yidao.db');
const OUT_DIR = path.join(__dirname, '..', 'training-data', 'sft-tcm-massive');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// 9 个 TCM 模块
const TCM_MODULES = [
  { mod: 'tcm', label: '中医基础' },
  { mod: 'tcm-fangji', label: '中医方剂' },
  { mod: 'tcm-classical', label: '中医经典' },
  { mod: 'tcm-clinical', label: '中医临床' },
  { mod: 'tcm-acupuncture', label: '中医针灸' },
  { mod: 'tcm-diagnosis', label: '中医诊断' },
  { mod: 'tcm-herb', label: '中药本草' },
  { mod: 'tcm-zhongfu', label: '中医脏腑' },
  { mod: 'nihaisha-tcm', label: '倪海厦中医' },
];

// 4 类问答模板
const TEMPLATES = [
  {
    type: 'concept',
    q: (mod, content) => `请用通俗语言解释以下中医概念。\n\n【素材】\n${content.slice(0, 600)}\n\n要求：1) 用现代语言讲清核心含义；2) 给出 1-2 个临床应用场景；3) 避免晦涩古文。`,
  },
  {
    type: 'fangji',
    q: (mod, content) => `请解读这个中医方剂：\n\n【素材】\n${content.slice(0, 600)}\n\n要求：1) 列出方剂组成（药名+剂量）；2) 解释方义（君臣佐使）；3) 给出主治病症；4) 列出使用禁忌。`,
  },
  {
    type: 'zheng',
    q: (mod, content) => `请辨证分析以下病例：\n\n【素材】\n${content.slice(0, 600)}\n\n要求：1) 判断中医证型；2) 分析病因病机；3) 给出治法；4) 推荐方药。`,
  },
  {
    type: 'yili',
    q: (mod, content) => `请从中医理论回答：\n\n【素材】\n${content.slice(0, 600)}\n\n要求：1) 引用经典（《内经》《伤寒论》等）；2) 解释机理；3) 联系临床实际；4) 给出调护建议。`,
  },
];

// 占位回答生成（KB 数据为底，避免幻觉）
function genResponse(content, mod) {
  const trimmed = content.replace(/\s+/g, ' ').slice(0, 800);
  return `【${mod}·知识库引用】\n\n${trimmed}\n\n【知识图谱关联】\n- 脏腑：肝/心/脾/肺/肾（五脏系统）\n- 经典：《黄帝内经》《伤寒论》《金匮要略》\n- 八纲：阴阳/表里/寒热/虚实\n- 治法：汗/吐/下/和/温/清/消/补\n\n【临床提示】\n1. 实际诊疗需结合四诊（望闻问切）\n2. 用药需辨证论治，不可机械套方\n3. 急重病请及时就医\n\n【来源】命理宝鉴·中医知识库（${mod}模块）`;
}

const db = sqlite3(DB_PATH);
const sftCases = [];
const stats = {};

// 对每个模块生成
for (const { mod, label } of TCM_MODULES) {
  const rows = db.prepare(
    `SELECT entry_id, title, content, summary, keywords 
     FROM kb_formal 
     WHERE module = ? AND status = 'formal' AND length(content) >= 200
     ORDER BY hit_count DESC, last_hit DESC
     LIMIT 500`
  ).all(mod);
  
  let moduleCount = 0;
  for (const row of rows) {
    // 每条 KB 数据生成 2-3 个 SFT case（避免重复）
    const tplIndices = [0, 1, 3].filter(() => Math.random() > 0.3);
    for (const ti of tplIndices.slice(0, 2)) {
      const tpl = TEMPLATES[ti];
      sftCases.push({
        module: mod,
        type: tpl.type,
        instruction: tpl.q(label, row.content || row.summary || row.title),
        response: genResponse(row.content || row.summary || row.title, label),
        source: row.entry_id,
      });
      moduleCount++;
    }
  }
  stats[mod] = moduleCount;
  console.log(`[${mod}] ${rows.length} 条 KB → ${moduleCount} SFT case`);
}

// 写入文件
const outFile = path.join(OUT_DIR, `sft-tcm-${Date.now()}.jsonl`);
const stream = fs.createWriteStream(outFile);
for (const c of sftCases) {
  stream.write(JSON.stringify(c) + '\n');
}
stream.end();

console.log(`\n=== 生成完成 ===`);
console.log(`总计: ${sftCases.length} 条 SFT`);
console.log(`输出: ${outFile}`);
Object.entries(stats).forEach(([m, n]) => console.log(`  ${m}: ${n}`));
db.close();
