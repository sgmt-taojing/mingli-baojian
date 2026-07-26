// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · KB 搜索框（divination-hub 入口）
// 客户端搜索 window.AUTHORITATIVE_KNOWLEDGE / window.FAITH_KNOWLEDGE_BASE
// 记录 _kb_search_count 反馈到本地统计
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const MAX_RESULTS = 30;        // 最多渲染 30 条
  const SNIPPET_RADIUS = 60;     // 关键词前后 60 字
  const STORAGE_KEY = '_kb_search_log';

  // 模块名 → 中文标签 + emoji
  const MODULE_LABELS = {
    'AUTHORITATIVE_KNOWLEDGE': { name: '经典知识库', emoji: '📚' },
    'FAITH_KNOWLEDGE_BASE': { name: '信仰知识库', emoji: '🛕' },
    'KOUJUE_DATABASE_FULL': { name: '口诀库', emoji: '📜' },
    'SCRIPTURE_DATABASE': { name: '经文库', emoji: '📖' },
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    const esc = escapeHtml(text);
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return esc.replace(re, (m) => `<span class="kb-search-hl">${m}</span>`);
  }

  function snippet(text, q) {
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) {
      return text.slice(0, SNIPPET_RADIUS * 2) + (text.length > SNIPPET_RADIUS * 2 ? '…' : '');
    }
    const start = Math.max(0, idx - SNIPPET_RADIUS);
    const end = Math.min(text.length, idx + q.length + SNIPPET_RADIUS);
    return (start > 0 ? '…' : '') + text.substring(start, end) + (end < text.length ? '…' : '');
  }

  // 递归扫描对象/数组，找到包含关键词的字符串
  function scan(obj, q, matches, currentPath, moduleKey) {
    if (matches.length >= MAX_RESULTS) return;
    if (typeof obj === 'string') {
      if (obj.toLowerCase().includes(q)) {
        matches.push({
          module: moduleKey,
          path: currentPath,
          text: obj,
          len: obj.length,
        });
      }
    } else if (obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => scan(item, q, matches, currentPath + '[' + i + ']', moduleKey));
      } else {
        Object.entries(obj).forEach(([k, v]) => {
          const next = currentPath ? currentPath + '.' + k : k;
          // 太深的路径剪枝（避免路径爆炸）
          if (next.length > 60) return;
          scan(v, q, matches, next, moduleKey);
        });
      }
    }
  }

  function getKbSources() {
    const sources = [];
    if (window.AUTHORITATIVE_KNOWLEDGE) sources.push('AUTHORITATIVE_KNOWLEDGE');
    if (window.FAITH_KNOWLEDGE_BASE) sources.push('FAITH_KNOWLEDGE_BASE');
    if (window.KOUJUE_DATABASE_FULL) sources.push('KOUJUE_DATABASE_FULL');
    if (window.SCRIPTURE_DATABASE) sources.push('SCRIPTURE_DATABASE');
    return sources;
  }

  function search(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    const sources = getKbSources();
    const matches = [];
    sources.forEach((key) => {
      const data = window[key];
      scan(data, q, matches, '', key);
    });
    return matches.slice(0, MAX_RESULTS);
  }

  function logSearch(query, count) {
    try {
      const log = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      log.push({ ts: Date.now(), q: query.slice(0, 20), count });
      // 只保留最近 100 条
      while (log.length > 100) log.shift();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch (_) {}
  }

  function renderResults(container, query) {
    const t0 = performance.now();
    const matches = search(query);
    const dur = Math.round(performance.now() - t0);

    if (matches.length === 0) {
      container.innerHTML = `
        <div class="kb-search-empty">
          <div class="kb-search-empty-icon">🔍</div>
          <div class="kb-search-empty-text">未找到与「${escapeHtml(query)}」相关的内容</div>
          <div class="kb-search-empty-hint">试试：天干、五行、八字、观音、化解、运势</div>
        </div>`;
      return;
    }

    // 按模块分组
    const byModule = {};
    matches.forEach((m) => {
      if (!byModule[m.module]) byModule[m.module] = [];
      byModule[m.module].push(m);
    });

    const sections = Object.entries(byModule).map(([mod, items]) => {
      const label = MODULE_LABELS[mod] || { name: mod, emoji: '📦' };
      return `<div class="kb-search-module">
        <div class="kb-search-module-head">
          <span class="kb-search-module-emoji">${label.emoji}</span>
          <span class="kb-search-module-name">${label.name}</span>
          <span class="kb-search-module-count">${items.length} 条</span>
        </div>
        <div class="kb-search-items">
          ${items.map((m) => {
            const snip = snippet(m.text, query);
            return `<div class="kb-search-item">
              <div class="kb-search-item-path">${escapeHtml(m.path || '(root)')}</div>
              <div class="kb-search-item-snip">${highlight(snip, query)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="kb-search-summary">
        共找到 <b>${matches.length}</b> 条匹配 · ${dur}ms · 命中
        ${Object.keys(byModule).length} 个模块
      </div>
      ${sections}`;

    logSearch(query, matches.length);
  }

  // 公开 mount API：让 divination-hub.html 直接调用
  window.mountKbSearchBox = function (mountEl) {
    if (!mountEl) return;
    mountEl.innerHTML = `
      <div class="kb-search-box">
        <div class="kb-search-input-wrap">
          <span class="kb-search-icon">🔍</span>
          <input type="search" id="kbSearchInput" class="kb-search-input"
                 placeholder="搜索 KB 条目（天干、五行、八字、观音...）"
                 aria-label="搜索知识库" autocomplete="off" />
          <button class="kb-search-clear" id="kbSearchClear" aria-label="清空搜索">✕</button>
        </div>
        <div class="kb-search-results" id="kbSearchResults"></div>
      </div>`;

    const input = mountEl.querySelector('#kbSearchInput');
    const clear = mountEl.querySelector('#kbSearchClear');
    const results = mountEl.querySelector('#kbSearchResults');

    let debounceTimer = null;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const q = input.value;
      clear.style.display = q ? 'block' : 'none';
      if (!q.trim()) {
        results.innerHTML = '';
        return;
      }
      debounceTimer = setTimeout(() => renderResults(results, q), 200);
    });

    clear.addEventListener('click', () => {
      input.value = '';
      clear.style.display = 'none';
      results.innerHTML = '';
      input.focus();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        renderResults(results, input.value);
      } else if (e.key === 'Escape') {
        input.value = '';
        clear.style.display = 'none';
        results.innerHTML = '';
      }
    });
  };
})();