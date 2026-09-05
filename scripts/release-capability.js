#!/usr/bin/env node
/**
 * release-capability.js — 命理能力发版脚本（G21 · ADR-021）
 *
 * 定位：mingli-baojian 是命理能力的唯一源头与定版方。
 *   能力变更（引擎/规则/prompt）→ 本脚本打包 → 落共享 outbox → 登记 capability-registry。
 *   知识条目增量不走本通道（走 mingli-full.json 镜像通道）。
 *
 * 用法：
 *   node scripts/release-capability.js <capability-id> <version> "<变更说明>"
 * 示例：
 *   node scripts/release-capability.js paipan 1.2.0 "R778 年份区间扩至 1-9999 + 顶层生肖字段"
 *
 * 产出：
 *   _shared/sync-bus/outbox/capability-packs/<id>/<version>/{manifest.json, code/, ...}
 *   _shared/capability-registry.json releases[] 登记（含 rollback_ref 指向上一版）
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT = path.resolve(__dirname, '..');
const SERVER = path.join(PROJECT, 'server');
const PROJECTS_ROOT = path.resolve(PROJECT, '..');
const OUTBOX_ROOT = path.join(PROJECTS_ROOT, '_shared', 'sync-bus', 'outbox', 'capability-packs');
const REGISTRY = path.join(PROJECTS_ROOT, '_shared', 'capability-registry.json');

// ── 能力清单（源头文件映射）──
const CAPS = {
  paipan: {
    type: 'engine',
    name: '命理排盘引擎包（Node 五引擎 + 八字 Python 引擎）',
    // server/ 下源码 → 包内 code/ 同名
    serverFiles: [
      'qimen-engine-node.js', 'liuyao-engine-node.js', 'meihua-engine-node.js',
      'liuren-engine-node.js', 'ziwei-engine-node.js', 'ziwei-iztro-core.js',
      'true-solar.js', 'bazi-engine-wrapper.js',
    ],
    // server/ 源码 → 包内改名
    renamed: { 'paipan.py': 'paipan-bazi.py' },
    // scripts/capability-assets/paipan/ 下的包级资产
    assetDir: 'capability-assets/paipan',
    assetFiles: ['_runner.js', 'paipan_bridge.py', 'selftest.js'],
    contract: {
      entry: 'code/bazi-engine-wrapper.js',
      interface: {
        'qimen(data)': '{year,month,day,hour} -> {ok, engine, data}',
        'liuyao(data)': '{year,month,day,hour} -> {ok, engine, data}',
        'meihua(data)': '{year,month,day,hour} -> {ok, engine, data}',
        'liuren(data)': '{year,month,day,hour} -> {ok, engine, data}',
        'ziwei(data)': "{date:'YYYY-MM-DD', time:'HH:MM', gender?, isLunar?, lng?} 或 {year,month,day,hour,...} -> 见 ziwei-engine-node",
        bazi: 'Python 引擎：python3 code/paipan-bazi.py <年> <月> <日> <时> <分> --gender male|female [--lunar] [--lng 经度] --json（消费方统一走 paipan_bridge.paipan(\'bazi\', ...)）',
      },
      runtime_deps: {
        npm: ['lunar-typescript', 'iztro'],
        pip: ['lunar_python'],
        note: 'Node 依赖以 NODE_PATH 复用 mingli-baojian/node_modules；lunar_python 须安装于系统 python3',
      },
    },
    selftest: 'node selftest.js（5 用例）；PYTHONPATH=项目根 python3 paipan_bridge.py（6 用例含 bazi）',
  },
  'mingli-annotation-prompt': {
    type: 'prompt',
    name: '命理批注 prompt 资产包（AI 命理草案 + 命理师批注环节）',
    serverFiles: ['private-prompt-builder.js', 'prompt-overrides.json'],
    renamed: {},
    assetDir: null,
    assetFiles: [],
    contract: { entry: 'code/private-prompt-builder.js', note: 'prompt 资产快照；overrides 为 case 级指引增量' },
    selftest: 'node -e "require(\'./code/private-prompt-builder.js\')" （加载自检）',
  },
  'paipan-rules': {
    type: 'rules',
    name: '排盘规则/历法换算规则包（真太阳时等）',
    serverFiles: ['true-solar.js'],
    renamed: {},
    assetDir: null,
    assetFiles: [],
    contract: { entry: 'code/true-solar.js', note: '历法换算规则快照；引擎包已内嵌同源副本，本包供独立审计/比对' },
    selftest: 'node -e "require(\'./code/true-solar.js\')" （加载自检）',
  },
};

function semverCmp(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if (pa[i] !== pb[i]) return pa[i] - pb[i]; }
  return 0;
}

function gitHead(dir) {
  try { return execSync('git rev-parse --short HEAD', { cwd: dir }).toString().trim(); }
  catch (_) { return 'unknown'; }
}

function main() {
  const [capId, version, ...noteParts] = process.argv.slice(2);
  const note = noteParts.join(' ');
  const cap = CAPS[capId];
  if (!cap) { console.error(`未知能力 id：${capId}（可选：${Object.keys(CAPS).join(', ')}）`); process.exit(1); }
  if (!/^\d+\.\d+\.\d+$/.test(version || '')) { console.error('版本号须为 semver（如 1.2.0）'); process.exit(1); }
  if (!note) { console.error('请提供变更说明'); process.exit(1); }

  // 上一版（rollback_ref）
  const capOutRoot = path.join(OUTBOX_ROOT, capId);
  let prev = null;
  if (fs.existsSync(capOutRoot)) {
    const vers = fs.readdirSync(capOutRoot).filter(d => /^\d+\.\d+\.\d+$/.test(d)).sort(semverCmp);
    prev = vers.length ? vers[vers.length - 1] : null;
    if (prev === version) { console.error(`版本 ${version} 已存在于 outbox，勿重复发版`); process.exit(1); }
    if (prev && semverCmp(version, prev) <= 0) { console.error(`版本 ${version} 须大于现有最新版 ${prev}`); process.exit(1); }
  }

  const outDir = path.join(capOutRoot, version);
  const codeDir = path.join(outDir, 'code');
  fs.mkdirSync(codeDir, { recursive: true });

  // 1) server 源码快照
  for (const f of cap.serverFiles) {
    const src = path.join(SERVER, f);
    if (!fs.existsSync(src)) { console.error(`源头文件缺失：server/${f}`); process.exit(1); }
    fs.copyFileSync(src, path.join(codeDir, f));
  }
  for (const [srcName, dstName] of Object.entries(cap.renamed)) {
    const src = path.join(SERVER, srcName);
    if (!fs.existsSync(src)) { console.error(`源头文件缺失：server/${srcName}`); process.exit(1); }
    fs.copyFileSync(src, path.join(codeDir, dstName));
  }
  // 2) 包级资产
  for (const f of cap.assetFiles || []) {
    const src = path.join(PROJECT, 'scripts', cap.assetDir, f);
    if (!fs.existsSync(src)) { console.error(`包级资产缺失：scripts/${cap.assetDir}/${f}`); process.exit(1); }
    // _runner.js 归 code/，其余归包根
    const dst = f === '_runner.js' ? path.join(codeDir, f) : path.join(outDir, f);
    fs.copyFileSync(src, dst);
  }

  // 3) manifest
  const head = gitHead(SERVER);
  const today = new Date().toISOString().slice(0, 10);
  const manifest = {
    id: `capability-mingli-${capId}`,
    version,
    type: cap.type,
    name: cap.name,
    provider: 'mingli-baojian',
    source_commit: `mingli-baojian/server @ ${head}（${today}）`,
    built_at: today,
    consumers: ['smart-home-family'],
    changelog: { [version]: note },
    contract: cap.contract,
    selftest: cap.selftest,
    rollback_ref: prev ? `outbox/capability-packs/${capId}/${prev}（回滚：消费方以该版包内容覆盖部署目录）` : '首版无上一版；删除消费方部署目录即回滚',
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // 4) 登记 registry.releases
  const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  reg.releases = Array.isArray(reg.releases) ? reg.releases : [];
  reg.releases = reg.releases.filter(r => !(r.id === manifest.id && r.version === version));
  reg.releases.push({
    id: manifest.id, version, type: cap.type, provider: 'mingli-baojian',
    built_at: today, source_commit: manifest.source_commit,
    pack_path: path.relative(PROJECTS_ROOT, outDir),
    consumers: manifest.consumers, selftest: cap.selftest,
    supersedes: prev || null,
    changelog: note,
  });
  reg.updated = today;
  fs.writeFileSync(REGISTRY, JSON.stringify(reg, null, 2));

  console.log(JSON.stringify({ ok: true, pack: outDir, version, prev, files: fs.readdirSync(codeDir).length + (cap.assetFiles || []).length - 1, registry: REGISTRY }, null, 2));
}

main();
