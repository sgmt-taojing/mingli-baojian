#!/usr/bin/env node
/**
 * release-capability.js — G21 能力发版脚本（命理宝鉴 → 消费方）
 * 2026-10-09 Kimi · 任务书 G21：能力变更即打包，命理能力唯一源头定版。
 *
 * 用法：
 *   node scripts/release-capability.js paipan <version> "<changelog 说明>"
 *   例：node scripts/release-capability.js paipan 1.3.0 "六爻入参校验；奇门格局校正；紫微细则引证入包"
 *
 * 产物（与 family capabilities/paipan 包契约完全一致）：
 *   _shared/sync-bus/outbox/capability-packs/<id>/<version>/
 *     ├── manifest.json    id/version/type/provider/source_commit/consumers/changelog/contract/selftest/rollback_ref/fingerprint
 *     ├── code/            引擎快照（源头 server/ 直取；paipan.py 按包契约改名 paipan-bazi.py）
 *     ├── selftest.js      最小用例断言（5 引擎 + ziwei 契约字段 + kbref 无库降级）
 *     └── paipan_bridge.py 消费方统一桥（接口未变时沿用上版）
 * 登记：_shared/capability-registry.json → releases[] 追加本版（packs[].deployed_version 由消费方部署后自更新，源头不代写）。
 *
 * 触发纪律（G21 任务③，同步见 docs/capability-release-policy.md）：
 *   CHANGELOG 出现命理能力条目（引擎/规则/prompt 变更）→ 同版本出包；
 *   知识条目增量走 mingli-full.json 镜像通道，不出能力包；
 *   红线类（家庭成员安全提示话术）2h 内出包；常规优化周窗打包。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const SHARED = path.join(REPO, '..', '_shared');
const OUTBOX = path.join(SHARED, 'sync-bus', 'outbox', 'capability-packs');
const REGISTRY = path.join(SHARED, 'capability-registry.json');

/** 能力清单：源头文件 → 包内路径（rename 仅 paipan.py → paipan-bazi.py） */
const CAPABILITIES = {
  paipan: {
    packId: 'capability-mingli-paipan',
    name: '命理排盘引擎包（Node 五引擎 + 八字 Python 引擎 + 紫微细则引证）',
    type: 'engine',
    consumers: ['smart-home-family'],
    files: [
      ['server/qimen-engine-node.js', 'qimen-engine-node.js'],
      ['server/liuyao-engine-node.js', 'liuyao-engine-node.js'],
      ['server/meihua-engine-node.js', 'meihua-engine-node.js'],
      ['server/liuren-engine-node.js', 'liuren-engine-node.js'],
      ['server/ziwei-engine-node.js', 'ziwei-engine-node.js'],
      ['server/ziwei-iztro-core.js', 'ziwei-iztro-core.js'],
      ['server/ziwei-palace-reader.js', 'ziwei-palace-reader.js'],   // v1.3.0 新增
      ['server/ziwei-kbref-engine.js', 'ziwei-kbref-engine.js'],     // v1.3.0 新增
      ['server/true-solar.js', 'true-solar.js'],
      ['server/bazi-engine-wrapper.js', 'bazi-engine-wrapper.js'],
      ['server/paipan.py', 'paipan-bazi.py'],                        // 包契约命名
    ],
    contract: {
      entry: 'code/bazi-engine-wrapper.js',
      interface: {
        'qimen(data)': '{year,month,day,hour} -> {ok, engine, data}',
        'liuyao(data)': '{year,month,day,hour[,coins,dayGanZhi]} -> {ok, engine, data}（v1.3.0 起 coins 畸形入参友好报错不崩栈）',
        'meihua(data)': '{year,month,day,hour} -> {ok, engine, data}',
        'liuren(data)': '{year,month,day,hour} -> {ok, engine, data}',
        'ziwei(data)': "{date:'YYYY-MM-DD', time:'HH:MM', gender?, isLunar?, lng?} 或 {year,month,day,hour,...} -> 见 ziwei-engine-node",
        'ziweiDeepRead(chart, flow?)': 'v1.3.0 新增：十二宫深读 + KB-ZW 细则原典引证（code/ziwei-palace-reader.js · PalaceDeepReader；KB 不可用时静默降级无引证）',
        bazi: 'Python 引擎：python3 code/paipan-bazi.py <年> <月> <日> <时> <分> --gender male|female [--lunar] [--lng 经度] --json（消费方统一走 paipan_bridge.paipan(\'bazi\', ...)）',
      },
      runtime_deps: {
        npm: ['lunar-typescript', 'iztro', 'better-sqlite3（可选，仅 ziweiDeepRead 引证层用，缺失自动降级）'],
        pip: ['lunar_python'],
        note: 'Node 依赖以 NODE_PATH 复用 mingli-baojian/node_modules；lunar_python 须安装于系统 python3',
      },
    },
  },
};

