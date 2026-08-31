/* mingli-annotation-view.js — 医师工作台命理视图开关（G-evo-1 · ADR-007 合流层呈现）
 *
 * 职责：
 *   1. 按角色给命理内容默认视角：命理师/管理员 → 全版；医生及其他 → 简版
 *   2. 悬浮开关 ☯ 一键切换 简版/全版，选择记忆在 localStorage
 *   3. 简版：隐藏 [data-mingli-detail] 细节，仅保留「命理批注已附」徽标（[data-mingli] 保留可见）
 *      全版：全部展示
 *   4. 可选：页面提供 window.MINGLI_EMR_ID 时，从批注层（8974）拉取该病历批注渲染面板
 *
 * 边界：本脚本只做呈现分层，不写任何医学/命理数据；不回流、不外发。
 * 用法：<script src="js/mingli-annotation-view.js" defer></script>
 *   （medical-stack 页面由 page-follow 补丁规则注入，源码直引亦可）
 */
(function () {
  'use strict';

  var LS_KEY = 'mingli_view_mode';           // 'brief' | 'full'
  var MASTER_ROLES = ['master', 'super_admin', 'admin'];
  var ANNOTATION_API = 'http://localhost:8974';

  function decodeRoles(t) {
    try {
      var p = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      var j = JSON.parse(decodeURIComponent(escape(atob(p))));
      return j.roles || [];
    } catch (e) { return []; }
  }

  function currentRoles() {
    var t = localStorage.getItem('admin_token') || localStorage.getItem('token') || '';
    return t ? decodeRoles(t) : [];
  }

  function defaultMode() {
    // G18：默认折叠（简版）对所有角色生效；命理师/管理员手动切全版，选择被记忆
    return 'brief';
  }

  function getMode() {
    var saved = localStorage.getItem(LS_KEY);
    return (saved === 'full' || saved === 'brief') ? saved : defaultMode();
  }

  function apply(mode) {
    document.querySelectorAll('[data-mingli-detail]').forEach(function (el) {
      el.style.display = (mode === 'full') ? '' : 'none';
    });
    document.querySelectorAll('[data-mingli-badge-brief]').forEach(function (el) {
      el.style.display = (mode === 'full') ? 'none' : '';
    });
    var btn = document.getElementById('mingliViewToggle');
    if (btn) btn.innerHTML = (mode === 'full' ? '☯ 命理视图：全版' : '☯ 命理视图：简版');
    document.body.setAttribute('data-mingli-view', mode);
  }

  function toggle() {
    var next = getMode() === 'full' ? 'brief' : 'full';
    localStorage.setItem(LS_KEY, next);
    apply(next);
  }

  function mountToggle() {
    if (document.getElementById('mingliViewToggle')) return;
    var btn = document.createElement('button');
    btn.id = 'mingliViewToggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', '切换命理视图简版全版');
    btn.style.cssText = 'position:fixed;right:16px;bottom:76px;z-index:9990;' +
      'background:rgba(30,22,12,.92);color:#d4af37;border:1px solid rgba(212,175,55,.5);' +
      'border-radius:20px;padding:8px 14px;font-size:12px;cursor:pointer;' +
      'box-shadow:0 2px 10px rgba(0,0,0,.35);backdrop-filter:blur(4px)';
    btn.addEventListener('click', toggle);
    document.body.appendChild(btn);
  }

  // 可选：批注面板（页面置 window.MINGLI_EMR_ID 才启用）
  function mountPanel() {
    var emrId = window.MINGLI_EMR_ID;
    if (!emrId || document.getElementById('mingliAnnotationPanel')) return;
    var box = document.createElement('div');
    box.id = 'mingliAnnotationPanel';
    box.setAttribute('data-mingli', '');
    box.style.cssText = 'margin:10px 0;padding:12px;border:1px solid rgba(212,175,55,.35);' +
      'border-radius:10px;font-size:13px';
    box.innerHTML = '<div style="color:#d4af37;font-weight:600;margin-bottom:6px">☯ 命理批注层 <span style="font-weight:400;font-size:11px;color:#999">（仅供命理参考，非医学诊断）</span></div>' +
      '<div data-mingli-badge-brief style="color:#c9b98a;font-size:12px">命理批注已随病历归档 · 切全版查看明细</div>' +
      '<div data-mingli-detail id="mingliAnnotationBody" style="color:#ddd;line-height:1.7">载入中…</div>';
    var anchor = document.querySelector('main') || document.body.firstElementChild || document.body;
    anchor.appendChild(box);

    fetch(ANNOTATION_API + '/api/emr/' + encodeURIComponent(emrId) + '/annotations',
        { signal: AbortSignal.timeout(8000) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var el = document.getElementById('mingliAnnotationBody');
        var list = (d && d.annotations) || [];
        if (!list.length) { el.textContent = '暂无批注（待 AI 草案或命理师核对）'; return; }
        el.innerHTML = list.map(function (a) {
          return '<div style="border-top:1px dashed rgba(212,175,55,.2);padding:6px 0">' +
            '<span style="color:#d4af37">' + esc(a.type === 'ai' ? 'AI 草案' : '命理师批注') + '</span>' +
            ' · ' + esc(a.author || '') + ' · ' + esc((a.created_at || '').slice(0, 16)) +
            ' · <em style="color:#c9b98a">' + esc(a.status === 'approved' ? '已核对' : '待核对') + '</em>' +
            '<div style="margin-top:4px;white-space:pre-wrap">' + esc(a.content || '') + '</div></div>';
        }).join('');
      })
      .catch(function () {
        var el = document.getElementById('mingliAnnotationBody');
        if (el) el.textContent = '批注层服务离线（8974）';
      });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function init() {
    // 页面未含任何命理内容且未指定 EMR 时不挂载开关（避免污染纯医学页）
    var hasMingli = document.querySelector('[data-mingli],[data-mingli-detail]') || window.MINGLI_EMR_ID;
    if (!hasMingli) return;
    mountToggle();
    mountPanel();
    apply(getMode());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
