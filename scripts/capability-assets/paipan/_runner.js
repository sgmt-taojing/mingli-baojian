#!/usr/bin/env node
/** _runner.js — paipan_bridge.py 的 Node 执行入口（CLI 单引擎单次调用）
 *  用法1（位置参数，向后兼容）: node _runner.js <engine> <year> <month> <day> <hour>
 *  用法2（JSON 全参数）:        node _runner.js <engine> '{"date":"1990-05-15","time":"14:00","gender":"男"}'
 */
'use strict';
const wrapper = require('./bazi-engine-wrapper.js');
const [engine, a2, a3, a4, a5] = process.argv.slice(2);
const data = a2 && a2.trim().startsWith('{')
  ? JSON.parse(a2)
  : { year: a2, month: a3, day: a4, hour: a5 };
if (typeof wrapper[engine] !== 'function') {
  console.log(JSON.stringify({ ok: false, error: `未知引擎 ${engine}` }));
  process.exit(0);
}
const r = wrapper[engine](data);
console.log(JSON.stringify(r));
