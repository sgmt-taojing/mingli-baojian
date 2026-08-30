
'use strict';
(function(){
  // === API helper ===
  const API = (location.protocol === 'https:' ? 'https://' : 'http://') + location.host;
  const token = localStorage.getItem('jwt') || 'demo-token';

  async function api(path, opts){
    opts = opts || {};
    opts.headers = Object.assign({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    }, opts.headers || {});
    try {
      const r = await fetch(API + path, opts,{signal:AbortSignal.timeout(15000)});
      return await r.json();
    } catch (e) {
      // 离线 / 401 / API 暂未上线 → 走离线降级，本页仍可用
      console.warn('[privacy-center] API 调用失败：', e.message);
      return { code: -1, ok: false, message: 'API 暂不可达（已离线降级）' };
    }
  }

  function showBanner(msg, type){
    type = type || 'success';
    const b = document.getElementById('banner');
    if (!b) return;
    b.textContent = msg;
    b.className = 'banner show ' + type;
    setTimeout(function(){ b.classList.remove('show'); }, 4000);
  }

  function confirmModal(title, body){
    return new Promise(function(resolve){
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalBody').textContent = body;
      const m = document.getElementById('confirmModal');
      m.classList.add('show');
      // 焦点管理（a11y）
      const confirmBtn = document.getElementById('modalConfirm');
      setTimeout(function(){ confirmBtn.focus(); }, 50);
      function cleanup(ok){
        m.classList.remove('show');
        resolve(ok);
      }
      document.getElementById('modalConfirm').onclick = function(){ cleanup(true); };
      document.getElementById('modalCancel').onclick = function(){ cleanup(false); };
      // ESC 键关闭
      m.onkeydown = function(e){
        if (e.key === 'Escape') cleanup(false);
      };
    });
  }

  // === 同意记录 ===
  const CONSENT_TYPES = [
    {key:'analytics',   label:'匿名使用统计', desc:'帮助我们改进产品（不含个人信息）', required:false},
    {key:'push',        label:'每日推送通知', desc:'运势提醒、节气养生、年度推送',    required:false},
    {key:'ai_training', label:'AI 模型训练',   desc:'允许脱敏后的对话用于改进 AI',      required:false},
    {key:'marketing',   label:'营销邮件',      desc:'优惠活动、新功能通知',             required:false},
  ];

  async function loadConsents(){
    const r = await api('/api/v1/user/consents');
    const current = {};
    if (r.data && Array.isArray(r.data.consents)) {
      r.data.consents.forEach(function(c){ current[c.consent_type] = c.granted; });
    }
    const list = document.getElementById('consentList');
    if (!list) return;
    list.innerHTML = '';
    CONSENT_TYPES.forEach(function(t){
      const granted = current[t.key] === true;
      const div = document.createElement('div');
      div.className = 'consent-toggle';
      div.innerHTML =
        '<div>' +
          '<strong>' + t.label + '</strong>' + (t.required ? '<span class="required-tag">[必需]</span>' : '') +
          '<div class="muted">' + t.desc + '</div>' +
        '</div>' +
        '<div class="toggle ' + (granted || t.required ? 'on' : '') + '" ' +
             'data-key="' + t.key + '" ' +
             'role="switch" ' +
             'aria-checked="' + (granted || t.required ? 'true' : 'false') + '" ' +
             'aria-label="' + t.label + ' 开关" ' +
             (t.required ? 'data-locked="1" tabindex="-1"' : 'tabindex="0"') + '></div>';
      list.appendChild(div);
    });
    // toggle click
    list.querySelectorAll('.toggle').forEach(function(t){
      t.onclick = function(){
        if (t.dataset.locked) return;
        t.classList.toggle('on');
        t.setAttribute('aria-checked', t.classList.contains('on') ? 'true' : 'false');
      };
      t.onkeydown = function(e){
        if (t.dataset.locked) return;
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          t.click();
        }
      };
    });
  }

  // 暴露给 ml-tap 的 onclick 字符串
  window.__privacySaveConsents = async function(){
    const toggles = document.querySelectorAll('#consentList .toggle');
    let ok = true;
    for (let i = 0; i < toggles.length; i++) {
      const t = toggles[i];
      const granted = t.classList.contains('on');
      const r = await api('/api/v1/user/consents', {
        method: 'POST',
        body: JSON.stringify({ consentType: t.dataset.key, granted, version: 'v1.1.0' }),
      });
      if (r.code !== 0 && r.ok !== true) {
        console.warn('[consent save]', t.dataset.key, '失败：', r.message);
        ok = false;
      }
    }
    showBanner(ok ? '✅ 同意设置已保存' : '部分同意项保存失败', ok ? 'success' : 'error');
  };

  window.__privacyExport = async function(){
    const ok = await confirmModal('确认申请数据导出？', '我们将在 24 小时内向你绑定的邮箱发送完整数据副本。');
    if (!ok) return;
    const r = await api('/api/v1/user/export', { method: 'POST' });
    if (r.code === 0 || r.ok === true) {
      const es = document.getElementById('exportStatus');
      es.textContent = '✅ 已申请';
      es.className = 'status ok';
      showBanner('数据导出申请已提交，请查收邮箱', 'success');
    } else {
      showBanner('申请失败：' + (r.message || 'API 暂不可达'), 'error');
    }
  };

  window.__privacySoftDelete = async function(){
    const ok = await confirmModal('⚠️ 确认申请注销？', '你的账号将进入 14 天冷静期，期间可一键恢复。14 天后数据将被物理删除。');
    if (!ok) return;
    const r = await api('/api/v1/user/soft-delete', {
      method: 'POST',
      body: JSON.stringify({ reason: '用户主动申请' }),
    });
    if (r.code === 0 || r.ok === true) {
      const ds = document.getElementById('deleteStatus');
      ds.textContent = '⏸ 待删除（14 天后物理删除）';
      ds.className = 'status warn';
      document.getElementById('softDeleteBtn').style.display = 'none';
      document.getElementById('cancelDeleteBtn').style.display = '';
      showBanner('账号已注销，14 天内可恢复', 'success');
    } else {
      showBanner('注销失败：' + (r.message || 'API 暂不可达'), 'error');
    }
  };

  window.__privacyCancelDelete = async function(){
    const ok = await confirmModal('确认恢复账号？', '你的账号将恢复正常，所有数据完整保留。');
    if (!ok) return;
    const r = await api('/api/v1/user/restore', { method: 'POST' });
    if (r.code === 0 || r.ok === true) {
      const ds = document.getElementById('deleteStatus');
      ds.textContent = '✅ 账号正常';
      ds.className = 'status ok';
      document.getElementById('softDeleteBtn').style.display = '';
      document.getElementById('cancelDeleteBtn').style.display = 'none';
      showBanner('账号已恢复', 'success');
    } else {
      showBanner('恢复失败：' + (r.message || 'API 暂不可达'), 'error');
    }
  };

  window.__privacyHardDelete = async function(){
    const ok1 = await confirmModal('⚠️ 第一次确认：立即物理删除？', '此操作不可恢复。建议先申请数据导出。');
    if (!ok1) return;
    const ok2 = await confirmModal('⚠️ 第二次确认：真的要永久删除？', '所有数据将立即从数据库清除，包括八字档案、推算记录、AI 对话、积分流水。');
    if (!ok2) return;
    const ok3 = await confirmModal('⚠️ 最后确认：这是不可逆操作', '点击确认将立即删除，无任何恢复手段。');
    if (!ok3) return;
    const r = await api('/api/v1/user/hard-delete', { method: 'POST' });
    if (r.code === 0 || r.ok === true) {
      showBanner('数据已物理删除', 'success');
      setTimeout(function(){ location.href = 'index.html'; }, 3000);
    } else {
      showBanner('删除失败：' + (r.message || 'API 暂不可达'), 'error');
    }
  };

  // === 审计日志（仅自己看） ===
  async function loadAuditLog(){
    const r = await api('/api/v1/user/audit-log');
    const logs = (r.data && Array.isArray(r.data.logs)) ? r.data.logs : [];
    const div = document.getElementById('auditLog');
    if (!div) return;
    if (!logs.length) {
      div.innerHTML = '<p class="muted">暂无审计记录</p>';
      return;
    }
    let html = '<table><thead><tr><th>时间</th><th>操作</th><th>详情</th></tr></thead><tbody>';
    logs.slice(0, 10).forEach(function(l){
      const ts = l.ts || l.created_at || '-';
      const action = l.action || '-';
      let detail = '-';
      try {
        detail = JSON.stringify(l.detail || {}).slice(0, 80);
      } catch (_) { detail = '-'; }
      html += '<tr><td>' + ts + '</td><td>' + action + '</td><td class="muted">' + detail + '</td></tr>';
    });
    html += '</tbody></table>';
    div.innerHTML = html;
  }

  // === 初始化 ===
  document.addEventListener('DOMContentLoaded', async function(){
    // 绑定 onclick 字符串（兼容 ml-tap 组件）
    const buttons = {
      saveConsents:    '__privacySaveConsents',
      exportBtn:       '__privacyExport',
      softDeleteBtn:   '__privacySoftDelete',
      cancelDeleteBtn: '__privacyCancelDelete',
      hardDeleteBtn:   '__privacyHardDelete',
    };
    Object.keys(buttons).forEach(function(id){
      const el = document.getElementById(id);
      if (el) el.setAttribute('onclick', buttons[id] + '()');
    });

    // 加载数据（API 失败时仍能渲染 UI）
    try { await loadConsents(); }   catch (e) { console.warn('同意记录查阅失败', e); }
    try { await loadAuditLog(); }   catch (e) { console.warn('审计日志查阅失败', e); }
  });
})();
