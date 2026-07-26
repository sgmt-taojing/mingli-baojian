// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · KB 搜索框（divination-hub 入口）
// R31-A→D 升级：FTS5 API 优先（带 module/status/boosted_score），
// 失败时回退客户端扫描 window.AUTHORITATIVE_KNOWLEDGE / FAITH / KOUJUE / SCRIPTURE
// 记录 _kb_search_count 反馈到本地统计
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const MAX_RESULTS = 30;          // 最多渲染 30 条
  const SNIPPET_RADIUS = 60;       // 关键词前后 60 字
  const STORAGE_KEY = '***';
  const DEBOUNCE_MS = 220;
  const API_BASE = '/api/public/kb';
  const API_TIMEOUT_MS = 1200;

  // 客户端扫描源 → 显示用标签
  const CLIENT_MODULE_LABELS = {
    'AUTHORITATIVE_KNOWLEDGE': { name: '经典知识库', emoji: '📚' },
    'FAITH_KNOWLEDGE_BASE': { name: '信仰知识库', emoji: '🛕' },
    'KOUJUE_DATABASE_FULL': { name: '口诀库', emoji: '📜' },
    'SCRIPTURE_DATABASE': { name: '经文库', emoji: '📖' },
  };

  // 服务端 FTS5 模块 → 中文标签（只列前 30 个核心）
  const SERVER_MODULE_LABELS = {
    'bazi': '八字', 'ziwei': '紫微', 'fengshui': '风水', 'qimen': '奇门',
    'tcm': '中医', 'tcm-zhongfu': '中医·中府', 'tcm-fangji': '中医·方剂',
    'tcm-diagnosis': '中医·诊断', 'shuhan': '舒晗·密宗天纪',
    'shuhan-tcm': '舒晗·中医', 'shanghan-lun': '伤寒论', 'acupuncture': '针灸',
    'huangdi-neijing': '黄帝内经', 'shennong-bencao': '神农本草', 'classics': '经典',
    'jinkui': '金匮', 'yijing': '易经', 'liuyao': '六爻', 'liuren': '六壬',
    'meihua': '梅花', 'general': '通用', 'r45_*': 'R45 扩展',
    'r39_*': 'R39 宫位', 'faith': '信仰', 'mantra': '真言',
    'tianji-jiangjie': '天纪讲解', 'nihaisha': '倪海厦', 'nihaisha-structured': '倪师·结构化',
    'nihaixia': '倪海厦', 'nihaixia-yian': '倪师医案',
  };

  // status → 标签 + 颜色
  const STATUS_META = {
    'formal':    { label: '已审核', emoji: '✅', cls: 'kb-status-formal'    },
    'staging':   { label: '待审',   emoji: '🟡', cls: 'kb-status-staging'   },
    'deprecated':{ label: '已归档', emoji: '🗄️', cls: 'kb-status-deprecated'},
    'experimental':{ label: '实验', emoji: '🧪', cls: 'kb-status-experimental'},
    'archived': { label: '归档',   emoji: '🗄️', cls: 'kb-status-deprecated' },
  };

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    const esc = escapeHtml(text);
    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escapedQ, 'gi');
    return esc.replace(re, (m) => `<span class="kb-search-hl">${m}</span>`);
  }

  function snippet(text, q) {
    if (!text) return '';
    const lowerText = text.toLowerCase();
    const lowerQ = (q || '').toLowerCase();
    const idx = lowerText.indexOf(lowerQ);
    if (idx < 0 || !lowerQ) {
      const slice = text.slice(0, SNIPPET_RADIUS * 2);
      return slice + (text.length > SNIPPET_RADIUS * 2 ? '…' : '');
    }
    const start = Math.max(0, idx - SNIPPET_RADIUS);
    const end = Math.min(text.length, idx + lowerQ.length + SNIPPET_RADIUS);
    return (start > 0 ? '…' : '') + text.substring(start, end) + (end < text.length ? '…' : '');
  }

  function serverLabel(mod) {
    if (!mod) return { name: '未分类', emoji: '📦' };
    if (SERVER_MODULE_LABELS[mod]) return { name: SERVER_MODULE_LABELS[mod], emoji: '🗂️' };
    if (mod.startsWith('r45_')) return { name: 'R45·' + mod.slice(4), emoji: '🗂️' };
    if (mod.startsWith('r39_')) return { name: 'R39·' + mod.slice(4), emoji: '🗂️' };
    if (mod.startsWith('r41_')) return { name: 'R41·' + mod.slice(4), emoji: '🗂️' };
    return { name: mod, emoji: '📦' };
  }

  // ──── FTS5 API 搜索 ────
  async function searchFts(query) {
    const url = `${API_BASE}/search-fts?q=${encodeURIComponent(query)}&limit=${MAX_RESULTS}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!r.ok) return null;
      const j = await r.json();
      if (!j || !j.data || !Array.isArray(j.data.results)) return null;
      return j.data.results.map((it) => ({
        source: 'fts5',
        module: it.module,
        title: it.title || it.entry_id,
        snippet: it.snippet || '',
        path: it.entry_id,
        status: it.status,
        trust: it.trust_score,
        score: it.score,
        boostedScore: it.boosted_score,
      }));
    } catch (_) {
      clearTimeout(timer);
      return null;
    }
  }

  // ──── 客户端字符串扫描（Fallback） ────
  function scan(obj, q, matches, currentPath, moduleKey) {
    if (matches.length >= MAX_RESULTS) return;
    if (typeof obj === 'string') {
      if (obj.toLowerCase().includes(q)) {
        matches.push({
          source: 'client',
          module: moduleKey,
          path: currentPath,
          snippet: obj,
          title: currentPath || '(root)',
        });
      }
    } else if (obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => scan(item, q, matches, currentPath + '[' + i + ']', moduleKey));
      } else {
        Object.entries(obj).forEach(([k, v]) => {
          const next = currentPath ? currentPath + '.' + k : k;
          if (next.length > 60) return;
          scan(v, q, matches, next, moduleKey);
        });
      }
    }
  }

  function searchClient(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    const sources = ['AUTHORITATIVE_KNOWLEDGE', 'FAITH_KNOWLEDGE_BASE', 'KOUJUE_DATABASE_FULL', 'SCRIPTURE_DATABASE'];
    const matches = [];
    sources.forEach((key) => {
      if (window[key]) scan(window[key], q, matches, '', key);
    });
    return matches.slice(0, MAX_RESULTS);
  }

  async function search(query) {
    // 优先 FTS5 API（含 status/boost）
    const fts = await searchFts(query);
    if (fts && fts.length > 0) return fts;
    return searchClient(query);
  }

  function logSearch(query, count, source) {
    try {
      const log = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      log.push({ ts: Date.now(), q: query.slice(0, 20), count, source });
      while (log.length > 100) log.shift();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch (_) {}
  }

  // 渲染单条
  function renderItem(item, query) {
    const snip = item.snippet || snippet(item.text, query);
    // 状态标签
    const statusMeta = STATUS_META[item.status];
    const statusHtml = statusMeta
      ? `<span class="kb-search-status ${statusMeta.cls}" title="${item.status}">${statusMeta.emoji} ${statusMeta.label}</span>`
      : '';
    // 路径
    return `<div class="kb-search-item">
      <div class="kb-search-item-row1">
        <span class="kb-search-item-path">${escapeHtml(item.path || item.title || '')}</span>
        ${statusHtml}
      </div>
      <div class="kb-search-item-snip">${highlight(snip, query)}</div>
    </div>`;
  }

  function renderResults(container, query) {
    const t0 = performance.now();

    // 立刻渲染 loading
    container.innerHTML = `<div class="kb-search-loading">🔎 搜索中...</div>`;

    search(query).then((matches) => {
      const dur = Math.round(performance.now() - t0);

      if (matches.length === 0) {
        container.innerHTML = `
          <div class="kb-search-empty">
            <div class="kb-search-empty-icon">🔍</div>
            <div class="kb-search-empty-text">未找到与「${escapeHtml(query)}」相关的内容</div>
            <div class="kb-search-empty-hint">试试：天干、五行、八字、观音、化解、运势</div>
          </div>`;
        logSearch(query, 0, 'none');
        return;
      }

      // 按模块分组
      const byModule = {};
      matches.forEach((m) => {
        const key = m.source === 'fts5' ? (m.module || 'unknown') : (m.module || 'unknown');
        if (!byModule[key]) byModule[key] = { source: m.source, items: [] };
        byModule[key].items.push(m);
      });

      const sections = Object.entries(byModule).map(([mod, group]) => {
        let label;
        if (group.source === 'fts5') {
          label = serverLabel(mod);
        } else {
          label = CLIENT_MODULE_LABELS[mod] || { name: mod, emoji: '📦' };
        }
        return `<div class="kb-search-module">
          <div class="kb-search-module-head">
            <span class="kb-search-module-emoji">${label.emoji}</span>
            <span class="kb-search-module-name">${escapeHtml(label.name)}</span>
            <span class="kb-search-module-count">${group.items.length} 条</span>
          </div>
          <div class="kb-search-items">
            ${group.items.map((m) => renderItem(m, query)).join('')}
          </div>
        </div>`;
      }).join('');

      const engineBadge = matches[0] && matches[0].source === 'fts5'
        ? `<span class="kb-search-engine">FTS5</span>`
        : `<span class="kb-search-engine kb-engine-client">客户端</span>`;

      container.innerHTML = `
        <div class="kb-search-summary">
          共找到 <b>${matches.length}</b> 条匹配 · ${dur}ms · ${engineBadge} · 命中 ${Object.keys(byModule).length} 个模块
        </div>
        ${sections}`;

      logSearch(query, matches.length, matches[0] ? matches[0].source : 'none');
    });
  }

  // 公开 mount API
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
      debounceTimer = setTimeout(() => renderResults(results, q), DEBOUNCE_MS);
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
