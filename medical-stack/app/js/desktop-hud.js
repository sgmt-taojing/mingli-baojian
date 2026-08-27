/**
 * ═══════════════════════════════════════════════════════════════
 *  DesktopHUD v1.0 — 桌面实时结论浮窗（R747）
 *  定位：全量实时采集的结论以"常驻桌面角标"形式秒级呈现
 *
 *  能力：
 *   1. DesktopHUD.mount() — 右下角常驻浮窗（可拖动/折叠/关闭）
 *   2. DesktopHUD.push(conclusion) — 推送实时结论（五诊来源标注）
 *   3. 状态流：listening(采集) → analyzing(分析) → conclusion(结论)
 *   4. 隐私联动：浮窗仅显示特征/证型结论，永不显示图像
 *   5. 紧急联动：urgency=P1 时浮窗变红 + 抖动提醒
 *   6. 多页面共享：localStorage 事件总线（同源页面实时同步）
 *
 *  使用：
 *   <script src="js/desktop-hud.js"></script>
 *   DesktopHUD.mount();
 *   DesktopHUD.push({ source: 'tongue', syndrome: '心脾两虚', confidence: 0.9, urgency: 'P2' });
 * ═══════════════════════════════════════════════════════════════
 */
(function (global) {
  'use strict';

  var LS_BUS = 'tcm_hud_bus_v1';   // 跨页面事件总线
  var MAX_ITEMS = 8;                // 浮窗最多显示条数
  var mounted = false;

  var MODE_ICON = { face: '😊', tongue: '👅', eye: '👁️', lip: '💋', hand: '✋', voice: '🎙️', inquiry: '📝' };
  var URGENCY_STYLE = {
    P1_EMERGENCY: { bg: '#dc2626', label: '🚨 紧急' },
    P2_HEALTH_TIP: { bg: '#f59e0b', label: '⚠️ 提示' },
    P3_ROUTINE: { bg: '#10b981', label: '✅ 常规' }
  };

  var state = { items: [], collapsed: false, pos: null };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function ensureStyles() {
    if (document.getElementById('desktop-hud-styles')) return;
    var st = document.createElement('style');
    st.id = 'desktop-hud-styles';
    st.textContent = [
      '.dhud { position:fixed; z-index:99998; right:16px; bottom:16px; width:300px; background:rgba(15,23,42,.94); backdrop-filter:blur(8px); border:1px solid rgba(148,163,184,.25); border-radius:12px; color:#e2e8f0; font-family:-apple-system,PingFang SC,sans-serif; box-shadow:0 8px 32px rgba(0,0,0,.4); overflow:hidden; }',
      '.dhud-head { display:flex; align-items:center; gap:8px; padding:10px 12px; background:rgba(30,41,59,.8); cursor:move; user-select:none; }',
      '.dhud-dot { width:8px; height:8px; border-radius:50%; background:#10b981; animation:dhud-pulse 2s infinite; }',
      '.dhud-dot.listening { background:#f59e0b; }',
      '.dhud-title { flex:1; font-size:12px; font-weight:600; }',
      '.dhud-btn { background:none; border:none; color:#94a3b8; cursor:pointer; font-size:14px; padding:2px 4px; }',
      '.dhud-btn:hover { color:#e2e8f0; }',
      '.dhud-list { max-height:260px; overflow-y:auto; }',
      '.dhud-item { padding:8px 12px; border-bottom:1px solid rgba(148,163,184,.12); font-size:12px; line-height:1.5; }',
      '.dhud-item:last-child { border-bottom:none; }',
      '.dhud-item-src { display:inline-block; margin-right:6px; }',
      '.dhud-item-syn { font-weight:600; color:#7dd3fc; }',
      '.dhud-item-meta { color:#94a3b8; font-size:11px; }',
      '.dhud-item.urgent { background:rgba(220,38,38,.15); border-left:3px solid #dc2626; animation:dhud-shake .5s; }',
      '.dhud-empty { padding:20px 12px; text-align:center; color:#64748b; font-size:12px; }',
      '.dhud-foot { padding:6px 12px; font-size:10px; color:#475569; text-align:right; border-top:1px solid rgba(148,163,184,.1); }',
      '@keyframes dhud-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }',
      '@keyframes dhud-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }',
      '@media (max-width:640px) { .dhud { width:calc(100vw - 24px); right:12px; bottom:12px; } }'
    ].join('\n');
    document.head.appendChild(st);
  }

  function render() {
    var root = document.getElementById('desktop-hud-root');
    if (!root) return;
    var listHtml = state.items.length
      ? state.items.map(function (it) {
          var icon = MODE_ICON[it.source] || '📋';
          var urg = URGENCY_STYLE[it.urgency] || URGENCY_STYLE.P3_ROUTINE;
          var time = new Date(it.ts || Date.now()).toLocaleTimeString('zh-CN', { hour12: false });
          return '<div class="dhud-item' + (it.urgency === 'P1_EMERGENCY' ? ' urgent' : '') + '">' +
            '<span class="dhud-item-src">' + icon + '</span>' +
            '<span class="dhud-item-syn">' + esc(it.syndrome || it.title || '分析中') + '</span>' +
            (it.confidence != null ? '<span class="dhud-item-meta"> · ' + Math.round(it.confidence * 100) + '%</span>' : '') +
            '<div class="dhud-item-meta">' + esc(it.detail || '') + ' · ' + esc(urg.label) + ' · ' + time + '</div>' +
            '</div>';
        }).join('')
      : '<div class="dhud-empty">等待实时采集数据…</div>';
    root.innerHTML =
      '<div class="dhud-head" id="dhud-head">' +
      '  <span class="dhud-dot" id="dhud-dot"></span>' +
      '  <span class="dhud-title">🩺 实时健康 HUD</span>' +
      '  <button class="dhud-btn" id="dhud-collapse" title="折叠">' + (state.collapsed ? '▸' : '▾') + '</button>' +
      '  <button class="dhud-btn" id="dhud-close" title="关闭">✕</button>' +
      '</div>' +
      (state.collapsed ? '' : '<div class="dhud-list" id="dhud-list">' + listHtml + '</div>') +
      '<div class="dhud-foot">🔒 仅特征与结论 · 图像不出本机</div>';
    bindEvents(root);
  }

  function bindEvents(root) {
    var closeBtn = root.querySelector('#dhud-close');
    var colBtn = root.querySelector('#dhud-collapse');
    if (closeBtn) closeBtn.addEventListener('click', function () { unmount(); });
    if (colBtn) colBtn.addEventListener('click', function () {
      state.collapsed = !state.collapsed; render();
    });
    // 拖动
    var head = root.querySelector('#dhud-head');
    var box = root.parentElement;
    if (head && box) {
      var drag = null;
      head.addEventListener('mousedown', function (e) {
        drag = { x: e.clientX, y: e.clientY, r: box.getBoundingClientRect() };
        e.preventDefault();
      });
      document.addEventListener('mousemove', function (e) {
        if (!drag) return;
        var nx = drag.r.left + e.clientX - drag.x;
        var ny = drag.r.top + e.clientY - drag.y;
        box.style.left = Math.max(0, Math.min(nx, innerWidth - drag.r.width)) + 'px';
        box.style.top = Math.max(0, Math.min(ny, innerHeight - drag.r.height)) + 'px';
        box.style.right = 'auto'; box.style.bottom = 'auto';
      });
      document.addEventListener('mouseup', function () { drag = null; });
    }
  }

  function setStatus(status) {
    var dot = document.getElementById('dhud-dot');
    if (dot) dot.className = 'dhud-dot' + (status === 'listening' ? ' listening' : '');
  }

  /** 推送一条实时结论（本页渲染 + 跨页广播） */
  function push(conclusion) {
    if (!conclusion) return;
    var it = {
      source: conclusion.source || 'inquiry',
      syndrome: conclusion.syndrome || conclusion.title || '',
      confidence: conclusion.confidence,
      detail: conclusion.detail || conclusion.formula || '',
      urgency: conclusion.urgency || 'P3_ROUTINE',
      ts: Date.now()
    };
    state.items.unshift(it);
    if (state.items.length > MAX_ITEMS) state.items.pop();
    render();
    // 跨页面广播（storage 事件）
    try {
      localStorage.setItem(LS_BUS, JSON.stringify({ ts: Date.now(), item: it }));
    } catch (_) {}
    // P1 紧急：语音播报提醒（复用 TTS 若可用）
    if (it.urgency === 'P1_EMERGENCY' && global.speechSynthesis) {
      try {
        var u = new SpeechSynthesisUtterance('注意：检测到紧急健康信号，' + (it.syndrome || '') + '，请及时就医');
        u.lang = 'zh-CN'; u.rate = 1.1;
        speechSynthesis.speak(u);
      } catch (_) {}
    }
    // 审计（联动隐私模块）
    if (global.PrivacyConsent) PrivacyConsent.auditLog('hud_push', { source: it.source, urgency: it.urgency });
  }

  function mount(opts) {
    if (mounted) return;
    ensureStyles();
    var wrap = document.createElement('div');
    wrap.id = 'desktop-hud-wrap';
    wrap.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99998;';
    var root = document.createElement('div');
    root.id = 'desktop-hud-root';
    root.className = 'dhud';
    wrap.appendChild(root);
    document.body.appendChild(wrap);
    mounted = true;
    render();
    // 订阅跨页广播
    global.addEventListener('storage', function (e) {
      if (e.key !== LS_BUS || !e.newValue) return;
      try {
        var msg = JSON.parse(e.newValue);
        if (msg.item && Date.now() - msg.ts < 5000) {
          state.items.unshift(msg.item);
          if (state.items.length > MAX_ITEMS) state.items.pop();
          render();
        }
      } catch (_) {}
    });
    if (global.PrivacyConsent) PrivacyConsent.auditLog('hud_mount', { page: location.pathname });
  }

  function unmount() {
    var wrap = document.getElementById('desktop-hud-wrap');
    if (wrap) wrap.remove();
    mounted = false;
  }

  global.DesktopHUD = {
    mount: mount,
    unmount: unmount,
    push: push,
    setStatus: setStatus
  };
})(typeof window !== 'undefined' ? window : globalThis);
