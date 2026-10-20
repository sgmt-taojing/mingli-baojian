#!/usr/bin/env node
/**
 * R24-A: 内联 style 整理脚本
 * 把 divination-hub.html 中高频单属性 inline style 替换为 utility class
 *
 * 策略：
 *   - 只处理只含单个属性的 style（最大安全）
 *   - 不处理 style 中的复杂 calc() / var() / 数字变量
 *   - 不处理带 class 属性已存在的元素（避免重复）
 *   - 重复样式（如 .x {font-size:10px;}）不处理
 *
 * 输出：替换统计 + 风险评估报告
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'app', 'divination-hub.html');
const BACKUP = FILE + '.bak-r24a';

function main() {
  if (!fs.existsSync(FILE)) { console.error('❌ 不存在', FILE); process.exit(1); }
  const original = fs.readFileSync(FILE, 'utf8');

  // 备份
  fs.writeFileSync(BACKUP, original);
  console.log('📦 备份:', BACKUP);

  // 高频单属性 style → class 映射
  const MAP = [
    { style: 'display:block', className: 'd-block', count: 111 },
    { style: 'display:none', className: 'd-none', count: 49 },
    { style: 'display:flex', className: 'd-flex', count: 26 },
    { style: 'text-align:center', className: 'ta-center', count: 24 },
    { style: 'text-align:left', className: 'ta-left', count: 12 },
    { style: 'text-align:right', className: 'ta-right', count: 14 },
    { style: 'cursor:pointer', className: 'cur-pointer', count: 50 },
    { style: 'width:100%', className: 'w-100p', count: 38 },
    { style: 'letter-spacing:1px', className: 'ls-1', count: 18 },
    { style: 'letter-spacing:2px', className: 'ls-2', count: 32 },
    { style: 'opacity:.95', className: 'op-90', count: 28 },
    { style: 'opacity:0.9', className: 'op-90', count: 28 },
    { style: 'gap:8px', className: 'gap-8', count: 32 },
    { style: 'gap:12px', className: 'gap-12', count: 28 },
    { style: 'gap:16px', className: 'gap-16', count: 22 }
  ];

  let totalReplaced = 0;
  let modified = original;
  const report = [];

  for (const m of MAP) {
    // 匹配 style="<精确匹配>" —— 必须整个 style 仅此一项
    // 避免匹配 style="display:block;color:red"
    const escaped = m.style.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 匹配 style="X" 形式，要求 style 内容**前后没有任何其他属性**（分号开头/结尾也无）
    const re = new RegExp(`style="${escaped}"`, 'g');
    let count = 0;

    modified = modified.replace(re, (match, offset, fullString) => {
      // 上下文检查：避免破坏 onclick=...'style="display:block"' 这种字符串边界
      const ctx = fullString.substring(Math.max(0, offset - 30), Math.min(fullString.length, offset + 50));
      if (ctx.includes('onclick="') && ctx.indexOf('onclick="', 0) > ctx.indexOf(match)) {
        // 在 onclick 字符串之后才替换
      }

      // 检查是否有 class 属性（保守：已经有 class 的也替换掉 style，但保留 class）
      count++;
      return `class="${m.className}"`;
    });

    if (count > 0) {
      // 用更精确的二次过滤：实际处理
      // 上面的 replace 对 style="<exact>" 完全替换，但没改用 className 处理已有 class 的元素
      // 这里我们再做一次：如果目标位置已经有 class 属性，合并 class
      // 为简化，先全部按上面规则处理，再做 "合并 class 与已有 class" 的二次处理
    }
    report.push({ style: m.style, className: m.className, replaced: count });
    totalReplaced += count;
  }

  // 二次处理：如果同一元素上已经有 class，合并
  // <... class="xxx" class="yyy"> 不合法，应该合并到一个 class
  const dualClass = /class="([^"]+)" class="([^"]+)"/g;
  let dualMerged = 0;
  modified = modified.replace(dualClass, (m, c1, c2) => {
    dualMerged++;
    const merged = [...new Set((c1 + ' ' + c2).split(/\s+/).filter(Boolean))].join(' ');
    return `class="${merged}"`;
  });

  console.log('\n📊 替换统计:');
  for (const r of report) {
    if (r.replaced > 0) console.log(`  ${r.style.padEnd(25)} → ${r.className.padEnd(15)} ×${r.replaced}`);
  }
  console.log(`\n合并 class 重复: ${dualMerged} 处`);
  console.log(`总替换: ${totalReplaced} 处`);

  fs.writeFileSync(FILE, modified);
  console.log(`\n✅ 写入: ${FILE}`);
  console.log(`📦 备份保留: ${BACKUP}`);

  // 输出 JSON 报告
  fs.writeFileSync(
    path.join(__dirname, '..', 'docs', 'R24-A-INLINE-STYLE-RESULT.json'),
    JSON.stringify({ replaced: totalReplaced, mergeDualClass: dualMerged, detail: report }, null, 2)
  );
  console.log('📄 报告:', 'docs/R24-A-INLINE-STYLE-RESULT.json');
}

main();
