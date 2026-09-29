#!/usr/bin/env node
/**
 * preheat-yilin-baihua.js — 焦氏易林繇辞白话串讲缓存预热
 * ============================================================
 * 键空间：jy-yilin.json 4020 条（缺文 76 条自动跳过）。
 * 生成器：本地 MLX-v5（127.0.0.1:8960，OpenAI 兼容），零成本、断点续跑。
 * 缓存：server/data/jy-yilin-baihua.json（与服务端共用，mkdir 锁 + 读-合-写）。
 *
 * 用法：node scripts/preheat-yilin-baihua.js [--limit 150] [--sleep 200] [--dry]
 * 建议：launchd 每晚 03:40 一批 300 条，约两周铺完。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'server', 'data');
const TABLE_PATH = path.join(DATA, 'jy-yilin.json');
const CACHE_PATH = path.join(DATA, 'jy-yilin-baihua.json');
const LOCK_PATH = path.join(DATA, '.jybh.lock');
const MLX_BASE = process.env.MLX_BASE || 'http://127.0.0.1:8960';

const args = process.argv.slice(2);
function argVal(name, dflt) {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
}
const LIMIT = parseInt(argVal('limit', '150'), 10);
const SLEEP = parseInt(argVal('sleep', '200'), 10);
const DRY = args.includes('--dry');

function readJson(p, dflt) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return dflt; }
}
function lock() {
  for (let i = 0; i < 30; i++) {
    try { fs.mkdirSync(LOCK_PATH); return true; } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const wait = 100 + i * 50;
      const end = Date.now() + wait;
      while (Date.now() < end) {} // 短任务自旋足够
    }
  }
  return false;
}
function unlock() { try { fs.rmdirSync(LOCK_PATH); } catch (_) {} }
function mergeWrite(newEntries) {
  if (!lock()) throw new Error('缓存锁获取超时');
  try {
    const disk = readJson(CACHE_PATH, {});
    const merged = Object.assign({}, disk, newEntries);
    const tmp = CACHE_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(merged, null, 0), 'utf8');
    fs.renameSync(tmp, CACHE_PATH);
    return Object.keys(merged).length;
  } finally { unlock(); }
}

const SYS = '你是古籍今译助手。把《焦氏易林》繇辞译成通俗现代汉语。规则：①紧扣字面意象直译，2到3句；②只译画面与大意，不断吉凶、不发挥、不加命理断语；③生僻字随文括注拼音；④开头不要任何称呼，直接给译文。';

async function genOne(key, hit) {
  const [ben, bian] = key.split('|');
  const notePart = (hit.note && !/^(無註|無注|註未詳|注未詳|未詳)$/.test(hit.note)) ? `\n旧注：${hit.note}` : '';
  const body = {
    messages: [
      { role: 'system', content: SYS },
      { role: 'user', content: `繇辞（${ben}之${bian}）：${hit.verse}${notePart}\n\n请给出白话串讲。` }
    ],
    max_tokens: 300
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => { try { ctrl.abort(); } catch (_) {} }, 70000);
  try {
    const resp = await fetch(MLX_BASE + '/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: ctrl.signal
    });
    if (!resp.ok) throw new Error('mlx HTTP ' + resp.status);
    const data = await resp.json();
    const text = cleanText((data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim());
    if (!text || text.length < 8) throw new Error('空回复');
    return text;
  } finally { clearTimeout(timer); }
}

// 清洗 3B 小模型泄漏的特殊token与模板残片（<s></s><|...|> 及行首孤立角色词）
function cleanText(t) {
  return String(t)
    .replace(/<\/?s>|<\|[a-z_|]+\|?>/gi, ' ')
    .replace(/^(assistant|助手|译文|白话)[:：]/i, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

(async () => {
  const table = (readJson(TABLE_PATH, {}).table) || {};
  const cache = readJson(CACHE_PATH, {});
  const todo = Object.keys(table).filter(k => !cache[k]).slice(0, LIMIT);
  console.log(`[preheat] 总 ${Object.keys(table).length} · 已缓存 ${Object.keys(cache).length} · 本批 ${todo.length}（limit=${LIMIT}）`);
  if (DRY) { console.log('[dry] 前 5 键:', todo.slice(0, 5)); return; }
  // MLX 探活
  try {
    const probe = await fetch(MLX_BASE + '/v1/models', { signal: AbortSignal.timeout(5000) });
    if (!probe.ok) throw new Error('HTTP ' + probe.status);
  } catch (e) {
    console.error('[preheat] MLX 8960 不可用：', e.message, '——本批终止');
    process.exit(2);
  }
  let ok = 0, fail = 0;
  const batch = {};
  for (const key of todo) {
    try {
      const text = await genOne(key, table[key]);
      batch[key] = { baihua: text, provider: 'mlx-v5-preheat', ts: new Date().toISOString() };
      ok++;
      if (ok % 20 === 0) {
        const total = mergeWrite(batch);
        for (const k of Object.keys(batch)) delete batch[k];
        console.log(`[preheat] ${ok}/${todo.length} 已落盘，缓存总量 ${total}`);
      }
    } catch (e) {
      fail++;
      console.warn(`[preheat] ${key} 失败：${e.message}`);
      if (fail >= 5) { console.error('[preheat] 连续失败过多，终止本批'); break; }
    }
    if (SLEEP > 0) await new Promise(r => setTimeout(r, SLEEP));
  }
  let total = Object.keys(cache).length;
  if (Object.keys(batch).length) total = mergeWrite(batch);
  console.log(`[preheat] 完批：成 ${ok} 败 ${fail}，缓存总量 ${total}/4020`);
  process.exit(fail > 0 && ok === 0 ? 1 : 0);
})();
