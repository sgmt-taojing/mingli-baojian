#!/usr/bin/env node
/**
 * text-icon-fix.js — 文字标识批量图形化（配套 text-icon-scan.js）
 * 把 icon/glyph/tab/card-title 容器内的单汉字标识替换为语义对应的图形符号。
 * 豁免与扫描器一致：icon-name/icon-sub（文本标签）、fp-marker（盘面文字标记）、
 * user-avatar/card-avatar（JS 动态首字头像）。
 */
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..', 'app');

const MAP = {
  乾: '☰', 爻: '☷', 卦: '☯️', 道: '☯️', 舒: '☯️', 紫: '🔮', 奇: '🌀',
  拍: '📷', 诊: '🩺', 医: '⚕️', 眼: '👁️', 面: '🙂', 脉: '💓', 药: '💊', 菜: '🥬', 草: '🌿',
  人: '👤', 众: '👥', 名: '📛', 字: '🔤', 号: '🔢', 写: '✍️', 改: '✏️',
  宅: '🏠', 山: '⛰️', 店: '🏬', 商: '🏪', 企: '🏢', 建: '🏗️',
  星: '⭐', 历: '📅', 时: '⏰', 晨: '🌅', 夜: '🌙', 钟: '🔔', 铃: '🛎️',
  音: '🎵', 听: '🎧', 语: '💬', 问: '❓', 示: '📢', 赞: '👍', 败: '❌',
  图: '📈', 表: '📊', 卷: '📜', 经: '📖', 典: '📚', 记: '🗒️', 存: '💾', 夹: '📁',
  心: '❤️', 缘: '🪷', 莲: '🪷', 花: '🌸', 苗: '🌱', 落: '🍂', 麦: '🌾', 虫: '🐛',
  拜: '🙏', 修: '🧘', 福: '🧧', 庆: '🎊', 宝: '🏺', 珠: '📿',
  机: '📱', 卡: '💳', 存2: '💾', 币: '🪙', 财: '💰', 礼: '🎁', 箱: '📦',
  查: '🔍', 点: '📍', 标: '🏷️', 向: '🧭', 算: '🧮', 骰: '🎲', 尺: '📏',
  警: '⚠️', 因: '🧬', 盾: '🛡️', 锁: '🔒', 钥: '🔑', 证: '🪪', 设: '⚙️', 配: '⚙️',
  成: '✅', 更: '🔄', 出: '🚪', 化: '🦋', 飞: '🕊️', 光: '💡', 气: '🌬️', 知: '🧠', 具: '🧰', 车: '🚗', 冠: '👑',
};

const CJK = '\\u4e00-\\u9fff';
const EXCLUDE = /(icon-name|icon-sub|fp-marker|user-avatar|card-avatar)/;

const RULES = [
  // 容器型：<x class="...icon...">字<
  new RegExp(`(<(?:div|span|i|b)[^>]*class=")([^"]*(?:icon|glyph|avatar|logo|mark)[^"]*)("[^>]*>)([${CJK}]{1,4})(<)`, 'g'),
  // 前缀型：<x class="...card-title...">字 文本<
  new RegExp(`(<(?:div|span|button|a)[^>]*class=")([^"]*(?:id-tab|nav-tab|card-title|badge|wz-card-title|ms-group-badge)[^"]*)("[^>]*>)([${CJK}])( )`, 'g'),
];

let total = 0;
for (const f of fs.readdirSync(APP).filter(f => f.endsWith('.html'))) {
  const p = path.join(APP, f);
  let s = fs.readFileSync(p, 'utf8');
  let n = 0;
  for (const re of RULES) {
    s = s.replace(re, (m, pre, cls, mid, ch, tail) => {
      if (EXCLUDE.test(cls)) return m;
      const emoji = MAP[ch];
      if (!emoji) { console.log(`! 未映射 ${f}: ${ch}`); return m; }
      n++;
      return pre + cls + mid + emoji + tail;
    });
  }
  if (n) { fs.writeFileSync(p, s, 'utf8'); console.log(`✓ ${f}: ${n} 处`); total += n; }
}
console.log(`\n共修复 ${total} 处`);
