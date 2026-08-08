/* ═══════════════════════════════════════════════════════════
   kb-search-engine.js — KB 搜索前端引擎 v2
   
   大数据量实战特性：
   - 防抖搜索（300ms debounce，避免每键触发 API）
   - 分页加载（page=1-50, pageSize=20，避免万行 DOM 崩溃）
   - FTS5 高亮（<mark> 标签渲染 + CSS 动画）
   - 查询历史（localStorage 最近 50 条 + kb_hit_log 后端同步）
   - 热门搜索（从 /api/public/kb-hot 拉取）
   - 空态/加载态/错误态全覆盖
   - 搜索结果缓存（同 query+page 不重复请求）
   ═══════════════════════════════════════════════════════════ */

(function(global) {
  'use strict';

  const SEARCH_DEBOUNCE_MS = 300;
  const PAGE_SIZE = 20;
  const MAX_HISTORY = 50;
  const HISTORY_KEY = 'kb_search_history_v2';
  const CACHE_TTL_MS = 120000;

  class KBSearchEngine {
    constructor(options = {}) {
      this.container = options.container;          // 挂载元素（CSS selector 或 DOM）
      this.apiBase = options.apiBase || '/api/public/kb/search-fts';
      this.hotApi = options.hotApi || '/api/public/kb-hot';
      this.hitLogApi = options.hitLogApi || '/api/public/kb-hit';
      this.placeholder = options.placeholder || '搜索知识库（FTS5全文检索 + BM25排序）';
      this.onSelect = options.onSelect || null;   // 选中回调
      
      this.query = '';
      this.page = 1;
      this.totalResults = 0;
      this.results = [];
      this.isLoading = false;
      this.error = null;
      this.debounceTimer = null;
      this.cache = new Map();
      this.abortController = null;
      
      this.init();
    }

    /* ───── 初始化 ───── */
    init() {
      this.mount();
      this.bindEvents();
      this.loadHistory();
      this.loadHotQueries();
    }

    mount() {
      const host = typeof this.container === 'string' 
        ? document.querySelector(this.container) 
        : this.container;
      if (!host) { console.warn('[KB Search] container not found'); return; }
      
      this.host = host;
      this.host.innerHTML = `
<div class="kb-search-engine" role="search" aria-label="知识库全文搜索">
  <div class="kbs-input-row">
    <div class="kbs-input-wrapper">
      <svg class="kbs-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="search" class="kbs-input" 
        placeholder="${this.placeholder}"
        autocomplete="off"
        aria-label="知识库搜索"
        aria-describedby="kbs-status">
      <button class="kbs-clear" aria-label="清除搜索" style="display:none">✕</button>
    </div>
  </div>
  
  <div class="kbs-meta-row" id="kbs-status">
    <span class="kbs-total"></span>
    <span class="kbs-engine-tag">FTS5 BM25</span>
  </div>

  <div class="kbs-history-panel" style="display:none">
    <div class="kbs-history-title">最近搜索</div>
    <div class="kbs-history-list"></div>
    <button class="kbs-clear-history">清除记录</button>
  </div>

  <div class="kbs-suggest-panel" style="display:none">
    <div class="kbs-history-title">智能联想 <span class="kbs-suggest-hint">拼音 / 模糊 / 热词</span></div>
    <div class="kbs-suggest-list"></div>
  </div>

  <div class="kbs-hot-panel">
    <div class="kbs-hot-title">🔥 热门搜索</div>
    <div class="kbs-hot-list"></div>
  </div>

  <div class="kbs-results-container" style="display:none">
    <div class="kbs-results-list"></div>
    <div class="kbs-pagination"></div>
  </div>

  <div class="kbs-loading" style="display:none">
    <div class="kbs-spinner"></div>
    <span>搜索中…</span>
  </div>
  <div class="kbs-empty" style="display:none">
    <div class="kbs-empty-icon">🔍</div>
    <div class="kbs-empty-text">未找到匹配结果</div>
    <div class="kbs-empty-hint">尝试缩短关键词或换用同义词</div>
  </div>
  <div class="kbs-error" style="display:none">
    <div class="kbs-error-icon">⚠️</div>
    <div class="kbs-error-text"></div>
    <button class="kbs-retry">重试</button>
  </div>
</div>`;
      
      // 缓存 DOM 引用
      this.$input = this.host.querySelector('.kbs-input');
      this.$clear = this.host.querySelector('.kbs-clear');
      this.$total = this.host.querySelector('.kbs-total');
      this.$results = this.host.querySelector('.kbs-results-list');
      this.$pagination = this.host.querySelector('.kbs-pagination');
      this.$resultsContainer = this.host.querySelector('.kbs-results-container');
      this.$loading = this.host.querySelector('.kbs-loading');
      this.$empty = this.host.querySelector('.kbs-empty');
      this.$history = this.host.querySelector('.kbs-history-panel');
      this.$historyList = this.host.querySelector('.kbs-history-list');
      this.$suggestPanel = this.host.querySelector('.kbs-suggest-panel');
      this.$suggestList = this.host.querySelector('.kbs-suggest-list');
      this.$error = this.host.querySelector('.kbs-error');
      this.$errorText = this.host.querySelector('.kbs-error-text');
      this.$retry = this.host.querySelector('.kbs-retry');
      this.$history = this.host.querySelector('.kbs-history-panel');
      this.$historyList = this.host.querySelector('.kbs-history-list');
      this.$clearHistory = this.host.querySelector('.kbs-clear-history');
      this.$hotList = this.host.querySelector('.kbs-hot-list');
    }

    bindEvents() {
      if (!this.host) return;

      // 输入防抖搜索
      this.$input.addEventListener('input', () => {
        this.$clear.style.display = this.$input.value ? 'block' : 'none';
        clearTimeout(this.debounceTimer);
        const v = this.$input.value.trim();
        if (v.length >= 2) {
          this.debounceTimer = setTimeout(() => this.search(1), SEARCH_DEBOUNCE_MS);
          this.smartSuggest(v); // R509：智能联想（拼音/模糊/热词），与搜索并行
        } else {
          this.hideSuggest();
          this.showHistory();
          this.$resultsContainer.style.display = 'none';
        }
      });

      // 回车立即搜索
      this.$input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          clearTimeout(this.debounceTimer);
          this.search(1);
        }
      });

      // 聚焦显示历史
      this.$input.addEventListener('focus', () => {
        if (!this.query) this.showHistory();
      });

      // 失焦隐藏历史（延迟，允许点击历史项）
      this.$input.addEventListener('blur', () => {
        setTimeout(() => { this.$history.style.display = 'none'; }, 200);
      });

      // 清除
      this.$clear.addEventListener('click', () => {
        this.$input.value = '';
        this.$clear.style.display = 'none';
        this.query = '';
        this.$resultsContainer.style.display = 'none';
        this.showHistory();
      });

      // 清除历史
      this.$clearHistory.addEventListener('click', () => {
        this.clearHistory();
      });

      // 重试
      this.$retry.addEventListener('click', () => this.search(this.page));
    }

    /* ───── 显示/隐藏态 ───── */
    setState(state) {
      [this.$loading, this.$empty, this.$error, this.$resultsContainer, this.$history]
        .forEach(el => { if (el) el.style.display = 'none'; });
      if (state !== 'history') this.hideSuggest();
      
      switch(state) {
        case 'loading': this.$loading.style.display = 'flex'; break;
        case 'empty': this.$empty.style.display = 'block'; break;
        case 'error': this.$error.style.display = 'block'; break;
        case 'results': this.$resultsContainer.style.display = 'block'; break;
        case 'history': this.$history.style.display = 'block'; break;
      }
    }

    showHistory() {
      this.setState('history');
      this.renderHistory();
    }

    /* ───── 智能联想（R509：拼音 / 模糊 / 热词）───── */
    async smartSuggest(q) {
      if (!this.suggestApi) this.suggestApi = this.apiBase.replace('kb/search-fts', 'search-suggest');
      try {
        const userId = '';
        const resp = await fetch(`${this.suggestApi}?q=${encodeURIComponent(q)}&limit=8`, { signal: AbortSignal.timeout(4000) });
        if (!resp.ok) return this.hideSuggest();
        const data = await resp.json();
        const items = data.suggestions || [];
        if (items.length === 0) return this.hideSuggest();
        this.$suggestList.innerHTML = items.map((s, i) => {
          const tag = s.type === 'hot' ? '🔥' : s.type === 'history' ? '🕘' : s.type === 'kb' ? '📚' : s.type === 'kb_entry' ? '📄' : '💡';
          const strat = s.strategy ? `<span class="kbs-suggest-strat">${s.strategy}</span>` : '';
          return `<div class="kbs-suggest-item" role="button" tabindex="0">
  <span class="kbs-suggest-tag">${tag}</span>
  <span class="kbs-suggest-query">${s.text}</span>
  ${strat}
</div>`;
        }).join('');
        this.$suggestPanel.style.display = 'block';
        this.$history.style.display = 'none';
        this.$suggestList.querySelectorAll('.kbs-suggest-item').forEach((item, i) => {
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const text = items[i].text;
            this.$input.value = text;
            this.hideSuggest();
            this.search(1);
          });
        });
      } catch (e) {
        this.hideSuggest();
      }
    }

    hideSuggest() {
      if (this.$suggestPanel) this.$suggestPanel.style.display = 'none';
    }

    /* ───── 搜索 ───── */
    async search(page = 1) {
      const q = this.$input.value.trim();
      if (q.length < 2) return;

      // 取消上一个请求
      if (this.abortController) this.abortController.abort();
      this.abortController = new AbortController();
      
      this.query = q;
      this.page = page;
      
      // 检查缓存
      const cacheKey = `${q}::${page}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.ts < CACHE_TTL_MS) {
          this.renderResults(cached.data, page);
          return;
        }
      }

      this.setState('loading');
      this.isLoading = true;

      try {
        const url = `${this.apiBase}?q=${encodeURIComponent(q)}&page=${page}&pageSize=${PAGE_SIZE}`;
        const resp = await fetch(url, { signal: this.abortController.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        
        const data = await resp.json();
        this.cache.set(cacheKey, { ts: Date.now(), data });
        
        this.addToHistory(q);
        this.recordHit(q, data.hits || data.results?.length || 0);
        this.renderResults(data, page);
      } catch (err) {
        if (err.name === 'AbortError') return;
        this.error = err.message;
        this.$errorText.textContent = err.message;
        this.setState('error');
      } finally {
        this.isLoading = false;
      }
    }

    /* ───── 渲染结果 ───── */
    renderResults(data, page) {
      const results = data.results || data.data || [];
      const total = data.total || data.count || results.length;
      
      this.results = results;
      this.totalResults = total;
      
      if (results.length === 0) {
        this.setState('empty');
        return;
      }

      this.setState('results');
      this.$total.innerHTML = `找到 <strong>${total.toLocaleString()}</strong> 条结果 · 耗时 <strong>${data.responseTime || data.time || '?'}ms</strong>`;
      
      // 结果卡片
      this.$results.innerHTML = results.map((r, i) => {
        const title = r.title || r.summary || r.entry_id || '';
        const content = r.snippet || r.content || r.summary || '';
        const module = r.module || r.category || '';
        const trust = r.confidence || r.trust_score || r.score || 0;
        const entryId = r.entry_id || '';
        const hitCount = r.hit_count || 0;
        
        return `<div class="kbs-result-card" data-index="${i}" data-id="${entryId}" tabindex="0" role="button" aria-label="查看: ${title.substring(0,60)}">
  <div class="kbs-result-title">
    <span class="kbs-result-num">#${(page-1)*PAGE_SIZE + i + 1}</span>
    ${title.replace(/<mark>([^<]+)<\/mark>/g, '<mark class="kbs-highlight">$1</mark>')}
  </div>
  <div class="kbs-result-snippet">${content.replace(/<mark>([^<]+)<\/mark>/g, '<mark class="kbs-highlight">$1</mark>')}</div>
  <div class="kbs-result-meta">
    <span class="kbs-result-module">📁 ${module || '未归类'}</span>
    <span class="kbs-result-trust" style="color:${trust>=0.9?'var(--green)':trust>=0.7?'var(--gold)':'var(--muted)'}">⚖️ ${(trust*100).toFixed(0)}%</span>
    ${hitCount ? `<span class="kbs-result-hits">👁 ${hitCount}</span>` : ''}
  </div>
</div>`;
      }).join('');

      // 点击事件
      this.$results.querySelectorAll('.kbs-result-card').forEach(card => {
        card.addEventListener('click', () => {
          const idx = parseInt(card.dataset.index);
          const entry = results[idx];
          if (this.onSelect) this.onSelect(entry);
        });
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && this.onSelect) {
            this.onSelect(results[parseInt(card.dataset.index)]);
          }
        });
      });

      // 分页
      this.renderPagination(total, page);
    }

    renderPagination(total, currentPage) {
      const totalPages = Math.ceil(total / PAGE_SIZE);
      if (totalPages <= 1) {
        this.$pagination.innerHTML = '';
        return;
      }

      let html = '<div class="kbs-pages">';
      html += `<button class="kbs-page-btn" ${currentPage===1?'disabled':''} data-page="${currentPage-1}">← 上一页</button>`;
      
      // 页码范围：当前页前后各 2 页
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, currentPage + 2);
      if (start > 1) html += '<span class="kbs-page-ellipsis">…</span>';
      for (let p = start; p <= end; p++) {
        html += `<button class="kbs-page-btn ${p===currentPage?'active':''}" data-page="${p}">${p}</button>`;
      }
      if (end < totalPages) html += '<span class="kbs-page-ellipsis">…</span>';
      
      html += `<button class="kbs-page-btn" ${currentPage===totalPages?'disabled':''} data-page="${currentPage+1}">下一页 →</button>`;
      html += `<span class="kbs-page-info">${currentPage}/${totalPages} 页 · 共 ${total.toLocaleString()} 条</span>`;
      html += '</div>';
      
      this.$pagination.innerHTML = html;
      
      // 分页事件
      this.$pagination.querySelectorAll('.kbs-page-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => this.search(parseInt(btn.dataset.page)));
      });
    }

    /* ───── 查询历史（localStorage + 服务端同步） ───── */
    getHistory() {
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    }

    saveHistory(list) {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
      } catch {}
    }

    addToHistory(query) {
      let list = this.getHistory();
      list = list.filter(h => h.q !== query);  // 去重
      list.unshift({ q: query, ts: Date.now() });
      this.saveHistory(list);
    }

    clearHistory() {
      localStorage.removeItem(HISTORY_KEY);
      this.$historyList.innerHTML = '<div class="kbs-history-empty">暂无搜索记录</div>';
    }

    loadHistory() {
      const list = this.getHistory();
      if (list.length === 0) {
        this.renderHistoryEmpty();
        return;
      }
      this.renderHistoryItems(list);
    }

    renderHistory() {
      const list = this.getHistory();
      if (list.length === 0) {
        this.renderHistoryEmpty();
        return;
      }
      this.renderHistoryItems(list);
    }

    renderHistoryEmpty() {
      this.$historyList.innerHTML = '<div class="kbs-history-empty">暂无搜索记录</div>';
    }

    renderHistoryItems(list) {
      this.$historyList.innerHTML = list.slice(0, 8).map(h => {
        const ago = this.formatTimeAgo(h.ts);
        return `<div class="kbs-history-item" role="button" tabindex="0">
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
  <span class="kbs-history-query">${h.q}</span>
  <span class="kbs-history-time">${ago}</span>
</div>`;
      }).join('');

      this.$historyList.querySelectorAll('.kbs-history-item').forEach((item, i) => {
        item.addEventListener('mousedown', () => {
          this.$input.value = list[i].q;
          this.search(1);
        });
      });
    }

    /* ───── 热门搜索 ───── */
    async loadHotQueries() {
      try {
        const resp = await fetch(this.hotApi, { signal: AbortSignal.timeout(5000) });
        if (!resp.ok) return this.renderDefaultHot();
        const data = await resp.json();
        const hot = data.hot || data.data || data || [];
        if (hot.length === 0) return this.renderDefaultHot();
        
        this.$hotList.innerHTML = hot.slice(0, 8).map(h => {
          const q = h.q || h.query || '';
          const count = h.count || h.cnt || h.hits || '';
          return `<div class="kbs-hot-item" role="button" tabindex="0">
  <span class="kbs-hot-rank">${h.rank || ''}</span>
  <span class="kbs-hot-query">${q}</span>
  <span class="kbs-hot-count">${count.toLocaleString?.() || count}</span>
</div>`;
        }).join('');

        this.$hotList.querySelectorAll('.kbs-hot-item').forEach(item => {
          item.addEventListener('click', () => {
            const q = item.querySelector('.kbs-hot-query').textContent;
            this.$input.value = q;
            this.search(1);
          });
        });
      } catch {
        this.renderDefaultHot();
      }
    }

    renderDefaultHot() {
      const defaults = [
        '八字日主强弱', '桂枝汤组成', 'ERP选型', '数字化转型方案',
        '针灸足三里', '紫微十四主星', '奇门遁甲排盘', '六爻起卦方法',
      ];
      this.$hotList.innerHTML = defaults.map((q, i) => 
        `<div class="kbs-hot-item" role="button" tabindex="0">
  <span class="kbs-hot-rank">${i+1}</span>
  <span class="kbs-hot-query">${q}</span>
</div>`
      ).join('');
      
      this.$hotList.querySelectorAll('.kbs-hot-item').forEach(item => {
        item.addEventListener('click', () => {
          const q = item.querySelector('.kbs-hot-query').textContent;
          this.$input.value = q;
          this.search(1);
        });
      });
    }

    /* ───── 命中记录 ───── */
    async recordHit(query, hits) {
      try {
        await fetch(this.hitLogApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, hits, source: 'kb-fts5', responseTime: 0 }),
          signal: AbortSignal.timeout(3000),
        });
      } catch { /* fire-and-forget */ }
    }

    /* ───── 工具 ───── */
    formatTimeAgo(ts) {
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return '刚刚';
      if (mins < 60) return `${mins}分钟前`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}小时前`;
      return `${Math.floor(hours / 24)}天前`;
    }

    /* ───── 公共 API ───── */
    setQuery(q) {
      this.$input.value = q;
      this.search(1);
    }

    refresh() {
      this.search(this.page);
    }
  }

  global.KBSearchEngine = KBSearchEngine;
})(typeof window !== 'undefined' ? window : global);
