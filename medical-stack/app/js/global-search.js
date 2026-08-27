/**
 * TCM-Agent 全局智能搜索组件 V1.0
 *
 * 功能：
 * - Ctrl/Cmd + K 唤起 / Esc 关闭
 * - 输入即搜（300ms 防抖）
 * - 5 源融合：患者 / 处方 / 方剂 / 穴位 / KB
 * - 历史搜索 localStorage 持久化（最近 20 条）
 * - 键盘 ↑↓ 导航 + Enter 跳转
 * - 模糊匹配 + 实时联想
 *
 * 使用方式：<script src="js/global-search.js"></script>
 *           （nav.js 已自动加载，无需手动引用）
 */

(function() {
  if (typeof window === 'undefined') return;

  var HISTORY_KEY = 'tcm_global_search_history';
  var DEBOUNCE_MS = 300;
  var MAX_RESULTS = 8;
  var MAX_HISTORY = 20;

  // ─── 持久化辅助 ───
  function loadHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }
  function saveHistory(arr) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, MAX_HISTORY))); } catch(e) {}
  }
  function pushHistory(q) {
    if (!q || !q.trim()) return;
    var arr = loadHistory().filter(function(x) { return x !== q; });
    arr.unshift(q);
    saveHistory(arr);
  }

  // ─── 状态 ───
  var state = {
    open: false,
    query: '',
    results: [],
    selectedIdx: 0,
    loading: false,
    debounceTimer: null,
    lastFetchController: null,
    panel: null,
    overlay: null
  };

  // ─── 键盘快捷键 ───
  function bindGlobalHotkey() {
    document.addEventListener('keydown', function(e) {
      // Ctrl+K or Cmd+K or / 聚焦
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openPanel();
        return;
      }
      // 只在已打开时响应 Esc/↑↓/Enter
      if (!state.open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveSelection(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveSelection(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        activateSelected();
      }
    });
  }

  // ─── 搜索请求 ───
  function search(q) {
    if (state.lastFetchController) {
      try { state.lastFetchController.abort(); } catch(e) {}
    }
    var ctl = new AbortController();
    state.lastFetchController = ctl;
    state.loading = true;
    return fetch('/api/search?q=' + encodeURIComponent(q) + '&limit=' + MAX_RESULTS, {
      signal: ctl.signal
    }).then(function(r) { return r.json(); })
      .then(function(d) {
        state.loading = false;
        state.results = (d && d.results) ? d.results : [];
        renderResults();
      }).catch(function(e) {
        if (e.name === 'AbortError') return;
        state.loading = false;
        state.results = [];
        renderResults();
      });
  }

  // ─── 渲染 ───
  function createPanel() {
    var overlay = document.createElement('div');
    overlay.className = 'tcm-gs-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '全局智能搜索');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.5);z-index:9998;display:none;align-items:flex-start;justify-content:center;padding-top:80px';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePanel();
    });

    var panel = document.createElement('div');
    panel.className = 'tcm-gs-panel';
    panel.style.cssText = 'background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.3);width:min(640px,90vw);max-height:75vh;display:flex;flex-direction:column;overflow:hidden';

    // 搜索框
    var box = document.createElement('div');
    box.style.cssText = 'display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #e5e7eb';
    var icon = document.createElement('span');
    icon.textContent = '🔍';
    icon.style.cssText = 'font-size:20px';
    box.appendChild(icon);

    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'tcm-gs-input';
    input.placeholder = '搜索患者、处方、方剂、穴位、知识库…（Ctrl+K）';
    input.setAttribute('aria-label', '全局搜索输入框');
    input.style.cssText = 'flex:1;border:none;outline:none;font-size:16px;background:transparent;color:#0f172a';
    input.addEventListener('input', function() {
      state.query = input.value;
      state.selectedIdx = 0;
      clearTimeout(state.debounceTimer);
      state.debounceTimer = setTimeout(function() {
        if (state.query.trim().length >= 1) search(state.query);
        else { state.results = []; renderResults(); }
      }, DEBOUNCE_MS);
    });
    box.appendChild(input);

    var kbd = document.createElement('span');
    kbd.textContent = 'ESC';
    kbd.style.cssText = 'font-size:11px;color:#94a3b8;background:#f1f5f9;padding:2px 8px;border-radius:4px';
    box.appendChild(kbd);
    panel.appendChild(box);

    // 结果区
    var list = document.createElement('div');
    list.id = 'tcm-gs-list';
    list.style.cssText = 'flex:1;overflow-y:auto;padding:6px 0';
    panel.appendChild(list);

    // 底部提示
    var footer = document.createElement('div');
    footer.style.cssText = 'padding:8px 18px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;background:#f8fafc';
    footer.innerHTML = '<span>↑↓ 导航 · Enter 跳转 · ESC 关闭</span><span>TCM 智能搜索 v1.0</span>';
    panel.appendChild(footer);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    state.overlay = overlay;
    state.panel = panel;
  }

  function renderResults() {
    if (!state.panel) return;
    var list = state.panel.querySelector('#tcm-gs-list');
    if (!list) return;

    // 状态：未输入 → 历史
    if (!state.query.trim()) {
      var hist = loadHistory();
      if (!hist.length) {
        list.innerHTML = '<div style="padding:32px 18px;text-align:center;color:#94a3b8;font-size:13px">输入关键词开始搜索 · 历史为空</div>';
      } else {
        var hhtml = '<div style="padding:8px 18px 4px;font-size:11px;color:#94a3b8;font-weight:600">最近搜索</div>';
        hist.forEach(function(h, i) {
          hhtml += '<div class="tcm-gs-item" data-q="' + h.replace(/"/g, '&quot;') + '" style="padding:8px 18px;cursor:pointer;display:flex;align-items:center;gap:8px">' +
                   '<span style="color:#94a3b8">🕐</span><span style="color:#334155">' + h + '</span></div>';
        });
        list.innerHTML = hhtml;
        bindHistoryItems();
      }
      return;
    }

    // 加载中
    if (state.loading && state.results.length === 0) {
      list.innerHTML = '<div style="padding:32px 18px;text-align:center;color:#94a3b8;font-size:13px">⏳ 搜索中…</div>';
      return;
    }

    // 0 结果
    if (!state.results.length) {
      list.innerHTML = '<div style="padding:32px 18px;text-align:center;color:#94a3b8;font-size:13px">未找到「' + escapeHtml(state.query) + '」相关结果<br><span style="font-size:11px">尝试：失眠、桂枝汤、合谷、患者姓名</span></div>';
      return;
    }

    var typeIcons = {
      patient: '👤', prescription: '📋', formula: '💊',
      acupoint: '📍', kb: '📚', case: '🗂️'
    };
    var typeLabels = {
      patient: '患者', prescription: '处方', formula: '方剂',
      acupoint: '穴位', kb: '知识', case: '病例'
    };
    var html = '';
    state.results.forEach(function(r, i) {
      var icon = typeIcons[r.type] || '📄';
      var label = typeLabels[r.type] || r.type || '';
      var title = escapeHtml(r.title || r.id || '');
      var desc = escapeHtml((r.desc || '').slice(0, 60));
      html += '<div class="tcm-gs-item" data-idx="' + i + '" style="padding:10px 18px;cursor:pointer;display:flex;align-items:center;gap:12px;' +
              (i === state.selectedIdx ? 'background:#eff6ff' : '') + '">' +
              '<span style="font-size:18px">' + icon + '</span>' +
              '<div style="flex:1;min-width:0">' +
              '<div style="font-size:14px;color:#0f172a;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + title + '</div>' +
              (desc ? '<div style="font-size:11px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + desc + '</div>' : '') +
              '</div>' +
              '<span style="font-size:10px;color:#94a3b8;background:#f1f5f9;padding:2px 6px;border-radius:4px">' + label + '</span>' +
              '</div>';
    });
    list.innerHTML = html;
    bindResultItems();
  }

  function bindHistoryItems() {
    if (!state.panel) return;
    var items = state.panel.querySelectorAll('.tcm-gs-item');
    items.forEach(function(el) {
      el.addEventListener('click', function() {
        var q = el.getAttribute('data-q');
        var input = state.panel.querySelector('#tcm-gs-input');
        if (input) {
          input.value = q;
          state.query = q;
          search(q);
        }
      });
    });
  }

  function bindResultItems() {
    if (!state.panel) return;
    var items = state.panel.querySelectorAll('.tcm-gs-item[data-idx]');
    items.forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = parseInt(el.getAttribute('data-idx'));
        state.selectedIdx = idx;
        activateSelected();
      });
      el.addEventListener('mouseenter', function() {
        state.selectedIdx = parseInt(el.getAttribute('data-idx'));
        renderResults();
      });
    });
  }

  function moveSelection(dir) {
    if (!state.results.length) return;
    state.selectedIdx = (state.selectedIdx + dir + state.results.length) % state.results.length;
    renderResults();
  }

  function activateSelected() {
    var r = state.results[state.selectedIdx];
    if (!r) return;
    pushHistory(state.query);
    closePanel();
    var link = r.link;
    if (link) {
      if (link.startsWith('#')) {
        location.hash = link;
      } else if (link.startsWith('http')) {
        window.open(link, '_blank');
      } else {
        location.href = link;
      }
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function openPanel() {
    if (!state.panel) createPanel();
    state.open = true;
    state.overlay.style.display = 'flex';
    var input = state.panel.querySelector('#tcm-gs-input');
    if (input) {
      input.value = state.query || '';
      setTimeout(function() { input.focus(); input.select(); }, 50);
    }
    renderResults();
  }

  function closePanel() {
    if (!state.overlay) return;
    state.open = false;
    state.overlay.style.display = 'none';
  }

  // ─── 启动 ───
  function init() {
    bindGlobalHotkey();
    // 暴露 API
    window.TCM = window.TCM || {};
    window.TCM.search = window.TCM.search || {
      open: openPanel,
      close: closePanel,
      search: search,
      history: function() { return loadHistory(); },
      clearHistory: function() { saveHistory([]); }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();