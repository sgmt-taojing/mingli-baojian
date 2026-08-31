#!/usr/bin/env node
/**
 * text-icon-scan.js — 「文字作为标识」静态扫描（全平台红线巡检）
 * 规则：icon/glyph/avatar/logo/mark 类容器内不得出现汉字；
 *       tab/card-title/badge 类容器不得以「单汉字+空格」作伪图标前缀。
 * 用法：node scripts/text-icon-scan.js   → 命中即 exit 1 并列出位置
 * 挂载：ui-smoke-daily.sh 每日 21:17 随回归一起跑。
 */
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..', 'app');
const CJK = '[\\u4e00-\\u9fff]';

// 豁免：文本标签（图标旁的名字/副标题）、命盘地图文字标记、JS 动态填充的用户头像首字
const EXCLUDE_CLASS = /(icon-name|icon-sub|fp-marker|user-avatar|card-avatar)/;

const RULES = [
  {
    name: 'icon/glyph 容器内含汉字',
    re: new RegExp(`<(div|span|i|b)[^>]*class="([^"]*(icon|glyph|avatar|logo|mark)[^"]*)"[^>]*>${CJK}{1,4}<`, 'g'),
    clsGroup: 2,
  },
  {
    name: 'hero-seal/symbol 徽章容器内含汉字',
    re: new RegExp(`<(div|span|i|b)[^>]*class="([^"]*(hero-seal|symbol)[^"]*)"[^>]*>${CJK}{1,4}[️]?<`, 'g'),
    clsGroup: 2,
  },
  {
    name: 'icon-glyph 内联 SVG 含汉字 text',
    re: new RegExp(`icon-glyph[^>]*>.*<text[^>]*>${CJK}+<\\/text>`, 'g'),
    clsGroup: null,
  },
  {
    name: 'tab/card-title/badge 单汉字伪图标前缀',
    re: new RegExp(`<(div|span|button|a)[^>]*class="([^"]*(id-tab|nav-tab|card-title|badge|wz-card-title|ms-group-badge)[^"]*)"[^>]*>${CJK} [^<]{1,12}<`, 'g'),
    clsGroup: 2,
  },
  {
    name: 'JS 字符串内 icon 容器含汉字',
    re: new RegExp(`class="(icon)">${CJK}{1,4}<`, 'g'),
    clsGroup: 1,
  },
];

let hits = 0;
for (const f of fs.readdirSync(APP).filter(f => f.endsWith('.html'))) {
  const text = fs.readFileSync(path.join(APP, f), 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(line)) !== null) {
        if (EXCLUDE_CLASS.test(m[rule.clsGroup] || '')) continue;
        hits++;
        console.log(`✗ ${f}:${i + 1} [${rule.name}] ${m[0].slice(0, 80)}`);
      }
    }
  });
}

if (hits) {
  console.log(`\n文字标识扫描：${hits} 处命中（红线：禁止文字作为卡片/图标标识）`);
  process.exit(1);
}
console.log('✓ 文字标识扫描通过（icon/glyph/tab/badge 容器无汉字标识）');
