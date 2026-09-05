#!/usr/bin/env node
/**
 * selftest.js — capability-mingli-paipan-v1.1 自检
 * 5 个排盘用例（奇门/六爻/梅花/六壬/紫微），验证引擎包在消费方环境可用。
 * 运行：node selftest.js（自动以 NODE_PATH 重执行，覆盖 lunar-typescript/iztro）
 */
'use strict';
const path = require('path');
const fs = require('fs');

// ── 依赖解析：找到含 lunar-typescript 的 node_modules，以 NODE_PATH 重执行一次 ──
if (!process.env._PAIPAN_SELFTEST_REEXEC) {
  const candidates = [
    process.env.MINGLI_NODE_MODULES || '',
    path.join(process.env.HOME || '', '.openclaw-autoclaw/workspace/projects/mingli-baojian/node_modules'),
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(path.join(p, 'lunar-typescript'))) {
      const { spawnSync } = require('child_process');
      const env = { ...process.env, NODE_PATH: p + (process.env.NODE_PATH ? ':' + process.env.NODE_PATH : ''), _PAIPAN_SELFTEST_REEXEC: '1' };
      const r = spawnSync(process.execPath, [__filename], { stdio: 'inherit', env });
      process.exit(r.status === null ? 1 : r.status);
    }
  }
  console.warn('WARN: 未找到 lunar-typescript 依赖，按零依赖引擎尝试（可能降级）');
}

const wrapper = require('./code/bazi-engine-wrapper.js');

const CASES = [
  { engine: 'qimen', data: { year: 2026, month: 8, day: 27, hour: 20 } },
  { engine: 'liuyao', data: { year: 2026, month: 8, day: 27, hour: 20 } },
  { engine: 'meihua', data: { year: 2026, month: 8, day: 27, hour: 20 } },
  { engine: 'liuren', data: { year: 2026, month: 8, day: 27, hour: 20 } },
  // ziwei 契约形态 {date, time, gender}，并校验关键字段非空（防解析回归）
  { engine: 'ziwei', data: { date: '1990-05-15', time: '14:00', gender: '男' },
    check: (d) => d && d.year && d.yearGanZhi && Array.isArray(d.palaces) && d.palaces.length === 12 },
];

let pass = 0;
for (const c of CASES) {
  const r = wrapper[c.engine](c.data);
  let ok = r && r.ok === true && r.data;
  if (ok && c.check) ok = !!c.check(r.data);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${c.engine} -> ${ok ? (r.engine || 'ok') : (r && r.error)}`);
  if (ok) pass++;
}
console.log(`selftest: ${pass}/${CASES.length} passed`);
process.exit(pass === CASES.length ? 0 : 1);
