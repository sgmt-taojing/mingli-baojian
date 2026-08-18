/**
 * RealtimeKB v2.0 — 实时知识库互通引擎（跨项目共享）
 * =====================================================================
 * 解决的核心问题：语音/视觉实时输入时，KB 检索必须「零延迟跟随」——
 * 用户还没说完一句话，KB 结果已经先出；不要求用户等待任何中间步骤。
 *
 * 设计要点：
 *  1. 防抖（默认 150ms）+ 请求合并（新请求 abort 旧请求）→ 边说边查不抖动
 *  2. 三级分级（与 KB 北极星 / P0-KB-first 规范一致）：
 *      命中分 ≥ 0.7 → KB 直答（来源标注 KB，直接朗读/展示）
 *      命中分 0.4~0.7 → KB 摘要 + AI 润色
 *      命中分 < 0.4 → AI 兜底（可注入 aiFallback 回调）
 *  3. 双级缓存：内存 LRU（瞬时命中零延迟）+ localStorage（断网兜底可用）
 *  4. 容错解析：兼容多种后端返回结构（results / data / 裸数组），解析失败安全降级
 *  5. 统计：每次检索输出 latency / tier / cacheHit，页面可展示「零延迟」证据
 *  6. 输入清洗：去空格、长度限制、特殊字符过滤（企业级工程规范）
 *
 * 后端契约（默认）：
 *  GET {apiBase}?q={query}&limit={n}&offset=0
 *  返回 { results: [ { entry_id, module, title, content, trust_score, hit_count, score, boosted_score } ] }
 *  （mingli-baojian 的 /api/public/kb/search-fts 即此契约；其他项目可配置各自端点）
 *
 * 使用方式：
 *  const kb = new RealtimeKB({
 *    apiBase: '/api/public/kb/search-fts',
 *    module: 'bazi',
 *    onResult: (r) => render(r),   // r = { tier, score, items, latencyMs, cacheHit, query }
 *    onStatus: (s) => updateStatus(s)
 *  });
 *  voice.on('interim', t => kb.search(t));   // 边说边查
 *  voice.on('final',   t => kb.search(t, { force: true, speak: true }));
 */
