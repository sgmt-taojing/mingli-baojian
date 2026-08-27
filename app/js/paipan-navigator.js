/**
 * 排盘导航 · 共享前端面板 v1.0 (R-NAV-2026-08-27)
 * 与问诊台副驾驶同一契约：POST /api/paipan/navigator
 *   → followups[{key,ask,why,priority,source,quick[]}] + coverage
 * 行为：
 *   - 页面加载/表单变更(防抖)/排盘完成(notifyChart) 时重算
 *   - 点「已问」收敛消失；点快捷回复回填对应输入框（可回填时）
 *   - 优先级色阶：p0红 > p1黄 > p2蓝 > p3青 > p4灰
 */
(function () {
  'use strict';

  var API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') ? 'http://127.0.0.1:8920' : '';
  var PAGE = (location.pathname.split('/').pop() || '').toLowerCase();

  var CONFIGS = {
    'bazi.html':          { module: 'bazi',     kind: 'bazi' },
    'ziwei-chart.html':   { module: 'ziwei',    prefix: 'zw-' },
    'qimen-chart.html':   { module: 'qimen',    prefix: 'qm-' },
    'liuyao-chart.html':  { module: 'liuyao',   prefix: 'ly-' },
    'liuren-chart.html':  { module: 'liuren',   prefix: 'lr-' },
    'meihua-chart.html':  { module: 'meihua',   prefix: 'mh-' },
    'fengshui-chart.html':{ module: 'fengshui', prefix: 'fs-' }
  };
  var cfg = CONFIGS[PAGE];
  if (!cfg) return; // 非排盘页不启动

  var PRI_COLOR = { p0: '#ef4444', p1: '#f59e0b', p2: '#63b3ed', p3: '#4ec9b0', p4: '#8b8f9e' };
  var PRI_LABEL = { p0: 'P0 关键信息', p1: 'P1 格局鉴别', p2: 'P2 断语核对', p3: 'P3 应期深挖', p4: 'P4 问卷缺口' };

  var asked = [];
  var hasChart = false;
  var refreshing = false;

  function collectFormState() {
    var s = {};
    if (cfg.kind === 'bazi') {
      var dateStr = (document.getElementById('baziDate') || {}).value || '';
      if (dateStr) {
        var parts = dateStr.split('-');
        s.year = +parts[0]; s.month = +parts[1]; s.day = +parts[2];
      }
      var h = (document.getElementById('baziHour') || {}).value;
      if (h !== '' && h != null) s.hour = +h;
      var sex = (document.getElementById('baziSex') || {}).value;
      if (sex) s.sex = sex;
      var lng = (document.getElementById('baziLng') || {}).value;
      if (lng) s.lng = +lng;
      var ty = (document.getElementById('baziTargetYear') || {}).value;
      if (ty) s.targetYear = +ty;
      s.lunar = false; // 八字页当前为公历输入
      return s;
    }
    // 前缀模式：读取所有 prefix 开头的 input/select
    var els = document.querySelectorAll('input[id^="' + cfg.prefix + '"],select[id^="' + cfg.prefix + '"],textarea[id^="' + cfg.prefix + '"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.id.slice(cfg.prefix.length);
      if (!key) continue;
      if (el.type === 'checkbox') { s[key] = el.checked; continue; }
      var v = el.value;
      if (v === '') continue;
      s[key] = (el.type === 'number') ? +v : v;
    }
    // 紫微历法开关
    if (cfg.module === 'ziwei') {
      if (window.zwCalMode) s.lunar = (window.zwCalMode === 'lunar');
      var leap = document.getElementById('zw-leap');
      if (leap) s.leapMonth = !!leap.checked;
    }
    return s;
  }

  // 快捷回复回填目标：问事/关注类 → 页面 question 输入框
  function fillTarget(f) {
    if (f.key === 'p0:question' || f.key === 'p4:focus') {
      var q = document.getElementById(cfg.prefix ? cfg.prefix + 'question' : 'baziQuestion');
      return q || null;
    }
    if (f.key === 'p0:sex') {
      return document.getElementById(cfg.prefix ? cfg.prefix + 'sex' : 'baziSex') || null;
    }
    if (f.key === 'p3:target-year') {
      return document.getElementById(cfg.prefix ? cfg.prefix + 'target-year' : 'baziTargetYear') || null;
    }
    return null;
  }

  function refresh() {
    if (refreshing) return;
    refreshing = true;
    var body = { module: cfg.module, formState: collectFormState(), hasChart: hasChart, asked: asked };
    fetch(API_BASE + '/api/paipan/navigator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Interceptor': '1' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000)
    }).then(function (r) { return r.json(); })
      .then(function (res) {
        refreshing = false;
        var data = res && res.data ? res.data : res; // 兼容裸响应与归一化包装
        if (data && data.ok) renderPanel(data);
      })
      .catch(function () { refreshing = false; });
  }

  var panelEl = null;
  function ensurePanel() {
    if (panelEl) return panelEl;
    panelEl = document.createElement('div');
    panelEl.id = 'paipan-navigator';
    panelEl.style.cssText = 'max-width:600px;margin:12px auto;padding:12px 14px;background:var(--card,#141928);border:1px solid var(--border,#2a3450);border-radius:10px;font-size:12px;color:var(--paper,#e8dcc8)';
    var main = document.querySelector('main') || document.body;
    main.insertBefore(panelEl, main.firstChild);
    return panelEl;
  }

  function renderPanel(data) {
    var panel = ensurePanel();
    panel.innerHTML = '';

    // 头部：标题 + 覆盖度
    var head = document.createElement('div');
    head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px';
    var title = document.createElement('span');
    title.style.cssText = 'color:var(--gold,#c9a84c);font-weight:600;letter-spacing:1px';
    title.textContent = '🧭 排盘导航 · ' + (data.moduleName || cfg.module);
    var cov = document.createElement('span');
    cov.style.cssText = 'color:var(--paper3,#8b7e6a);font-size:11px';
    cov.textContent = '信息覆盖 ' + data.coverage.percent + '%（' + data.coverage.coveredCount + '/' + data.coverage.total + '）';
    head.appendChild(title); head.appendChild(cov);
    panel.appendChild(head);

    // 覆盖度进度条
    var barWrap = document.createElement('div');
    barWrap.style.cssText = 'height:4px;background:rgba(255,255,255,.06);border-radius:2px;margin-bottom:10px;overflow:hidden';
    var bar = document.createElement('div');
    bar.style.cssText = 'height:100%;width:' + data.coverage.percent + '%;background:var(--gold,#c9a84c);transition:width .4s';
    barWrap.appendChild(bar);
    panel.appendChild(barWrap);

    if (!data.followups.length) {
      var done = document.createElement('div');
      done.style.cssText = 'color:var(--jade,#4ec9b0);font-size:12px';
      done.textContent = '✓ 排盘信息已齐，没有待办追问。';
      panel.appendChild(done);
      return;
    }

    data.followups.forEach(function (f) {
      var card = document.createElement('div');
      card.style.cssText = 'border-left:3px solid ' + (PRI_COLOR[f.priority] || '#888') + ';background:rgba(255,255,255,.03);border-radius:6px;padding:8px 10px;margin-bottom:6px';

      var top = document.createElement('div');
      top.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;gap:8px';
      var ask = document.createElement('div');
      ask.style.cssText = 'font-size:12px;line-height:1.6;flex:1';
      ask.textContent = f.ask;
      var doneBtn = document.createElement('button');
      doneBtn.textContent = '已问';
      doneBtn.style.cssText = 'flex:none;padding:2px 8px;font-size:10px;background:transparent;border:1px solid var(--border,#2a3450);border-radius:4px;color:var(--paper3,#8b7e6a);cursor:pointer';
      doneBtn.onclick = function () { asked.push(f.key); refresh(); };
      top.appendChild(ask); top.appendChild(doneBtn);
      card.appendChild(top);

      var meta = document.createElement('div');
      meta.style.cssText = 'font-size:10px;color:var(--paper3,#8b7e6a);margin-top:4px';
      meta.textContent = (PRI_LABEL[f.priority] || f.priority) + ' · ' + f.why;
      card.appendChild(meta);

      if (f.quick && f.quick.length) {
        var chips = document.createElement('div');
        chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:6px';
        f.quick.forEach(function (q) {
          var chip = document.createElement('button');
          chip.textContent = q;
          chip.style.cssText = 'padding:3px 8px;font-size:10px;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.25);border-radius:10px;color:var(--gold,#c9a84c);cursor:pointer';
          chip.onclick = function () {
            var target = fillTarget(f);
            if (target) {
              // 问事/关注类回填文本，性别类回填值
              if (f.key === 'p0:sex') target.value = (q === '男') ? 'male' : (q === '女' ? 'female' : q);
              else if (target.type === 'number') { var n = q.match(/\d{4}/); if (n) target.value = n[0]; }
              else target.value = q;
              target.dispatchEvent(new Event('change', { bubbles: true }));
            }
            asked.push(f.key);
            refresh();
          };
          chips.appendChild(chip);
        });
        card.appendChild(chips);
      }
      panel.appendChild(card);
    });
  }

  // 表单变更 → 防抖重算
  var timer = null;
  document.addEventListener('change', function (e) {
    if (!e.target || !e.target.id) return;
    if (cfg.prefix && e.target.id.indexOf(cfg.prefix) !== 0) return;
    if (cfg.kind === 'bazi' && e.target.id.indexOf('bazi') !== 0) return;
    clearTimeout(timer);
    timer = setTimeout(refresh, 350);
  });

  // 对外钩子：排盘完成后调用
  window.PaipanNav = {
    notifyChart: function () { hasChart = true; refresh(); },
    refresh: refresh
  };

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }
})();