function semverKey(v) { return v.split('.').map(n => parseInt(n, 10) || 0); }
function sha256File(f) { return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); }

/** 包级指纹：code/ 全文件 sha256 排序串联再哈希（G22 漂移巡检基准） */
function packFingerprint(codeDir) {
  const hs = fs.readdirSync(codeDir).sort().map(f => sha256File(path.join(codeDir, f)));
  return crypto.createHash('sha256').update(hs.join('\n')).digest('hex');
}

/** selftest 模板（基于 v1.2.0 五用例 + v1.3.0 kbref 降级用例） */
function selftestJs(version) {
  return `#!/usr/bin/env node
/**
 * selftest.js — capability-mingli-paipan-v${version} 自检
 * 6 用例：奇门/六爻/梅花/六壬/紫微（契约字段）+ ziwei kbref 引证层无库降级不崩。
 * 运行：node selftest.js（自动以 NODE_PATH 重执行，覆盖 lunar-typescript/iztro）
 */
'use strict';
const path = require('path');
const fs = require('fs');

if (!process.env._PAIPAN_SELFTEST_REEXEC) {
  const candidates = [
    process.env.MINGLI_NODE_MODULES || '',
    path.join(process.env.HOME || '', 'kimi/projects/mingli-baojian/node_modules'),
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
  { engine: 'ziwei', data: { date: '1990-05-15', time: '14:00', gender: '男' },
    check: (d) => d && d.year && d.yearGanZhi && Array.isArray(d.palaces) && d.palaces.length === 12 },
  // v1.3.0：kbref 引证层——消费方无 KB 库时必须静默降级（返回空引证）不崩栈
  { engine: '_kbref', data: {}, run: () => {
      const e = require('./code/ziwei-kbref-engine.js');
      const refs = e.buildPalaceRefs('夫妻', ['武曲', '破军']);
      return { ok: Array.isArray(refs), engine: 'ziwei-kbref', data: refs };
    } },
];

let pass = 0;
for (const c of CASES) {
  const r = c.run ? c.run() : wrapper[c.engine](c.data);
  let ok = r && r.ok === true && r.data !== undefined;
  if (ok && c.check) ok = !!c.check(r.data);
  console.log(\`\${ok ? 'PASS' : 'FAIL'} \${c.engine} -> \${ok ? (r.engine || 'ok') : (r && r.error)}\`);
  if (ok) pass++;
}
console.log(\`selftest: \${pass}/\${CASES.length} passed\`);
process.exit(pass === CASES.length ? 0 : 1);
`;
}