(function (global) {
  'use strict';

  var TIER = { DIRECT: 'direct', SUMMARY: 'summary', AI: 'ai' };
  var TIER_LABEL = { direct: 'KB 直答', summary: 'KB 摘要', ai: 'AI 兜底' };

  function RealtimeKB(options) {
    this._opts = Object.assign({
      apiBase: '/api/public/kb/search-fts',
      module: '',                  // 可选：模块过滤（如 bazi / shexiang）
      debounceMs: 150,             // 实时防抖
      minChars: 2,                 // 少于该字数不检索（避免无意义请求）
      maxChars: 60,                // 超过截断（防超长请求）
      maxResults: 5,
      tierHigh: 0.7,
      tierMid: 0.4,
      cacheSize: 200,              // 内存 LRU 上限
      persistCache: true,          // localStorage 持久化（断网兜底）
      persistKey: '_rt_kb_cache_v1',
      timeoutMs: 5000,
      onResult: null,              // (result) => void
      onStatus: null,              // (status) => void
      aiFallback: null,            // (query, kbItems) => void  命中分<0.4 时调用
      fetchImpl: null              // 可注入自定义 fetch（测试用）
    }, options || {});

    this._cache = new Map();       // LRU
    this._pendingTimer = null;
    this._pendingQuery = '';
    this._lastQuery = '';
    this._abort = null;
    this._stats = { total: 0, hits: 0, lastLatency: 0, avgLatency: 0, direct: 0, summary: 0, ai: 0 };
    this._loadPersistCache();
  }

  /* ================= 对外 API ================= */

  /**
   * 实时检索（防抖）。force=true 立即执行（final 结果/手动输入时用）
   */
  RealtimeKB.prototype.search = function (text, opts) {
    opts = opts || {};
    var q = this._clean(text);
    if (q.length < this._opts.minChars) {
      if (opts.force) this._emitStatus({ tier: null, latencyMs: 0, query: q, empty: true });
      return;
    }
    this._pendingQuery = q;
    var self = this;
    if (this._pendingTimer) clearTimeout(this._pendingTimer);
    if (opts.force) {
      this._doSearch(q, opts);
    } else {
      this._pendingTimer = setTimeout(function () {
        if (self._pendingQuery === q) self._doSearch(q, opts);
      }, this._opts.debounceMs);
    }
  };

  /** 立即清空待发请求 */
  RealtimeKB.prototype.flush = function () {
    if (this._pendingTimer) { clearTimeout(this._pendingTimer); this._pendingTimer = null; }
    if (this._abort) { try { this._abort.abort(); } catch (e) { /* ignore */ } this._abort = null; }
  };

  RealtimeKB.prototype.clear = function () {
    this.flush();
    this._cache.clear();
    this._savePersistCache();
  };

  RealtimeKB.prototype.getStats = function () { return Object.assign({}, this._stats); };

  /* ================= 核心检索 ================= */
  RealtimeKB.prototype._doSearch = function (q, opts) {
    var self = this;
    var cacheKey = (this._opts.module ? this._opts.module + '|' : '') + q;

    // 1. 内存 LRU 命中 → 零延迟返回
    if (this._cache.has(cacheKey)) {
      var hit = this._cache.get(cacheKey);
      this._cache.delete(cacheKey);
      this._cache.set(cacheKey, hit); // 刷新 LRU
      this._stats.hits++;
      this._emitResult(q, hit, 0, true);
      if (opts && opts.force) this._emitStatus({ tier: hit.tier, latencyMs: 0, query: q, cacheHit: true });
      return;
    }

    // 2. 请求合并：新请求 abort 旧请求
    if (this._abort) { try { this._abort.abort(); } catch (e) { /* ignore */ } }
    var ac = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    this._abort = ac;

    var t0 = Date.now();
    var url = this._opts.apiBase + '?q=' + encodeURIComponent(q) +
      '&limit=' + this._opts.maxResults + '&offset=0';
    if (this._opts.module) url += '&module=' + encodeURIComponent(this._opts.module);

    var fetchImpl = this._opts.fetchImpl || (typeof global.fetch === 'function' ? global.fetch : null);
    if (!fetchImpl) {
      this._emitStatus({ tier: 'ai', latencyMs: Date.now() - t0, query: q, error: 'no-fetch' });
      if (typeof this._opts.aiFallback === 'function') { try { this._opts.aiFallback(q, []); } catch (e) { /* ignore */ } }
      return;
    }

    var timeoutSignal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(this._opts.timeoutMs) : null;
    var signal = (ac && ac.signal) ? ac.signal : undefined;

    fetchImpl(url, { signal: signal, headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var latency = Date.now() - t0;
        var parsed = self._parse(data);
        var tiered = self._tier(q, parsed.items);
        var result = {
          query: q,
          tier: tiered.tier,
          score: tiered.score,
          items: parsed.items.slice(0, self._opts.maxResults),
          latencyMs: latency,
          cacheHit: false,
          engine: parsed.engine || 'unknown',
          ts: Date.now()
        };
        // 写入 LRU（AI 级不缓存，避免污染）
        if (result.tier !== TIER.AI) {
          self._cache.set(cacheKey, result);
          if (self._cache.size > self._opts.cacheSize) {
            var oldest = self._cache.keys().next().value;
            if (oldest !== undefined) self._cache.delete(oldest);
          }
          self._savePersistCache();
        }
        self._stats.total++;
        self._stats.lastLatency = latency;
        self._stats.avgLatency = self._stats.avgLatency === 0 ? latency : Math.round((self._stats.avgLatency * (self._stats.total - 1) + latency) / self._stats.total);
        if (result.tier === TIER.DIRECT) self._stats.direct++;
        else if (result.tier === TIER.SUMMARY) self._stats.summary++;
        else self._stats.ai++;

        self._emitResult(q, result, latency, false);
        self._emitStatus({ tier: result.tier, latencyMs: latency, query: q, cacheHit: false, score: result.score });

        // 命中分 < 0.4 → AI 兜底（页面可注入真实 AI 调用）
        if (result.tier === TIER.AI && typeof self._opts.aiFallback === 'function') {
          try { self._opts.aiFallback(q, result.items); } catch (e) { /* ignore */ }
        }
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return; // 被新请求合并，静默
        // 3. 断网/失败 → localStorage 持久化缓存兜底
        var cached = self._loadPersistEntry(cacheKey);
        if (cached) {
          self._emitResult(q, cached, Date.now() - t0, true);
          self._emitStatus({ tier: cached.tier, latencyMs: Date.now() - t0, query: q, cacheHit: true, degraded: true });
          return;
        }
        self._emitStatus({ tier: 'ai', latencyMs: Date.now() - t0, query: q, error: 'network', message: '知识库检索失败，已走 AI 兜底' });
        if (typeof self._opts.aiFallback === 'function') {
          try { self._opts.aiFallback(q, []); } catch (e) { /* ignore */ }
        }
      });
  };

  /* ================= 输入清洗（企业级规范） ================= */
  RealtimeKB.prototype._clean = function (text) {
    try {
      var s = String(text == null ? '' : text).trim();
      s = s.replace(/[\u0000-\u001f\u007f]+/g, ' ');   // 控制字符
      s = s.replace(/[<>{}|\\^`]+/g, ' ');              // 特殊字符过滤
      s = s.replace(/["'()\[\]【】「」《》<>《》]+/g, ' '); // 成对标点
      s = s.replace(/\s+/g, ' ').trim();
      if (s.length > this._opts.maxChars) s = s.substring(0, this._opts.maxChars);
      return s;
    } catch (e) { return ''; }
  };

  /* ================= 响应容错解析 ================= */
  RealtimeKB.prototype._parse = function (data) {
    var rows = [];
    var engine = 'unknown';
    try {
      if (!data) return { items: [], engine: engine };
      if (Array.isArray(data)) rows = data;
      else if (Array.isArray(data.results)) rows = data.results;
      else if (Array.isArray(data.data)) rows = data.data;
      else if (data.data && Array.isArray(data.data.results)) rows = data.data.results;
      engine = data.engine || data.engine_name || 'unknown';

      rows = rows.map(function (r) {
        try {
          return {
            entry_id: r.entry_id || r.id || r.entryId || '',
            module: r.module || r.category || '',
            title: r.title || '',
            content: r.content || r.snippet || r.text || '',
            trust_score: typeof r.trust_score === 'number' ? r.trust_score : (typeof r.trust === 'number' ? r.trust : null),
            hit_count: r.hit_count || r.hits || 0,
            score: (typeof r.boosted_score === 'number') ? r.boosted_score : (typeof r.score === 'number' ? r.score : null),
            rank: typeof r.rank === 'number' ? r.rank : null
          };
        } catch (e) { return null; }
      }).filter(Boolean);
    } catch (e) { rows = []; }
    return { items: rows, engine: engine };
  };

  /* ================= 三级分级（与 ai-assistant _kbScore 同源；客户端重排） =================
   * 说明：FTS5 排序可能把泛词条排前（如“目标检测”命中通用词条），
   *      因此遍历全部返回条目，以 title 命中为主权重重排；
   *      查询词与词条近义差异（如“强弱”vs“旺衰”）时 ≥3 词差 1 词宽容判满。
   */
  RealtimeKB.prototype._tier = function (q, items) {
    if (!items || !items.length) return { tier: TIER.AI, score: 0 };
    var terms = this._terms(q);
    var best = 0;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var title = item.title || '';
      var content = (item.content || '').substring(0, 300);

      // title 命中率（≥3 词时差 1 词宽容为满）
      var tHit = 0;
      for (var j = 0; j < terms.length; j++) { if (title.indexOf(terms[j]) !== -1) tHit++; }
      var titleScore = terms.length ? tHit / terms.length : 0;
      if (terms.length >= 3 && titleScore >= (terms.length - 1) / terms.length) titleScore = 1;

      // content 命中率
      var cHit = 0;
      for (var k = 0; k < terms.length; k++) { if (content.indexOf(terms[k]) !== -1) cHit++; }
      var contentScore = terms.length ? cHit / terms.length : 0;

      // 排名微加成：服务端 top1 相关性略优
      var rankBonus = i === 0 ? 0.1 : 0;
      // trust 加权
      var trust = (typeof item.trust_score === 'number') ? Math.min(1, Math.max(0, item.trust_score)) : 0.5;

      var s = titleScore * 0.6 + contentScore * 0.25 + rankBonus + trust * 0.05;
      if (s > best) best = s;
    }
    best = Math.min(1, Math.max(0, best));
    var tier = best >= this._opts.tierHigh ? TIER.DIRECT : (best >= this._opts.tierMid ? TIER.SUMMARY : TIER.AI);
    return { tier: tier, score: Math.round(best * 100) / 100 };
  };

  RealtimeKB.prototype._terms = function (q) {
    var parts = q.split(/\s+/).filter(Boolean);
    var terms = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p.length <= 2) { terms.push(p); continue; }
      for (var j = 0; j <= p.length - 2; j++) terms.push(p.substring(j, j + 2));
    }
    // 去重保序
    var seen = {}, out = [];
    for (var k = 0; k < terms.length; k++) {
      if (!seen[terms[k]]) { seen[terms[k]] = 1; out.push(terms[k]); }
    }
    return out.slice(0, 8);
  };

  /* ================= 输出 ================= */
  RealtimeKB.prototype._emitResult = function (q, result, latency, cacheHit) {
    result = result || {};
    result.query = q;
    result.latencyMs = typeof latency === 'number' ? latency : result.latencyMs;
    result.cacheHit = !!cacheHit;
    var cb = this._opts.onResult;
    if (typeof cb === 'function') { try { cb(result); } catch (e) { /* ignore */ } }
    this.emit('result', result);
  };

  RealtimeKB.prototype._emitStatus = function (status) {
    var cb = this._opts.onStatus;
    if (typeof cb === 'function') { try { cb(status); } catch (e) { /* ignore */ } }
    this.emit('status', status);
  };

  /* ================= 持久化缓存（断网兜底） ================= */
  RealtimeKB.prototype._loadPersistCache = function () {
    if (!this._opts.persistCache) return;
    try {
      var raw = global.localStorage && global.localStorage.getItem(this._opts.persistKey);
      if (!raw) return;
      var obj = JSON.parse(raw);
      if (obj && obj.entries && Array.isArray(obj.entries)) {
        for (var i = 0; i < obj.entries.length; i++) {
          var e = obj.entries[i];
          if (e && e.k && e.v && !this._cache.has(e.k)) this._cache.set(e.k, e.v);
        }
      }
    } catch (e) { /* 损坏缓存忽略 */ }
  };

  RealtimeKB.prototype._loadPersistEntry = function (key) {
    try {
      if (this._cache.has(key)) return this._cache.get(key);
      return null;
    } catch (e) { return null; }
  };

  RealtimeKB.prototype._savePersistCache = function () {
    if (!this._opts.persistCache) return;
    try {
      var entries = [];
      var keys = Array.from(this._cache.keys());
      for (var i = 0; i < keys.length; i++) {
        var v = this._cache.get(keys[i]);
        if (v && v.tier && v.tier !== TIER.AI) entries.push({ k: keys[i], v: v });
        if (entries.length >= 60) break; // 只持久化最近 60 条
      }
      global.localStorage && global.localStorage.setItem(this._opts.persistKey, JSON.stringify({ entries: entries, ts: Date.now() }));
    } catch (e) { /* 存储满忽略 */ }
  };

  /* 事件总线由文件底部统一注入（与 RealtimeVoice 同款实现） */

  global.RealtimeKB = RealtimeKB;
  global.RT_KB_TIER = TIER;
  global.RT_KB_TIER_LABEL = TIER_LABEL;
})(typeof window !== 'undefined' ? window : this);

/* 事件总线注入（复用 RealtimeVoice 的同款实现，避免重复代码） */
(function (global) {
  'use strict';
  var proto = global.RealtimeKB && global.RealtimeKB.prototype;
  if (!proto) return;
  if (proto.emit) return; // 已注入
  proto._listeners = {};
  proto.on = function (evt, fn) {
    if (!this._listeners[evt]) this._listeners[evt] = [];
    this._listeners[evt].push(fn);
    return this;
  };
  proto.emit = function (evt) {
    var args = Array.prototype.slice.call(arguments, 1);
    var fns = this._listeners[evt] || [];
    for (var i = 0; i < fns.length; i++) {
      try { fns[i].apply(null, args); } catch (e) { /* ignore */ }
    }
  };
})(typeof window !== 'undefined' ? window : this);
