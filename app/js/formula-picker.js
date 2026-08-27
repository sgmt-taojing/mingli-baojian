/**
 * formula-picker.js — 方剂检索选择器（R-FORMULA-SEARCH）
 * 用法：FormulaPicker.attach(inputEl, { onPick(card), target: textareaEl })
 * 支持：中文 / 拼音全拼 / 首字母（bht→白虎汤）/ 模糊；选中后展示完整卡片（含古籍原文）
 */
(function (global) {
  'use strict';

  const API = (location.protocol === 'file:' || location.port === '8900') ? 'http://127.0.0.1:8920' : '';
  const esc = global.escHtml || global.escapeHtml || function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };

  const TRAD_LABEL = { tcm: '中医经典', kampo: '日本汉方', hanbang: '韩国韩方', ayurveda: '阿育吠陀', western: '西方草本', nam_thuoc: '越南南药', global: '其他' };

  function attach(input, opts) {
    opts = opts || {};
    if (!input) return;

    // 下拉容器
    const drop = document.createElement('div');
    drop.style.cssText = 'position:absolute;left:0;right:0;top:100%;z-index:60;background:#15151f;border:1px solid rgba(201,168,76,.35);border-radius:8px;max-height:300px;overflow:auto;display:none;margin-top:4px;box-shadow:0 8px 24px rgba(0,0,0,.5)';
    const wrap = input.parentElement;
    if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
    wrap.appendChild(drop);

    // 详情卡容器
    const card = document.createElement('div');
    card.style.cssText = 'display:none;margin-top:8px;border:1px solid rgba(201,168,76,.3);border-radius:8px;padding:10px 12px;background:rgba(201,168,76,.05);font-size:12px;line-height:1.8';
    wrap.appendChild(card);

    let timer = null, lastQ = '';
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 1) { drop.style.display = 'none'; return; }
      timer = setTimeout(() => doSearch(q), 220);
    });
    input.addEventListener('blur', () => setTimeout(() => { drop.style.display = 'none'; }, 250));

    async function doSearch(q) {
      if (q === lastQ) return; lastQ = q;
      try {
        const r = await fetch(API + '/api/formulas/search?q=' + encodeURIComponent(q) + '&limit=10', { signal: AbortSignal.timeout(8000) });
        const j = await r.json();
        const list = (j && j.data) || [];
        if (!list.length) {
          drop.innerHTML = '<div style="padding:10px;color:#8b7e6a;font-size:12px">未收录该方剂，可手动输入</div>';
          drop.style.display = 'block';
          return;
        }
        drop.innerHTML = list.map((f, i) =>
          '<div data-i="' + i + '" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);font-size:13px" ' +
          'onmouseover="this.style.background=\'rgba(201,168,76,.12)\'" onmouseout="this.style.background=\'\'">' +
          '<b style="color:#e8cc7a">' + esc(f.name) + '</b> <span style="color:#8b7e6a;font-size:11px">' + esc(TRAD_LABEL[f.tradition] || f.tradition) + ' · ' + esc(f.source || '') + (f.classical ? ' · 📜有古籍原文' : '') + '</span>' +
          '<div style="color:#b8b0a0;font-size:11px;margin-top:2px">' + esc((f.actions || '') + (f.indications ? '｜' + String(f.indications).slice(0, 40) : '')) + '</div>' +
          '</div>'
        ).join('');
        drop.style.display = 'block';
        drop.querySelectorAll('[data-i]').forEach(el => {
          el.addEventListener('mousedown', ev => { ev.preventDefault(); pick(list[+el.dataset.i]); });
        });
      } catch (e) { /* 网络异常静默 */ }
    }

    function pick(f) {
      drop.style.display = 'none';
      input.value = f.name;
      // 详情卡（含古籍原文）
      let h = '<div style="color:#e8cc7a;font-weight:bold;margin-bottom:4px">📖 ' + esc(f.name) + ' <span style="font-weight:normal;color:#8b7e6a">' + esc(f.source || '') + ' · ' + esc(f.category || '') + '</span></div>';
      if (f.composition) h += '<div><b>组成：</b>' + esc(f.composition) + '</div>';
      if (f.actions) h += '<div><b>功用：</b>' + esc(f.actions) + '</div>';
      if (f.indications) h += '<div><b>主治：</b>' + esc(f.indications) + '</div>';
      if (f.modifications) h += '<div><b>加减：</b>' + esc(f.modifications) + '</div>';
      if (f.contraindications) h += '<div style="color:#ef9a9a"><b>禁忌：</b>' + esc(f.contraindications) + '</div>';
      if (f.safety) h += '<div style="color:#ef9a9a"><b>安全：</b>' + esc(f.safety) + '</div>';
      if (f.classical) h += '<div style="margin-top:6px;border-top:1px dashed rgba(201,168,76,.3);padding-top:6px;color:#c9b896"><b>📜 古籍原文（' + esc(f.classical.chapter) + '）：</b><br>「' + esc(f.classical.text) + '」</div>';
      h += '<div style="margin-top:4px;color:#8b7e6a;font-size:11px">仅供中医辨证参考，不构成处方建议；实际用药须由执业中医师辨证论治</div>';
      card.innerHTML = h;
      card.style.display = 'block';
      // 填入目标输入框
      if (opts.target) {
        const line = f.name + (f.source ? '（' + f.source + '）' : '') + '：' + (f.composition || '');
        const t = opts.target;
        t.value = t.value ? t.value.replace(/\s+$/, '') + '\n' + line : line;
        t.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (typeof opts.onPick === 'function') opts.onPick(f);
    }
  }

  global.FormulaPicker = { attach };
})(window);
