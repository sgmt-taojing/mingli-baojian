#!/usr/bin/env node
/**
 * ota-client.js — 命理宝鉴·医学栈 OTA 客户端
 *
 * 定位：从中医标准智能体 ota-server（默认 http://127.0.0.1:8952）拉取升级包，
 *       应用到本栈自有目录（独立部署、自有闭环；源端只读消费，不回写）。
 *
 * 能力：
 *   node ota-client.js status   — 已装版本与源端清单对比
 *   node ota-client.js check    — 仅检测是否有新版本
 *   node ota-client.js apply    — 下载→SHA-256 验签→装前备份→应用→失败回滚
 *
 * 安全：
 *   - SHA-256 完整性校验，不匹配即拒绝并回滚
 *   - 版本防降级（同包名只允许更高版本）
 *   - 装前备份到 data/ota/backup/<name>/<version>-<ts>.json
 *   - 全程写 data/ota/ota-log.jsonl（可审计）
 *
 * 应用目标（按包类型）：
 *   kb-patch    → server/kb-store/ota-<name>.json（医学栈 KB 增量层，与基线 KB 并存）
 *   rule-update → data/ota/rules/<name>.json
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const OTA_DIR = path.join(ROOT, 'data', 'ota');
const BACKUP_DIR = path.join(OTA_DIR, 'backup');
const INSTALLED_PATH = path.join(OTA_DIR, 'installed.json');
const LOG_PATH = path.join(OTA_DIR, 'ota-log.jsonl');
const SOURCE = process.env.OTA_SOURCE || 'http://127.0.0.1:8952';

function ensureDirs() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(INSTALLED_PATH)) fs.writeFileSync(INSTALLED_PATH, '{}');
}

function log(event, extra) {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...extra });
  fs.appendFileSync(LOG_PATH, line + '\n');
  console.log(line);
}

function readInstalled() {
  try { return JSON.parse(fs.readFileSync(INSTALLED_PATH, 'utf8')); } catch (_) { return {}; }
}

function writeInstalled(m) { fs.writeFileSync(INSTALLED_PATH, JSON.stringify(m, null, 2)); }

function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

/** 简化 semver 比较：a > b 返回 true（仅数字段） */
function isNewer(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
}

async function fetchJson(u) {
  const res = await fetch(u, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${u}`);
  return res.text();
}

function applyTarget(pkg) {
  if (pkg.type === 'kb-patch') return path.join(ROOT, 'server', 'kb-store', `ota-${pkg.name}.json`);
  if (pkg.type === 'rule-update') return path.join(OTA_DIR, 'rules', `${pkg.name}.json`);
  return path.join(OTA_DIR, 'misc', `${pkg.name}.json`);
}

async function applyAll() {
  ensureDirs();
  const installed = readInstalled();
  const manifest = JSON.parse(await fetchJson(`${SOURCE}/manifest.json`));
  const results = [];
  for (const pkg of manifest.packages || []) {
    const cur = installed[pkg.name] && installed[pkg.name].version;
    if (cur && !isNewer(pkg.version, cur)) {
      results.push({ name: pkg.name, action: 'skip', reason: cur === pkg.version ? '已是最新' : `防降级 ${cur} > ${pkg.version}` });
      continue;
    }
    const target = applyTarget(pkg);
    let backupPath = null;
    try {
      const content = await fetchJson(pkg.url);
      const digest = sha256(content);
      if (pkg.sha256 && digest !== pkg.sha256) {
        throw new Error(`SHA-256 不匹配 manifest=${pkg.sha256} actual=${digest}`);
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (fs.existsSync(target)) {
        backupPath = path.join(BACKUP_DIR, pkg.name);
        fs.mkdirSync(backupPath, { recursive: true });
        backupPath = path.join(backupPath, `${cur || 'new'}-${Date.now()}.json`);
        fs.copyFileSync(target, backupPath);
      }
      fs.writeFileSync(target, content);
      // 装后自检：JSON 可解析
      JSON.parse(content);
      installed[pkg.name] = { version: pkg.version, type: pkg.type, applied_at: new Date().toISOString(), sha256: digest, target: path.relative(ROOT, target) };
      writeInstalled(installed);
      log('applied', { name: pkg.name, version: pkg.version, target: path.relative(ROOT, target) });
      results.push({ name: pkg.name, action: 'applied', version: pkg.version });
    } catch (e) {
      // 回滚
      if (backupPath && fs.existsSync(backupPath)) fs.copyFileSync(backupPath, target);
      else if (fs.existsSync(target) && !cur) fs.unlinkSync(target);
      log('rollback', { name: pkg.name, version: pkg.version, error: e.message });
      results.push({ name: pkg.name, action: 'rollback', error: e.message });
    }
  }
  return results;
}

async function main() {
  const cmd = process.argv[2] || 'status';
  ensureDirs();
  if (cmd === 'status') {
    const installed = readInstalled();
    let manifest = null;
    try { manifest = JSON.parse(await fetchJson(`${SOURCE}/manifest.json`)); } catch (e) { console.log(JSON.stringify({ source: SOURCE, source_reachable: false, error: e.message, installed }, null, 2)); return; }
    const pending = (manifest.packages || []).filter(p => !installed[p.name] || isNewer(p.version, installed[p.name].version)).map(p => `${p.name}@${p.version}`);
    console.log(JSON.stringify({ source: SOURCE, source_reachable: true, installed, pending }, null, 2));
  } else if (cmd === 'check') {
    const installed = readInstalled();
    const manifest = JSON.parse(await fetchJson(`${SOURCE}/manifest.json`));
    const pending = (manifest.packages || []).filter(p => !installed[p.name] || isNewer(p.version, installed[p.name].version));
    console.log(JSON.stringify({ pending: pending.length, packages: pending.map(p => `${p.name}@${p.version}`) }, null, 2));
    process.exit(pending.length ? 10 : 0);
  } else if (cmd === 'apply') {
    const results = await applyAll();
    console.log(JSON.stringify({ ok: results.every(r => r.action !== 'rollback'), results }, null, 2));
  } else {
    console.error('用法: node ota-client.js [status|check|apply]');
    process.exit(2);
  }
}

main().catch(e => { log('fatal', { error: e.message }); process.exit(1); });
