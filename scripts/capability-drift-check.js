#!/usr/bin/env node
/**
 * capability-drift-check.js — G22 能力漂移巡检（mingli 本侧半边 · ADR-021）
 *
 * 对照：_shared/sync-bus/outbox/capability-packs/<cap>/<最新版>/  ↔  消费方部署目录
 * 结论：
 *   IN_SYNC        部署版 == 最新版且逐文件哈希一致
 *   NOT_ON_LATEST  部署版落后于最新发布版（待消费方接收，告警级 WARN）
 *   DRIFT          同版本但文件内容漂移（告警级 ERROR，可能消费方私改/部署不完整）
 *   MISSING        消费方部署目录不存在
 *
 * 用法：node scripts/capability-drift-check.js [--json]
 * 退出码：0=IN_SYNC  1=DRIFT  2=NOT_ON_LATEST/MISSING
 * 状态件：DELIVERY/capability-drift-latest.json
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT = path.resolve(__dirname, '..');
const PROJECTS_ROOT = path.resolve(PROJECT, '..');
const OUTBOX = path.join(PROJECTS_ROOT, '_shared', 'sync-bus', 'outbox', 'capability-packs');
const STATE_FILE = path.join(PROJECT, 'DELIVERY', 'capability-drift-latest.json');

// 能力 → 消费方部署目录（G21 登记的消费映射，新消费方在此追加）
const CONSUMERS = {
  paipan: [
    { id: 'smart-home-family', deploy: path.join(PROJECTS_ROOT, 'smart-home-family', 'capabilities', 'paipan') },
  ],
};

const IGNORE = /__pycache__|\.pyc$|\.DS_Store/;

function sha(f) { return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); }

function walk(dir, base = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? base + '/' + e.name : e.name;
    if (IGNORE.test(rel)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(abs, rel));
    else out.push(rel);
  }
  return out;
}

function semverMax(a, b) {
  if (a == null) return b;
  if (b == null) return a;
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if (pa[i] !== pb[i]) return pa[i] > pb[i] ? a : b; }
  return a;
}

function checkCap(capId) {
  const capRoot = path.join(OUTBOX, capId);
  if (!fs.existsSync(capRoot)) return { capability: capId, status: 'MISSING', detail: 'outbox 无该能力任何版本' };
  // 版本目录兼容 family 激活流水线的归档后缀（X.Y.Z.activated 乃至多重 .activated 仍是有效定版包，G22 指纹基准）
  const VER_DIR_RE = /^(\d+\.\d+\.\d+)(\.activated)*$/;
  const stripAct = d => d.replace(/(\.activated)+$/, '');
  const verDirs = fs.readdirSync(capRoot).filter(d => VER_DIR_RE.test(d));
  const latest = verDirs.map(stripAct).reduce(semverMax, null);
  const latestDir = verDirs.find(d => stripAct(d) === latest);
  const packDir = path.join(capRoot, latestDir);
  const packFiles = walk(packDir);
  const results = [];
  for (const c of CONSUMERS[capId] || []) {
    if (!fs.existsSync(c.deploy)) {
      results.push({ consumer: c.id, status: 'MISSING', detail: `部署目录不存在：${c.deploy}` });
      continue;
    }
    let deployedVer = null;
    try { deployedVer = JSON.parse(fs.readFileSync(path.join(c.deploy, 'manifest.json'), 'utf8')).version; } catch (_) {}
    if (deployedVer !== latest) {
      results.push({ consumer: c.id, status: 'NOT_ON_LATEST', deployed: deployedVer, latest, detail: '部署版落后于最新发布版' });
      continue;
    }
    // 同版本：逐文件哈希比对
    const deployFiles = walk(c.deploy);
    const diff = [], missing = [], extra = [];
    for (const f of packFiles) {
      const df = path.join(c.deploy, f);
      if (!fs.existsSync(df)) { missing.push(f); continue; }
      if (sha(path.join(packDir, f)) !== sha(df)) diff.push(f);
    }
    const packSet = new Set(packFiles);
    for (const f of deployFiles) if (!packSet.has(f)) extra.push(f);
    if (diff.length || missing.length) {
      results.push({ consumer: c.id, status: 'DRIFT', deployed: deployedVer, latest, diff, missing, extra });
    } else {
      results.push({ consumer: c.id, status: 'IN_SYNC', deployed: deployedVer, latest, files: packFiles.length, extra });
    }
  }
  return { capability: capId, latest, results };
}

// A2 · registry.releases ↔ outbox 实物对账（登记但无实物 / 有实物未登记 / manifest 不可解析或版本不符 均告警）
const REGISTRY = path.join(PROJECTS_ROOT, '_shared', 'capability-registry.json');
function checkRegistry() {
  const issues = [];
  let reg;
  try { reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8')); }
  catch (e) { return { status: 'ERROR', issues: [`registry 不可解析：${e.message}`] }; }
  const releases = (reg.releases || []).filter(r => r.pack_path);
  const stripAct = d => d.replace(/(\.activated)+$/, '');
  for (const r of releases) {
    // 能力目录名从 pack_path 提取（…/capability-packs/<cap>/<version>）
    const pm = /capability-packs\/([^/]+)\/([^/]+)$/.exec(String(r.pack_path));
    if (!pm) { issues.push(`${r.id}@${r.version}：pack_path 不合规（${r.pack_path}）`); continue; }
    const capId = pm[1];
    const dir = path.join(OUTBOX, capId);
    const found = fs.existsSync(dir)
      ? fs.readdirSync(dir).find(d => stripAct(d) === r.version)
      : null;
    if (!found) { issues.push(`${r.id}@${r.version}：registry 已登记但 outbox 无实物`); continue; }
    try {
      const m = JSON.parse(fs.readFileSync(path.join(dir, found, 'manifest.json'), 'utf8'));
      if (m.version !== r.version) issues.push(`${r.id}@${r.version}：实物 manifest 版本为 ${m.version}，与登记不符`);
    } catch (e) { issues.push(`${r.id}@${r.version}：实物 manifest 不可解析（${e.message}）`); }
  }
  // 反向：outbox 有版本实物但未登记（按 pack_path 的能力目录名+版本匹配，不限定提供方前缀）
  if (fs.existsSync(OUTBOX)) {
    for (const capId of fs.readdirSync(OUTBOX)) {
      const dir = path.join(OUTBOX, capId);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const d of fs.readdirSync(dir)) {
        const v = stripAct(d);
        if (!/^\d+\.\d+\.\d+$/.test(v)) continue;
        const hit = (reg.releases || []).some(r => {
          const pp = String(r.pack_path || '');
          return r.version === v && (pp.endsWith(`/${capId}/${v}`) || pp.includes(`/${capId}/`));
        });
        if (!hit) issues.push(`${capId}@${v}：outbox 有实物但 registry 未登记（${d}）`);
      }
    }
  }
  return { status: issues.length ? 'MISMATCH' : 'OK', checked: releases.length, issues };
}

function main() {
  const report = {
    checked_at: new Date().toISOString(),
    capabilities: Object.keys(CONSUMERS).map(checkCap),
    registry: checkRegistry(),
  };
  let worst = 0;
  for (const cap of report.capabilities) {
    for (const r of cap.results || []) {
      if (r.status === 'DRIFT' || r.status === 'MISSING') worst = Math.max(worst, 1);
      else if (r.status === 'NOT_ON_LATEST') worst = Math.max(worst, 2);
    }
  }
  // registry 对账异常按 ERROR 级（登记与实物脱节会让 rollback_ref/指纹基准失效）
  if (report.registry.status !== 'OK') worst = Math.max(worst, 1);
  report.overall = worst === 0 ? 'IN_SYNC' : worst === 1 ? 'DRIFT' : 'NOT_ON_LATEST';
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(report, null, 2));

  // 人读输出
  for (const cap of report.capabilities) {
    for (const r of cap.results || []) {
      const mark = { IN_SYNC: '✅', NOT_ON_LATEST: '⚠️', DRIFT: '❌', MISSING: '❌' }[r.status] || '?';
      console.log(`${mark} ${cap.capability} → ${r.consumer}: ${r.status}（部署 ${r.deployed || '—'} / 最新 ${r.latest || cap.latest || '—'}）`);
      if (r.diff && r.diff.length) console.log(`   漂移文件: ${r.diff.join(', ')}`);
      if (r.missing && r.missing.length) console.log(`   缺失文件: ${r.missing.join(', ')}`);
      if (r.extra && r.extra.length) console.log(`   多出文件: ${r.extra.join(', ')}`);
    }
  }
  // A2 对账人读输出
  if (report.registry.status === 'OK') {
    console.log(`✅ registry↔outbox 对账: OK（${report.registry.checked} 条登记）`);
  } else {
    for (const i of report.registry.issues) console.log(`❌ registry↔outbox 对账: ${i}`);
  }
  process.exit(worst === 0 ? 0 : worst === 1 ? 1 : 2);
}

main();
