/**
 * reflux-badge.js — G13+ 家庭端回流状态共享组件
 * 用法：
 *   <script src="js/vendor/qrcode.min.js"></script>   （引导二维码需要，可选）
 *   <script src="js/reflux-badge.js"></script>
 *   RefluxBadge.attach(el, apiBase, name)             — 单患者徽标（签发页）
 *   RefluxBadge.decorateRows(container, apiBase)      — 列表页批量（容器内 [data-rb-name]）
 *   RefluxBadge.guide(url)                            — 扫码绑定引导模态
 * apiBase：同源页面传 ''；跨端口页面传 'http://127.0.0.1:8972'
 */
(function () {
  'use strict';
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var ICON = { emr: '📋', prescription: '💊', lab: '🧪', revisit: '📅' };

  /* ── 扫码绑定引导模态（懒创建单例） ── */
  function guide(url) {
    var modal = document.getElementById('rb-guide-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'rb-guide-modal';
      modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;align-items:center;justify-content:center';
      modal.innerHTML =
        '<div style="background:#fff;border-radius:12px;padding:20px;max-width:300px;text-align:center">' +
          '<div style="font-weight:700;font-size:14px;margin-bottom:4px">🏠 引导患者绑定家庭端</div>' +
          '<div style="font-size:11px;color:#666;margin-bottom:10px">患者用手机扫码 → 填手机号收验证码 → 完成绑定<br>此后病历/处方/检验报告自动推送到家庭端</div>' +
          '<div id="rb-qr" style="display:flex;justify-content:center;margin-bottom:8px"></div>' +
          '<div id="rb-qr-url" style="font-size:9px;color:#999;word-break:break-all;margin-bottom:10px"></div>' +
          '<button class="btn small" onclick="document.getElementById(\'rb-guide-modal\').style.display=\'none\'">关闭</button>' +
        '</div>';
      document.body.appendChild(modal);
    }
    var qrBox = modal.querySelector('#rb-qr');
    qrBox.innerHTML = '';
    modal.querySelector('#rb-qr-url').textContent = url || '';
    if (url && typeof QRCode !== 'undefined') {
      new QRCode(qrBox, { text: url, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M });
    } else {
      qrBox.textContent = '二维码组件不可用，请手动访问下方链接';
    }
    modal.style.display = 'flex';
  }

  /* ── 徽标 HTML ── */
  function chipHtml(d, opts) {
    opts = opts || {};
    if (!d || !d.ok) return '🏠 家庭端回流：状态查询失败';
    if (d.bound) {
      var phones = (d.links || []).map(function (l) { return l.phone_masked; }).join('、');
      var recent = (d.deliveries || []).slice(0, 3).map(function (x) {
        return (ICON[x.report_type] || '📄') + (x.pushed_family ? '✓' : '⏳');
      }).join(' ');
      if (opts.mini) {
        var last = (d.deliveries || [])[0];
        return '<span title="家庭端已绑定 ' + esc(phones) + (last ? '；最近送达 ' + esc(last.title) : '') + '" style="color:#059669">🏠✓</span>';
      }
      return '🏠 家庭端 <b style="color:#059669">已绑定</b> ' + esc(phones) +
        (recent ? ' · 最近送达 ' + recent : ' · 暂无送达记录');
    }
    var url = esc(d.bind_url || '');
    if (opts.mini) {
      return '<span title="家庭端未绑定，点击出引导二维码" style="color:#d97706;cursor:pointer" onclick="event.stopPropagation();RefluxBadge.guide(\'' + url + '\')">🏠○</span>';
    }
    return '🏠 家庭端 <b style="color:#d97706">未绑定</b> ' +
      '<span style="display:inline-block;font-size:10px;border:1px solid #d97706;color:#d97706;border-radius:10px;padding:0 8px;cursor:pointer" onclick="RefluxBadge.guide(\'' + url + '\')">📱 扫码绑定</span>' +
      ' <span style="opacity:.6">绑定后病历/处方/检验自动推送</span>';
  }

  /* ── 单患者徽标 ── */
  async function attach(el, apiBase, name) {
    if (!el) return;
    name = String(name || '').trim();
    if (name.length < 2) { el.textContent = '🏠 家庭端回流：确认姓名后自动核查'; return; }
    try {
      var r = await fetch((apiBase || '') + '/api/reflux/patient-status?patient_name=' + encodeURIComponent(name));
      var d = await r.json();
      el.innerHTML = chipHtml(d);
    } catch (e) { el.textContent = '🏠 家庭端回流：服务不可用'; }
  }

  /* ── 列表页批量装饰：容器内所有 [data-rb-name] 占位 → mini 徽标 ── */
  async function decorateRows(container, apiBase) {
    if (!container) return;
    var nodes = container.querySelectorAll('[data-rb-name]');
    if (!nodes.length) return;
    var names = [];
    nodes.forEach(function (n) {
      var v = (n.getAttribute('data-rb-name') || '').trim();
      if (v.length >= 2 && names.indexOf(v) < 0) names.push(v);
    });
    if (!names.length) return;
    try {
      var r = await fetch((apiBase || '') + '/api/reflux/status-batch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: names.slice(0, 50) })
      });
      var d = await r.json();
      if (!d.ok) return;
      nodes.forEach(function (n) {
        var v = (n.getAttribute('data-rb-name') || '').trim();
        var st = d.statuses && d.statuses[v];
        if (st) n.innerHTML = ' ' + chipHtml({ ok: true, bound: st.bound, deliveries: st.last_delivery ? [st.last_delivery] : [] }, { mini: true });
      });
    } catch (e) { /* 批量核查失败静默——不干扰列表主流程 */ }
  }

  window.RefluxBadge = { attach: attach, decorateRows: decorateRows, guide: guide, chipHtml: chipHtml, esc: esc };
})();
