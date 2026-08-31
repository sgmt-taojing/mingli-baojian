/* R-SLA-3TIER · 批注队列 48h SLA 三级预警组件
 * 阈值：age<24h 绿 ｜ 24–36h 黄 ｜ 36–48h 橙 ｜ ≥48h（overdue）红
 * 数据源：8974 /api/annotation-queue（旁路只读，绝不触医学正文——R745/R756）
 * 用法：SLATier.mount('元素id', { detailed: true|false, refreshMs: 60000 })
 * 页面需自带 escapeHtml 或使用组件内置转义。
 */
(function () {
  'use strict';
  var API = 'http://127.0.0.1:8974/api/annotation-queue';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function tierOf(a, slaHours) {
    var sla = slaHours || 48;
    var age = Number(a.age_hours || 0);
    if (a.overdue || age >= sla) return { k: 'red', label: '红·超 48h', color: '#f87171' };
    if (age >= 36) return { k: 'orange', label: '橙·36h+', color: '#fb923c' };
    if (age >= 24) return { k: 'yellow', label: '黄·24h+', color: '#fbbf24' };
    return { k: 'green', label: '绿·正常', color: '#34d399' };
  }

  function summarize(queue, slaHours) {
    var t = { green: 0, yellow: 0, orange: 0, red: 0 };
    (queue || []).forEach(function (a) { t[tierOf(a, slaHours).k]++; });
    return t;
  }

  function worstColor(t) {
    if (t.red) return '#f87171';
    if (t.orange) return '#fb923c';
    if (t.yellow) return '#fbbf24';
    return '#34d399';
  }

  function renderPill(q) {
    var t = summarize(q.queue, q.sla_hours);
    var c = worstColor(t);
    var total = q.backlog || 0;
    var txt = total === 0
      ? '批注队列清空 ✅'
      : '批注 ' + total + ' 待核 · 红' + t.red + ' 橙' + t.orange + ' 黄' + t.yellow + ' 绿' + t.green;
    return '<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;'
      + 'font-size:12px;border:1px solid ' + c + ';color:' + c + '">'
      + '<span style="width:8px;height:8px;border-radius:50%;background:' + c + '"></span>'
      + esc(txt) + '</span>';
  }

  function renderList(q) {
    if (!q.queue || !q.queue.length) {
      return '<div style="color:var(--muted,#888);padding:4px 0">队列清空，无待核批注 ✅</div>';
    }
    return q.queue.map(function (a) {
      var t = tierOf(a, q.sla_hours);
      var remain = Math.max(0, (q.sla_hours || 48) - (a.age_hours || 0));
      var tag = t.k === 'red' ? '已超 ' + ((a.age_hours || 0) - (q.sla_hours || 48)).toFixed(1) + 'h'
        : '剩 ' + remain.toFixed(1) + 'h';
      return '<div style="padding:3px 0;border-top:1px dashed rgba(255,255,255,.06);color:' + t.color + '">'
        + '<b style="font-size:11px">[' + t.label + ']</b> '
        + '#' + esc(a.emr_id || '') + ' · ' + (a.type === 'ai' ? '🤖AI' : '✍️人工')
        + ' · ' + esc(a.author || '') + ' · 已等 ' + (a.age_hours || 0) + 'h（' + tag + '）</div>';
    }).join('');
  }

  function mount(elId, opts) {
    opts = opts || {};
    var el = document.getElementById(elId);
    if (!el) return;
    var detailed = !!opts.detailed;
    var refreshMs = opts.refreshMs || 60000;

    async function tick() {
      try {
        var q = await fetch(API, { signal: AbortSignal.timeout(6000) }).then(function (r) { return r.json(); });
        if (!q.ok) throw new Error(q.error || '队列接口异常');
        el.innerHTML = renderPill(q) + (detailed
          ? '<div style="margin-top:6px">' + renderList(q) + '</div>' : '');
      } catch (e) {
        el.innerHTML = '<span style="color:var(--muted,#888);font-size:12px">批注服务（8974）不可达：'
          + esc(e.message) + '</span>';
      }
    }
    tick();
    if (opts.noTimer !== true) setInterval(tick, refreshMs);
    return tick;
  }

  window.SLATier = { mount: mount, tierOf: tierOf, summarize: summarize, renderPill: renderPill, renderList: renderList };
})();
