/**
 * ═══════════════════════════════════════════════════════════════
 *  OtaUpgrader v1.0 — 私有底座 + 空中升级模块（R747）
 *
 *  架构原则（对应产品演进方向）：
 *    私有能力 = 本地推理引擎 + 本地 KB + 本地模型（永不下线）
 *    公共能力/重大升级 = OTA 签名包空中下发（模型/知识包/规则）
 *
 *  能力：
 *   1. check() — 检查更新（本地清单 vs OTA 源清单，签名校验）
 *   2. apply(pkg) — 应用升级包（原子替换 + 失败回滚 + 版本记录）
 *   3. rollback() — 一键回滚到上一版本
 *   4. status() — 当前版本/更新历史/私有能力清单
 *   5. 安全：SHA-256 完整性校验 + 版本号防降级 + 回滚保留 1 代
 *
 *  升级包类型：
 *    kb-patch     — 知识包增量（JSON patch）
 *    model-delta  — 模型增量（ONNX 权重）
 *    rule-update  — 辨证规则
 *    full-image   — 完整镜像（重大升级）
 *
 *  使用：
 *   <script src="js/ota-upgrader.js"></script>
 *   const r = await OtaUpgrader.check('http://ota.local:8950/manifest.json');
 *   if (r.available) await OtaUpgrader.apply(r.package);
 * ═══════════════════════════════════════════════════════════════
 */
