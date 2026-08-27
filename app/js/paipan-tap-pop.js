/**
 * paipan-tap-pop.js — 排盘点读浮动弹层（R-TAP-X）
 * 六爻点爻 / 紫微点宫 / 风水点宫 /（奇门走页内旧实现，接口一致）
 *
 * 用法：
 *   PaipanTap.bind(container, selector, { module, keyOf(el), paramOf(el) })
 *   —— 点击 container 内匹配 selector 的元素时弹层；再次点击同元素/空白/ESC 关闭
 * 请求体取自 window._paipanBody[module]（由 paipan-baihua-panel notify 或页面排盘函数缓存）
 */
(function () {
  'use strict';

  var API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') ? 'http://127.0.0.1:8920' : '';
  var LV_COLOR = { good: '#4ec9b0', bad: '#ef4444', neutral: '#8b7e6a' };
  var LV_LABEL = { good: '吉', bad: '凶', neutral: '平' };
  var _pop = null, _key = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function injectCss() {
    if (document.getElementById('paipan-tap-css')) return;
    var st = document.createElement('style');
    st.id = 'paipan-tap-css';
    st.textContent =
      '.pt-pop{position:absolute;z-index:80;background:#171722;border:1px solid rgba(201,168,76,.4);border-radius:10px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.55);font-size:12px;line-height:1.7;color:#e8dcc8;max-height:60vh;overflow:auto}' +
      '.pt-title{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#e8cc7a;margin-bottom:6px}' +
      '.pt-close{background:none;border:none;color:#8b7e6a;cursor:pointer;font-size:13px;padding:0 2px}' +
      '.pt-close:hover{color:#e8cc7a}' +
      '.pt-summary{border-left:3px solid;border-radius:4px;padding:6px 8px;margin-bottom:8px;background:rgba(255,255,255,.03)}' +
      '.pt-summary.good{border-color:#4ec9b0}.pt-summary.bad{border-color:#ef4444}.pt-summary.neutral{border-color:#8b7e6a}' +
      '.pt-line{margin-bottom:5px;padding-left:2px}' +
      '.pt-line .pt-label{display:inline-block;min-width:52px;color:#c9a84c;font-weight:600;margin-right:6px}' +
      '.pt-line.good .pt-label{color:#4ec9b0}.pt-line.bad .pt-label{color:#ef4444}' +
      '.pt-hint{margin-top:8px;font-size:10px;color:#8b7e6a;text-align:center}';
    document.head.appendChild(st);
  }

  function hide() { if (_pop) { _pop.remove(); _pop = null; _key = null; } }
  document.addEventListener('click', hide);
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') hide(); });

  function anchorPop(pop, container, anchor) {
    var pw = Math.min(320, container.clientWidth * 0.9);
    pop.style.width = pw + 'px';
    var left = anchor.offsetLeft + anchor.offsetWidth / 2 - pw / 2;
    left = Math.max(0, Math.min(left, container.clientWidth - pw));
    pop.style.left = left + 'px';
    if (anchor.offsetTop - 8 - pop.offsetHeight >= 0) {
      pop.style.top = ''; pop.style.bottom = (container.clientHeight - anchor.offsetTop + 8) + 'px';
    } else {
      pop.style.bottom = ''; pop.style.top = (anchor.offsetTop + anchor.offsetHeight + 8) + 'px';
    }
  }

  function show(opts) {
    injectCss();
    var key = opts.key;
    if (_key === key) { hide(); return; }
    hide(); _key = key;

    var container = opts.container;
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    var pop = document.createElement('div');
    pop.className = 'pt-pop';
    _pop = pop;
    pop.innerHTML = '<div class="pt-title"><span>🔮 解读中…</span></div>';
    pop.addEventListener('click', function (ev) { ev.stopPropagation(); });
    container.appendChild(pop);
    anchorPop(pop, container, opts.anchor);

    (async function () {
      var body = Object.assign({}, (window._paipanBody || {})[opts.module] || {}, opts.params || {});
      var r = await fetch(API_BASE + '/api/paipan/' + opts.module + '/baihua', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Skip-Interceptor': '1' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify(body)
      });
      var res = await r.json();
      var d = res && res.data ? res.data : res;
      return d && (d.tapDetail || d.palaceDetail);
    })().then(function (pd) {
      if (_pop !== pop) return; // 已切换/关闭
      if (!pd || !pd.ok) throw new Error((pd && pd.error) || '解读生成失败');
      pop.innerHTML = '<div class="pt-title"><span>🔮 ' + esc(pd.title) + ' <span style="font-size:10px;border:1px solid currentColor;border-radius:8px;padding:0 6px;color:' + (LV_COLOR[pd.level] || LV_COLOR.neutral) + '">' + (LV_LABEL[pd.level] || '') + '</span></span><button class="pt-close" title="关闭">✕</button></div>'
        + '<div class="pt-summary ' + pd.level + '">' + esc(pd.summary) + '</div>'
        + (pd.lines || []).map(function (l) { return '<div class="pt-line ' + l.level + '"><span class="pt-label">' + esc(l.label) + '</span>' + esc(l.text) + '</div>'; }).join('')
        + '<div class="pt-hint">点击其他位置切换 · 点空白或按 ESC 关闭</div>';
      pop.querySelector('.pt-close').addEventListener('click', hide);
      anchorPop(pop, container, opts.anchor);
    }).catch(function (e) {
      if (_pop !== pop) return;
      pop.innerHTML = '<div class="pt-title"><span>⚠️ ' + esc((e && e.message) || '解读失败（请先排盘）') + '</span><button class="pt-close">✕</button></div>';
      pop.querySelector('.pt-close').addEventListener('click', hide);
      anchorPop(pop, container, opts.anchor);
    });
  }

  // 便捷绑定：在 container 上代理 selector 的点击
  function bind(container, selector, conf) {
    if (!container) return;
    container.addEventListener('click', function (ev) {
      var el = ev.target.closest(selector);
      if (!el || !container.contains(el)) return;
      ev.stopPropagation();
      show({ container: container, anchor: el, key: conf.keyOf(el), module: conf.module, params: conf.paramOf(el) });
    });
  }

  window.PaipanTap = { show: show, hide: hide, bind: bind };
})();
