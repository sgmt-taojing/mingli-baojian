/**
 * 排盘白话解读 · 共享前端面板 v1.0 (R-BAIHUA-2026-08-27)
 * 契约：POST /api/paipan/:module/baihua
 *   → { ok, module, overview, cards[{title,plain,level}], forecast[{period,plain,tone}],
 *       backtest[{period,plain,verifyAsk,tone}], tips[] }
 * 行为：
 *   - 排盘完成后由页面调用 PaipanBaihua.notify(module, requestBody)
 *   - 渲染四区块：①白话总览 ②逐要素卡（level 配色）③往后预测时间轴 ④往前验证（可答符合/不符合）
 *   - 验证反馈存 localStorage（mlbj_baihua_verify）
 */
(function () {
  'use strict';

  var API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') ? 'http://127.0.0.1:8920' : '';

  var LEVEL_COLOR = { good: '#4ec9b0', bad: '#ef4444', neutral: '#8b8f9e' };
  var LEVEL_LABEL = { good: '吉', bad: '凶', neutral: '平' };
  var TONE_ARROW = { good: '↑', bad: '↓', neutral: '→' };

  var MODULE_NAME = {
    bazi: '八字', ziwei: '紫微斗数', qimen: '奇门遁甲', liuyao: '六爻',
    liuren: '大六壬', meihua: '梅花易数', fengshui: '玄空风水'
  };

  var panelEl = null;
  var loading = false;
  var lastVerifyKey = null;

  function ensurePanel() {
    if (panelEl && document.body.contains(panelEl)) return panelEl;
    panelEl = document.createElement('div');
    panelEl.id = 'paipan-baihua';
    panelEl.style.cssText = 'max-width:600px;margin:12px auto;padding:14px 16px;background:var(--card,#141928);border:1px solid var(--gold,#c9a84c);border-radius:12px;font-size:13px;color:var(--paper,#e8dcc8);box-shadow:0 4px 20px rgba(201,168,76,.12)';
    // 优先挂到排盘结果容器前，其次 main 顶部
    var anchor = document.getElementById('chartContainer') || document.getElementById('baziResult') || document.querySelector('.chart-wrap') || document.querySelector('main') || document.body;
    if (anchor === document.body || anchor.tagName === 'MAIN') anchor.insertBefore(panelEl, anchor.firstChild);
    else anchor.parentNode.insertBefore(panelEl, anchor);
    return panelEl;
  }

  function el(tag, css, text) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (text != null) e.textContent = text;
    return e;
  }

  function loadVerify() {
    try { return JSON.parse(localStorage.getItem('mlbj_baihua_verify') || '{}'); } catch (e) { return {}; }
  }
  function saveVerify(v) {
    try { localStorage.setItem('mlbj_baihua_verify', JSON.stringify(v)); } catch (e) {}
  }

  function renderLoading() {
    var panel = ensurePanel();
    panel.innerHTML = '';
    panel.appendChild(el('div', 'color:var(--gold,#c9a84c);font-weight:600;letter-spacing:1px;margin-bottom:8px', '💬 白话解读'));
    panel.appendChild(el('div', 'color:var(--paper3,#8b7e6a);font-size:12px', '正在把盘面翻译成人话…'));
  }

  function renderPanel(data, module, reqBody) {
    var panel = ensurePanel();
    panel.innerHTML = '';
    var verifyStore = loadVerify();
    lastVerifyKey = module + ':' + JSON.stringify(reqBody).slice(0, 80);

    // 头部
    var head = el('div', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px');
    head.appendChild(el('span', 'color:var(--gold,#c9a84c);font-weight:600;letter-spacing:1px;font-size:14px', '💬 白话解读 · ' + (MODULE_NAME[module] || module)));
    head.appendChild(el('span', 'color:var(--paper3,#8b7e6a);font-size:11px', '不懂术语也能看懂'));
    panel.appendChild(head);

    // ① 白话总览
    var ov = el('div', 'background:rgba(201,168,76,.08);border-left:3px solid var(--gold,#c9a84c);border-radius:6px;padding:10px 12px;margin-bottom:12px;line-height:1.8;font-size:13px');
    ov.textContent = data.overview || '';
    panel.appendChild(ov);

    // ② 逐要素卡
    if (data.cards && data.cards.length) {
      var grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px;margin-bottom:12px');
      data.cards.forEach(function (c) {
        var card = el('div', 'background:rgba(255,255,255,.03);border:1px solid var(--border,#2a3450);border-radius:8px;padding:8px 10px');
        var t = el('div', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px');
        t.appendChild(el('span', 'color:var(--gold,#c9a84c);font-size:12px;font-weight:600', c.title));
        var badge = el('span', 'font-size:10px;padding:1px 6px;border-radius:8px;border:1px solid ' + (LEVEL_COLOR[c.level] || '#888') + ';color:' + (LEVEL_COLOR[c.level] || '#888'), LEVEL_LABEL[c.level] || '');
        t.appendChild(badge);
        card.appendChild(t);
        card.appendChild(el('div', 'font-size:12px;line-height:1.7;color:var(--paper,#e8dcc8)', c.plain));
        grid.appendChild(card);
      });
      panel.appendChild(grid);
    }

    // ③ 往后预测
    if (data.forecast && data.forecast.length) {
      panel.appendChild(el('div', 'color:var(--gold,#c9a84c);font-size:12px;font-weight:600;margin:10px 0 6px', '🔮 往后看 · 未来' + data.forecast.length + '年'));
      var tl = el('div', 'border-left:2px solid rgba(201,168,76,.3);padding-left:12px;margin-bottom:12px');
      data.forecast.forEach(function (f) {
        var item = el('div', 'position:relative;margin-bottom:8px');
        var dot = el('span', 'position:absolute;left:-17px;top:5px;width:8px;height:8px;border-radius:50%;background:' + (LEVEL_COLOR[f.tone] || '#8b8f9e'));
        item.appendChild(dot);
        item.appendChild(el('div', 'font-size:11px;color:var(--gold,#c9a84c);font-weight:600', f.period + ' ' + (TONE_ARROW[f.tone] || '')));
        item.appendChild(el('div', 'font-size:12px;line-height:1.7', f.plain));
        tl.appendChild(item);
      });
      panel.appendChild(tl);
    }

    // ④ 往前验证
    if (data.backtest && data.backtest.length) {
      panel.appendChild(el('div', 'color:var(--gold,#c9a84c);font-size:12px;font-weight:600;margin:10px 0 6px', '🔍 往前验证 · 已发生的事对得上吗'));
      panel.appendChild(el('div', 'font-size:11px;color:var(--paper3,#8b7e6a);margin-bottom:6px', '先别信，先验证：看看过去几年的盘象和您的实际经历是否吻合。'));
      data.backtest.forEach(function (b, idx) {
        var card = el('div', 'background:rgba(255,255,255,.03);border:1px solid var(--border,#2a3450);border-radius:8px;padding:8px 10px;margin-bottom:6px');
        card.appendChild(el('div', 'font-size:11px;color:var(--gold,#c9a84c);font-weight:600;margin-bottom:3px', b.period));
        card.appendChild(el('div', 'font-size:12px;line-height:1.7;margin-bottom:4px', b.plain));
        if (b.verifyAsk) card.appendChild(el('div', 'font-size:12px;color:var(--jade,#4ec9b0);margin-bottom:6px', '🤔 ' + b.verifyAsk));
        var vKey = lastVerifyKey + ':' + b.period;
        var btns = el('div', 'display:flex;gap:6px;align-items:center');
        var answered = verifyStore[vKey];
        ['符合', '不符合'].forEach(function (label) {
          var btn = el('button', 'padding:3px 12px;font-size:11px;border-radius:10px;cursor:pointer;border:1px solid ' + (label === '符合' ? 'rgba(78,201,176,.4)' : 'rgba(239,68,68,.4)') + ';background:' + (answered === label ? (label === '符合' ? 'rgba(78,201,176,.25)' : 'rgba(239,68,68,.25)') : 'transparent') + ';color:' + (label === '符合' ? '#4ec9b0' : '#ef4444'), label);
          btn.onclick = function () {
            var store = loadVerify();
            store[vKey] = label;
            saveVerify(store);
            // 只刷新按钮区
            btns.querySelectorAll('button').forEach(function (x) { x.style.background = 'transparent'; });
            btn.style.background = label === '符合' ? 'rgba(78,201,176,.25)' : 'rgba(239,68,68,.25)';
            hint.textContent = label === '符合' ? '✓ 已记录：这一年对上了' : '已记录：这一年没对上，解读权重会相应调整';
          };
          btns.appendChild(btn);
        });
        var hint = el('span', 'font-size:10px;color:var(--paper3,#8b7e6a)', answered ? '已反馈：' + answered : '');
        btns.appendChild(hint);
        card.appendChild(btns);
        panel.appendChild(card);
      });
    }

    // tips
    if (data.tips && data.tips.length) {
      var tips = el('div', 'margin-top:10px;padding-top:8px;border-top:1px dashed var(--border,#2a3450);font-size:11px;color:var(--paper3,#8b7e6a);line-height:1.8');
      tips.textContent = '💡 ' + data.tips.join('；');
      panel.appendChild(tips);
    }
  }

  function renderError(msg) {
    var panel = ensurePanel();
    panel.innerHTML = '';
    panel.appendChild(el('div', 'color:var(--paper3,#8b7e6a);font-size:12px', '白话解读暂时不可用：' + msg));
  }

  window.PaipanBaihua = {
    notify: function (module, requestBody) {
      if (loading) return;
      loading = true;
      renderLoading();
      fetch(API_BASE + '/api/paipan/' + module + '/baihua', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Skip-Interceptor': '1' },
        body: JSON.stringify(requestBody || {}),
        signal: AbortSignal.timeout(20000)
      }).then(function (r) { return r.json(); })
        .then(function (res) {
          loading = false;
          var data = res && res.data ? res.data : res;
          if (data && data.ok) renderPanel(data, module, requestBody || {});
          else renderError((res && res.message) || '生成失败');
        })
        .catch(function (e) { loading = false; renderError(e && e.message ? e.message : '网络异常'); });
    }
  };
})();