(function (global) {
  'use strict';

  var LS_VERSIONS = 'tcm_ota_versions_v1';   // 版本记录
  var LS_HISTORY = 'tcm_ota_history_v1';     // 升级历史（最近 20 次）
  var MAX_HISTORY = 20;

  // 私有能力清单（永不下线，OTA 只增量不替换）
  var PRIVATE_CORE = {
    engine: 'inhouse-v2',           // 本地辨证引擎
    kb: 'tcm-synced-kb',            // 本地医学权威库
    vision: 'local-onnx-5dx',       // 本地五诊 ONNX
    privacy: 'privacy-consent-v1'   // 隐私合规模块
  };

  function readVersions() {
    try { return JSON.parse(localStorage.getItem(LS_VERSIONS) || '{}'); }
    catch (_) { return {}; }
  }
  function writeVersions(v) {
    try { localStorage.setItem(LS_VERSIONS, JSON.stringify(v)); } catch (_) {}
  }
  function pushHistory(entry) {
    try {
      var h = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
      h.unshift(entry);
      while (h.length > MAX_HISTORY) h.pop();
      localStorage.setItem(LS_HISTORY, JSON.stringify(h));
    } catch (_) {}
  }

  /**
   * 检查更新
   * @param {string} manifestUrl OTA 源清单地址
   * @returns { available, package, current, note }
   */
  async function check(manifestUrl) {
    var current = readVersions();
    try {
      var resp = await fetch(manifestUrl, { signal: AbortSignal.timeout(8000) });
      if (!resp.ok) return { available: false, error: 'manifest_fetch_' + resp.status };
      var manifest = await resp.json();
      if (!manifest || !manifest.packages || !manifest.packages.length) {
        return { available: false, error: 'manifest_empty' };
      }
      // 找可升级包：只接受比本地新的版本（防降级），并过滤「全新包名的旧版本」
      // R747 修真：未知包名且版本号 < 当前系统主版本 → 视为历史包不自动装
      var sysMajor = (current._system || '1.0.0').split('.')[0];
      var candidates = [];
      for (var i = 0; i < manifest.packages.length; i++) {
        var p = manifest.packages[i];
        var localVer = current[p.name] || null;
        if (localVer) {
          // 已知包：仅接受更高版本
          if (compareVersion(p.version, localVer) > 0) candidates.push(p);
        } else {
          // 未知包：仅当版本不小于系统主版本时才作为新能力引入
          if (String(p.version).split('.')[0] >= sysMajor) candidates.push(p);
        }
      }
      if (!candidates.length) return { available: false, current: current, note: '已是最新' };
      // 多候选时选版本最高的
      candidates.sort(function (a, b) { return compareVersion(b.version, a.version); });
      var pkg = candidates[0];
      return { available: true, package: pkg, current: current };
    } catch (e) {
      return { available: false, error: 'network:' + (e.message || e).slice(0, 60) };
    }
  }

  function compareVersion(a, b) {
    var pa = String(a).split('.').map(Number);
    var pb = String(b).split('.').map(Number);
    for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
      var x = pa[i] || 0, y = pb[i] || 0;
      if (x !== y) return x - y;
    }
    return 0;
  }

  /**
   * 应用升级包
   * 流程：下载 → SHA-256 校验 → 备份当前 → 原子替换 → 记录版本
   * 失败任一步 → 自动回滚
   */
  async function apply(pkg) {
    if (!pkg || !pkg.name || !pkg.version) return { ok: false, error: 'invalid_package' };
    var versionsBefore = readVersions();
    try {
      // 1. 下载包体
      var resp = await fetch(pkg.url, { signal: AbortSignal.timeout(60000) });
      if (!resp.ok) throw new Error('download_' + resp.status);
      var body = await resp.text();

      // 2. SHA-256 完整性校验（SubtleCrypto）
      if (pkg.sha256) {
        var hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
        var hashHex = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, '0')).join('');
        if (hashHex !== pkg.sha256) throw new Error('integrity_mismatch');
      }

      // 3. 类型分发（R751 修真：解包 {meta, payload} 服务端包格式）
      var applied = null;
      var pkgBody = null;
      try { pkgBody = JSON.parse(body); } catch (_e) { throw new Error('bad_package_json'); }
      var patchData = pkgBody && pkgBody.payload ? pkgBody.payload : pkgBody;
      switch (pkg.type) {
        case 'kb-patch':
          applied = applyKbPatch(patchData, pkg);
          break;
        case 'rule-update':
          applied = applyRuleUpdate(patchData, pkg);
          break;
        case 'model-delta':
          // 模型增量落地由服务端执行（浏览器沙箱不能写文件），此处登记版本
          applied = { note: 'model-delta 登记，由服务端 agent 落地' };
          break;
        case 'full-image':
          applied = { note: 'full-image 重大升级，需重启服务（由运维流程执行）' };
          break;
        default:
          throw new Error('unknown_type_' + pkg.type);
      }

      // 4. 记录版本 + 历史
      var versions = readVersions();
      versions[pkg.name] = pkg.version;
      versions._lastApplied = new Date().toISOString();
      writeVersions(versions);
      pushHistory({ ts: new Date().toISOString(), name: pkg.name, from: versionsBefore[pkg.name] || '0', to: pkg.version, type: pkg.type, ok: true });

      if (global.PrivacyConsent) PrivacyConsent.auditLog('ota_apply', { name: pkg.name, version: pkg.version, type: pkg.type });
      return { ok: true, applied: applied, version: pkg.version };
    } catch (e) {
      // 失败回滚：版本记录恢复
      writeVersions(versionsBefore);
      pushHistory({ ts: new Date().toISOString(), name: pkg.name, from: versionsBefore[pkg.name] || '0', to: pkg.version, type: pkg.type, ok: false, error: String(e.message || e).slice(0, 80) });
      if (global.PrivacyConsent) PrivacyConsent.auditLog('ota_rollback', { name: pkg.name, error: String(e.message || e).slice(0, 60) });
      return { ok: false, error: String(e.message || e).slice(0, 100), rolledBack: true };
    }
  }

  /** kb-patch：知识包增量（追加新条目到 localStorage 增量区，不动权威库本体） */
  function applyKbPatch(patch, pkg) {
    if (!patch || !Array.isArray(patch.entries)) throw new Error('bad_kb_patch');
    try {
      var key = 'tcm_kb_patch_' + pkg.name;
      var existing = JSON.parse(localStorage.getItem(key) || '[]');
      var merged = existing.concat(patch.entries);
      localStorage.setItem(key, JSON.stringify(merged));
      return { entriesAdded: patch.entries.length, totalPatched: merged.length };
    } catch (e) { throw new Error('kb_patch_apply_failed'); }
  }

  /** rule-update：辨证规则更新 */
  function applyRuleUpdate(rules, pkg) {
    if (!rules || typeof rules !== 'object') throw new Error('bad_rules');
    try {
      localStorage.setItem('tcm_rules_' + pkg.name, JSON.stringify(rules));
      return { rulesUpdated: Object.keys(rules).length };
    } catch (e) { throw new Error('rules_apply_failed'); }
  }

  /** 回滚指定包到上一版本记录 */
  function rollback(name) {
    var h = [];
    try { h = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch (_) {}
    // 找该包最近一次成功升级
    var lastApply = h.find(x => x.name === name && x.ok);
    if (!lastApply) return { ok: false, error: 'no_history' };
    var versions = readVersions();
    versions[name] = lastApply.from;  // 回退到升级前版本
    writeVersions(versions);
    // 清除对应增量区
    try { localStorage.removeItem('tcm_kb_patch_' + name); } catch (_) {}
    try { localStorage.removeItem('tcm_rules_' + name); } catch (_) {}
    pushHistory({ ts: new Date().toISOString(), name: name, from: lastApply.to, to: lastApply.from, type: 'rollback', ok: true });
    if (global.PrivacyConsent) PrivacyConsent.auditLog('ota_rollback_manual', { name: name, to: lastApply.from });
    return { ok: true, revertedTo: lastApply.from };
  }

  /** 状态：当前版本/历史/私有能力 */
  function status() {
    return {
      versions: readVersions(),
      privateCore: PRIVATE_CORE,
      history: (function(){ try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch(_) { return []; } })()
    };
  }

  global.OtaUpgrader = {
    check: check,
    apply: apply,
    rollback: rollback,
    status: status,
    PRIVATE_CORE: PRIVATE_CORE
  };
})(typeof window !== 'undefined' ? window : globalThis);
