/* pinyin.js — 汉字→首字母/全拼 离线映射（R790）
 *
 * 数据源 server/kb-store/pinyin-map.json（pypinyin 离线生成，4,089 字，
 * 多音字保留全部首字母）。运行期零依赖：一次加载进内存 Map。
 *
 * 用法：
 *   const py = require('./pinyin');
 *   py.variants('四君子汤')   → ['sjzt']
 *   py.variants('党参')       → ['dcs', 'dsc']（多音字展开，上限 8 组）
 *   py.full('四君子汤')       → 'sijunzitang'
 *   py.isLatin('sjz')         → true
 */
'use strict';
const fs = require('fs');
const path = require('path');

let _map = null;
function map() {
  if (_map) return _map;
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'pinyin-map.json'), 'utf8'));
    _map = new Map();
    for (const [ch, v] of Object.entries(raw)) {
      const bar = v.indexOf('|');
      _map.set(ch, { inis: v.slice(0, bar).split(','), py: v.slice(bar + 1) });
    }
  } catch (e) {
    console.error('[pinyin] 映射加载失败:', e.message);
    _map = new Map();
  }
  return _map;
}

/* 逐字首字母展开为变体组合（多音字分叉），超过 cap 组时截断保主读音 */
function variants(text, cap) {
  const m = map();
  const limit = cap || 8;
  let acc = [''];
  for (const ch of String(text || '')) {
    if (/[a-z0-9]/i.test(ch)) {           // 字母数字原样小写并入
      acc = acc.map(s => s + ch.toLowerCase());
      continue;
    }
    const rec = m.get(ch);
    if (!rec) {                            // 未收录字符：阻断前缀匹配，用通配占位
      acc = acc.map(s => s + '·');
      continue;
    }
    const next = [];
    for (const s of acc) {
      for (const ini of rec.inis) {
        next.push(s + ini);
        if (next.length >= limit) break;
      }
      if (next.length >= limit) break;
    }
    acc = next;
  }
  return acc;
}

/* 主读音全拼（连写小写） */
function full(text) {
  const m = map();
  let out = '';
  for (const ch of String(text || '')) {
    if (/[a-z0-9]/i.test(ch)) { out += ch.toLowerCase(); continue; }
    const rec = m.get(ch);
    out += rec ? rec.py : '';
  }
  return out;
}

function isLatin(s) {
  return /^[a-z0-9]+$/i.test(String(s || '').trim());
}

module.exports = { variants, full, isLatin };
