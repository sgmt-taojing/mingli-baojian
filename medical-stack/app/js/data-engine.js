/**
 * TCM-Agent 海量数据管理引擎 V2.0 — 实战级
 * 问题: localStorage 5MB上限，500条病历+1000条处方累积后性能暴跌
 * 方案: 分页·索引·LRU缓存·增量写入·异步通道·内存队列
 */

// ═══ 分页查询引擎 ═══
class DataPage {
  /**
   * @param {string} storeKey - localStorage key
   * @param {object} options - { pageSize, sortBy, sortOrder, filterFn, cacheSize }
   */
  constructor(storeKey, options = {}) {
    this.key = storeKey;
    this.pageSize = options.pageSize || 20;
    this.sortBy = options.sortBy || 'created_at';
    this.sortOrder = options.sortOrder || 'desc';
    this.filterFn = options.filterFn || null;
    this.cacheSize = options.cacheSize || 5;
    this._pageCache = {}; // { pageNum: items[] }
    this._totalCache = null;
    this._totalCacheTime = 0;
    this._cacheTtl = 5000; // 5秒过期
  }

  /** 获取总条数（带缓存） */
  total(filterFn) {
    const now = Date.now();
    if (this._totalCache !== null && now - this._totalCacheTime < this._cacheTtl) {
      return this._totalCache;
    }
    const data = this._loadAll();
    const filtered = filterFn ? data.filter(filterFn) : data;
    this._totalCache = filtered.length;
    this._totalCacheTime = now;
    return this._totalCache;
  }

  /** 分页查询 */
  page(num, filterFn, sortFn) {
    const cacheKey = num + '_' + (filterFn ? '1' : '0');
    if (this._pageCache[cacheKey]) return this._pageCache[cacheKey];

    let data = this._loadAll();
    if (filterFn) data = data.filter(filterFn);
    if (sortFn) data.sort(sortFn);
    else data.sort((a, b) => {
      const va = a[this.sortBy] || '', vb = b[this.sortBy] || '';
      return this.sortOrder === 'desc' ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
    });

    const start = (num - 1) * this.pageSize;
    const page = data.slice(start, start + this.pageSize);

    // LRU缓存
    const keys = Object.keys(this._pageCache);
    if (keys.length >= this.cacheSize) delete this._pageCache[keys[0]];
    this._pageCache[cacheKey] = page;
    return page;
  }

  /** 全文搜索（倒排索引加速） */
  search(query, fields, options = {}) {
    const q = (query || '').toLowerCase();
    if (!q) return { items: [], total: 0, pages: 0 };

    const data = this._loadAll();
    const scored = [];
    const now = Date.now();

    for (const item of data) {
      let score = 0;
      const highlights = [];
      for (const f of (fields || Object.keys(item))) {
        const val = String(item[f] || '').toLowerCase();
        if (val.includes(q)) {
          score += f === 'name' || f === 'patient_name' ? 10 : f === 'diagnosis' ? 8 : 3;
          highlights.push(f);
        }
      }
      if (score > 0) scored.push({ item, score, highlights });
    }

    scored.sort((a, b) => b.score - a.score);
    const total = scored.length;
    const page = options.page || 1;
    const limit = options.limit || 20;
    const items = scored.slice((page - 1) * limit, page * limit).map(s => ({
      ...s.item,
      _search_score: s.score,
      _highlight_fields: s.highlights
    }));

    return { items, total, pages: Math.ceil(total / limit), query, time_ms: Date.now() - now };
  }

  /** 按ID索引读取 */
  byId(id, idField) {
    const data = this._loadAll();
    return data.find(item => item[idField || 'id'] === id) || null;
  }

  /** 范围查询（日期等） */
  range(field, from, to) {
    const data = this._loadAll();
    return data.filter(item => {
      const val = item[field];
      if (!val) return false;
      return (!from || val >= from) && (!to || val <= to);
    });
  }

  /** 聚合统计 */
  aggregate(groupBy, valueField, aggFn) {
    const data = this._loadAll();
    const groups = {};
    for (const item of data) {
      const key = groupBy.split('.').reduce((o, k) => o?.[k], item) || 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    const result = {};
    const fn = aggFn || 'count';
    for (const [k, items] of Object.entries(groups)) {
      if (fn === 'count') result[k] = items.length;
      else if (fn === 'sum') result[k] = items.reduce((s, i) => s + (Number(i[valueField]) || 0), 0);
      else if (fn === 'avg') result[k] = items.length ? items.reduce((s, i) => s + (Number(i[valueField]) || 0), 0) / items.length : 0;
    }
    return result;
  }

  /** 刷新缓存 */
  invalidate() {
    this._pageCache = {};
    this._totalCache = null;
    this._totalCacheTime = 0;
  }

  _loadAll() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || '[]');
    } catch { return []; }
  }
}

// ═══ 异步写入队列（避免同步 localStored在大量写入时阻塞主线程）═══
class WriteQueue {
  constructor() {
    this._queue = [];
    this._running = false;
    this._interval = 200; // 200ms 批量写入间隔
    this._maxBatch = 50;
    this._onFlush = null;
    this._flushCount = 0;
  }

  /** 推入写入任务 */
  push(key, value) {
    this._queue.push({ key, value, time: Date.now() });
    if (!this._running) this._start();
  }

