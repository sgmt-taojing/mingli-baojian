/**
 * ═══════════════════════════════════════════════════════════════
 *  PrivacyConsent v1.0 — 视觉采集隐私合规模块（R747）
 *  法律边界：知情同意 + 本地优先 + 最小化传输 + 限期留存 + 可撤回
 *
 *  依据：《个人信息保护法》第 13/26/29 条（敏感个人信息处理规则）
 *  敏感个人信息（人脸/生物识别）处理需单独同意 + 充分告知。
 *
 *  能力：
 *   1. consentGate() — 采集前置门：无同意记录则拒绝启动摄像头
 *   2. showConsentBanner() — 知情同意横幅（用途/期限/撤回方式/拒绝权）
 *   3. dataMinimize() — 帧数据处理策略：默认仅特征出端，原图不出本机
 *   4. retentionSweep() — 留存清扫：结论 30 天过期、原图缓存 10 分钟滚动清除
 *   5. auditLog() — 敏感操作本地审计（开摄像头/上传/同意/撤回）
 *   6. revoke() — 一键撤回同意 + 清除全部本地生物数据
 *
 *  使用：
 *   <script src="js/privacy-consent.js"></script>
 *   const gate = await PrivacyConsent.consentGate('realtime-assistant');
 *   if (!gate.ok) { PrivacyConsent.showConsentBanner(); return; }
 *   const payload = PrivacyConsent.dataMinimize(frameResult); // 传输前必经
 *   PrivacyConsent.auditLog('camera_start', { page: 'realtime' });
 * ═══════════════════════════════════════════════════════════════
 */