function main() {
  const [, , capId, version, ...clParts] = process.argv;
  const changelogText = clParts.join(' ').trim();
  const cap = CAPABILITIES[capId];
  if (!cap || !version || !changelogText) {
    console.error('用法: node scripts/release-capability.js paipan <version> "<changelog>"');
    process.exit(2);
  }
  if (!/^\d+\.\d+\.\d+$/.test(version)) { console.error('版本号须为 x.y.z'); process.exit(2); }

  // 源文件齐备检查
  for (const [src] of cap.files) {
    if (!fs.existsSync(path.join(REPO, src))) { console.error('缺源文件: ' + src); process.exit(1); }
  }

  // 上一版（rollback_ref + paipan_bridge.py 沿用）
  const capOutbox = path.join(OUTBOX, capId);
  const prevVersions = fs.existsSync(capOutbox)
    ? fs.readdirSync(capOutbox).filter(d => /^\d+\.\d+\.\d+/.test(d)).map(d => d.split('.').slice(0, 3).join('.'))
    : [];
  prevVersions.sort((a, b) => {
    const ka = semverKey(a), kb = semverKey(b);
    return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
  });
  const prev = prevVersions.length ? prevVersions[prevVersions.length - 1] : null;
  if (prev && semverKey(version).join() <= semverKey(prev).join()) {
    console.error(`新版本 ${version} 须大于既有最新版 ${prev}`); process.exit(2);
  }

  const packDir = path.join(capOutbox, version);
  if (fs.existsSync(packDir)) { console.error('版本目录已存在: ' + packDir); process.exit(2); }
  fs.mkdirSync(path.join(packDir, 'code'), { recursive: true });

  // code/ 快照
  for (const [src, dst] of cap.files) {
    fs.copyFileSync(path.join(REPO, src), path.join(packDir, 'code', dst));
  }
  // _runner.js（桥执行入口，包内胶水，沿用上版或重建）
  const prevRunner = prev && fs.existsSync(path.join(capOutbox, prev + '.activated', 'code', '_runner.js'))
    ? path.join(capOutbox, prev + '.activated', 'code', '_runner.js')
    : (prev && fs.existsSync(path.join(capOutbox, prev, 'code', '_runner.js')) ? path.join(capOutbox, prev, 'code', '_runner.js') : null);
  if (prevRunner) fs.copyFileSync(prevRunner, path.join(packDir, 'code', '_runner.js'));

  // paipan_bridge.py（接口未变沿用上版；接口变更时需人工更新后重跑）
  const prevBridge = prev && fs.existsSync(path.join(capOutbox, prev + '.activated', 'paipan_bridge.py'))
    ? path.join(capOutbox, prev + '.activated', 'paipan_bridge.py')
    : (prev && fs.existsSync(path.join(capOutbox, prev, 'paipan_bridge.py')) ? path.join(capOutbox, prev, 'paipan_bridge.py') : null);
  if (prevBridge) fs.copyFileSync(prevBridge, path.join(packDir, 'paipan_bridge.py'));

  // selftest.js
  fs.writeFileSync(path.join(packDir, 'selftest.js'), selftestJs(version));

  // source_commit
  let commit = 'unknown';
  try { commit = execSync('git -C ' + path.join(REPO, 'server') + ' log --oneline -1', { encoding: 'utf8' }).trim(); } catch (_) {}

  const fingerprint = packFingerprint(path.join(packDir, 'code'));
  const today = new Date().toISOString().slice(0, 10);
  const manifest = {
    id: cap.packId,
    version,
    type: cap.type,
    name: cap.name,
    provider: 'mingli-baojian',
    source_commit: `mingli-baojian/server @ ${commit}`,
    built_at: today,
    consumers: cap.consumers,
    changelog: { [version]: changelogText },
    contract: cap.contract,
    selftest: `node selftest.js（6 用例）；PYTHONPATH=项目根 python3 paipan_bridge.py（6 用例含 bazi）`,
    rollback_ref: prev ? `_shared/sync-bus/outbox/capability-packs/${capId}/${prev}（回滚：消费方以该版包内容覆盖部署目录）` : null,
    fingerprint,
  };
  fs.writeFileSync(path.join(packDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  // 登记 releases[]
  if (fs.existsSync(REGISTRY)) {
    const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
    reg.releases = reg.releases || [];
    reg.releases.push({
      id: cap.packId,
      version,
      type: cap.type,
      provider: 'mingli-baojian',
      built_at: today,
      source_commit: manifest.source_commit,
      pack_path: `_shared/sync-bus/outbox/capability-packs/${capId}/${version}`,
      consumers: cap.consumers,
      selftest: manifest.selftest,
      supersedes: prev,
      fingerprint,
      changelog: changelogText,
    });
    reg.updated = today;
    fs.writeFileSync(REGISTRY, JSON.stringify(reg, null, 2) + '\n');
  } else {
    console.warn('WARN: 注册表不存在，跳过登记: ' + REGISTRY);
  }

  console.log(JSON.stringify({ ok: true, packDir, version, prev, fingerprint: fingerprint.slice(0, 16) + '…', files: cap.files.length + 1 }, null, 2));
}

main();