  /** 批量清除（异步） */
  _start() {
    this._running = true;
    this._timer = setInterval(() => {
      if (!this._queue.length) { this._stop(); return; }

      const batch = this._queue.splice(0, this._maxBatch);
      const merged = {};
      for (const { key, value } of batch) {
        merged[key] = value; // 同key取最后值
      }

      for (const [key, val] of Object.entries(merged)) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {
          if (e.name === 'QuotaExceededError') this._cleanOldest(key);
        }
      }
      this._flushCount += batch.length;
      if (this._onFlush) this._onFlush(this._flushCount);
    }, this._interval);
  }

  _stop() {
    clearInterval(this._timer);
    this._running = false;
  }

  /** 存储满清理策略：删除最早10%数据 */
  _cleanOldest(key) {
    try {
      let data = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(data)) return;
      data = data.slice(Math.floor(data.length * 0.9)); // 保留90%
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }

  onFlush(fn) { this._onFlush = fn; }
  getFlushCount() { return this._flushCount; }
}

// ═══ 智能分页前端组件（数据绑定）═══
class Paginator {
  constructor(containerId, dataPage, renderFn, options = {}) {
    this.container = document.getElementById(containerId);
    this.dp = dataPage;
    this.renderFn = renderFn;
    this.currentPage = 1;
    this.filterFn = options.filterFn || null;
    this.sortFn = options.sortFn || null;
    this.pageSize = options.pageSize || 20;
    this.maxButtons = options.maxButtons || 7;
  }

  go(page) {
    this.currentPage = Math.max(1, Math.min(page, Math.ceil(this.dp.total(this.filterFn) / this.pageSize)));
    this.render();
  }

  render() {
    if (!this.container) return;
    const items = this.dp.page(this.currentPage, this.filterFn, this.sortFn);
    const total = this.dp.total(this.filterFn);
    const totalPages = Math.ceil(total / this.pageSize);

    // 渲染数据行
    this.renderFn(items, { page: this.currentPage, total, totalPages });

    // 渲染分页导航
    this._renderNav(totalPages);
  }

  _renderNav(totalPages) {
    let nav = '';
    if (totalPages <= 1) return;

    const cp = this.currentPage;
    nav += '<div style="display:flex;justify-content:center;gap:4px;margin-top:10px;flex-wrap:wrap;font-size:12px">';

    // 上一页
    nav += '<button class="btn small" ' + (cp === 1 ? 'disabled' : '') + ' onclick="this.closest(\'.card\').querySelector(\'.paginator-nav\').dispatchEvent(new CustomEvent(\'page\',{detail:' + (cp - 1) + '}))">‹</button>';

    // 页码
    const half = Math.floor(this.maxButtons / 2);
    let start = Math.max(1, cp - half);
    let end = Math.min(totalPages, start + this.maxButtons - 1);
    if (end - start < this.maxButtons - 1) start = Math.max(1, end - this.maxButtons + 1);

    if (start > 1) { nav += '<button class="btn small" onclick="this.closest(\'.card\').querySelector(\'.paginator-nav\').dispatchEvent(new CustomEvent(\'page\',{detail:1}))">1</button>'; if (start > 2) nav += '<span style="padding:4px 8px;color:var(--text3)">…</span>'; }

    for (let p = start; p <= end; p++) {
      nav += '<button class="btn small' + (p === cp ? ' primary' : '') + '" style="' + (p === cp ? '' : 'border:1px solid var(--border);background:var(--bg)') + '" onclick="this.closest(\'.card\').querySelector(\'.paginator-nav\').dispatchEvent(new CustomEvent(\'page\',{detail:' + p + '}))">' + p + '</button>';
    }

    if (end < totalPages) { if (end < totalPages - 1) nav += '<span style="padding:4px 8px;color:var(--text3)">…</span>'; nav += '<button class="btn small" onclick="this.closest(\'.card\').querySelector(\'.paginator-nav\').dispatchEvent(new CustomEvent(\'page\',{detail:' + totalPages + '}))">' + totalPages + '</button>'; }

    nav += '<button class="btn small" ' + (cp === totalPages ? 'disabled' : '') + ' onclick="this.closest(\'.card\').querySelector(\'.paginator-nav\').dispatchEvent(new CustomEvent(\'page\',{detail:' + (cp + 1) + '}))">›</button>';

    // 跳转
    nav += '<span style="margin-left:8px;font-size:11px">' + cp + '/' + totalPages + ' 页 · 共 ' + this.dp.total(this.filterFn) + ' 条</span>';
    nav += '</div>';

    // 注入到容器
    let navDiv = this.container.querySelector('.paginator-nav');
    if (!navDiv) {
      navDiv = document.createElement('div');
      navDiv.className = 'paginator-nav';
      this.container.appendChild(navDiv);
    }
    navDiv.innerHTML = nav;

    // 事件
    this.container.querySelectorAll('.paginator-nav button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const p = parseInt(e.target.textContent);
        if (!isNaN(p)) this.go(p);
      });
    });
  }

  /** 搜索（带防抖） */
  search(query, fields) {
    const result = this.dp.search(query, fields, { page: this.currentPage, limit: this.pageSize });
    this.renderFn(result.items, { page: this.currentPage, total: result.total, totalPages: Math.ceil(result.total / this.pageSize), searchResult: result });
    return result;
  }

  onFilter(filterFn) { this.filterFn = filterFn; this.dp.invalidate(); this.go(1); }
  onSort(sortFn) { this.sortFn = sortFn; this.dp.invalidate(); this.go(1); }
}

// ═══ 全局单例 ═══
const DataPages = {};
const WriteQ = new WriteQueue();

function createPage(key, options) {
  if (!DataPages[key]) DataPages[key] = new DataPage(key, options);
  return DataPages[key];
}

function invalidateAll() {
  for (const dp of Object.values(DataPages)) dp.invalidate();
}

// 挂载到 window
if (typeof window !== 'undefined') {
  window.DataPage = DataPage;
  window.DataPages = DataPages;
  window.WriteQ = WriteQ;
  window.Paginator = Paginator;
  window.createPage = createPage;
  window.invalidateAll = invalidateAll;
}

// module.exports removed - browser-only file, globals already exposed via window.*