(function (global) {
  'use strict';

  var LS_CONSENT = 'tcm_privacy_consent_v1';      // 同意记录
  var LS_AUDIT   = 'tcm_privacy_audit_v1';        // 审计日志（最近 200 条）
  var LS_RAW_FRAMES = 'tcm_privacy_raw_frames';   // 原图缓存（10 分钟滚动）
  var RAW_TTL_MS = 10 * 60 * 1000;                 // 原图缓存 10 分钟
  var CONCLUSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 结论 30 天
  var AUDIT_MAX = 200;

  // ── 同意记录结构 ──
  // { granted: bool, ts: ISO, scope: 'visual_biometric', version: '1.0',
  //   purposes: ['tcm_diagnosis'], expiry: ISO|null, page: string }

  function readConsent() {
    try {
      var raw = localStorage.getItem(LS_CONSENT);
      if (!raw) return null;
      var c = JSON.parse(raw);
      // 同意有效期 90 天，过期需重新授权（最小化长期授权风险）
      if (c.expiry && new Date(c.expiry).getTime() < Date.now()) return null;
      return c;
    } catch (_) { return null; }
  }

  /**
   * 采集前置门。返回 { ok, reason, consent }
   * reason: 'never_asked' | 'revoked' | 'expired'
   */
  function consentGate(page) {
    var c = readConsent();
    if (c && c.granted) {
      auditLog('gate_pass', { page: page || location.pathname });
      return Promise.resolve({ ok: true, consent: c });
    }
    auditLog('gate_block', { page: page || location.pathname, reason: c ? 'revoked' : 'never_asked' });
    return Promise.resolve({ ok: false, reason: c ? 'revoked' : 'never_asked', consent: c });
  }

  /** 授予同意（用户点击横幅"同意"） */
  function grant(purposes) {
    var now = new Date();
    var expiry = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    var c = {
      granted: true,
      ts: now.toISOString(),
      scope: 'visual_biometric',
      version: '1.0',
      purposes: purposes || ['tcm_diagnosis'],
      expiry: expiry.toISOString(),
      page: location.pathname
    };
    try { localStorage.setItem(LS_CONSENT, JSON.stringify(c)); } catch (_) {}
    auditLog('consent_granted', { purposes: c.purposes, expiry: c.expiry });
    return c;
  }

  /** 撤回同意 + 清除全部本地生物数据（合规要求"删除权"） */
  function revoke() {
    try { localStorage.removeItem(LS_CONSENT); } catch (_) {}
    try { localStorage.removeItem(LS_RAW_FRAMES); } catch (_) {}
    // 清除各页面的照片存档
    try { localStorage.removeItem('tcm_tongue_photos'); } catch (_) {}
    try { localStorage.removeItem('tcm_face_captures'); } catch (_) {}
    auditLog('consent_revoked', { dataWiped: ['raw_frames', 'photo_archive'] });
    return { ok: true };
  }

  /**
   * 数据最小化：传输前必经。
   * 模式 local-only（默认）：仅放行特征向量+诊断结论，剥离一切图像数据
   * 模式 authorized：用户明确授权后放行压缩帧（用于云端精诊）
   */
  function dataMinimize(frameResult, opts) {
    opts = opts || {};
    var consent = readConsent();
    if (!consent || !consent.granted) {
      return { ok: false, error: 'no_consent', payload: null };
    }
    var r = frameResult || {};
    var payload = {
      features: r.features || [],
      conclusion: r.conclusion || null,
      syndrome: r.syndrome || null,
      confidence: r.confidence || null,
      quality: r.quality || null,
      ts: r.ts || Date.now(),
      mode: r.mode || 'face'
    };
    // local-only：剥离图像数据（blob/baseUrl/thumbnail 一律不出端）
    if (!opts.allowRawImage) {
      return { ok: true, payload: payload, stripped: ['image'] };
    }
    // authorized：需明确二次授权用途记录
    if (consent.purposes.indexOf('cloud_refine') >= 0) {
      payload.image = r.compressed || null; // 仅压缩帧
      auditLog('raw_image_transfer', { purpose: 'cloud_refine', bytes: (payload.image || '').length });
      return { ok: true, payload: payload, stripped: [] };
    }
    // 未授权云端精诊 → 仍只出特征
    auditLog('raw_image_blocked', { reason: 'purpose_not_granted' });
    return { ok: true, payload: payload, stripped: ['image(未授权云端)'] };
  }

  /** 敏感操作审计（本地留存，最近 200 条） */
  function auditLog(action, detail) {
    try {
      var arr = JSON.parse(localStorage.getItem(LS_AUDIT) || '[]');
      arr.unshift({ ts: new Date().toISOString(), action: action, detail: detail || {}, ua: (navigator.userAgent || '').slice(0, 80) });
      while (arr.length > AUDIT_MAX) arr.pop();
      localStorage.setItem(LS_AUDIT, JSON.stringify(arr));
    } catch (_) { /* 审计失败不阻断业务 */ }
    try { console.info('[privacy-audit]', action, detail || ''); } catch (_) {}
  }

  /** 留存清扫：页面加载时调用（原图 10 分钟滚动清除 + 结论 30 天过期） */
  function retentionSweep() {
    var now = Date.now();
    // 1. 原图缓存
    try {
      var frames = JSON.parse(localStorage.getItem(LS_RAW_FRAMES) || '[]');
      var keep = frames.filter(function (f) { return now - (f.ts || 0) < RAW_TTL_MS; });
      if (keep.length !== frames.length) {
        localStorage.setItem(LS_RAW_FRAMES, JSON.stringify(keep));
        auditLog('retention_sweep', { type: 'raw_frames', removed: frames.length - keep.length });
      }
    } catch (_) {}
    // 2. 照片存档 30 天
    try {
      var photos = JSON.parse(localStorage.getItem('tcm_tongue_photos') || '[]');
      var keepP = photos.filter(function (p) {
        return now - new Date(p.time || 0).getTime() < CONCLUSION_TTL_MS;
      });
      if (keepP.length !== photos.length) {
        localStorage.setItem('tcm_tongue_photos', JSON.stringify(keepP));
        auditLog('retention_sweep', { type: 'photo_archive', removed: photos.length - keepP.length });
      }
    } catch (_) {}
  }

  /** 知情同意横幅（拒绝可继续用非视觉功能） */
  function showConsentBanner(onDecide) {
    // 幂等：已有横幅不重复
    if (document.getElementById('privacy-consent-banner')) return;
    var overlay = document.createElement('div');
    overlay.id = 'privacy-consent-banner';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font-family:-apple-system,PingFang SC,sans-serif;';
    overlay.innerHTML =
      '<div style="background:#fff;max-width:420px;width:90%;border-radius:14px;padding:24px;max-height:80vh;overflow-y:auto;">' +
      '  <h3 style="margin:0 0 8px;font-size:17px;">📷 视觉采集隐私授权</h3>' +
      '  <div style="font-size:13px;color:#374151;line-height:1.7;">' +
      '    为提供中医望诊辅助，需调用摄像头采集面/舌/眼/唇/手图像。依据《个人信息保护法》敏感个人信息处理规则，向您告知：<br><br>' +
      '    <b>① 本地优先</b>：图像在本机实时分析，默认仅提取特征与诊断结论，<b>原图不上传</b><br>' +
      '    <b>② 限期留存</b>：结论留存 30 天、临时缓存 10 分钟后自动清除<br>' +
      '    <b>③ 用途限定</b>：仅用于中医辅助辨证，不用于其他用途，不向第三方提供<br>' +
      '    <b>④ 随时撤回</b>：设置中可一键撤回授权并删除全部生物数据<br>' +
      '    <b>⑤ 授权期限</b>：授权有效期 90 天，到期后需重新确认<br>' +
      '  </div>' +
      '  <div style="display:flex;gap:10px;margin-top:18px;">' +
      '    <button id="pc-agree" style="flex:1;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">同意并开始</button>' +
      '    <button id="pc-decline" style="flex:1;padding:12px;background:#f3f4f6;color:#374151;border:none;border-radius:8px;font-size:14px;cursor:pointer;">拒绝（不使用视觉功能）</button>' +
      '  </div>' +
      '  <div style="font-size:11px;color:#9ca3af;margin-top:10px;">拒绝后仍可使用问诊/闻诊/文字咨询等非视觉功能</div>' +
      '</div>';
    document.body.appendChild(overlay);
    auditLog('consent_banner_shown', { page: location.pathname });

    function close() { overlay.remove(); }
    overlay.querySelector('#pc-agree').addEventListener('click', function () {
      var c = grant(['tcm_diagnosis']);
      close();
      auditLog('consent_user_agreed', {});
      if (onDecide) onDecide({ ok: true, consent: c });
    });
    overlay.querySelector('#pc-decline').addEventListener('click', function () {
      close();
      auditLog('consent_user_declined', {});
      if (onDecide) onDecide({ ok: false, declined: true });
    });
    // Esc = 拒绝（焦点陷阱简单实现）
    overlay.tabIndex = -1;
    overlay.focus();
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { overlay.querySelector('#pc-decline').click(); }
    });
  }

  // ── 公开 API ──
  global.PrivacyConsent = {
    consentGate: consentGate,
    grant: grant,
    revoke: revoke,
    dataMinimize: dataMinimize,
    auditLog: auditLog,
    retentionSweep: retentionSweep,
    showConsentBanner: showConsentBanner,
    readConsent: readConsent
  };

  // 页面加载自动清扫过期数据
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', retentionSweep, { once: true });
  } else {
    retentionSweep();
  }
})(typeof window !== 'undefined' ? window : globalThis);
